# Experience connection contract v0.1

## Manifest
experienceId, version, title, kind, authorId, plotId, description, assetUrl, entryPoint, spawn, bounds, supportedFeatures, durationEstimateSeconds, integrationMode, publicationStatus. Sample JSON is in content/manifests. Validate schemas at runtime; URLs have allowed schemes/origins and assets have size limits.

## Identity
Persistent platform user ID is authoritative. Wallet address is an optional verified link, never a substitute for server verification. No session cookie or reusable login credential is passed to a creator's origin. A later third-party adapter receives an audience-scoped, short-lived capability ticket through a server-mediated exchange.

## Entry
Client asks server to enter experience/version. Server checks registration, eligibility, room capacity and current session. Server issues/reserves handoff and returns loading details. One active gameplay session per user for this proof. Party members may enter together; failure has cancel/retry behavior. Client cannot choose another user's identity.

## Completion
Client input is not a trusted result. First-party server validates checkpoints, elapsed time, allowed movement and cooperative actions. Durable completion event includes eventId, userId, sessionId, experienceId, version, outcome, score and server time. Unique event/session constraints prevent duplicate objective contributions. Signing a result from a third-party operator authenticates its origin, not its truth: economic rewards require an approved verifier or trusted operator policy.

## Exit
Home/exit releases room membership and returns to registered plaza entrance. Reconnect either resumes valid session or safely returns home. Database identity and progression do not depend on renderer lifetime. Unsupported inventory stays in account but is not usable in that experience.

## Models and code
GLB/GLTF visual assets are not full games. Validate asset size, textures, external resource paths, bounds and performance; use declared collisions. Never execute uploaded JavaScript in main origin. Separate hosted games require an isolated adapter and limited messaging. Renderer continuity and authentication continuity are different deliverables.

## Plots
Stable plot ID, transform/bounds, creator authorization, current publication version. Admin assigns free plot for proof. Updates require owner permission and matching expected version. Publication review checks bounds, functionality, provenance and performance. No tradable land right is implied.
