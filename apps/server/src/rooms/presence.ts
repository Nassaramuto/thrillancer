/** One live plaza seat per user across all plaza rooms in this process. */
export interface SeatHandle {
  roomId: string;
  sessionId: string;
  kick(reason: string): void;
}
const seats = new Map<string, SeatHandle>();

export const presence = {
  /** Registers a seat and evicts any previous one for the same user. Returns the evicted handle, if any. */
  claim(userId: string, handle: SeatHandle): SeatHandle | undefined {
    const prev = seats.get(userId);
    seats.set(userId, handle);
    return prev;
  },
  release(userId: string, sessionId: string) {
    if (seats.get(userId)?.sessionId === sessionId) seats.delete(userId);
  },
  get: (userId: string) => seats.get(userId),
  count: () => seats.size,
  clear: () => seats.clear(),
};

/** Last known position so a refresh or reconnect keeps you where you were (ephemeral, in-process). */
const lastPos = new Map<string, { x: number; z: number; heading: number; at: number }>();
export const positionMemory = {
  save(userId: string, p: { x: number; z: number; heading: number }) {
    lastPos.set(userId, { ...p, at: Date.now() });
    if (lastPos.size > 2000) for (const [k, v] of lastPos) if (Date.now() - v.at > 600_000) lastPos.delete(k);
  },
  recall(userId: string, maxAgeMs = 300_000) {
    const p = lastPos.get(userId);
    return p && Date.now() - p.at < maxAgeMs ? p : undefined;
  },
  clear: () => lastPos.clear(),
};
