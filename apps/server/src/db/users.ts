import type { PublicProfile, SessionUser } from "@thrillancer/contracts";
import { AVATAR_COLORS } from "@thrillancer/contracts";
import type { Pool } from "./pool.ts";

interface UserRow {
  id: string;
  kind: "guest" | "wallet";
  nickname: string;
  color_index: number;
  created_at: Date;
}

const toSessionUser = (r: UserRow): SessionUser => ({
  userId: r.id,
  nickname: r.nickname,
  kind: r.kind,
  colorIndex: r.color_index,
});

export async function createGuest(pool: Pool, nickname: string): Promise<SessionUser> {
  const color = Math.floor(Math.random() * AVATAR_COLORS.length);
  const { rows } = await pool.query<UserRow>(
    "insert into users(kind, nickname, color_index) values ('guest', $1, $2) returning *",
    [nickname, color],
  );
  return toSessionUser(rows[0]!);
}

export async function getUser(pool: Pool, id: string): Promise<SessionUser | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await pool.query<UserRow>("select * from users where id = $1", [id]);
  return rows[0] ? toSessionUser(rows[0]) : null;
}

export async function setNickname(pool: Pool, id: string, nickname: string): Promise<SessionUser | null> {
  const { rows } = await pool.query<UserRow>(
    "update users set nickname = $2, last_seen_at = now() where id = $1 returning *",
    [id, nickname],
  );
  return rows[0] ? toSessionUser(rows[0]) : null;
}

export async function getPublicProfile(pool: Pool, id: string): Promise<PublicProfile | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await pool.query<UserRow>("select * from users where id = $1", [id]);
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.id,
    nickname: r.nickname,
    kind: r.kind,
    colorIndex: r.color_index,
    joinedAt: r.created_at.toISOString(),
    isBot: false,
  };
}

export async function listBlocks(pool: Pool, blockerId: string): Promise<string[]> {
  const { rows } = await pool.query<{ blocked_id: string }>("select blocked_id from user_blocks where blocker_id = $1", [blockerId]);
  return rows.map((r) => r.blocked_id);
}

export async function addBlock(pool: Pool, blockerId: string, blockedId: string): Promise<boolean> {
  if (blockerId === blockedId) return false;
  const r = await pool.query(
    "insert into user_blocks(blocker_id, blocked_id) select $1, id from users where id = $2 on conflict do nothing",
    [blockerId, blockedId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function removeBlock(pool: Pool, blockerId: string, blockedId: string): Promise<void> {
  await pool.query("delete from user_blocks where blocker_id = $1 and blocked_id = $2", [blockerId, blockedId]);
}

export async function addReport(pool: Pool, reporterId: string, targetId: string, reason: string, note?: string): Promise<boolean> {
  if (reporterId === targetId) return false;
  const r = await pool.query(
    "insert into reports(reporter_id, target_id, reason, note) select $1, id, $3, $4 from users where id = $2",
    [reporterId, targetId, reason, note ?? null],
  );
  return (r.rowCount ?? 0) > 0;
}
