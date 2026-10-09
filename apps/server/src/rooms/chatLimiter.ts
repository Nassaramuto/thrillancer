import { CHAT_BUCKET_CAPACITY, CHAT_REFILL_MS } from "@thrillancer/contracts";

/** Token bucket: short bursts allowed, sustained rate of one message per CHAT_REFILL_MS. */
export class ChatLimiter {
  private tokens = CHAT_BUCKET_CAPACITY;
  private last: number;
  private lastText = "";
  constructor(now = Date.now()) {
    this.last = now;
  }
  tryTake(text: string, now = Date.now()): { ok: true } | { ok: false; code: "rate_limited" | "invalid"; retryAfterMs?: number } {
    this.tokens = Math.min(CHAT_BUCKET_CAPACITY, this.tokens + (now - this.last) / CHAT_REFILL_MS);
    this.last = now;
    if (text === this.lastText && this.tokens < CHAT_BUCKET_CAPACITY) {
      return { ok: false, code: "invalid" }; // repeated identical message while not idle
    }
    if (this.tokens < 1) {
      return { ok: false, code: "rate_limited", retryAfterMs: Math.ceil((1 - this.tokens) * CHAT_REFILL_MS) };
    }
    this.tokens -= 1;
    this.lastText = text;
    return { ok: true };
  }
}
