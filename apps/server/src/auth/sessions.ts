import type { SessionUser } from "@thrillancer/contracts";
import { SESSION_TTL_DAYS } from "@thrillancer/contracts";
import type { Pool } from "../db/pool.ts";
import { randomToken, sha256 } from "./tokens.ts";

export async function createSession(pool: Pool, userId: string, userAgent?: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await pool.query("insert into sessions(user_id, token_hash, expires_at, user_agent) values ($1, $2, $3, $4)", [
    userId,
    sha256(token),
    expiresAt,
    userAgent?.slice(0, 200) ?? null,
  ]);
  return { token, expiresAt };
}

export async function lookupSession(pool: Pool, token: string | undefined): Promise<SessionUser | null> {
  if (!token || token.length > 128) return null;
  const { rows } = await pool.query<{ id: string; kind: "guest" | "wallet"; nickname: string; color_index: number }>(
    `select u.id, u.kind, u.nickname, u.color_index
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()`,
    [sha256(token)],
  );
  const r = rows[0];
  return r ? { userId: r.id, kind: r.kind, nickname: r.nickname, colorIndex: r.color_index } : null;
}

export async function revokeSession(pool: Pool, token: string | undefined): Promise<void> {
  if (!token) return;
  await pool.query("update sessions set revoked_at = now() where token_hash = $1 and revoked_at is null", [sha256(token)]);
}
