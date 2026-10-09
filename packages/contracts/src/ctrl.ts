import { SPRINT_SPEED, WALK_SPEED } from "./constants.ts";
import { BIKES, groundHeight, resolveCollisions } from "./world.ts";

/**
 * Deterministic port of the Claude Design V2 character controller (zg-ctrl.js `walk` / `ride`).
 * Used by the server (authoritative) and by the client (prediction/replay). Camera, occlusion and animation stay
 * in the design scripts; this file is only the movement physics. parity: tests/parity (real zg-ctrl.js vs this).
 */
export interface CtrlState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  vy: number;
  /** Character facing (design C.yaw). While riding it equals the bike heading. */
  yaw: number;
  grounded: boolean;
  coyote: number;
  jumpBuf: number;
  /** Bike index or -1. */
  bike: number;
  /** Bike heading and speed (design C.hy, C.bsp). */
  hy: number;
  bsp: number;
}

export const FOLLOW_SPEED = 5;
export const WALK_FAST = SPRINT_SPEED; // 11.5, also used by follow when far away
/** Step speed classes. 0 walk, 1 sprint, 2 follow, 3 follow-far. The server maps these to fixed speeds. */
export const SPEED_CLASS = [WALK_SPEED, SPRINT_SPEED, FOLLOW_SPEED, SPRINT_SPEED] as const;

export interface CtrlStep {
  /** Seconds, 0 < dt <= 0.05 (design clamps). */
  dt: number;
  /** Walk: desired world direction (any length; normalised here, zero = no input). */
  wx: number;
  wz: number;
  speed: 0 | 1 | 2 | 3;
  /** Ride: forward(+1)/back(-1) and steering (+1 right), sprint, brake. */
  f: number;
  s: number;
  sprint: boolean;
  brake: boolean;
  /** Jump pressed since the previous step (sets the 0.14 s buffer). */
  jump: boolean;
  /** 0 none, 1 mount `bike`, 2 dismount. Applied before the physics of this step, in stream order. */
  act: 0 | 1 | 2;
  bike: number;
}

export interface BikeView {
  x: number;
  y: number;
  z: number;
  hy: number;
  taken: boolean;
}

export function initialBikes(): BikeView[] {
  return BIKES.map((b) => ({ x: b[0], y: b[1], z: b[2], hy: b[3], taken: false }));
}

export function newCtrlState(x: number, z: number, yaw: number): CtrlState {
  return { x, y: groundHeight(x, z), z, vx: 0, vz: 0, vy: 0, yaw, grounded: true, coyote: 0, jumpBuf: 0, bike: -1, hy: 0, bsp: 0 };
}

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const wrap = (a: number) => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

/** Horizontal move with ledge blocking (design `moveH`). */
function moveH(s: CtrlState, dx: number, dz: number, r: number, stepMax: number) {
  const ox = s.x, oz = s.z;
  const put = (x: number, z: number) => {
    const q = resolveCollisions({ x, z }, r);
    s.x = q.x;
    s.z = q.z;
  };
  put(ox + dx, oz + dz);
  if (groundHeight(s.x, s.z) - s.y > stepMax) {
    put(ox + dx, oz);
    if (groundHeight(s.x, s.z) - s.y > stepMax) {
      put(ox, oz + dz);
      if (groundHeight(s.x, s.z) - s.y > stepMax) {
        s.x = ox;
        s.z = oz;
      }
    }
  }
  return Math.hypot(s.x - ox - dx, s.z - oz - dz);
}

export function dismountPosition(s: CtrlState, bike: BikeView) {
  const rx = -Math.cos(s.hy), rz = Math.sin(s.hy);
  const q = resolveCollisions({ x: bike.x + rx * 1.6, z: bike.z + rz * 1.6 }, 0.6);
  s.x = q.x;
  s.z = q.z;
  s.y = groundHeight(s.x, s.z);
}

/** Apply one step in place. `bikes` is mutated for the ridden bike (it follows the rider). */
export function stepCtrl(s: CtrlState, input: CtrlStep, bikes: BikeView[]): void {
  const dt = Math.min(Math.max(input.dt, 0), 0.05);
  if (dt <= 0) return;
  if (input.act === 1 && s.bike < 0) {
    const b = bikes[input.bike];
    if (b && !b.taken) {
      s.bike = input.bike;
      b.taken = true;
      s.hy = b.hy;
      s.x = b.x;
      s.z = b.z;
      s.y = b.y;
      s.bsp = 0;
      s.vx = 0;
      s.vz = 0;
    }
  } else if (input.act === 2 && s.bike >= 0) {
    const b = bikes[s.bike]!;
    dismountPosition(s, b);
    b.taken = false;
    s.bike = -1;
    s.bsp = 0;
    s.vx = 0;
    s.vz = 0;
    s.vy = 0;
    s.grounded = true;
    s.yaw = s.hy;
  }
  if (input.jump) s.jumpBuf = 0.14;
  s.jumpBuf = Math.max(0, s.jumpBuf - dt);
  if (s.bike >= 0) ride(s, input, dt, bikes[s.bike]!);
  else walk(s, input, dt);
}

function walk(s: CtrlState, input: CtrlStep, dt: number) {
  let wx = Number.isFinite(input.wx) ? input.wx : 0;
  let wz = Number.isFinite(input.wz) ? input.wz : 0;
  const wl0 = Math.hypot(wx, wz);
  const wl = wl0 > 0 ? 1 : 0;
  if (wl0 > 0) {
    wx /= wl0;
    wz /= wl0;
  } else {
    wx = wz = 0;
  }
  const spd = SPEED_CLASS[input.speed] ?? WALK_SPEED;
  const tvx = wx * spd, tvz = wz * spd;
  const acc = s.grounded ? (wl > 0 ? 30 : 40) : 8;
  const dvx = tvx - s.vx, dvz = tvz - s.vz, dl = Math.hypot(dvx, dvz), m = acc * dt;
  if (dl <= m) {
    s.vx = tvx;
    s.vz = tvz;
  } else {
    s.vx += (dvx / dl) * m;
    s.vz += (dvz / dl) * m;
  }
  const sp = Math.hypot(s.vx, s.vz);
  if (sp > 0.4 || wl > 0) {
    const tg = wl > 0 ? Math.atan2(wx, wz) : Math.atan2(s.vx, s.vz);
    const d = wrap(tg - s.yaw);
    s.yaw += d * Math.min(1, dt * (s.grounded ? 14 : 5));
  }
  const ox = s.x, oz = s.z;
  moveH(s, s.vx * dt, s.vz * dt, 0.55, s.grounded ? 0.95 : 0.25);
  if (Math.abs(s.x - ox - s.vx * dt) + Math.abs(s.z - oz - s.vz * dt) > 1e-4) {
    s.vx = (s.x - ox) / dt;
    s.vz = (s.z - oz) / dt;
  }
  const gh = groundHeight(s.x, s.z);
  if (s.grounded) s.coyote = 0.12;
  else s.coyote = Math.max(0, s.coyote - dt);
  if (s.jumpBuf > 0 && (s.grounded || s.coyote > 0)) {
    s.vy = 9.4 + Math.min(2.4, Math.max(0, Math.hypot(s.vx, s.vz) - 6) * 0.5);
    s.grounded = false;
    s.coyote = 0;
    s.jumpBuf = 0;
  }
  if (s.grounded) {
    if (gh - s.y >= -0.4) s.y = gh;
    else s.grounded = false;
  }
  if (!s.grounded) {
    s.vy -= 28 * dt;
    s.y += s.vy * dt;
    if (s.y <= gh && s.vy <= 0) {
      s.y = gh;
      s.vy = 0;
      s.grounded = true;
    }
  }
}

function ride(s: CtrlState, input: CtrlStep, dt: number, bike: BikeView) {
  const f = cl(Math.round(input.f), -1, 1);
  const st = cl(input.s, -1, 1);
  let sp = s.bsp;
  if (f > 0) sp += (input.sprint ? 11 : 8) * dt;
  else if (f < 0) sp = sp > 0 ? Math.max(0, sp - 16 * dt) : Math.max(-2.8, sp - 5 * dt);
  else sp *= Math.exp(-dt * 0.7);
  if (input.brake) sp *= Math.exp(-dt * 4);
  sp = cl(sp, -2.8, input.sprint ? 15 : 11.5);
  s.hy -= st * dt * 2.4 * cl(Math.abs(sp) / 3.5, 0.2, 1) * (sp < -0.1 ? -1 : 1);
  const ox = s.x, oz = s.z;
  moveH(s, Math.sin(s.hy) * sp * dt, Math.cos(s.hy) * sp * dt, 1, 0.6);
  if (Math.abs(sp) > 1 && Math.hypot(s.x - ox, s.z - oz) / dt < Math.abs(sp) * 0.5) sp *= Math.exp(-dt * 8);
  s.bsp = sp;
  s.y += (groundHeight(s.x, s.z) - s.y) * Math.min(1, dt * 14);
  s.vx = Math.sin(s.hy) * sp;
  s.vz = Math.cos(s.hy) * sp;
  s.vy = 0;
  s.grounded = true;
  s.yaw = s.hy;
  bike.x = s.x;
  bike.z = s.z;
  bike.y = s.y;
  bike.hy = s.hy;
}

/** Place a state at a point facing a target (design `C.teleport`). A ridden bike stays where it is, untaken. */
export function teleportCtrl(s: CtrlState, bikes: BikeView[], x: number, z: number, fx?: number, fz?: number) {
  if (s.bike >= 0) {
    const b = bikes[s.bike]!;
    dismountPosition(s, b);
    b.taken = false;
    s.bike = -1;
    s.bsp = 0;
  }
  const q = resolveCollisions({ x, z }, 0.6);
  s.x = q.x;
  s.z = q.z;
  s.y = groundHeight(s.x, s.z);
  s.vx = s.vz = s.vy = 0;
  s.grounded = true;
  s.coyote = 0;
  s.jumpBuf = 0;
  if (fx !== undefined && fz !== undefined) s.yaw = Math.atan2(fx - x, fz - z);
}
