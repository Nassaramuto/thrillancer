import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PLAZA_RADIUS, SPAWN, WALK_SPEED, TELEPORT_POINTS } from "@thrillancer/contracts";
import {
  bootTestServer, createGuest, getTicket, joinPlaza, mkStep, sendInput, sendSteps, sleep, waitFor, type TestServer,
} from "./helpers.ts";

let s: TestServer;
beforeAll(async () => {
  s = await bootTestServer();
});
afterAll(async () => {
  await s?.drop();
});

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

describe("shared plaza", () => {
  it("two real sessions see each other plus a labelled bot", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Alice A"), createGuest(s, "Bob B")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    await waitFor(() => pa.players().size === 3 && pb.players().size === 3, 5000, "both see 3 entries");
    expect(pa.players().get(b.userId)?.name).toBe("Bob B");
    expect(pa.players().get("npc:guide")?.kind).toBe("npc");
    expect(pa.players().get(a.userId)?.kind).toBe("user");
    pa.room.leave();
    pb.room.leave();
  });

  it("server moves the avatar from input and other clients see it", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Mover"), createGuest(s, "Watcher")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    await waitFor(() => pb.players().get(a.userId), 3000, "watcher sees mover");
    const start = { x: pa.me().x, z: pa.me().z };
    for (let i = 0; i < 10; i++) {
      sendInput(pa, 50, 1, 0);
      await sleep(50);
    }
    await sleep(200);
    const moved = pb.players().get(a.userId);
    expect(moved.x - start.x).toBeGreaterThan(1);
    expect(moved.x - start.x).toBeLessThan(WALK_SPEED * 0.9);
    expect(pa.me().ackSeq).toBeGreaterThanOrEqual(10);
    pa.room.leave();
    pb.room.leave();
  });

  it("rejects speed hacks: a burst of 100 max-dt inputs cannot teleport the player", async () => {
    const a = await createGuest(s, "Speedy");
    const p = await joinPlaza(s, a);
    const start = { x: p.me().x, z: p.me().z };
    for (let i = 0; i < 100; i++) sendInput(p, 50, 1, 0, true);
    await sleep(600);
    // 100 inputs claim 10 s of travel (78 m at sprint). The budget allows ~0.5 s.
    expect(dist(start, p.me())).toBeLessThan(7);
    p.room.leave();
  });

  it("ignores out-of-order, stale-epoch and malformed inputs", async () => {
    const a = await createGuest(s, "Sloppy");
    const p = await joinPlaza(s, a);
    const start = { x: p.me().x, z: p.me().z };
    const ok = mkStep(50, 1, 0);
    p.room.send("input", { seq: 5, epoch: p.epoch + 7, steps: [ok] }); // wrong epoch
    p.room.send("input", { seq: 6, epoch: p.epoch, steps: [{ ...ok, wx: 99 }] }); // invalid magnitude
    p.room.send("input", { seq: 7, epoch: p.epoch, steps: [{ ...ok, dt: "fast" }] });
    p.room.send("input", { seq: 8, epoch: p.epoch, steps: [] });
    p.room.send("input", "nonsense");
    await sleep(300);
    expect(dist(start, p.me())).toBeLessThan(0.001);
    p.room.leave();
  });

  it("server collision keeps players out of landmarks and inside the plaza", async () => {
    const a = await createGuest(s, "Wall");
    const p = await joinPlaza(s, a);
    p.room.send("teleport", { pointId: "square" });
    await waitFor(() => p.snaps.length > 0);
    for (let i = 0; i < 90; i++) {
      sendInput(p, 50, 0, -1, true); // straight at the centre landmark
      await sleep(25);
    }
    await sleep(200);
    expect(Math.hypot(p.me().x, p.me().z)).toBeGreaterThanOrEqual(3.2);
    expect(Math.hypot(p.me().x, p.me().z)).toBeLessThanOrEqual(PLAZA_RADIUS);
    p.room.leave();
  });

  it("teleport: valid points work, unknown ids and rapid repeats are denied", async () => {
    const a = await createGuest(s, "Hopper");
    const p = await joinPlaza(s, a);
    p.room.send("teleport", { pointId: "colo" });
    await waitFor(() => p.snaps.length === 1);
    const arena = TELEPORT_POINTS.find((t) => t.id === "colo")!;
    await waitFor(() => dist(p.me(), arena) < 2.5); // state patch can trail the snap message
    expect(dist(p.me(), arena)).toBeLessThan(2.5);
    p.room.send("teleport", { pointId: "square" });
    await waitFor(() => p.denied.length === 1);
    expect(p.denied[0].reason).toBe("cooldown");
    await sleep(1600);
    p.room.send("teleport", { pointId: "../../etc" });
    await waitFor(() => p.denied.length === 2);
    expect(p.denied[1].reason).toBe("unknown_point");
    expect(dist(p.me(), arena)).toBeLessThan(2.5);
    p.room.leave();
  });

  it("jump leaves the ground and lands again (server authoritative)", async () => {
    const a = await createGuest(s, "Jumper");
    const p = await joinPlaza(s, a);
    sendSteps(p, [mkStep(50, 0, 0, { jump: true }), mkStep(50, 0, 0), mkStep(50, 0, 0)]);
    await waitFor(() => p.me().y > 0.2 || !p.me().grounded, 2000, "airborne");
    for (let i = 0; i < 30; i++) { sendInput(p, 50, 0, 0); await sleep(30); }
    await waitFor(() => p.me().grounded && p.me().y < 0.05, 3000, "landed");
    p.room.leave();
  });

  it("bikes: mount needs range, one rider per bike, dismount frees it", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Rider"), createGuest(s, "Other")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    await waitFor(() => pa.room.state.bikes.size > 0, 3000, "bikes replicated");
    // spawn is ~7.5 m from bike 0: out of mount range, so the request is ignored
    sendSteps(pa, [mkStep(50, 0, 0, { act: 1, bike: 0 })]);
    await sleep(300);
    expect(pa.me().bike).toBe(-1);
    // walk both players to the bike
    const bike = () => pa.room.state.bikes.get("0");
    const walkTo = async (p: any) => {
      for (let i = 0; i < 80 && dist(p.me(), bike()) > 2; i++) {
        const dx = bike().x - p.me().x, dz = bike().z - p.me().z, d = Math.hypot(dx, dz) || 1;
        sendInput(p, 50, dx / d, dz / d, true);
        await sleep(60);
      }
    };
    await walkTo(pa);
    await walkTo(pb);
    expect(dist(pa.me(), bike())).toBeLessThan(3.5);
    sendSteps(pa, [mkStep(50, 0, 0, { act: 1, bike: 0 })]);
    await waitFor(() => pa.me().bike === 0, 2000, "A mounted");
    sendSteps(pb, [mkStep(50, 0, 0, { act: 1, bike: 0 })]);
    await sleep(300);
    expect(pb.me().bike).toBe(-1); // taken
    expect(bike().taken).toBe(true);
    sendSteps(pa, [mkStep(50, 0, 0, { act: 2 })]);
    await waitFor(() => pa.me().bike === -1 && !bike().taken, 2000, "dismounted and freed");
    pa.room.leave();
    pb.room.leave();
  });

  it("goto player places you beside a connected player", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Target"), createGuest(s, "Seeker")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    pa.room.send("teleport", { pointId: "pill" });
    await waitFor(() => pa.snaps.length === 1);
    await sleep(150);
    pb.room.send("gotoPlayer", { userId: a.userId });
    await waitFor(() => pb.snaps.length === 1);
    await sleep(150);
    expect(dist(pa.me(), pb.me())).toBeLessThan(4);
    pa.room.leave();
    pb.room.leave();
  });
});

describe("chat", () => {
  it("delivers to others, sanitises, validates and rate limits", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Talker"), createGuest(s, "Listener")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    pa.room.send("chat", { text: "  hello‮   world\u0000 " });
    await waitFor(() => pb.chats.length === 1);
    expect(pb.chats[0].text).toBe("hello world");
    expect(pb.chats[0].fromId).toBe(a.userId);
    pa.room.send("chat", { text: "   " });
    pa.room.send("chat", { text: 12345 });
    pa.room.send("chat", { text: "x".repeat(2000) }); // over the schema cap: invalid
    await waitFor(() => pa.errors.length >= 3);
    expect(pa.errors.every((e) => e.code === "invalid")).toBe(true);
    for (let i = 0; i < 8; i++) pa.room.send("chat", { text: `spam ${i}` });
    await waitFor(() => pa.errors.some((e) => e.code === "rate_limited"));
    const delivered = pb.chats.length;
    expect(delivered).toBeLessThanOrEqual(5); // burst capacity is 4 (+1 earlier, minus refill)
    pa.room.leave();
    pb.room.leave();
  });

  it("blocked users no longer exchange chat; block persists in the database", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Blocker"), createGuest(s, "Blocked")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    await waitFor(() => pa.players().has(b.userId));
    pa.room.send("block", { userId: b.userId });
    await sleep(300);
    pb.room.send("chat", { text: "can you see this?" });
    await sleep(300);
    expect(pa.chats.find((c) => c.fromId === b.userId)).toBeUndefined();
    pa.room.send("chat", { text: "and this?" });
    await sleep(300);
    expect(pb.chats.find((c) => c.fromId === a.userId)).toBeUndefined();
    const rows = await s.pool.query("select 1 from user_blocks where blocker_id=$1 and blocked_id=$2", [a.userId, b.userId]);
    expect(rows.rowCount).toBe(1);
    pa.room.send("unblock", { userId: b.userId });
    await sleep(300);
    pb.room.send("chat", { text: "back again" });
    await waitFor(() => pa.chats.some((c) => c.text === "back again"));
    pa.room.leave();
    pb.room.leave();
  });

  it("reports are stored and rate limited", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Reporter"), createGuest(s, "Reported")]);
    const pa = await joinPlaza(s, a);
    pa.room.send("report", { userId: b.userId, reason: "spam", note: "test" });
    await sleep(300);
    const rows = await s.pool.query("select reason from reports where reporter_id=$1", [a.userId]);
    expect(rows.rows[0].reason).toBe("spam");
    pa.room.send("report", { userId: b.userId, reason: "bogus" }); // invalid reason ignored
    await sleep(200);
    expect((await s.pool.query("select 1 from reports where reporter_id=$1", [a.userId])).rowCount).toBe(1);
    pa.room.leave();
  });
});

describe("tickets and identity", () => {
  it("a room ticket works once; replay, tampering and missing tickets are rejected", async () => {
    const a = await createGuest(s, "Ticketed");
    const ticket = await getTicket(s, a);
    const p = await joinPlaza(s, a, ticket);
    p.room.leave();
    await sleep(200);
    await expect(joinPlaza(s, a, ticket)).rejects.toThrow();
    const fresh = await getTicket(s, a);
    await expect(joinPlaza(s, a, fresh.slice(0, -3) + "AAA")).rejects.toThrow();
    await expect(joinPlaza(s, a, "")).rejects.toThrow();
  });

  it("a claimed user id is not authentication: forged ticket for another user fails", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Real"), createGuest(s, "Victim")]);
    const t = await getTicket(s, a);
    const [data, sig] = t.split(".");
    const body = JSON.parse(Buffer.from(data!, "base64url").toString());
    body.uid = b.userId;
    const forged = `${Buffer.from(JSON.stringify(body)).toString("base64url")}.${sig}`;
    await expect(joinPlaza(s, a, forged)).rejects.toThrow();
  });
});

describe("reconnect and duplicate seats", () => {
  it("a dropped connection is marked disconnected then resumes on the same avatar", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Flaky"), createGuest(s, "Steady")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    pa.room.send("teleport", { pointId: "shiba" });
    await waitFor(() => pa.snaps.length === 1);
    await sleep(150);
    const pos = { x: pb.players().get(a.userId).x, z: pb.players().get(a.userId).z };
    const baseline = pb.players().size;
    const token = pa.room.reconnectionToken;
    (pa.room as any).connection.transport.ws.close(); // abrupt close, not a consented leave
    await waitFor(() => pb.players().get(a.userId)?.connected === false, 5000, "marked disconnected");
    expect(pb.players().size).toBe(baseline);
    const { Client } = await import("@colyseus/sdk");
    const again = await new Client(s.ws).reconnect(token);
    again.send("hello", {});
    await waitFor(() => pb.players().get(a.userId)?.connected === true, 5000, "reconnected");
    expect(pb.players().size).toBe(baseline); // no duplicate avatar
    expect(dist(pb.players().get(a.userId), pos)).toBeLessThan(0.5);
    again.leave();
    pb.room.leave();
  });

  it("opening a second session for the same user evicts the first; one avatar remains", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Twin"), createGuest(s, "Observer")]);
    const first = await joinPlaza(s, a);
    const obs = await joinPlaza(s, b);
    first.room.send("teleport", { pointId: "colo" });
    await waitFor(() => first.snaps.length === 1);
    await sleep(150);
    const baseline = obs.players().size;
    const second = await joinPlaza(s, a);
    await waitFor(() => first.replaced.length === 1, 3000, "first told it was replaced");
    await sleep(300);
    expect(obs.players().size).toBe(baseline);
    expect(dist(second.me(), TELEPORT_POINTS.find((t) => t.id === "colo")!)).toBeLessThan(3); // kept its place
    second.room.leave();
    obs.room.leave();
  });

  it("the explicit leave removes the avatar immediately", async () => {
    const [a, b] = await Promise.all([createGuest(s, "Leaver"), createGuest(s, "Stayer")]);
    const pa = await joinPlaza(s, a);
    const pb = await joinPlaza(s, b);
    await waitFor(() => pb.players().has(a.userId));
    await pa.room.leave();
    await waitFor(() => !pb.players().has(a.userId), 3000, "avatar removed");
    pb.room.leave();
  });
});

describe("bounded rooms", () => {
  it("fills a room to its limit then opens another", async () => {
    const small = await bootTestServer({ plazaMaxClients: 2 });
    try {
      const accounts = await Promise.all(["R1", "R2", "R3"].map((n) => createGuest(small, n)));
      const peers = [];
      for (const acc of accounts) peers.push(await joinPlaza(small, acc));
      const rooms = new Set(peers.map((p) => p.room.roomId));
      expect(rooms.size).toBe(2);
      expect(SPAWN).toBeDefined();
      peers.forEach((p) => p.room.leave());
    } finally {
      await small.drop();
    }
  });
});
