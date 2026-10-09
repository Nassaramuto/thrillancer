# Implementation plan

## Decisions
Desktop browser first. One compact festival district, two game rooms, optional wallet sign-in. Guests can play. Real multiplayer text chat; voice deferred. Platform economics and mainnet deferred. Working fiction: repair the city beacon before an event starts. Race deliveries and cooperative repair contribute to one shared objective. No actual catastrophe or wallet loss.

## Milestone 1 — shared plaza
Create workspace and scene, guest session, Colyseus plaza room, server-checked movement, other real players, minimap, teleport, inspectable profiles, chat with mute/block/report hooks, reconnect and error UI. Server-issued guest identity persists on refresh. Distinguish disconnected players and NPCs. PostgreSQL stores durable identity; real-time positions remain ephemeral.
Acceptance: two independent browser sessions see each other, communicate and rejoin without duplicated avatars. Movement is pleasant and camera reliable. Guest flow works without a wallet.

## Milestone 2 — wallet and devnet receipt
Challenge/signature login and explicit devnet SOL payment. Link guest history only after authenticated ownership and conflict handling. Protect session fixation and nonce replay. Recipient and amount come from server configuration. Transaction signatures cannot pay two different intents. Verify chain, success, recipient, amount and requested payment intent. Explain finality policy and support uncertain/pending results. Never show devnet tokens as money earned.
Acceptance: connect, rejected signature, successful login, expired/replayed nonce, wrong wallet and payment rejection are handled. Confirmed receipt survives refresh; duplicate submissions do not duplicate credit.

## Milestone 3 — activity continuity
Opportunity board and venue entrances. Short checkpoint race plus cooperative repair interaction, deliberately different controls. Each has its own room and server-validated objectives. Shared party and identity, Home button, consistent return location. Server-issued short-lived handoff ticket; expire abandoned reservations. Reward display uses demo points, not minted assets. Shared beacon progress accepts unique completed session events.
Acceptance: two players move plaza → activity → plaza, preserve identity, receive one result, recover from interrupted transition and can discover next activity. Retry cannot duplicate mission progress.

## Milestone 4 — builder camp
Manifest validation, free plot assignment, GLB asset pipeline, fixed bounds, spawn/entrance mapping, versioned publication and rollback. Separate draft from published. Allow GLB buildings plus reviewed activity modules. Provide a template and documented instructions; let a different vibecoder submit a new camp and update it.
Acceptance: outsider publishes and updates via the documented route without core scene edits. Unauthorized plot update fails. Invalid assets fail with helpful errors; bad publication can be rolled back.

## Milestone 5 — hosted test
Prepare a production build and staging deployment instructions with WebSocket support, HTTPS, database migration, allowed origins and public devnet recipient. Hosting selection/credentials are unresolved. No blanket public deployment authorization is implied by this folder.
Run load simulation at 20, 30 and 50 clients, then event with 10–20 real users. Report results separately. Proposed initial goals: 30+ FPS on declared representative laptops; p95 action-to-visible response below 250 ms on declared test network; at least 90% complete an activity and return unaided. These are validation targets, not guarantees.

## Later, only after evidence
Independent hosted experience adapter; better bike controls; mobile wallet QA; real creator commissions; land allocation/auction contract; platform token utility; launchpad integrations; spectator markets and jurisdiction-specific review if pursuing wagering. Each has its own specification.

## Architecture
Web renders approved geometry and sends user inputs. Colyseus runs bounded plaza/game rooms. API authenticates sessions and registers content. PostgreSQL retains ownership, versions and results. Solana RPC verifies devnet payments. Shared schemas define what each service accepts.

Colyseus scaling increases rooms across processes; single-room capacity must be measured. Do not assume more servers makes a single plaza unlimited. Reference: https://docs.colyseus.io/scalability
Wallet auth reference: https://solana.com/docs/frontend/messages-and-auth
Model loading reference: https://threejs.org/manual/pages/loading-3d-models.html

## Questions to resolve through implementation
Complete design export availability, target tester devices, compatible dependencies, chosen hosting, target room population and independent-builder feedback. Do not invent model-version capabilities or preselect paid providers.
