import type { Config } from "./config.ts";
import type { Pool } from "./db/pool.ts";
import { TicketLedger } from "./auth/tokens.ts";

/** Process-wide services the rooms need. Set once by startServer(); rooms are constructed by Colyseus so they cannot take args. */
export interface Deps {
  cfg: Config;
  pool: Pool;
  ledger: TicketLedger;
}
let current: Deps | undefined;
export const setDeps = (d: Deps) => {
  current = d;
};
export const deps = (): Deps => {
  if (!current) throw new Error("server dependencies not initialised");
  return current;
};
