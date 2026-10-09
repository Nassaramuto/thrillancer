import { createServer } from "node:http";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Server } from "@colyseus/core";
import { PLAZA_ROOM } from "@thrillancer/contracts";
import { loadConfig, type Config } from "./config.ts";
import { createPool, waitForDb, type Pool } from "./db/pool.ts";
import { runMigrations } from "./db/migrate.ts";
import { setDeps } from "./deps.ts";
import { TicketLedger } from "./auth/tokens.ts";
import { buildApi } from "./http/api.ts";
import { PlazaRoom } from "./rooms/PlazaRoom.ts";
import { presence, positionMemory } from "./rooms/presence.ts";

export interface RunningServer {
  port: number;
  cfg: Config;
  pool: Pool;
  stop(): Promise<void>;
}

export async function startServer(overrides: Partial<Config> = {}): Promise<RunningServer> {
  const cfg = loadConfig(process.env, overrides);
  const pool = createPool(cfg.databaseUrl);
  await waitForDb(pool);
  const applied = await runMigrations(pool);
  if (applied.length) console.log(`[db] applied migrations: ${applied.join(", ")}`);

  setDeps({ cfg, pool, ledger: new TicketLedger() });
  presence.clear();
  positionMemory.clear();

  const http = createServer();
  const transport = new WebSocketTransport({ server: http, pingInterval: 3000, pingMaxRetries: 3 });
  const server = new Server({
    transport,
    gracefullyShutdown: false,
    express: (app) => {
      app.disable("x-powered-by");
      app.set("trust proxy", cfg.production ? 1 : false);
      app.use("/api", buildApi(cfg, pool));
    },
  });
  server.define(PLAZA_ROOM, PlazaRoom);
  await server.listen(cfg.port);
  const addr = http.address();
  const port = typeof addr === "object" && addr ? addr.port : cfg.port;
  console.log(`[server] THRILLANCER listening on :${port} (origin ${cfg.appOrigin})`);

  return {
    port, cfg, pool,
    async stop() {
      await server.gracefullyShutdown(false).catch(() => {});
      await pool.end().catch(() => {});
    },
  };
}
