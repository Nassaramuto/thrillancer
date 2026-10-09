import { describe, expect, it } from "vitest";
import { signTicket, verifyTicket, TicketLedger } from "./auth/tokens.ts";
import { ChatLimiter } from "./rooms/chatLimiter.ts";

const SECRET = "s".repeat(40);

describe("room tickets", () => {
  it("round-trips and binds audience", () => {
    const t = signTicket(SECRET, { uid: "u1", aud: "plaza" }, 60);
    const ok = verifyTicket(SECRET, t, "plaza");
    expect(ok.ok && ok.payload.uid).toBe("u1");
    expect(verifyTicket(SECRET, t, "other")).toEqual({ ok: false, reason: "audience" });
  });
  it("rejects tampering, wrong secret and expiry", () => {
    const t = signTicket(SECRET, { uid: "u1", aud: "plaza" }, 60);
    const [d, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "admin", aud: "plaza", exp: 9e9, jti: "x" })).toString("base64url");
    expect(verifyTicket(SECRET, `${forged}.${s}`, "plaza").ok).toBe(false);
    expect(verifyTicket("z".repeat(40), t, "plaza").ok).toBe(false);
    expect(verifyTicket(SECRET, t, "plaza", Date.now() + 61_000)).toEqual({ ok: false, reason: "expired" });
    expect(verifyTicket(SECRET, "garbage", "plaza").ok).toBe(false);
    expect(verifyTicket(SECRET, undefined, "plaza").ok).toBe(false);
    void d;
  });
  it("ledger consumes a ticket id exactly once", () => {
    const l = new TicketLedger();
    expect(l.consume("a", Math.floor(Date.now() / 1000) + 60)).toBe(true);
    expect(l.consume("a", Math.floor(Date.now() / 1000) + 60)).toBe(false);
  });
});

describe("chat limiter", () => {
  it("allows a burst then rate limits, then refills", () => {
    const l = new ChatLimiter(0);
    const results = [0, 1, 2, 3, 4].map((i) => l.tryTake(`m${i}`, i));
    expect(results.slice(0, 4).every((r) => r.ok)).toBe(true);
    expect(results[4]).toMatchObject({ ok: false, code: "rate_limited" });
    expect(l.tryTake("later", 6000).ok).toBe(true);
  });
  it("suppresses immediate repeats", () => {
    const l = new ChatLimiter(0);
    expect(l.tryTake("same", 0).ok).toBe(true);
    expect(l.tryTake("same", 10)).toMatchObject({ ok: false, code: "invalid" });
  });
});
