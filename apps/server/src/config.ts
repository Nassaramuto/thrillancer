import { randomBytes } from "node:crypto";
import { z } from "zod";
import { PLAZA_MAX_CLIENTS } from "@thrillancer/contracts";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(2567),
  DATABASE_URL: z.string().min(1).default("postgresql://zeitgeist:zeitgeist@localhost:5432/zeitgeist"),
  PUBLIC_APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  SESSION_SECRET: z.string().optional(),
  PLAZA_MAX_CLIENTS: z.coerce.number().int().min(2).max(100).default(PLAZA_MAX_CLIENTS),
  GUEST_RATE_PER_MIN: z.coerce.number().int().min(1).default(20),
});

export interface Config {
  nodeEnv: string;
  production: boolean;
  port: number;
  databaseUrl: string;
  appOrigin: string;
  secureCookies: boolean;
  sessionSecret: string;
  plazaMaxClients: number;
  guestRatePerMin: number;
}

export function loadConfig(env: Record<string, string | undefined> = process.env, overrides: Partial<Config> = {}): Config {
  const e = EnvSchema.parse(env);
  const production = e.NODE_ENV === "production";
  let secret = e.SESSION_SECRET?.trim();
  if (!secret) {
    if (production) throw new Error("SESSION_SECRET is required when NODE_ENV=production");
    secret = randomBytes(32).toString("hex");
    console.warn("[config] SESSION_SECRET not set; using a random per-process secret (room tickets reset on restart).");
  } else if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  const appOrigin = e.PUBLIC_APP_ORIGIN.replace(/\/$/, "");
  return {
    nodeEnv: e.NODE_ENV,
    production,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    appOrigin,
    secureCookies: appOrigin.startsWith("https://"),
    sessionSecret: secret,
    plazaMaxClients: e.PLAZA_MAX_CLIENTS,
    guestRatePerMin: e.GUEST_RATE_PER_MIN,
    ...overrides,
  };
}
