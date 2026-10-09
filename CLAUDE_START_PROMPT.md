You are implementing ZEITGEIST, a community-built alternative Earth rooted in crypto culture. Work in this folder. Read README.md, AGENTS.md and all docs before changing code.

Build a working proof of concept for a hosted session with 10–20 participants. This is an implementation task, not another design presentation. Use the existing Claude Design export when available; audit reusable geometry and interaction code. If its referenced files are missing, document that and build a compact procedural plaza rather than blocking.

The hub is a crypto Burning Man terminal: memorable landmarks, real people, clear opportunities, optional exploration, and instant entry into experiences. Remove generic apartment-block filler. Keep a Shiba-shaped community venue, classical competition arena, pill-themed launch venue preview, neon paths, a sky activity billboard and a small rocket landmark. Only the plaza and two activities need work initially. Do not spend the first milestone rebuilding the globe or generating giant celebrity assets.

Implement this stack unless repository evidence requires an explained adjustment: React + TypeScript + Vite client, Three.js rendering (React Three Fiber permitted), Node + TypeScript + Colyseus service, shared runtime-validated schemas, PostgreSQL persistence. Use official documentation to verify compatible stable versions and wallet packages. Do not copy obsolete API snippets. Separate visual client, game server, wallet authentication, payments, content registry and experience connector.

Implement milestones in docs/IMPLEMENTATION_PLAN.md in order. Make each milestone runnable and demonstrate it before broadening scope. Maintain docs/STATUS.md with completed features, checks, blockers and exact next commands. Provide root dev, build, typecheck and test scripts plus an accurate .env.example. Never invent test results.

Required visitor journey:
1. Enter as guest or authenticate a Solana wallet; select a nickname.
2. See real connected avatars, inspect a profile, use text chat and teleport.
3. Open the opportunity board: activity, duration, availability, optional cost/reward. Sample figures must be labeled demo.
4. Enter a short checkpoint race or cooperative repair challenge. Preserve identity and the selected party where possible; membership handoff must prevent duplicate reward delivery.
5. Receive a server-verified result and return to the plaza at the venue entrance.
6. Optionally make one explicitly labeled devnet SOL payment through the normal wallet confirmation UI and see a verified receipt. Gameplay stays free.
7. Visit a camp submitted through the contribution template and its manifest, not hard-coded into the scene.

Build real multiplayer, not scripted avatars posing as users. Server controls legal movement, completion and shared objective progress. Use bounded rooms, reconnection handling, chat rate limits and message validation. Label bots if used for testing. Do not promise 1,000 visible avatars; collect capacity evidence.

Wallet login: issue an expiring server challenge bound to intended domain and wallet; verify its signature and consume its nonce exactly once. Use secure session cookies or appropriately scoped session tickets; never accept a claimed wallet address as authentication. Allow guests. No private key collection and no automatic signing. Explain disconnect versus sign-out behavior.

Payment: devnet only, explicit amount and destination, fresh transaction construction, official wallet signing flow, server/RPC verification of successful network execution and expected recipient/amount, and one receipt per signature. Never trust browser success messages. Payment cannot be triggered by collision, movement, entering a portal or pressing a gameplay key. Support rejection, timeout, retries and unavailable RPC honestly. No spend of real funds.

Community integration: implement the connection contract and manifest in docs/EXPERIENCE_CONTRACT.md. First support approved GLB/GLTF camps and vetted first-party activity modules. Arbitrary HTML or code uploads must not execute in the primary application. Show independent-host integration as a documented later adapter unless it can be implemented with isolated origin, narrow messaging and server-verifiable results. Do not claim a link-out is seamless world integration.

Persist users, wallet links, camps, plots, versions, sessions, results and receipts. Introduce migrations and seeded illustrative content. Camp assignment is free and administered in this proof: no land auction or platform token mint. Enforce builder authorization and optimistic version checks. A model update must not reset identity or move neighboring plots.

Prioritize reliable control and journeys over scenery. Implement walking, camera and teleportation first; cycling is optional after those work. HTML overlays handle menus and wallet flows. Keep a visible Home action, minimap, activity selection, clear key hints, loading/failure/retry screens and low-quality setting. Target desktop first and document mobile status accurately.

Test the meaningful boundaries: nonce replay, plot authorization, double result submissions, payment signature reuse, reconnect, room handoff and chat validation. Do browser checks with two sessions. Measure real frame rate, latency, errors and result handoff. Record test conditions. Do not infer capacity from a cinematic or simulated clients alone.

Start now: inspect files, report a concise implementation sequence, create the workspace, and implement milestone 1. Continue autonomously through reversible implementation and testing. Ask only for essential unavailable credentials or externally consequential actions. Do not deploy publicly or use paid services without specific authorization. End with working commands, actual checks and the next tester-ready milestone.
