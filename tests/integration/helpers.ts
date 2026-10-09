import { Client, type Room } from "@colyseus/sdk";
import pg from "pg";
import { randomBytes } from "node:crypto";
import { SESSION_COOKIE } from "@thrillancer/contracts";
import { startServer, type RunningServer } from "../../apps/server/src/server.ts";

export const ADMIN_DB_URL = process.env.TEST_DATABASE_ADMIN_URL ?? "postgresql://zeitgeist:zeitgeist@localhost:5432/postgres";
export const ORIGIN = "http://localhost:5173";

export interface TestServer extends RunningServer {
  http: string;
  ws: string;
  dbName: string;
  drop(): Promise<void>;
}

/** Boots the real server against a throwaway database. Requires a reachable Postgres (npm run db:dev). */
export async function bootTestServer(over: { plazaMaxClients?: number; guestRatePerMin?: number } = {}): Promise<TestServer> {
  const admin = new pg.Client({ connectionString: ADMIN_DB_URL });
  try {
    await admin.connect();
  } catch (err) {
    throw new Error(`Integration tests need PostgreSQL at ${ADMIN_DB_URL} (run "npm run db:dev" in another terminal, or set TEST_DATABASE_ADMIN_URL). ${(err as Error).message}`);
  }
  const dbName = `zg_test_${randomBytes(4).toString("hex")}`;
  await admin.query(`create database ${dbName}`);
  const u = new URL(ADMIN_DB_URL);
  u.pathname = `/${dbName}`;
  process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "x".repeat(48);
  const srv = await startServer({ databaseUrl: u.toString(), port: 0, appOrigin: ORIGIN, guestRatePerMin: 1000, ...over });
  return {
    ...srv,
    http: `http://localhost:${srv.port}`,
    ws: `ws://localhost:${srv.port}`,
    dbName,
    async stop() {
      await srv.stop();
    },
    async drop() {
      await srv.stop();
      await admin.query(`drop database if exists ${dbName} with (force)`);
      await admin.end();
    },
  };
}

export interface Account {
  userId: string;
  nickname: string;
  cookie: string;
}

export async function createGuest(s: TestServer, nickname: string): Promise<Account> {
  const res = await fetch(`${s.http}/api/session/guest`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ nickname }),
  });
  if (res.status !== 201) throw new Error(`guest create failed ${res.status} ${await res.text()}`);
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0]!;
  const body = (await res.json()) as { user: { userId: string; nickname: string } };
  if (!cookie.startsWith(`${SESSION_COOKIE}=`)) throw new Error("no session cookie");
  return { userId: body.user.userId, nickname: body.user.nickname, cookie };
}

export async function getTicket(s: TestServer, a: Account): Promise<string> {
  const res = await fetch(`${s.http}/api/room-ticket`, { method: "POST", headers: { cookie: a.cookie, origin: ORIGIN } });
  if (!res.ok) throw new Error(`ticket failed ${res.status}`);
  return ((await res.json()) as { ticket: string }).ticket;
}

export interface Peer {
  account: Account;
  room: Room;
  chats: any[];
  snaps: any[];
  errors: any[];
  denied: any[];
  replaced: any[];
  seq: number;
  epoch: number;
  players(): Map<string, any>;
  me(): any;
}

export async function joinPlaza(s: TestServer, account: Account, ticket?: string): Promise<Peer> {
  const client = new Client(s.ws);
  const room = await client.joinOrCreate("plaza", { ticket: ticket ?? (await getTicket(s, account)) });
  const peer: Peer = {
    account, room, chats: [], snaps: [], errors: [], denied: [], replaced: [], seq: 0, epoch: 0,
    players: () => {
      const m = new Map<string, any>();
      (room.state as any)?.players?.forEach((p: any, k: string) => m.set(k, p));
      return m;
    },
    me: () => (room.state as any)?.players?.get(account.userId),
  };
  room.onMessage("welcome", (w: any) => {
    peer.epoch = w.epoch;
  });
  room.onMessage("chat", (m: any) => peer.chats.push(m));
  room.onMessage("chatError", (m: any) => peer.errors.push(m));
  room.onMessage("snap", (m: any) => {
    peer.snaps.push(m);
    peer.epoch = m.epoch;
  });
  room.onMessage("teleportDenied", (m: any) => peer.denied.push(m));
  room.onMessage("replaced", (m: any) => peer.replaced.push(m));
  room.onMessage("*", () => {});
  room.send("hello", {});
  await waitFor(() => peer.me() && peer.epoch > 0, 5000, "own player + welcome");
  return peer;
}

export interface StepOpts { sprint?: boolean; jump?: boolean; brake?: boolean; act?: number; bike?: number; f?: number; s?: number; }
export function mkStep(dtMs: number, wx: number, wz: number, o: StepOpts = {}) {
  return {
    dt: Math.min(dtMs, 50) / 1000, wx, wz, speed: o.sprint ? 1 : 0, f: o.f ?? 0, s: o.s ?? 0,
    sprint: !!o.sprint, brake: !!o.brake, jump: !!o.jump, act: o.act ?? 0, bike: o.bike ?? -1,
  };
}
export function sendSteps(p: Peer, steps: any[]) {
  p.room.send("input", { seq: ++p.seq, epoch: p.epoch, steps });
}
/** One controller step of dtMs (<=50) walking toward world direction (wx, wz). */
export function sendInput(p: Peer, dtMs: number, wx: number, wz: number, sprint = false, o: StepOpts = {}) {
  sendSteps(p, [mkStep(dtMs, wx, wz, { ...o, sprint })]);
}

export async function waitFor(fn: () => unknown, timeoutMs = 4000, label = "condition"): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`timeout waiting for ${label}`);
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
