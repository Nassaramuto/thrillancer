# Status

Last updated: 2026-10-09. Milestone 1 (shared plaza) is **implemented and runnable locally on the Claude Design V2 world**. Milestones 2-5: not started.

## Done in Milestone 1
- Workspace (npm workspaces), shared contracts, root `dev` / `build` / `typecheck` / `test` scripts, `.env.example`, committed lockfile.
- PostgreSQL migration `001_identity.sql` (users, sessions, user_blocks, reports); migration runner; `npm run db:dev` local Postgres without Docker.
- Guest sessions (server-issued, HttpOnly cookie, hashed token), nickname validation, single-use room tickets.
- Colyseus plaza room: server-authoritative controller (walk, sprint, jump, ledges, ramps), shared bicycles (one rider each, range-checked mount), teleport + cooldown + respawn, go-to-player, chat with sanitising/rate limit, mute (client), block + report (persisted), reconnect window, duplicate-seat eviction, bounded rooms, labelled Guide Bot.
- Client = the V2 design: its unmodified world, avatar rig, controller and camera (look up/down, recenter, occlusion, pointer capture), plus the globe, arrival card, Travel menu with route chevrons/beam/target bar, Options, minimap, Discoveries, unicorn flights and the 16-chapter cinematic tour, re-implemented in React/TS from `zg-app.js`. Details and deviations: `docs/DESIGN_EXPORT_AUDIT.md`.
- Server colliders, ground height, bikes and the Travel table are extracted from the design scripts (`npm run world:extract`). The ported controller is proven equal to the real `zg-ctrl.js` by `tests/parity`.
- The wallet button is disabled and says Milestone 2; the opportunity board is not built (Milestone 3).

## Checks actually run (Linux x64 cloud sandbox, Node 22.22, PostgreSQL 18.4 via embedded-postgres)
| Check | Result |
|---|---|
| `npm run typecheck` (all workspaces) | pass |
| `npm run build` (web bundle + server bundle) | web and server bundles build; the bundled server was not re-booted after the V2 change |
| `npx vitest run`: 40 tests / 5 files (contracts unit, controller parity vs real design code, integration against a real server + throwaway Postgres) | 40 pass |
| `npm run test:e2e`: two Chromium contexts, 16 checks (enter, visibility, bot label, walking, position agreement, chat, rate limit, Travel-menu teleport, Respawn, profile card, refresh identity, no duplicate, socket-drop ghost + resume) | 16 / 16 pass |
| `node tests/e2e/gameplay.mjs`: walk to a bike, mount (server claims it), ride, second session sees rider and bike, dismount frees it, jump; prediction vs server | 7 / 7 pass, 0 corrections, 0 m max error |

Integration tests cover: ticket replay/expiry/forgery, session cookie flags and hashing, foreign-origin rejection, sign-out revocation, speed-hack burst, stale-epoch/out-of-order/malformed steps, wall/boundary collision, jump, bike mount range / single rider / dismount, teleport cooldown and unknown ids, chat sanitising/rate limit, block persistence, report storage, reconnect without duplicate, same-user eviction, explicit leave, room capacity overflow.

Visual check: screenshots of the globe, spawn, Travel route, Options, Colosseum, looking up at the sky and the tour were compared by eye with the V2 design; they match in layout and look. I did not do a pixel diff against the design's own rendering.

## Measurements and their limits
`docs/evidence/m1-two-sessions.json` and `m1-gameplay.json` record conditions. WebGL here is **software-rendered (SwiftShader) on 2 vCPUs**: about 2-5 fps, **not representative of any real laptop**. Scene size: about 1050 draw calls and 50k triangles in low quality (the V2 city is heavier than V1). The design controller clamps each frame to 50 ms, so below 20 fps movement is slow motion; the e2e therefore checks direction, bounds and agreement, not real-time speed. Localhost round trip 7-36 ms.
**Not measured:** real-GPU frame rate (needs a laptop run), WAN latency, server capacity (no load test), mobile. If frame rate is poor, instancing/merging the design's meshes is the next job.
The only browser console errors are blocked Google Fonts requests (no outbound access in the sandbox).

## Things you should know
- Sprint speed: the design README says 8.6 m/s, the design code does 11.5 m/s. The port follows the code.
- The Sky Market Board fetches CoinGecko prices from every player's browser (design code). Decide whether that is acceptable for the hosted session.
- The crowd, penguin, unicorn and the discoveries (bones, Ring Run, launch spotter, penguin trail) are local scenery/flavour. They are not users, not synchronised, and grant nothing that is stored.
- Respawn does not reset other riders' bikes (the design's did); the tour is a client-only camera.
- `embedded-postgres` only ships a beta tag; development use only.

## Blockers / open questions
- Target tester devices and hosting are still undecided (needed for Milestone 5).
- No wallet/RPC packages chosen yet (Milestone 2 will verify against Solana docs).
- Needs a human run on a real GPU laptop to judge feel and FPS before the hosted session.

## Exact next commands
```bash
cd Desktop/Launchpad/thrillancer
npm install
npm run dev                  # then open http://localhost:5173 in two windows (add #city to skip the globe)
npm test                     # needs `npm run db:dev` running in another terminal; parity needs PLAYWRIGHT_CHROMIUM_EXECUTABLE or `npx playwright install chromium`
npm run world:extract         # only if the design scripts change
npm run test:e2e && node tests/e2e/gameplay.mjs   # with `npm run dev` running
```

## Next tester-ready milestone
Milestone 2: wallet challenge/signature login and an explicit devnet SOL payment with a server-verified receipt (see `docs/IMPLEMENTATION_PLAN.md`). Only on your go.
