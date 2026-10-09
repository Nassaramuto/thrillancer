// Starts a local PostgreSQL for development using the `embedded-postgres` npm package (real Postgres binaries, no Docker needed).
// Data lives in .data/pg (gitignored). Stop with Ctrl+C. Skip this script if you already have a Postgres: set DATABASE_URL and run `npm run dev:app`.
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const url = new URL(process.env.DATABASE_URL ?? "postgresql://zeitgeist:zeitgeist@localhost:5432/zeitgeist");
const port = Number(url.port || 5432);
const user = decodeURIComponent(url.username || "zeitgeist");
const password = decodeURIComponent(url.password || "zeitgeist");
const dbName = url.pathname.replace(/^\//, "") || "zeitgeist";
const dir = path.resolve(process.env.DEV_DB_DIR ?? ".data/pg");
mkdirSync(path.dirname(dir), { recursive: true });

const pg = new EmbeddedPostgres({ databaseDir: dir, user, password, port, persistent: true, onLog: () => {}, onError: (e) => console.error("[pg]", String(e).trim()) });
if (!existsSync(path.join(dir, "PG_VERSION"))) {
  console.log(`[db] initialising new cluster in ${dir}`);
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase(dbName);
  console.log(`[db] created database "${dbName}"`);
} catch (e) {
  if (!/already exists/i.test(String(e?.message ?? e))) console.warn("[db] createDatabase:", e?.message ?? e);
}
console.log(`[db] PostgreSQL ready on localhost:${port} (database "${dbName}", user "${user}")`);

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  await pg.stop().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
