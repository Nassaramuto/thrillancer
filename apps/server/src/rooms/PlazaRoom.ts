import { CloseCode, Room, ServerError, type Client } from "@colyseus/core";
import {
  AVATAR_COLORS, CHAT_HISTORY, ClientMessages, INPUT_BUDGET_CAP_MS, NPC_GUIDE_ID, PATCH_RATE_MS,
  PLAZA_ROOM, RECONNECT_WINDOW_S, RESPAWN_ID, SPAWN, SPAWN_FACE, TELEPORT_COOLDOWN_MS, TELEPORT_POINTS, PLAYER_RADIUS,
  groundHeight, initialBikes, newCtrlState, resolveCollisions, sanitizeText, stepCtrl, teleportCtrl, teleportPoint,
} from "@thrillancer/contracts";
import type { BikeView, ChatBroadcast, CtrlState, InputMessage, SessionUser, SnapPayload, WelcomePayload } from "@thrillancer/contracts";
import { verifyTicket } from "../auth/tokens.ts";
import { addBlock, addReport, getUser, listBlocks, removeBlock } from "../db/users.ts";
import { deps } from "../deps.ts";
import { ChatLimiter } from "./chatLimiter.ts";
import { positionMemory, presence } from "./presence.ts";
import { BikeState, PlayerState, PlazaState } from "./plazaState.ts";

interface Seat {
  user: SessionUser;
  client: Client;
  player: PlayerState;
  budgetMs: number;
  lastInputAt: number;
  epoch: number;
  chat: ChatLimiter;
  blocked: Set<string>;
  lastTeleportAt: number;
  actionWindow: { start: number; n: number };
  reports: { start: number; n: number };
  pending?: { reject: Function };
  evicted: boolean;
}

const NPC_SPEED = 2.2;

function toCtrl(p: PlayerState): CtrlState {
  return { x: p.x, y: p.y, z: p.z, vx: p.vx, vz: p.vz, vy: p.vy, yaw: p.heading, grounded: p.grounded, coyote: p.coyote, jumpBuf: p.jumpBuf, bike: p.bike, hy: p.hy, bsp: p.bsp };
}
function fromCtrl(p: PlayerState, c: CtrlState) {
  p.x = c.x; p.y = c.y; p.z = c.z; p.vx = c.vx; p.vz = c.vz; p.vy = c.vy; p.heading = c.yaw;
  p.grounded = c.grounded; p.coyote = c.coyote; p.jumpBuf = c.jumpBuf; p.bike = c.bike; p.hy = c.hy; p.bsp = c.bsp;
}
const NPC_TIPS = [
  "I'm a server-controlled guide bot, not a person. Press T to open the teleport menu.",
  "Home (H) always brings you back to the plaza spawn.",
  "Click a name in the player list to inspect a profile, mute, block or report.",
  "Racing and repair activities arrive in Milestone 3. The board here is a preview.",
];

export class PlazaRoom extends Room<{ state: PlazaState }> {
  override maxClients = deps().cfg.plazaMaxClients;
  override state = new PlazaState();

  private seats = new Map<string, Seat>(); // by sessionId
  private chatHistory: ChatBroadcast[] = [];
  private chatSeq = 0;
  private bikes: BikeView[] = initialBikes();
  private bikeOwner: (string | undefined)[] = [];
  private npc?: { player: PlayerState; target: number; waitMs: number; tipAt: number; tipIdx: number };

  override onCreate() {
    this.patchRate = PATCH_RATE_MS;
    this.maxMessagesPerSecond = 60;
    this.setSimulationInterval((dt) => this.tick(dt), 50);
    this.spawnNpc();
    this.bikes.forEach((b, i) => {
      const bs = new BikeState();
      bs.x = b.x; bs.y = b.y; bs.z = b.z; bs.hy = b.hy; bs.taken = false; bs.by = "";
      this.state.bikes.set(String(i), bs);
    });

    this.onMessage("hello", (client) => {
      const s = this.seats.get(client.sessionId);
      if (s) this.sendWelcome(s);
    });
    this.onMessage("input", (client, raw) => {
      const s = this.seats.get(client.sessionId);
      const m = ClientMessages.input.safeParse(raw);
      if (s && m.success) this.handleInput(s, m.data);
    });
    this.onMessage("chat", (client, raw) => {
      const s = this.seats.get(client.sessionId);
      if (s) this.handleChat(s, raw);
    });
    this.onMessage("teleport", (client, raw) => {
      const s = this.seats.get(client.sessionId);
      const m = ClientMessages.teleport.safeParse(raw);
      if (s && m.success) this.handleTeleport(s, m.data.pointId);
    });
    this.onMessage("gotoPlayer", (client, raw) => {
      const s = this.seats.get(client.sessionId);
      const m = ClientMessages.gotoPlayer.safeParse(raw);
      if (s && m.success) this.handleGoto(s, m.data.userId);
    });
    this.onMessage("ping", (client, raw) => {
      const m = ClientMessages.ping.safeParse(raw);
      if (m.success) client.send("pong", { t: m.data.t, serverTime: Date.now() });
    });
    this.onMessage("block", (client, raw) => void this.handleBlock(client, raw, true));
    this.onMessage("unblock", (client, raw) => void this.handleBlock(client, raw, false));
    this.onMessage("report", (client, raw) => void this.handleReport(client, raw));
  }

  // ---- auth / lifecycle -------------------------------------------------------------------------------------

  override async onAuth(_client: Client, options: { ticket?: unknown }): Promise<SessionUser> {
    const { cfg, pool, ledger } = deps();
    const v = verifyTicket(cfg.sessionSecret, options?.ticket, PLAZA_ROOM);
    if (!v.ok) throw new ServerError(4401, `invalid_ticket:${v.reason}`);
    if (!ledger.consume(v.payload.jti, v.payload.exp)) throw new ServerError(4401, "invalid_ticket:replayed");
    const user = await getUser(pool, v.payload.uid);
    if (!user) throw new ServerError(4401, "invalid_ticket:unknown_user");
    return user;
  }

  override async onJoin(client: Client) {
    const user = client.auth as SessionUser;
    const now = Date.now();

    // Evict any earlier seat (other tab, stale reconnect window, other plaza room) and inherit its position.
    const prevPos = this.currentPosition(user.userId);
    const evicted = presence.claim(user.userId, {
      roomId: this.roomId,
      sessionId: client.sessionId,
      kick: (reason) => this.evictSeat(user.userId, client.sessionId, reason),
    });
    evicted?.kick("replaced");

    const player = new PlayerState();
    player.userId = user.userId;
    player.name = user.nickname;
    player.kind = "user";
    player.colorIndex = user.colorIndex;
    player.connected = true;
    player.ackSeq = 0;
    const start = prevPos ?? positionMemory.recall(user.userId) ?? this.spawnPoint();
    fromCtrl(player, newCtrlState(start.x, start.z, start.heading));

    const blocked = new Set(await listBlocks(deps().pool, user.userId).catch(() => [] as string[]));
    const seat: Seat = {
      user, client, player, budgetMs: 100, lastInputAt: now, epoch: 1, chat: new ChatLimiter(now), blocked,
      lastTeleportAt: 0, actionWindow: { start: now, n: 0 }, reports: { start: now, n: 0 }, evicted: false,
    };
    this.seats.set(client.sessionId, seat);
    this.state.players.set(user.userId, player);
  }

  override async onLeave(client: Client, code?: number) {
    const seat = this.seats.get(client.sessionId);
    if (!seat) return;
    if (seat.evicted || code === CloseCode.CONSENTED) {
      this.dropSeat(seat);
      return;
    }
    seat.player.connected = false;
    try {
      const deferred = this.allowReconnection(client, RECONNECT_WINDOW_S);
      seat.pending = deferred;
      const fresh = await deferred;
      seat.pending = undefined;
      seat.client = fresh;
      seat.player.connected = true;
      seat.lastInputAt = Date.now();
      seat.budgetMs = 100;
    } catch {
      this.dropSeat(seat); // window expired or seat evicted
    }
  }

  override onDispose() {
    for (const s of this.seats.values()) presence.release(s.user.userId, s.client.sessionId);
  }

  private evictSeat(userId: string, sessionId: string, reason: string) {
    const seat = this.seats.get(sessionId);
    if (!seat || seat.user.userId !== userId) return;
    seat.evicted = true;
    try {
      seat.client.send("replaced", { reason });
    } catch { /* socket may already be gone */ }
    seat.pending?.reject(new Error("replaced")); // eslint-disable-line
    try {
      seat.client.leave(CloseCode.CONSENTED);
    } catch { /* ignore */ }
    this.dropSeat(seat);
  }

  private dropSeat(seat: Seat) {
    if (this.seats.get(seat.client.sessionId) !== seat && !this.seatsHas(seat)) return;
    for (const [sid, s] of this.seats) if (s === seat) this.seats.delete(sid);
    this.releaseBike(seat.user.userId, seat.player);
    const cur = this.state.players.get(seat.user.userId);
    if (cur === seat.player) {
      positionMemory.save(seat.user.userId, { x: seat.player.x, z: seat.player.z, heading: seat.player.heading });
      this.state.players.delete(seat.user.userId);
    }
    presence.release(seat.user.userId, seat.client.sessionId);
  }
  private seatsHas(seat: Seat) {
    for (const s of this.seats.values()) if (s === seat) return true;
    return false;
  }

  private currentPosition(userId: string) {
    const p = this.state.players.get(userId);
    return p ? { x: p.x, z: p.z, heading: p.heading } : undefined;
  }

  private spawnPoint() {
    const a = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 2.5; // keeps the spawn camera in front of the Art Gallery signpost at (-2, 18)
    const p = resolveCollisions({ x: SPAWN.x + Math.cos(a) * r, z: SPAWN.z + Math.sin(a) * r });
    return { ...p, heading: Math.PI };
  }

  private sendWelcome(s: Seat) {
    const payload: WelcomePayload = {
      userId: s.user.userId, roomId: this.roomId, serverTime: Date.now(), epoch: s.epoch,
      blocked: [...s.blocked], history: this.chatHistory.slice(-CHAT_HISTORY),
    };
    s.client.send("welcome", payload);
  }

  // ---- movement ---------------------------------------------------------------------------------------------

  /** A rider who leaves keeps nothing: their bike is dropped where it stands, free for the next person. */
  private releaseBike(userId: string, p: PlayerState) {
    if (p.bike < 0) return;
    const i = p.bike;
    const b = this.bikes[i];
    if (b && this.bikeOwner[i] === userId) {
      b.taken = false;
      this.bikeOwner[i] = undefined;
      this.syncBike(i);
    }
    p.bike = -1;
    p.bsp = 0;
  }

  private syncBike(i: number) {
    const b = this.bikes[i]!;
    const bs = this.state.bikes.get(String(i));
    if (!bs) return;
    bs.x = b.x; bs.y = b.y; bs.z = b.z; bs.hy = b.hy;
    bs.taken = b.taken;
    bs.by = this.bikeOwner[i] ?? "";
  }

  private handleInput(s: Seat, m: InputMessage) {
    if (!s.player.connected || m.epoch !== s.epoch || m.seq <= s.player.ackSeq) return;
    const now = Date.now();
    s.budgetMs = Math.min(s.budgetMs + (now - s.lastInputAt), INPUT_BUDGET_CAP_MS);
    s.lastInputAt = now;
    const c = toCtrl(s.player);
    const uid = s.user.userId;
    for (const st of m.steps) {
      const wantMs = st.dt * 1000;
      const allowed = Math.min(wantMs, s.budgetMs);
      if (allowed < 1) break; // out of time budget: remaining steps are dropped (speed-hack guard)
      s.budgetMs -= allowed;
      let act = st.act as 0 | 1 | 2;
      // Mounting is only honoured next to a free bike; the server decides, the client just asks.
      if (act === 1) {
        const b = this.bikes[st.bike];
        const owner = this.bikeOwner[st.bike];
        if (!b || c.bike >= 0 || (b.taken && owner !== uid) || Math.hypot(b.x - c.x, b.z - c.z) > 3.5) act = 0;
      }
      const wasBike = c.bike;
      stepCtrl(c, { ...st, dt: allowed / 1000, act, speed: st.speed as 0 | 1 | 2 | 3 }, this.bikes);
      if (c.bike !== wasBike) {
        if (wasBike >= 0) { this.bikeOwner[wasBike] = undefined; this.syncBike(wasBike); }
        if (c.bike >= 0) this.bikeOwner[c.bike] = uid;
      }
      if (c.bike >= 0) this.syncBike(c.bike);
      else if (wasBike >= 0) this.syncBike(wasBike);
    }
    fromCtrl(s.player, c);
    s.player.ackSeq = m.seq;
  }

  private snap(s: Seat, x: number, z: number, face: { x: number; z: number } | undefined, reason: SnapPayload["reason"]) {
    const c = toCtrl(s.player);
    const wasBike = c.bike;
    teleportCtrl(c, this.bikes, x, z, face?.x, face?.z);
    if (wasBike >= 0) { this.bikeOwner[wasBike] = undefined; this.syncBike(wasBike); }
    fromCtrl(s.player, c);
    s.epoch += 1;
    s.budgetMs = 100;
    s.lastInputAt = Date.now();
    const payload: SnapPayload = { x: c.x, y: c.y, z: c.z, heading: c.yaw, ...(face ? { fx: face.x, fz: face.z } : {}), bike: c.bike, seq: s.player.ackSeq, epoch: s.epoch, reason };
    s.client.send("snap", payload);
  }

  private handleTeleport(s: Seat, pointId: string) {
    const respawn = pointId === RESPAWN_ID;
    const pt = respawn ? { x: SPAWN.x, z: SPAWN.z, face: SPAWN_FACE } : teleportPoint(pointId);
    const now = Date.now();
    if (!pt || now - s.lastTeleportAt < TELEPORT_COOLDOWN_MS || !s.player.connected) {
      s.client.send("teleportDenied", { reason: pt ? "cooldown" : "unknown_point" });
      return;
    }
    s.lastTeleportAt = now;
    // Small jitter so people teleporting together do not stack exactly.
    this.snap(s, pt.x + (Math.random() - 0.5) * 1.2, pt.z + (Math.random() - 0.5) * 1.2, pt.face, "teleport");
  }

  private handleGoto(s: Seat, userId: string) {
    const now = Date.now();
    const target = this.state.players.get(userId);
    if (!target || !target.connected || userId === s.user.userId || now - s.lastTeleportAt < TELEPORT_COOLDOWN_MS) {
      s.client.send("teleportDenied", { reason: !target ? "unknown_player" : "cooldown" });
      return;
    }
    s.lastTeleportAt = now;
    const back = target.heading + Math.PI;
    const fx = target.x + Math.sin(target.heading) * 10, fz = target.z + Math.cos(target.heading) * 10;
    this.snap(s, target.x + Math.sin(back) * (PLAYER_RADIUS * 4), target.z + Math.cos(back) * (PLAYER_RADIUS * 4), { x: fx, z: fz }, "teleport");
  }

  // ---- chat / moderation ------------------------------------------------------------------------------------

  private handleChat(s: Seat, raw: unknown) {
    const parsed = ClientMessages.chat.safeParse(raw);
    const text = parsed.success ? sanitizeText(parsed.data.text) : "";
    if (!text) {
      s.client.send("chatError", { code: "invalid" });
      return;
    }
    const verdict = s.chat.tryTake(text);
    if (!verdict.ok) {
      s.client.send("chatError", { code: verdict.code, retryAfterMs: verdict.retryAfterMs });
      return;
    }
    this.broadcastChat(s.user.userId, s.user.nickname, text, false);
  }

  private broadcastChat(fromId: string, name: string, text: string, npc: boolean) {
    const msg: ChatBroadcast = { id: `${this.roomId}:${++this.chatSeq}`, fromId, name, text, ts: Date.now(), ...(npc ? { npc: true } : {}) };
    this.chatHistory.push(msg);
    if (this.chatHistory.length > CHAT_HISTORY * 2) this.chatHistory.splice(0, CHAT_HISTORY);
    const sender = [...this.seats.values()].find((x) => x.user.userId === fromId);
    for (const r of this.seats.values()) {
      if (!r.player.connected) continue;
      if (r.blocked.has(fromId) || sender?.blocked.has(r.user.userId)) continue;
      r.client.send("chat", msg);
    }
  }

  private actionAllowed(s: Seat, limit: { start: number; n: number }, max: number) {
    const now = Date.now();
    if (now - limit.start > 60_000) {
      limit.start = now;
      limit.n = 0;
    }
    limit.n += 1;
    return limit.n <= max;
  }

  private async handleBlock(client: Client, raw: unknown, on: boolean) {
    const s = this.seats.get(client.sessionId);
    const m = ClientMessages.block.safeParse(raw);
    if (!s || !m.success || !this.actionAllowed(s, s.actionWindow, 30)) return;
    try {
      if (on) {
        if (await addBlock(deps().pool, s.user.userId, m.data.userId)) s.blocked.add(m.data.userId);
      } else {
        await removeBlock(deps().pool, s.user.userId, m.data.userId);
        s.blocked.delete(m.data.userId);
      }
      s.client.send("blocked", { blocked: [...s.blocked] });
    } catch (err) {
      console.error("[plaza] block failed", (err as Error).message);
    }
  }

  private async handleReport(client: Client, raw: unknown) {
    const s = this.seats.get(client.sessionId);
    const m = ClientMessages.report.safeParse(raw);
    if (!s || !m.success) return;
    if (!this.actionAllowed(s, s.reports, 5)) {
      s.client.send("reportResult", { ok: false, reason: "rate_limited" });
      return;
    }
    try {
      const note = m.data.note ? sanitizeText(m.data.note, 300) : undefined;
      const ok = await addReport(deps().pool, s.user.userId, m.data.userId, m.data.reason, note);
      s.client.send("reportResult", { ok });
    } catch (err) {
      console.error("[plaza] report failed", (err as Error).message);
      s.client.send("reportResult", { ok: false, reason: "error" });
    }
  }

  // ---- NPC guide bot (labelled everywhere as a bot) ---------------------------------------------------------

  private spawnNpc() {
    const p = new PlayerState();
    p.userId = NPC_GUIDE_ID;
    p.name = "Guide Bot";
    p.kind = "npc";
    p.colorIndex = AVATAR_COLORS.length;
    p.connected = true;
    p.x = SPAWN.x + 4;
    p.z = SPAWN.z - 6;
    p.y = groundHeight(p.x, p.z);
    p.heading = 0;
    p.grounded = true;
    p.bike = -1;
    this.state.players.set(NPC_GUIDE_ID, p);
    this.npc = { player: p, target: 0, waitMs: 0, tipAt: Date.now() + 45_000, tipIdx: 0 };
  }

  private tick(dtMs: number) {
    const n = this.npc;
    if (!n) return;
    const dest = TELEPORT_POINTS[n.target % TELEPORT_POINTS.length]!;
    const dx = dest.x - n.player.x;
    const dz = dest.z - n.player.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.5) {
      n.waitMs += dtMs;
      n.player.vx = n.player.vz = 0;
      if (n.waitMs > 6000) {
        n.target = (n.target + 1 + Math.floor(Math.random() * 3)) % TELEPORT_POINTS.length;
        n.waitMs = 0;
      }
    } else {
      const k = (NPC_SPEED * dtMs) / 1000;
      const q = resolveCollisions({ x: n.player.x + (dx / d) * k, z: n.player.z + (dz / d) * k });
      n.player.x = q.x;
      n.player.z = q.z;
      n.player.y = groundHeight(q.x, q.z);
      n.player.vx = (dx / d) * NPC_SPEED;
      n.player.vz = (dz / d) * NPC_SPEED;
      n.player.heading = Math.atan2(dx, dz);
    }
    if (Date.now() > n.tipAt && this.seats.size > 0) {
      n.tipAt = Date.now() + 90_000;
      this.broadcastChat(NPC_GUIDE_ID, "Guide Bot", NPC_TIPS[n.tipIdx++ % NPC_TIPS.length]!, true);
    }
  }
}
