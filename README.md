# THRILLANCER — proof-of-concept plaza

A community-built alternative Earth rooted in crypto culture. This repository is the proof of concept for a hosted session with 10–20 participants.

**Current state: Milestone 1 (shared plaza) is implemented and runnable, on the Claude Design V2 world** (controller, avatar rig, bikes, travel menu, globe, tour). See `docs/STATUS.md` for what works, what was tested, and what is not built yet.

## Run it (desktop, Node 22+)
```bash
npm install
cp .env.example .env        # optional for local dev; defaults work
npm run dev                 # starts local Postgres (embedded), the game server (:2567) and the web client (:5173)
```
Open http://localhost:5173 in two browser windows (use a normal and a private window, or two browsers, so each gets its own guest identity), enter different nicknames, and you will see each other.

Already have PostgreSQL? Set `DATABASE_URL` in `.env` and run `npm run dev:app` instead of `npm run dev`.

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Embedded Postgres + server + web client, with reload |
| `npm run dev:app` | Server + web client only (bring your own Postgres) |
| `npm run db:dev` | Just the local development Postgres (`.data/pg`) |
| `npm run db:migrate` | Apply pending SQL migrations (the server also does this on boot) |
| `npm run typecheck` | TypeScript check of all workspaces |
| `npm test` | Unit + integration tests (integration needs Postgres: run `npm run db:dev` first) |
| `npm run test:e2e` | Two-browser-session test against a running `npm run dev` stack (needs `npx playwright install chromium`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE`). Also: `node tests/e2e/gameplay.mjs` (bike mount/ride/dismount/jump, two sessions) |
| `npm run world:extract` | Re-dump colliders, bikes and the Travel table from the design scripts (needs `PLAYWRIGHT_CHROMIUM_EXECUTABLE` or Playwright's Chromium) |
| `npm run build` | Typecheck + production bundles (`apps/web/dist`, `apps/server/dist`) |

## Controls
WASD move (camera-relative) · Shift sprint · Space jump (brake on a bike) · drag or arrow keys to look (up too) · E mount/dismount/interact · F follow the penguin · V reset camera · R respawn · M travel · O options · P players · Enter chat · T cinematic tour · G Earth · H hide help · F3 debug overlay. Click an avatar to inspect it. Open straight into the city (skipping the globe) with `http://localhost:5173/#city`.

## Structure
- `apps/web`: React + TypeScript + Vite client, plain Three.js (r128) renderer running the original Claude Design V2 world scripts, React HUD.
- `apps/server`: Node + TypeScript service: Colyseus rooms, HTTP API (sessions, tickets, profiles), PostgreSQL migrations.
- `packages/contracts`: shared runtime-validated schemas, world layout, and the controller port (`stepCtrl`) and world data used by both server and client replay. No secrets.
- `packages/experience-sdk`: stub for activity/camp integration (Milestones 3–4).
- `content`: world registry and sample manifests (used from Milestone 4).
- `examples/community-camp`: independent-builder template (filled in at Milestone 4).
- `docs`: plan, contract, status, test protocol, audit and dependency records.
- `references/claude-design`: the supplied design export. Not modified.

## Out of scope for this proof
Platform token economics, real-money wagering, paid land, mainnet transactions, live external launchpad integrations, public deployment. See `docs/IMPLEMENTATION_PLAN.md`.
