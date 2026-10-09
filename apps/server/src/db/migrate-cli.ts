import { loadConfig } from "../config.ts";
import { createPool, waitForDb } from "./pool.ts";
import { runMigrations } from "./migrate.ts";

const cfg = loadConfig();
const pool = createPool(cfg.databaseUrl);
try {
  await waitForDb(pool);
  const applied = await runMigrations(pool);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database already up to date.");
} finally {
  await pool.end();
}
