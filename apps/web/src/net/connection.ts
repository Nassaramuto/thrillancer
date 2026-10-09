import { Client, type Room } from "@colyseus/sdk";
import { RECONNECT_WINDOW_S } from "@thrillancer/contracts";
import type { ChatBroadcast, ChatErrorPayload, InputMessage, InputStep, SnapPayload, WelcomePayload } from "@thrillancer/contracts";
import { api, COLYSEUS_URL } from "./api";

export type ConnStatus = "idle" | "connecting" | "connected" | "reconnecting" | "failed" | "replaced";

export interface ConnEvents {
  status: (s: ConnStatus, detail?: string) => void;
  welcome: (w: WelcomePayload) => void;
  snap: (s: SnapPayload) => void;
  chat: (m: ChatBroadcast) => void;
  chatError: (e: ChatErrorPayload) => void;
  denied: (reason: string) => void;
  blocked: (ids: string[]) => void;
  reportResult: (r: { ok: boolean; reason?: string }) => void;
  state: () => void;
}

const TOKEN_KEY = "zg.reconnect";
const safeSession = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) sessionStorage.removeItem(k);
      else sessionStorage.setItem(k, v);
    } catch {
      /* storage may be unavailable; reconnect falls back to a fresh join */
    }
  },
};

export class PlazaConnection {
  status: ConnStatus = "idle";
  room?: Room;
  userId = "";
  epoch = 0;
  rtt = 0;
  private client = new Client(COLYSEUS_URL);
  private handlers: { [K in keyof ConnEvents]?: Array<ConnEvents[K]> } = {};
  private pingTimer?: ReturnType<typeof setInterval>;
  private closed = false;
  private seq = 0;

  on<K extends keyof ConnEvents>(ev: K, fn: ConnEvents[K]): () => void {
    (this.handlers[ev] ??= [] as never).push(fn as never);
    return () => {
      this.handlers[ev] = (this.handlers[ev] as Array<ConnEvents[K]>).filter((f) => f !== fn) as never;
    };
  }
  private emit<K extends keyof ConnEvents>(ev: K, ...args: Parameters<ConnEvents[K]>) {
    for (const fn of (this.handlers[ev] ?? []) as Array<(...a: unknown[]) => void>) fn(...args);
  }
  private setStatus(s: ConnStatus, detail?: string) {
    this.status = s;
    this.emit("status", s, detail);
  }

  /** Fresh join. Obtains a single-use ticket from the API (cookie-authenticated) and presents it to the room. */
  async connect(): Promise<void> {
    this.closed = false;
    this.setStatus("connecting");
    try {
      const { ticket } = await api.ticket();
      const room = await this.client.joinOrCreate("plaza", { ticket });
      this.attach(room);
    } catch (err) {
      this.setStatus("failed", describe(err));
      throw err;
    }
  }

  private attach(room: Room) {
    this.room = room;
    safeSession.set(TOKEN_KEY, room.reconnectionToken);
    room.onStateChange(() => this.emit("state"));
    room.onMessage("welcome", (w: WelcomePayload) => {
      this.userId = w.userId;
      this.epoch = w.epoch;
      this.emit("welcome", w);
      this.setStatus("connected");
    });
    room.onMessage("snap", (s: SnapPayload) => {
      this.epoch = s.epoch;
      this.emit("snap", s);
    });
    room.onMessage("chat", (m: ChatBroadcast) => this.emit("chat", m));
    room.onMessage("chatError", (e: ChatErrorPayload) => this.emit("chatError", e));
    room.onMessage("teleportDenied", (d: { reason: string }) => this.emit("denied", d.reason));
    room.onMessage("blocked", (d: { blocked: string[] }) => this.emit("blocked", d.blocked));
    room.onMessage("reportResult", (r: { ok: boolean; reason?: string }) => this.emit("reportResult", r));
    room.onMessage("pong", (p: { t: number }) => {
      const rtt = performance.now() - p.t;
      this.rtt = this.rtt ? this.rtt * 0.7 + rtt * 0.3 : rtt;
    });
    room.onMessage("replaced", () => {
      this.closed = true;
      safeSession.set(TOKEN_KEY, null);
      this.setStatus("replaced");
    });
    // The SDK retries the same seat automatically (onDrop -> onReconnect). onLeave fires only once it has given up
    // or the server closed us on purpose; then we fall back to a fresh join with a new single-use ticket.
    room.onDrop(() => {
      if (!this.closed) this.setStatus("reconnecting");
    });
    room.onReconnect(() => {
      safeSession.set(TOKEN_KEY, room.reconnectionToken);
      room.send("hello", {});
      this.setStatus("connected");
    });
    room.onLeave((code: number) => {
      clearInterval(this.pingTimer);
      if (this.closed || this.status === "replaced") return;
      if (code === 4000) return this.setStatus("idle");
      void this.rejoin();
    });
    room.onError((code: number, msg?: string) => console.warn("[room error]", code, msg));
    room.send("hello", {});
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => room.send("ping", { t: performance.now() }), 2000);
  }

  /** Fallback after the SDK's own reconnect attempts failed: join again with a fresh ticket (server evicts any stale seat). */
  private async rejoin() {
    this.setStatus("reconnecting");
    const deadline = Date.now() + RECONNECT_WINDOW_S * 1000;
    let delay = 700;
    while (!this.closed && Date.now() < deadline) {
      try {
        const { ticket } = await api.ticket();
        this.attach(await this.client.joinOrCreate("plaza", { ticket }));
        return;
      } catch (err) {
        if (err instanceof Error && /401|session/i.test(err.message)) break;
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 1.6, 4000);
      }
    }
    if (!this.closed) this.setStatus("failed", "Lost connection to the plaza. Check your network and retry.");
  }

  leave() {
    this.closed = true;
    clearInterval(this.pingTimer);
    safeSession.set(TOKEN_KEY, null);
    void this.room?.leave(true);
    this.room = undefined;
    this.setStatus("idle");
  }

  // ---- outbound -------------------------------------------------------------------------------------------
  /** One batch of controller steps (see contracts/ctrl.ts). Returns the message so the caller can keep it for replay. */
  sendSteps(steps: InputStep[]): InputMessage {
    const msg: InputMessage = { seq: ++this.seq, epoch: this.epoch, steps };
    this.room?.send("input", msg);
    return msg;
  }
  chat(text: string) {
    this.room?.send("chat", { text });
  }
  teleport(pointId: string) {
    this.room?.send("teleport", { pointId });
  }
  gotoPlayer(userId: string) {
    this.room?.send("gotoPlayer", { userId });
  }
  block(userId: string, on: boolean) {
    this.room?.send(on ? "block" : "unblock", { userId });
  }
  report(userId: string, reason: string, note?: string) {
    this.room?.send("report", { userId, reason, note });
  }
  get connected() {
    return this.status === "connected" && !!this.room;
  }
}

function describe(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  if (/401|ticket/i.test(m)) return "Your session expired. Sign in again.";
  if (/network|fetch|ECONN|Failed/i.test(m)) return "Cannot reach the game server. Check that it is running.";
  return m || "Could not join the plaza.";
}
