declare const window: any; declare const document: any;
// Proves the shared controller port (packages/contracts/src/ctrl.ts) matches the REAL Claude Design controller
// (zg-ctrl.js) step for step. The design scripts run in headless Chromium and record every step; we replay the same
// steps through stepCtrl and compare trajectories. Requires a Chromium (PLAYWRIGHT_CHROMIUM_EXECUTABLE or playwright's own).
import { describe, expect, it } from "vitest";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { initialBikes, newCtrlState, stepCtrl, type CtrlState, type CtrlStep } from "@thrillancer/contracts";

const DIR = path.resolve("apps/web/public/design");
const read = (f: string) => fs.readFileSync(f, "utf8");

interface Rec { step: CtrlStep; after: { x: number; y: number; z: number; vx: number; vz: number; vy: number; yaw: number; grounded: boolean; bike: number; hy: number; bsp: number } }

async function record(): Promise<{ recs: Rec[]; start: CtrlState }[]> {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const p = await b.newPage();
    await p.route("**/*", (r) => (r.request().url().startsWith("http") ? r.abort() : r.continue()));
    await p.setContent("<html><body><div id='zg-root'></div></body></html>");
    await p.addScriptTag({ content: read("scripts/vendor/three-r128.min.js") });
    await p.evaluate(() => { (window as any).ZG = {}; });
    for (const f of ["zg-core.js", "zg-avatar.js", "zg-city.js", "zg-dest.js", "zg-dest2.js", "zg-extras.js", "zg-ctrl.js"]) await p.addScriptTag({ content: read(path.join(DIR, f)) });
    return await p.evaluate(() => {
      const Z = (window as any).ZG, C = Z.ctrl, T = window.THREE as any;
      const cam = new T.PerspectiveCamera(55, 1, 0.3, 1800);
      C.init(cam, document.createElement("canvas"), () => false, () => "city");
      const out: any[] = [];
      const snap = () => ({ x: C.pos.x, y: C.y, z: C.pos.z, vx: C.vel.x, vz: C.vel.z, vy: C.vy, yaw: C.yaw, grounded: C.grounded, bike: C.bike ? Z.bikes.indexOf(C.bike) : -1, hy: C.hy, bsp: C.bsp });
      const start = () => ({ x: C.pos.x, y: C.y, z: C.pos.z, vx: C.vel.x, vz: C.vel.z, vy: C.vy, yaw: C.yaw, grounded: C.grounded, coyote: C.coyote, jumpBuf: C.jumpBuf, bike: C.bike ? Z.bikes.indexOf(C.bike) : -1, hy: C.hy, bsp: C.bsp });
      let t = 0;
      const run = (name: string, tp: number[] | null, frames: number, script: (i: number) => { keys?: string[]; jump?: boolean; mount?: number; dismount?: boolean; camYaw?: number; dt?: number }) => {
        if (tp) C.teleport(tp[0], tp[1], tp[2], tp[3]);
        C.keys = {}; C.vel.set(0, 0, 0);
        const s0 = start(); const recs: any[] = [];
        for (let i = 0; i < frames; i++) {
          const sc = script(i); const dt = sc.dt ?? 0.016;
          C.keys = {}; (sc.keys || []).forEach((k) => (C.keys[k] = true));
          if (sc.camYaw !== undefined) C.cam.yaw = sc.camYaw;
          let act = 0, bike = -1;
          if (sc.mount !== undefined) { C.mount(Z.bikes[sc.mount]); act = 1; bike = sc.mount; }
          if (sc.dismount) { C.dismount(); act = 2; }
          if (sc.jump) C.jump();
          const k = C.keys, f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), sprint = !!(k.ShiftLeft || k.ShiftRight);
          const sn = Math.sin(C.cam.yaw), cs = Math.cos(C.cam.yaw);
          const step = { dt: Math.min(dt, 0.05), wx: sn * f - cs * s, wz: cs * f + sn * s, speed: sprint ? 1 : 0, f, s, sprint, brake: !!k.Space, jump: !!sc.jump, act, bike };
          // For mount/dismount the design already moved the player before step(); the port performs them inside the step.
          if (act) { /* record state before the act so replay starts from the same pre-act state */ }
          t += dt; C.step(dt, t); recs.push({ step, after: snap() });
        }
        out.push({ name, start: s0, recs });
      };
      // 1 straight walk then sprint
      run("walk-sprint", [0, 8, 0, -72], 240, (i) => ({ keys: i < 120 ? ["KeyW"] : ["KeyW", "ShiftLeft"], camYaw: Math.PI }));
      // 2 zigzag + jumps, varying dt
      run("zigzag-jump", [0, 8, 0, -72], 360, (i) => ({ keys: i % 90 < 45 ? ["KeyW", "KeyD"] : ["KeyW", "KeyA"], camYaw: Math.PI + Math.sin(i / 40) * 0.8, jump: i % 70 === 0, dt: 0.01 + (i % 7) * 0.006 }));
      // 3 Colosseum ramp up the terrace
      run("ramp", [28, -10, 75, -10], 400, () => ({ keys: ["KeyW", "ShiftLeft"], camYaw: Math.PI / 2 }));
      // 4 run into the Pill Pantheon area walls/columns
      run("pantheon-walls", [0, -42, 0, -72], 300, (i) => ({ keys: ["KeyW", "ShiftLeft"], camYaw: Math.PI + (i > 150 ? 0.9 : 0) }));
      // 5 bike: mount nearest, ride, steer, brake, dismount
      const bi = 0; const bp = Z.bikes[bi].g.position;
      run("bike", [bp.x - 1.2, bp.z, bp.x, bp.z], 480, (i) => {
        if (i === 5) return { mount: bi };
        if (i === 400) return { dismount: true };
        if (i < 5 || i > 400) return { keys: [], camYaw: Math.PI };
        const k: string[] = i < 200 ? ["KeyW"] : i < 300 ? ["KeyW", "KeyD", "ShiftLeft"] : ["Space", "KeyA"];
        return { keys: k };
      });
      return out;
    });
  } finally {
    await b.close();
  }
}

describe("controller parity (real zg-ctrl.js vs contracts/ctrl.ts)", () => {
  it("replays recorded design steps with negligible divergence", async () => {
    const scenarios = (await record()) as any[];
    const report: string[] = [];
    for (const sc of scenarios) {
      const bikes = initialBikes();
      const s: CtrlState = { ...sc.start };
      let maxPos = 0, maxY = 0, maxYaw = 0;
      let bikeMismatch = 0;
      for (const r of sc.recs as Rec[]) {
        // The design moves the player on mount before step(); mirror by letting the port do it inside the step.
        stepCtrl(s, r.step, bikes);
        const ep = Math.hypot(s.x - r.after.x, s.z - r.after.z);
        if (ep > 0.01 && !(globalThis as any).__first) { (globalThis as any).__first = { sc: sc.name, i: (sc.recs as Rec[]).indexOf(r), ep, sim: { ...s }, des: r.after, step: r.step }; }
        maxPos = Math.max(maxPos, ep);
        maxY = Math.max(maxY, Math.abs(s.y - r.after.y));
        const dy = Math.atan2(Math.sin(s.yaw - r.after.yaw), Math.cos(s.yaw - r.after.yaw));
        maxYaw = Math.max(maxYaw, Math.abs(dy));
        if (s.bike !== r.after.bike) bikeMismatch++;
      }
      const recs = sc.recs as Rec[];
      const reached = { maxY: Math.max(...recs.map((r) => r.after.y)), airborne: recs.some((r) => !r.after.grounded), rode: recs.some((r) => r.after.bike >= 0), topSpeed: Math.max(...recs.map((r) => Math.hypot(r.after.vx, r.after.vz))) };
      if (sc.name === "ramp") expect(reached.maxY, "ramp climbed to the terrace").toBeGreaterThan(3.9);
      if (sc.name === "zigzag-jump") expect(reached.airborne, "jumped").toBe(true);
      if (sc.name === "bike") expect(reached.rode && reached.topSpeed > 8, "rode a bike").toBe(true);
      report.push(`${sc.name}: pos ${maxPos.toExponential(2)} m, y ${maxY.toExponential(2)} m, yaw ${maxYaw.toExponential(2)} rad, bike-state mismatches ${bikeMismatch}`);
      if ((globalThis as any).__first) console.log("FIRST", JSON.stringify((globalThis as any).__first));
      expect(maxPos, sc.name).toBeLessThan(0.02);
      expect(maxY, sc.name).toBeLessThan(0.02);
      expect(maxYaw, sc.name).toBeLessThan(0.02);
      expect(bikeMismatch, sc.name).toBe(0);
    }
    if ((globalThis as any).__first) console.log("FIRST", JSON.stringify((globalThis as any).__first));
    console.log("PARITY\n" + report.join("\n"));
  }, 120_000);
});
