import express, { type NextFunction, type Request, type Response } from "express";
import { ROOM_TICKET_TTL_S, SESSION_COOKIE, SESSION_TTL_DAYS, PLAZA_ROOM, NPC_GUIDE_ID, validateNickname, AVATAR_COLORS, NPC_COLOR } from "@thrillancer/contracts";
import type { PublicProfile, SessionUser } from "@thrillancer/contracts";
import type { Config } from "../config.ts";
import type { Pool } from "../db/pool.ts";
import { createGuest, getPublicProfile, setNickname } from "../db/users.ts";
import { createSession, lookupSession, revokeSession } from "../auth/sessions.ts";
import { signTicket } from "../auth/tokens.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionUser;
    sessionToken?: string;
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Fixed-window limiter keyed by caller; good enough for a single-process proof. */
class WindowLimiter {
  private hits = new Map<string, { n: number; reset: number }>();
  constructor(private max: number, private windowMs: number) {}
  allow(key: string, now = Date.now()): boolean {
    const h = this.hits.get(key);
    if (!h || h.reset < now) {
      this.hits.set(key, { n: 1, reset: now + this.windowMs });
      if (this.hits.size > 5000) for (const [k, v] of this.hits) if (v.reset < now) this.hits.delete(k);
      return true;
    }
    h.n += 1;
    return h.n <= this.max;
  }
}

export function buildApi(cfg: Config, pool: Pool): express.Router {
  const api = express.Router();
  const guestLimiter = new WindowLimiter(cfg.guestRatePerMin, 60_000);
  const ticketLimiter = new WindowLimiter(30, 60_000);

  // CORS: only the configured app origin may call with credentials.
  api.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      if (origin !== cfg.appOrigin) {
        res.status(403).json({ error: "origin_not_allowed" });
        return;
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  api.use(express.json({ limit: "4kb" }));

  // Attach session user if cookie valid.
  api.use(async (req, _res, next) => {
    try {
      const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      req.sessionToken = token;
      req.user = (await lookupSession(pool, token)) ?? undefined;
      next();
    } catch (err) {
      next(err);
    }
  });

  const cookieAttrs = (maxAgeS: number) =>
    `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeS}${cfg.secureCookies ? "; Secure" : ""}`;
  const setSessionCookie = (res: Response, token: string) =>
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieAttrs(SESSION_TTL_DAYS * 86_400)}`);
  const clearSessionCookie = (res: Response) => res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; ${cookieAttrs(0)}`);
  const requireUser = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "no_session" });
      return;
    }
    next();
  };

  api.get("/health", async (_req, res) => {
    try {
      await pool.query("select 1");
      res.json({ ok: true, db: "up", time: Date.now() });
    } catch {
      res.status(503).json({ ok: false, db: "down" });
    }
  });

  api.get("/session", (req, res) => {
    res.json({ user: req.user ?? null });
  });

  // Guest entry: the server creates the identity and issues the session; the client cannot claim a user id.
  api.post("/session/guest", async (req, res, next) => {
    try {
      if (!guestLimiter.allow(req.ip ?? "unknown")) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      const nick = validateNickname(req.body?.nickname);
      if (!nick.ok) {
        res.status(400).json({ error: "invalid_nickname", message: nick.reason });
        return;
      }
      // Reuse an existing valid session instead of minting a second identity for the same browser.
      if (req.user) {
        const updated = req.user.nickname === nick.value ? req.user : await setNickname(pool, req.user.userId, nick.value);
        res.json({ user: updated, reused: true });
        return;
      }
      const user = await createGuest(pool, nick.value);
      const { token } = await createSession(pool, user.userId, req.headers["user-agent"]);
      setSessionCookie(res, token);
      res.status(201).json({ user, reused: false });
    } catch (err) {
      next(err);
    }
  });

  api.patch("/me", requireUser, async (req, res, next) => {
    try {
      const nick = validateNickname(req.body?.nickname);
      if (!nick.ok) {
        res.status(400).json({ error: "invalid_nickname", message: nick.reason });
        return;
      }
      const user = await setNickname(pool, req.user!.userId, nick.value);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  });

  // Sign out: revokes this browser's session. A guest identity cannot be recovered afterwards.
  api.post("/session/signout", async (req, res, next) => {
    try {
      await revokeSession(pool, req.sessionToken);
      clearSessionCookie(res);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Short-lived, single-use room ticket. This is what a room join presents; the room never sees the cookie.
  api.post("/room-ticket", requireUser, (req, res) => {
    if (!ticketLimiter.allow(req.user!.userId)) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    const ticket = signTicket(cfg.sessionSecret, { uid: req.user!.userId, aud: PLAZA_ROOM }, ROOM_TICKET_TTL_S);
    res.json({ ticket, expiresInS: ROOM_TICKET_TTL_S });
  });

  api.get("/profile/:id", requireUser, async (req, res, next) => {
    try {
      const id = String(req.params.id);
      if (id === NPC_GUIDE_ID) {
        const bot: PublicProfile = {
          userId: NPC_GUIDE_ID,
          nickname: "Guide Bot",
          kind: "npc",
          colorIndex: AVATAR_COLORS.length,
          joinedAt: new Date(0).toISOString(),
          isBot: true,
          note: "Server-controlled test bot. Not a real participant.",
        };
        void NPC_COLOR;
        res.json({ profile: bot });
        return;
      }
      const profile = await getPublicProfile(pool, id);
      if (!profile) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  });

  api.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api] error", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "internal" });
  });
  return api;
}
