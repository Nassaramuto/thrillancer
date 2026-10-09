import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export interface TicketPayload {
  uid: string;
  aud: string;
  exp: number; // epoch seconds
  jti: string;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");

export function signTicket(secret: string, payload: Omit<TicketPayload, "jti" | "exp">, ttlS: number, now = Date.now()): string {
  const body: TicketPayload = { ...payload, exp: Math.floor(now / 1000) + ttlS, jti: randomToken(12) };
  const data = b64(JSON.stringify(body));
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export type TicketResult = { ok: true; payload: TicketPayload } | { ok: false; reason: "malformed" | "signature" | "expired" | "audience" };

export function verifyTicket(secret: string, ticket: unknown, audience: string, now = Date.now()): TicketResult {
  if (typeof ticket !== "string" || ticket.length > 1024) return { ok: false, reason: "malformed" };
  const [data, sig] = ticket.split(".");
  if (!data || !sig) return { ok: false, reason: "malformed" };
  const expected = createHmac("sha256", secret).update(data).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "signature" };
  let payload: TicketPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload.uid !== "string" || typeof payload.exp !== "number" || typeof payload.jti !== "string") return { ok: false, reason: "malformed" };
  if (payload.aud !== audience) return { ok: false, reason: "audience" };
  if (payload.exp * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

/** Single-use guard: remembers consumed ticket ids until they would have expired anyway. */
export class TicketLedger {
  private used = new Map<string, number>();
  consume(jti: string, expSeconds: number, now = Date.now()): boolean {
    for (const [k, exp] of this.used) if (exp * 1000 < now) this.used.delete(k);
    if (this.used.has(jti)) return false;
    this.used.set(jti, expSeconds);
    return true;
  }
}
