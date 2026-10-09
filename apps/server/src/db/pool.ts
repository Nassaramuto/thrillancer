import pg from "pg";

export type Pool = pg.Pool;

export function createPool(databaseUrl: string): Pool {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10, idleTimeoutMillis: 30_000 });
  pool.on("error", (err) => console.error("[db] idle client error", err.message));
  return pool;
}

/** Wait for Postgres to accept connections (dev DB may still be booting). */
export async function waitForDb(pool: Pool, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      await pool.query("select 1");
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Database not reachable after ${timeoutMs}ms: ${(lastErr as Error)?.message ?? lastErr}`);
}
