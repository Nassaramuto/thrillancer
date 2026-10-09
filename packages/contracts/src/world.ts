import worldData from "./world-data.ts";
import { PLAZA_RADIUS, PLAYER_RADIUS } from "./constants.ts";

/** Heading convention: forward = (sin h, cos h) in (x, z). h = 0 faces +z. Three.js rotation.y = h matches. */
export type Vec2 = { x: number; z: number };

/** Collision data extracted verbatim from the original Claude Design V2 scripts (scripts/extract-world.mjs). */
type Circle = readonly [number, number, number];
type Box = readonly [number, number, number, number];
type Platform = readonly [number, number, number, number, number];
type Mound = readonly [number, number, number, number];
export const CIRCLES = worldData.circles as unknown as readonly Circle[];
export const BOXES = worldData.boxes as unknown as readonly Box[];
export const PLATFORMS = worldData.platforms as unknown as readonly Platform[];
export const MOUNDS = worldData.mounds as unknown as readonly Mound[];
/** Bicycles: [x, y, z, heading]. Index = bike id. */
export const BIKES = worldData.bikes as unknown as readonly (readonly [number, number, number, number])[];

export interface TeleportPoint {
  id: string;
  label: string;
  x: number;
  z: number;
  heading: number;
  /** Where the camera/avatar should face after arriving (design `f`). */
  face: Vec2;
  cat: "explore" | "comm" | "act";
  tag: string;
  color: string;
  /** Centre of the venue (used for distance readouts and the route line). */
  cx: number;
  cz: number;
}

export const SPAWN: Vec2 = { x: 0, z: 8 };
export const SPAWN_FACE: Vec2 = { x: 0, z: -72 };

/** The design's Travel table. Arrival point `sp`, facing `f`, venue centre `x,z`. */
export const TELEPORT_POINTS: readonly TeleportPoint[] = (worldData.travel as unknown as Array<{ id: string; n: string; cat: TeleportPoint["cat"]; tag: string; x: number; z: number; sp: number[]; f: number[]; c: string }>).map((d) => ({
  id: d.id,
  label: d.n,
  x: d.sp[0]!,
  z: d.sp[1]!,
  heading: Math.atan2(d.f[0]! - d.sp[0]!, d.f[1]! - d.sp[1]!),
  face: { x: d.f[0]!, z: d.f[1]! },
  cat: d.cat,
  tag: d.tag,
  color: d.c,
  cx: d.x,
  cz: d.z,
}));

/** Respawn (design key R and Options > Respawn) is a teleport to the square facing the Pantheon. */
export const RESPAWN_ID = "respawn";
export const NPC_GUIDE_ID = "npc:guide";

export function teleportPoint(id: string): TeleportPoint | undefined {
  return TELEPORT_POINTS.find((p) => p.id === id);
}

export interface Destination {
  k: string;
  n: string;
  tag: string;
  x: number;
  z: number;
  r: number;
  c: string;
  minor: boolean;
}
export const DESTINATIONS = (worldData.dest as unknown as Array<{ k: string; n: string; tag?: string; x: number; z: number; r?: number; c: string; minor: boolean }>).map((d) => ({
  k: d.k, n: d.n, tag: d.tag ?? "", x: d.x, z: d.z, r: d.r ?? 0, c: d.c, minor: d.minor,
})) as readonly Destination[];

export interface Kinematic extends Vec2 {
  heading: number;
}

/** Push a point out of every circle and box and back inside the bound. Mirrors Claude Design `Z.resolve` exactly. */
export function resolveCollisions(p: Vec2, r: number = PLAYER_RADIUS): Vec2 {
  let { x, z } = p;
  for (const c of CIRCLES) {
    const dx = x - c[0], dz = z - c[1], m = c[2] + r, d2 = dx * dx + dz * dz;
    if (d2 < m * m && d2 > 1e-8) {
      const d = Math.sqrt(d2);
      x = c[0] + (dx / d) * m;
      z = c[1] + (dz / d) * m;
    }
  }
  for (const b of BOXES) {
    const cx = Math.max(b[0], Math.min(x, b[1]));
    const cz = Math.max(b[2], Math.min(z, b[3]));
    const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        z = cz + (dz / d) * r;
      } else {
        const l = x - b[0], rr = b[1] - x, t = z - b[2], bt = b[3] - z, m = Math.min(l, rr, t, bt);
        if (m === l) x = b[0] - r;
        else if (m === rr) x = b[1] + r;
        else if (m === t) z = b[2] - r;
        else z = b[3] + r;
      }
    }
  }
  const d = Math.hypot(x, z);
  if (d > PLAZA_RADIUS) {
    x *= PLAZA_RADIUS / d;
    z *= PLAZA_RADIUS / d;
  }
  return { x, z };
}

/** Terrain height: Colosseum terrace and ramp, platforms and mounds. Mirrors Claude Design `Z.groundH`. */
export function groundHeight(x: number, z: number): number {
  let h = 0;
  if (Math.hypot(x - 75, z + 10) < 25) h = 4;
  else if (Math.abs(z + 10) < 6 && x >= 40 && x < 52) h = 4 * Math.min(1, (x - 40) / 10);
  for (const p of PLATFORMS) if (x > p[0] && x < p[1] && z > p[2] && z < p[3] && p[4] > h) h = p[4];
  for (const m of MOUNDS) {
    const d = Math.hypot(x - m[0], z - m[1]);
    if (d < m[2]) {
      const v = m[3] * (1 - (d * d) / (m[2] * m[2]));
      if (v > h) h = v;
    }
  }
  return h;
}

export function isInsidePlaza(p: Vec2): boolean {
  if (Math.hypot(p.x, p.z) > PLAZA_RADIUS) return false;
  const q = resolveCollisions(p);
  return Math.hypot(q.x - p.x, q.z - p.z) < 0.05;
}
