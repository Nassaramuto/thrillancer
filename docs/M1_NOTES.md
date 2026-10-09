# Milestone 1 design notes

## Identity and sessions
- Guest entry: `POST /api/session/guest {nickname}` creates a `users` row server-side and an opaque session token. Only the SHA-256 of the token is stored (`sessions`). The browser holds it in an `HttpOnly; SameSite=Lax` cookie (`Secure` when `PUBLIC_APP_ORIGIN` is https). The client can never claim a user id.
- Refresh keeps identity: `GET /api/session` returns the cookie's user (or `null`).
- Cross-origin rules: the API accepts credentialed requests only from `PUBLIC_APP_ORIGIN`; other origins get 403. In production serve web and API under the same registrable domain (e.g. `app.example.com` + `api.example.com`) so `SameSite=Lax` cookies flow.
- **Leave vs sign out**: *Leave plaza* closes the room connection and keeps the session, so you return as the same person. *Sign out* revokes the session and clears the cookie; a guest identity cannot be recovered afterwards. (Wallet disconnect vs sign-out is specified in Milestone 2.)

## Room join
The room never sees the cookie. The client asks `POST /api/room-ticket` (cookie-authenticated) for a ticket: HMAC-signed, audience `plaza`, 60 s expiry, single use (in-process ledger). `onAuth` verifies signature, audience, expiry, replay, and that the user exists.

## Authoritative movement (V2 controller)
- `packages/contracts/src/ctrl.ts` is the shared port of the design controller (`stepCtrl`); `world.ts` holds the extracted colliders, ground height (terrace, ramp, mounds), bikes and the Travel table. Server and client replay use the same function.
- The client runs the real `Z.ctrl` for feel and camera, and sends **batches of controller steps** `{seq, epoch, steps[{dt<=0.05, wx, wz, speed, f, s, sprint, brake, jump, act, bike}]}` (at most 16 steps, about 20 messages/s). Idle frames are not sent.
- The server applies the steps with a per-player time budget (real elapsed time, capped at 400 ms of banking); excess steps are dropped, so a burst cannot teleport a player. Speeds are server constants (walk 4.8, sprint 11.5, follow 5), never client values.
- Mount (`act` 1) is honoured only when that bike is free (or yours) and within 3.5 m; a bike has one rider; leaving, dropping, disconnecting or teleporting releases it.
- Reconciliation: on every state patch the client rebuilds the server's state at its last acknowledged seq, replays the steps the server has not seen, and compares with what it shows. Under 15 cm it does nothing, up to 3 m it blends, beyond that (or on a bike mismatch) it snaps. A mount/dismount pressed but not yet queued is not compared. Teleports snap and bump the epoch so in-flight inputs are discarded.
- Out-of-order seq, stale epoch and schema-invalid messages are ignored. Flooding past 60 msg/s disconnects.
- Teleport only to server-known point ids (including `respawn`), 1.5 s cooldown; "go to player" places you beside a connected player.

## Presence, reconnect, duplicates
- Avatars are keyed by user id, so one user can never have two avatars. A second session for the same user (other tab, other plaza room, stale reconnect window) evicts the first and inherits its position.
- Abrupt disconnects keep the seat for 20 s: the avatar is shown ghosted/"reconnecting". The SDK retries the same seat; if it gives up the client re-joins with a fresh ticket.
- Positions are ephemeral (in-process memory); only identity, sessions, blocks and reports are in PostgreSQL.

## Chat and moderation
Server-side: NFKC normalise, strip control/bidi characters, 1–200 chars, token bucket (burst 4, 1 per 2 s), identical-message suppression, per-recipient block filtering (both directions). Mute is client-local; block and report are persisted (`user_blocks`, `reports`). Chat history is in memory (last 40) and not stored.

## The bot
"Guide Bot" is a server-controlled NPC, flagged `kind: npc` in state, labelled "BOT" in the world, the player list, chat and profile card. It patrols the teleport points and posts a tip every 90 s while someone is present. It is not counted as a person.

## Known limits
- Capacity is **unmeasured**: `PLAZA_MAX_CLIENTS` defaults to 24 as a bound, not a claim. Load tests are a Milestone 5 task.
- Presence and the ticket ledger are in-process; a multi-process deployment needs a shared store.
- Venue interiors are decorative in M1; teleport points land outside the buildings until Milestone 3.
- The design's ambient crowd, penguin and unicorn are local scenery, not synchronised and not users. The seven bicycles are shared and server-owned.
- Mobile browsers are untested and there are no touch controls.
- The design controller clamps each frame to 50 ms, so below 20 fps the avatar moves in slow motion (that is the design's behaviour, kept on purpose). Real-GPU frame rate is unmeasured.
