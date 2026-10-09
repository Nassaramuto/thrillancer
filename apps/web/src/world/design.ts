/**
 * Loads the ORIGINAL Claude Design world scripts (vendored, unmodified, in /public/design) against the
 * same three.js revision they were authored for (r128). They build the city, characters and props
 * into the global `ZG` namespace; this module only exposes that namespace with types.
 */
import * as THREE from "three";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DesignWorld {
  T: typeof THREE;
  city: THREE.Group;
  updaters: Array<(t: number, dt: number) => void>;
  interact: Array<{ x: number; z: number; r: number; label: string; act: () => void }>;
  dest: Array<{ k: string; n: string; tag?: string; x: number; z: number; r?: number; c: string; minor?: boolean }>;
  bikes: Array<{ g: THREE.Group; taken?: boolean; p0?: THREE.Vector3; y0?: number; rb?: THREE.MeshStandardMaterial[] }>;
  bones: Array<{ g: THREE.Group; x: number; z: number; y0: number; got?: boolean }>;
  penguinState: { pos: THREE.Vector3 };
  person: (o?: Record<string, unknown>) => THREE.Group;
  walk: (g: THREE.Group, speed: number, t: number) => void;
  label: (lines: string[], w: number, h: number, o?: Record<string, unknown>) => THREE.Sprite;
  unicorn: () => THREE.Group;
  B: (c: number, o?: Record<string, unknown>) => THREE.Material;
  groundH: (x: number, z: number) => number;
  panel: (title: string, html: string, list?: string[], links?: Array<{ t: string; u: string }>) => void;
  elder: () => void;
  [k: string]: any;
}

// Same boot order as the design (zg-boot.js). zg-app.js (UI shell) is re-implemented in React/TS, not loaded.
const FILES = ["zg-core.js", "zg-avatar.js", "zg-city.js", "zg-dest.js", "zg-dest2.js", "zg-extras.js", "zg-ctrl.js"];
let loading: Promise<DesignWorld> | null = null;

function inject(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

export function loadDesign(): Promise<DesignWorld> {
  if (loading) return loading;
  loading = (async () => {
    const w = window as any;
    w.THREE = THREE;
    w.ZG = w.ZG || {};
    const base = `${import.meta.env.BASE_URL}design/`;
    for (const f of FILES) await inject(base + f);
    return w.ZG as DesignWorld;
  })();
  loading.catch(() => (loading = null));
  return loading;
}
