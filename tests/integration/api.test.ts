import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@thrillancer/contracts";
import { bootTestServer, createGuest, ORIGIN, type TestServer } from "./helpers.ts";

let s: TestServer;
beforeAll(async () => {
  s = await bootTestServer();
});
afterAll(async () => {
  await s?.drop();
});

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${s.http}${path}`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN, ...headers }, body: JSON.stringify(body) });

describe("session API", () => {
  it("issues an HttpOnly cookie, persists identity across requests, and reuses the session", async () => {
    const res = await post("/api/session/guest", { nickname: "Guesty" });
    expect(res.status).toBe(201);
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    const first = (await res.json()) as any;
    const c = cookie.split(";")[0]!;
    const me = await fetch(`${s.http}/api/session`, { headers: { cookie: c, origin: ORIGIN } });
    expect(((await me.json()) as any).user.userId).toBe(first.user.userId);
    const again = await post("/api/session/guest", { nickname: "Renamed" }, { cookie: c });
    const body = (await again.json()) as any;
    expect(body.reused).toBe(true);
    expect(body.user.userId).toBe(first.user.userId);
    expect(body.user.nickname).toBe("Renamed");
    const count = await s.pool.query("select count(*)::int as n from users where id=$1", [first.user.userId]);
    expect(count.rows[0].n).toBe(1);
  });

  it("validates nicknames and refuses foreign origins", async () => {
    expect((await post("/api/session/guest", { nickname: "x" })).status).toBe(400);
    expect((await post("/api/session/guest", { nickname: "<b>hi</b>" })).status).toBe(400);
    expect((await post("/api/session/guest", {})).status).toBe(400);
    const evil = await post("/api/session/guest", { nickname: "Evil Origin" }, { origin: "https://evil.example" });
    expect(evil.status).toBe(403);
  });

  it("requires a session for tickets and profiles; sign-out revokes the session", async () => {
    expect((await post("/api/room-ticket", {})).status).toBe(401);
    const a = await createGuest(s, "Signer");
    const ok = await fetch(`${s.http}/api/room-ticket`, { method: "POST", headers: { cookie: a.cookie, origin: ORIGIN } });
    expect(ok.status).toBe(200);
    const prof = await fetch(`${s.http}/api/profile/${a.userId}`, { headers: { cookie: a.cookie, origin: ORIGIN } });
    expect(((await prof.json()) as any).profile.nickname).toBe("Signer");
    const noauth = await fetch(`${s.http}/api/profile/${a.userId}`, { headers: { origin: ORIGIN } });
    expect(noauth.status).toBe(401);
    const bot = await fetch(`${s.http}/api/profile/npc:guide`, { headers: { cookie: a.cookie, origin: ORIGIN } });
    expect(((await bot.json()) as any).profile.isBot).toBe(true);
    await post("/api/session/signout", {}, { cookie: a.cookie });
    const after = await fetch(`${s.http}/api/session`, { headers: { cookie: a.cookie, origin: ORIGIN } });
    expect(((await after.json()) as any).user).toBeNull();
    const reuse = await fetch(`${s.http}/api/room-ticket`, { method: "POST", headers: { cookie: a.cookie, origin: ORIGIN } });
    expect(reuse.status).toBe(401);
  });

  it("stores only a hash of the session token", async () => {
    const a = await createGuest(s, "Hashed");
    const token = decodeURIComponent(a.cookie.split("=")[1]!);
    const rows = await s.pool.query("select token_hash from sessions where user_id=$1", [a.userId]);
    expect(rows.rows[0].token_hash).not.toBe(token);
    expect(rows.rows[0].token_hash).toHaveLength(64);
  });

  it("rejects profile lookups with malformed ids", async () => {
    const a = await createGuest(s, "Prober");
    const r = await fetch(`${s.http}/api/profile/${encodeURIComponent("1; drop table users")}`, { headers: { cookie: a.cookie, origin: ORIGIN } });
    expect(r.status).toBe(404);
  });
});
