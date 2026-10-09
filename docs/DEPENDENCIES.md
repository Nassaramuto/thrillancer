# Dependency record (verified against the npm registry on 2026-10-09)

| Package | Version | Why / note |
|---|---|---|
| `@colyseus/core`, `@colyseus/ws-transport`, `@colyseus/schema`, `@colyseus/sdk` | 0.18.18 / 0.18.4 / 5.0.36 / 0.18.5 | Colyseus 0.18 API (`schema()`/`t.*`, `onDrop`/`onReconnect`, `allowReconnection`). Used the individual packages rather than the `colyseus` meta package. API checked against the installed type definitions, not older snippets. |
| `express` | 5.2.1 | Peer requirement of the ws-transport HTTP app; hosts `/api`. |
| `pg` | 8.23.1 | PostgreSQL driver; plain SQL migrations in `apps/server/migrations`. |
| `zod` | 4.6.5 | Runtime validation of every client message, config and manifests. |
| `three` | 0.128.0 (pinned) | Renderer (imperative, no React Three Fiber). Pinned to r128, the revision the Claude Design world scripts were written for, so the original city, avatar rig and controller render unchanged. The V2 scripts also call `localStorage` (settings) and fetch CoinGecko prices client-side (see the design audit). Upgrading needs a visual regression pass. |
| `react`, `react-dom` | 19.3.0 | HTML overlays only. |
| `vite`, `@vitejs/plugin-react` | 8.3.4 / 6.1.2 | Dev server and build. |
| `typescript` | 5.9.3 | Deliberately 5.9 (not the new 7.x line) until the toolchain around it is proven. |
| `vitest` | 5.0.3 | Tests. |
| `tsx` | 4.23.15 | Runs the server TypeScript directly in dev/start. |
| `playwright` | 1.64.0 | Two-session browser test. |
| `embedded-postgres` | 18.4.0-beta.17 | Real PostgreSQL 18 binaries from npm so no Docker is needed for local dev. **Only a beta tag exists**; development use only. Production/staging should use a managed or standard PostgreSQL. Binaries for darwin-arm64/x64, linux, windows are in the lockfile. |

Not yet used (Milestone 2): Solana wallet/auth packages. They will be chosen from the Solana docs when M2 starts; none are installed now.

Node 22+ required. A `package-lock.json` is committed.
