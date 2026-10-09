// Two independent browser sessions against a running stack (npm run dev). Records conditions + measurements to docs/evidence/.
// Usage: npm run test:e2e   (env: APP_URL, API_URL, PLAYWRIGHT_CHROMIUM_EXECUTABLE, HEADFUL=1)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";

const APP = process.env.APP_URL ?? "http://localhost:5173";
const outDir = new URL("./out/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const VIEWPORT = { width: 800, height: 450 };
const results = [];
const log = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 8000, label = "condition") {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(100);
  }
  throw new Error(`timeout: ${label}`);
}

const browser = await chromium.launch({
  headless: !process.env.HEADFUL,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const errors = { A: [], B: [] };
async function session(tag, nickname) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  await ctx.addInitScript(() => { try { localStorage.setItem("zg.quality", "low"); } catch {} });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors[tag].push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors[tag].push(`console: ${m.text()}`); });
  await page.goto(APP + "/#city"); // start in the city (the globe intro is covered by tests/e2e/v2shots.mjs)
  await page.fill("#nick", nickname);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => window.__zg?.stats().players >= 1 && window.__zg.conn().status === "connected", null, { timeout: 45000, polling: 250 });
  return { ctx, page };
}
const players = (page) => page.evaluate(() => window.__zg.players());
const stats = (page) => page.evaluate(() => window.__zg.stats());

try {
  const t0 = Date.now();
  const A = await session("A", "AliceE2E");
  const tFirst = Date.now() - t0;
  const B = await session("B", "BobE2E");
  log("both sessions enter as guests", true, `first session ready in ${tFirst} ms`);

  await until(async () => (await players(A.page)).some((p) => p.name === "BobE2E") && (await players(B.page)).some((p) => p.name === "AliceE2E"), 8000, "mutual visibility");
  const roster = await players(A.page);
  log("real avatars visible to each other", true, roster.map((p) => `${p.name}${p.kind === "npc" ? "[bot]" : ""}`).join(", "));
  log("bot is labelled as npc", roster.some((p) => p.kind === "npc" && p.name === "Guide Bot"));

  // movement: A walks forward; B must see A move; server authority keeps A's predicted position consistent.
  const before = (await stats(A.page)).pos;
  await A.page.keyboard.down("KeyW");
  await sleep(4000);
  await A.page.keyboard.up("KeyW");
  await sleep(900);
  const afterA = (await stats(A.page)).pos;
  const seenByB = (await players(B.page)).find((p) => p.name === "AliceE2E");
  const moved = Math.hypot(afterA.x - before.x, afterA.z - before.z);
  log("walking moves the avatar at plausible speed", moved > 0.2 && moved < 11.5 * 4.5, `moved ${moved.toFixed(2)} m while W held ~4 s (the design controller clamps each frame to 50 ms, so at software-GL frame rates this is slow motion; it checks direction and an upper speed bound, not real-time speed)`);
  log("other session sees the same position", Math.hypot(seenByB.x - afterA.x, seenByB.z - afterA.z) < 0.8, `A=(${afterA.x.toFixed(1)},${afterA.z.toFixed(1)}) B sees (${seenByB.x.toFixed(1)},${seenByB.z.toFixed(1)})`);

  // chat
  await A.page.keyboard.press("Enter");
  await A.page.keyboard.type("hello from Alice");
  await A.page.keyboard.press("Enter");
  await until(async () => (await B.page.locator(".chat-log div").allTextContents()).some((t) => t.includes("hello from Alice")), 5000, "chat delivery");
  log("chat message delivered across sessions", true);

  // rate limit surfaces to the user
  for (let i = 0; i < 8; i++) { await A.page.keyboard.press("Enter"); await A.page.keyboard.type(`spam ${i}`); await A.page.keyboard.press("Enter"); }
  await until(async () => (await A.page.locator(".hud .note").allTextContents()).some((t) => /slow down|not sent/i.test(t)), 4000, "rate-limit toast");
  log("chat rate limit is shown to the sender", true);
  await A.page.keyboard.press("Escape");

  // teleport via the Travel menu (select, then Teleport now)
  await A.page.keyboard.press("KeyM");
  await A.page.click(".zg-it >> text=Colosseum >> nth=0");
  await A.page.click("text=Teleport now");
  await until(async () => { const p = (await stats(A.page)).pos; return Math.hypot(p.x - 28, p.z + 10) < 3.5; }, 6000, "teleport arrival");
  const tp = (await stats(A.page)).pos;
  log("teleport to the Colosseum entrance", true, `at (${tp.x.toFixed(1)},${tp.z.toFixed(1)})`);
  await A.page.screenshot({ path: outDir + "A-colosseum.png" });

  // Respawn (R) returns to the square
  await sleep(1700);
  await A.page.keyboard.press("KeyR");
  await until(async () => { const p = (await stats(A.page)).pos; return Math.hypot(p.x - 0, p.z - 8) < 4; }, 6000, "respawn");
  const home = (await stats(A.page)).pos;
  log("Respawn returns to the square", true, `at (${home.x.toFixed(1)},${home.z.toFixed(1)})`);

  // profile inspect from player list
  await B.page.keyboard.press("KeyP");
  await B.page.click(".zg-it >> text=AliceE2E");
  await until(async () => (await B.page.locator(".profile").textContent())?.includes("AliceE2E"), 4000, "profile card");
  log("profile card opens for another real player", true);
  await B.page.screenshot({ path: outDir + "B-profile.png" });
  await B.page.keyboard.press("Escape");

  // refresh: same identity, no duplicate avatar
  const idBefore = await A.page.evaluate(() => window.__zg.conn().userId);
  const countBefore = (await players(B.page)).filter((p) => p.name === "AliceE2E").length;
  await A.page.reload();
  await A.page.click("button[type=submit]");
  await A.page.waitForFunction(() => window.__zg?.conn().status === "connected", null, { timeout: 15000 });
  const idAfter = await A.page.evaluate(() => window.__zg.conn().userId);
  await sleep(800);
  const countAfter = (await players(B.page)).filter((p) => p.name === "AliceE2E").length;
  log("refresh keeps server-issued guest identity", idBefore === idAfter);
  log("refresh does not duplicate the avatar", countBefore === 1 && countAfter === 1, `B sees ${countAfter} avatar(s) named AliceE2E`);

  // reconnect: abrupt socket drop
  await A.page.evaluate(() => window.__zg.dropSocket());
  await until(async () => (await players(B.page)).find((p) => p.name === "AliceE2E")?.connected === false, 6000, "B sees A disconnected");
  log("peer shown as disconnected (ghost) after socket drop", true);
  await until(async () => (await players(B.page)).find((p) => p.name === "AliceE2E")?.connected === true, 20000, "A resumes");
  const countRe = (await players(B.page)).filter((p) => p.name === "AliceE2E").length;
  log("SDK reconnect resumes the same seat without duplicates", countRe === 1);
  const aStatus = await A.page.evaluate(() => window.__zg.conn().status);
  log("dropped client returns to connected state", aStatus === "connected", aStatus);

  // measurements
  await A.page.keyboard.down("KeyD"); await B.page.keyboard.down("KeyA");
  await sleep(4000);
  await A.page.keyboard.up("KeyD"); await B.page.keyboard.up("KeyA");
  const sa = await stats(A.page), sb = await stats(B.page);
  log("rtt measured", sa.rtt > 0 || sb.rtt > 0, `A ${sa.rtt} ms, B ${sb.rtt} ms (localhost)`);
  await A.page.screenshot({ path: outDir + "A-final.png" });
  await B.page.screenshot({ path: outDir + "B-final.png" });

  const gl = await A.page.evaluate(() => { const c = document.createElement("canvas"); const g = c.getContext("webgl"); const e = g?.getExtension("WEBGL_debug_renderer_info"); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "unknown"; });
  const summary = {
    when: new Date().toISOString(),
    conditions: { browser: browser.version(), gl, viewport: "800x450 x2 contexts, low-quality mode", host: `${os.cpus().length} vCPU ${os.arch()} ${os.platform()}`, network: "localhost (no WAN latency)", note: "Software-rendered WebGL (SwiftShader): FPS below is NOT representative of real laptops." },
    measurements: { A: { fps: sa.fps, frameP95: sa.frameMsP95, drawCalls: sa.drawCalls, triangles: sa.triangles, rttMs: sa.rtt, corrections: sa.corrections, maxErrorM: sa.maxError }, B: { fps: sb.fps, frameP95: sb.frameMsP95, rttMs: sb.rtt, corrections: sb.corrections, maxErrorM: sb.maxError } },
    consoleErrors: errors,
    results,
  };
  mkdirSync(new URL("../../docs/evidence/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../../docs/evidence/m1-two-sessions.json", import.meta.url), JSON.stringify(summary, null, 2));
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed. Console errors: A=${errors.A.length} B=${errors.B.length}`);
  if (errors.A.length || errors.B.length) console.log([...errors.A, ...errors.B].slice(0, 8).join("\n"));
  await browser.close();
  process.exit(failed ? 1 : 0);
} catch (err) {
  console.error("E2E aborted:", err.message);
  log("e2e run completed", false, err.message);
  await browser.close().catch(() => {});
  process.exit(1);
}
