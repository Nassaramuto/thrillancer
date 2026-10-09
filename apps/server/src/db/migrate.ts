import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "./pool.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
// Works from source (src/db), from the esbuild bundle (dist/), and when MIGRATIONS_DIR is set explicitly.
export const MIGRATIONS_DIR =
  [process.env.MIGRATIONS_DIR, path.resolve(here, "../../migrations"), path.resolve(here, "../migrations")].find((d) => !!d && existsSync(d)) ??
  path.resolve(here, "../../migrations");

/** Applies pending *.sql files in lexical order, each in its own transaction, serialized by an advisory lock. */
export async function runMigrations(pool: Pool, dir = MIGRATIONS_DIR): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query("select pg_advisory_lock(727001)");
    await client.query(
      "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const done = new Set((await client.query<{ name: string }>("select name from schema_migrations")).rows.map((r) => r.name));
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const f of files) {
      if (done.has(f)) continue;
      const sql = await readFile(path.join(dir, f), "utf8");
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into schema_migrations(name) values ($1)", [f]);
        await client.query("commit");
        applied.push(f);
      } catch (err) {
        await client.query("rollback");
        throw new Error(`Migration ${f} failed: ${(err as Error).message}`);
      }
    }
  } finally {
    await client.query("select pg_advisory_unlock(727001)").catch(() => {});
    client.release();
  }
  return applied;
}
