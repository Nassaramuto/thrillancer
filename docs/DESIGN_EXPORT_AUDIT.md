# Claude Design export audit (V2)

Source: `references/claude-design/V2 Zeitgeist cinematic animation suite/` (untouched; it also holds the README, `zg-app.js` and `zg-test.js`). Seven world scripts are vendored **byte-for-byte** into `apps/web/public/design/` (checked with `cmp`): `zg-core.js`, `zg-avatar.js`, `zg-city.js`, `zg-dest.js`, `zg-dest2.js`, `zg-extras.js`, `zg-ctrl.js`, loaded in the design's own boot order (`zg-boot.js`). They run on three.js r128 (`three@0.128.0` from npm; the minified copy used by the headless tools is `scripts/vendor/three-r128.min.js`).

## Used as-is (unmodified design code)
- The whole city (`zg-city/dest/dest2/extras`): square, Pill Pantheon, Colosseum, Shiba House, Moonport + Atlas, Speech Square, Gallery, Penguin Mountain, Solana Sky Hall, Stonk Exchange, Wif Hat Plaza, Jean Phil Ring, Sky Market Board, Ring Run, lookouts, bikes, penguin, unicorn model.
- The avatar rig `Z.makeAvatar()` (IK walking, run, jump, ride). "You" and every remote player are built with it; remote players only differ in colours/hair/hat. The Guide Bot has its own pale look and a "BOT" tag.
- The character controller, camera and bicycle `Z.ctrl` (camera-relative WASD, acceleration, jump buffer/coyote time, ledge blocking, orbit/look incl. looking up, auto-recenter, camera occlusion, mount/dismount, pointer capture). It runs unmodified in the browser, so feel is the design's. Only `C.jump`, `C.interact`, `C.respawn` are wrapped so the same action is also sent to the server.

## Re-implemented from `zg-app.js` (not loaded; ported to React/TS, same look, copy and behaviour)
Globe "Earth, alternate" and city pins; arrival card; Travel menu (categories, distance, route chevrons + beam, target bar, Teleport now / Walk); Options (sensitivity X/Y, invert, auto-recenter, capture mouse, neon backpack, spark halo, rainbow wheels, reset camera V, respawn R); minimap; Discoveries (Shiba bones, Ring Run, launch spotter, penguin trail); toasts; E prompt; help; unicorn flights; fireworks; cinematic tour (16 chapters, captions, play/pause/next/exit); panel modal for venue info.

## Made multiplayer (server authority)
- Server collision, ground height, bounds and teleport table come from the design: `npm run world:extract` runs the real scripts headlessly and dumps circles (281), boxes (23), platforms (14), mounds (2), bikes (7), destinations (11) and the Travel table to `packages/contracts/src/world-data.ts`.
- The controller physics are ported to `packages/contracts/src/ctrl.ts` (`stepCtrl`) and shared by server and client replay. **Parity is tested**: `tests/parity` records the real `zg-ctrl.js` in headless Chromium (walk/sprint, zigzag + jumps with varying dt, Colosseum ramp, Pantheon walls, bike mount/ride/steer/brake/dismount) and replays the same steps through `stepCtrl`. Measured divergence: 0 m on walk/jump/ramp, 0.5 mm on wall contact, 1 mm on the bike run.
- Bicycles are shared: seven bikes, one rider each, server-validated (free, within 3.5 m). A ridden bike follows its rider on every screen; a dropped bike stays where it was left. Teleport/respawn dismounts.

## Deliberately different from the design
- **Sprint speed.** The design README says 8.6 m/s; the design code uses 11.5 m/s. The port follows the code (11.5), which is what the design actually does.
- **Respawn (R) / Options > Respawn** is a teleport to the square facing the Pantheon for me only. The design's `C.respawn` also reset every bike; in a shared world that would yank bikes from other riders, so bikes are not reset.
- **Cinematic tour / globe** are client-only views. The tour does not move your avatar or anyone else's; your avatar stands still in the room while the camera flies.
- Travel > Teleport asks the server (1.5 s cooldown, fade held until the server answers) instead of moving locally.
- Chat is the real room chat (design chat was a local stub). Players menu, profile card, block/report, quality toggle and the connection banner are additions, styled to match.
- The previous "Opportunity board (preview)" sheet was removed: the design's Travel > Activities already covers it, and the board stays a Milestone 3 job.

## Scenery, not people
The ambient crowd, the walking penguin, the unicorn and the discoveries/quests are generated locally by the design code. They are not users, are not synchronised and grant nothing (the Good Boy badge, Spark Halo and rainbow wheels are local to the tab and not stored). Real people are listed under Players (P); the Guide Bot is labelled BOT everywhere.

## External network call you should know about
`zg-extras.js` (Sky Market Board) fetches prices from CoinGecko **from each player's browser** every 60 s. If blocked or offline it shows "FEED OFFLINE" and dashes (no invented prices). Decide before the hosted session whether that is acceptable (rate limits with 20 clients on one IP; privacy of player IPs to a third party). Not a live product integration.

## Not carried over
`zg-test.js` (the design's in-browser behaviour tests) is not vendored; the parity test and the e2e suites replace it. Mobile/touch controls do not exist in the design and were not added.
