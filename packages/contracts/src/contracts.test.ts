import { describe, expect, it } from "vitest";
import {
  CIRCLES, BOXES, BIKES, DESTINATIONS, PLAZA_RADIUS, SPRINT_SPEED, WALK_SPEED, ExperienceManifest, InputMessage, isInsidePlaza,
  resolveCollisions, sanitizeText, validateNickname, TELEPORT_POINTS, newCtrlState, stepCtrl, initialBikes, type CtrlStep,
} from "./index.ts";

const step = (o: Partial<CtrlStep> = {}): CtrlStep => ({
  dt: 0.05, wx: 0, wz: 0, speed: 0, f: 0, s: 0, sprint: false, brake: false, jump: false, act: 0, bike: -1, ...o,
});

describe("controller (shared sim)", () => {
  it("accelerates toward walk speed and never exceeds it", () => {
    const st = newCtrlState(0, 8, 0);
    const bikes = initialBikes();
    for (let i = 0; i < 40; i++) stepCtrl(st, step({ wx: 1, wz: 0 }), bikes);
    const v = Math.hypot(st.vx, st.vz);
    expect(v).toBeGreaterThan(WALK_SPEED * 0.9);
    expect(v).toBeLessThanOrEqual(WALK_SPEED + 1e-6);
  });
  it("sprint reaches sprint speed", () => {
    const st = newCtrlState(0, 8, 0);
    const bikes = initialBikes();
    for (let i = 0; i < 60; i++) stepCtrl(st, step({ wx: 1, speed: 1, sprint: true }), bikes);
    expect(Math.hypot(st.vx, st.vz)).toBeGreaterThan(SPRINT_SPEED * 0.9);
  });
  it("jumps and lands", () => {
    const st = newCtrlState(0, 8, 0);
    const bikes = initialBikes();
    stepCtrl(st, step({ jump: true }), bikes);
    expect(st.grounded).toBe(false);
    let maxY = st.y;
    for (let i = 0; i < 40; i++) { stepCtrl(st, step(), bikes); maxY = Math.max(maxY, st.y); }
    expect(maxY).toBeGreaterThan(0.5);
    expect(st.grounded).toBe(true);
  });
  it("cannot leave the plaza or pass through landmarks", () => {
    const st = newCtrlState(0, 10, 0);
    const bikes = initialBikes();
    for (let i = 0; i < 2000; i++) stepCtrl(st, step({ wx: 1, wz: 0.3, speed: 1, sprint: true }), bikes);
    expect(Math.hypot(st.x, st.z)).toBeLessThanOrEqual(PLAZA_RADIUS + 1e-6);
  });
  it("clamps dt and ignores non-positive dt", () => {
    const st = newCtrlState(0, 8, 0);
    stepCtrl(st, step({ dt: 5, wx: 1 }), initialBikes());
    expect(Math.hypot(st.vx, st.vz)).toBeLessThan(2);
    const before = { ...st };
    stepCtrl(st, step({ dt: 0, wx: 1 }), initialBikes());
    expect(st).toEqual(before);
  });
  it("teleport points are all on legal ground, world data is present", () => {
    for (const p of TELEPORT_POINTS) expect(isInsidePlaza(p), p.id).toBe(true);
    expect(CIRCLES.length).toBeGreaterThan(200);
    expect(BOXES.length).toBeGreaterThan(10);
    expect(BIKES.length).toBe(7);
    expect(DESTINATIONS.length).toBeGreaterThan(0);
  });
  it("a point inside a circle is pushed out to its rim (Z.resolve port)", () => {
    const c = CIRCLES[0]!;
    const q = resolveCollisions({ x: c[0] + 0.01, z: c[1] });
    expect(Math.hypot(q.x - c[0], q.z - c[1])).toBeGreaterThanOrEqual(c[2] + 0.1);
  });
});

describe("text", () => {
  it("strips control and bidi characters and collapses whitespace", () => {
    expect(sanitizeText("  hi‮  there\u0000\n\n friend ")).toBe("hi there friend");
  });
  it("validates nicknames", () => {
    expect(validateNickname("Stephane").ok).toBe(true);
    expect(validateNickname("a").ok).toBe(false);
    expect(validateNickname("<script>").ok).toBe(false);
    expect(validateNickname(42).ok).toBe(false);
    expect(validateNickname("x".repeat(21)).ok).toBe(false);
  });
});

describe("schemas", () => {
  it("rejects malformed inputs", () => {
    const ok = { dt: 0.05, wx: 0, wz: 0, speed: 0, f: 0, s: 0, sprint: false, brake: false, jump: false, act: 0, bike: -1 };
    const msg = (st: object) => ({ seq: 1, epoch: 1, steps: [st] });
    expect(InputMessage.safeParse(msg({ ...ok, wx: 2 })).success).toBe(false);
    expect(InputMessage.safeParse(msg({ ...ok, dt: 5 })).success).toBe(false);
    expect(InputMessage.safeParse({ seq: 1, epoch: 1, steps: [] }).success).toBe(false);
    expect(InputMessage.safeParse(msg(ok)).success).toBe(true);
  });
  it("manifest requires /assets glb paths and bounded size", () => {
    const base = {
      experienceId: "genesis-community-camp", version: "0.1.0", title: "Community Camp", kind: "camp", authorId: "demo-builder",
      plotId: "genesis-plot-001", description: "x", assetUrl: "/assets/community-camp.glb", entryPoint: "community-camp",
      spawn: { x: 0, y: 0, z: 0 }, bounds: { width: 12, height: 10, depth: 12 }, supportedFeatures: ["profile"],
      durationEstimateSeconds: 120, integrationMode: "reviewed-first-party", publicationStatus: "draft",
    };
    expect(ExperienceManifest.safeParse(base).success).toBe(true);
    expect(ExperienceManifest.safeParse({ ...base, assetUrl: "https://evil.example/x.glb" }).success).toBe(false);
    expect(ExperienceManifest.safeParse({ ...base, bounds: { width: 400, height: 1, depth: 1 } }).success).toBe(false);
  });
});
