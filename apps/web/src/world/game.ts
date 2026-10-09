import * as THREE from "three";
import {
  INPUT_MAX_STEPS, INPUT_SEND_HZ, RESPAWN_ID, TELEPORT_POINTS, stepCtrl,
  type BikeView, type CtrlState, type CtrlStep, type InputMessage, type InputStep, type SnapPayload, type TeleportPoint,
} from "@thrillancer/contracts";
import type { PlazaConnection } from "../net/connection";
import { RemoteAvatar } from "./avatars";
import type { DesignWorld } from "./design";
import { CITIES, Globe, type City } from "./globe";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Quality = "high" | "low";
export type Mode = "globe" | "city" | "tour";
export type MenuName = null | "trav" | "opt" | "players";
export type TravelFilter = "all" | "act" | "comm" | "explore";

export interface PlayerView {
  userId: string;
  name: string;
  kind: "user" | "npc";
  colorIndex: number;
  connected: boolean;
  isSelf: boolean;
  x: number;
  z: number;
  dist: number;
}
export interface GameStats {
  fps: number;
  frameMsP95: number;
  rtt: number;
  players: number;
  pending: number;
  corrections: number;
  maxError: number;
  pos: { x: number; z: number };
  camYaw: number;
  drawCalls: number;
  triangles: number;
}
export interface Opts {
  sensX: number;
  sensY: number;
  invertY: boolean;
  recenter: boolean;
  capture: boolean;
  pack: boolean;
  halo: boolean;
  rainbow: boolean;
}
export interface Discoveries {
  bones: number;
  ring: number;
  ringDone: boolean;
  launch: boolean;
  buddy: boolean;
  done: boolean;
}
export interface UiState {
  mode: Mode;
  menu: MenuName;
  travFilter: TravelFilter;
  selId: string | null;
  routeId: string | null;
  toast: { a: string; b?: string; n: number } | null;
  prompt: string | null;
  panel: { title: string; html: string; list: string[]; links: Array<{ t: string; u: string }> } | null;
  disc: Discoveries;
  badge: string;
  arrive: boolean;
  fadeOn: boolean;
  following: boolean;
  locked: boolean;
  helpHidden: boolean;
  globeSel: City | null;
  tour: { caption: { a: string; b: string; n: string } | null; playing: boolean; progress: number };
  opts: Opts;
}

// ---- tour (cinematic camera path, from the design) -------------------------------------------------------------------
const PI = Math.PI;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const K: Array<[number[], number[], string, string]> = [
  [[0, 2.4, 25], [0, 2.2, 10], "Arrival", "Genesis Square at dusk"],
  [[-17, 5, 21], [6, 4, 2], "Neighbours", "Visitors, bikes, cafés and glowing wheels"],
  [[2, 4, -16], [0, 12, -60], "The Pill Pantheon", "Shops & launches beneath a floating capsule"],
  [[19, 3, -50], [0, 34, -70], "Under the capsule", "A cultural reference — not affiliated with any project"],
  [[44, 56, -22], [0, 14, -70], "Pantheon from above", "A silhouette visible across the city"],
  [[26, 6, -1], [75, 8, -10], "The Colosseum", "Up the Acropolis Way"],
  [[54, 28, 22], [75, 6, -10], "Builders & competitions", "Hackathons · Viber stage · Demo events"],
  [[-40, 7, 16], [-68, 8, -10], "Shiba House", "A landmark you can walk into"],
  [[-50, 14, -36], [-68, 16, -8], "Terraces & a lounge", "A small quest hides inside"],
  [[34, 9, 50], [62, 18, 74], "Moonport", "Rockets and ambition"],
  [[46, 42, 100], [66, 26, 79], "The Atlas", "A giant holds the stack together"],
  [[-30, 8, 40], [-54, 9, 62], "Speech Square", "Satire — silent gestures only"],
  [[10, 5, 58], [0, 4, 84], "The Gallery", "Placeholder art, open for artists"],
  [[-80, 14, -78], [-130, 45, -148], "Penguin Mountain", "Follow the small one"],
  [[-60, 60, -20], [0, 40, -200], "The skyline", "Burj Khalifa & other Earth landmarks"],
  [[0, 70, 64], [0, 25, -140], "THRILLANCER", "A world built by its community"],
];
const SEG = 5.2;
const TOT = SEG * (K.length - 1);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FLUSH_MS = 1000 / INPUT_SEND_HZ;
const isTyping = () => {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT");
};

interface Unacked {
  seq: number;
  steps: InputStep[];
}

// ---- shared, once-per-page parts of the design world (fireworks, unicorn) ---------------------------------------------
function ensureFireworks(Z: DesignWorld) {
  if (Z.__fw) return Z.__fw as (x: number, y: number, z: number) => void;
  const n = 240, pa = new Float32Array(n * 3), pc = new Float32Array(n * 3), vel = Array.from({ length: n }, () => V()), life = new Float32Array(n);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pa, 3));
  g.setAttribute("color", new THREE.BufferAttribute(pc, 3));
  pa.fill(-999);
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.1, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false;
  Z.city.add(pts);
  let k = 0;
  Z.updaters.push((_t: number, dt: number) => {
    for (let i = 0; i < n; i++) {
      if (life[i]! > 0) {
        life[i]! -= dt;
        vel[i]!.y -= 9 * dt;
        pa[i * 3]! += vel[i]!.x * dt;
        pa[i * 3 + 1]! += vel[i]!.y * dt;
        pa[i * 3 + 2]! += vel[i]!.z * dt;
        if (life[i]! <= 0) pa[i * 3 + 1] = -999;
      }
    }
    g.attributes.position!.needsUpdate = true;
  });
  Z.__fw = (x: number, y: number, z: number) => {
    const cols = [0x3dffa0, 0x4de8ff, 0xff4fd8, 0xffc24a];
    for (let b = 0; b < 3; b++) {
      const c = new THREE.Color(cols[(Math.random() * 4) | 0]), ox = (Math.random() - 0.5) * 10, oz = (Math.random() - 0.5) * 10, oy = Math.random() * 6;
      for (let j = 0; j < 70; j++) {
        const i = k++ % n, a = Math.random() * PI * 2, e = Math.random() * PI - PI / 2, s = 6 + Math.random() * 7;
        pa.set([x + ox, y + oy, z + oz], i * 3);
        pc.set([c.r, c.g, c.b], i * 3);
        vel[i]!.set(Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 4, Math.sin(a) * Math.cos(e) * s);
        life[i] = 1.8;
      }
    }
    g.attributes.color!.needsUpdate = true;
  };
  return Z.__fw as (x: number, y: number, z: number) => void;
}

interface Sky {
  uni: THREE.Group;
  puffs: THREE.Group[];
  st: { s: THREE.Vector3; e: THREE.Vector3; t: number; L: number; acc: number } | null;
  nextU: number;
  onSpawn?: () => void;
}
const R = (a: number, b: number) => a + Math.random() * (b - a);
function ensureSky(Z: DesignWorld): Sky {
  if (Z.__sky) return Z.__sky as Sky;
  const uni = Z.unicorn() as THREE.Group;
  uni.scale.setScalar(3.4);
  uni.visible = false;
  Z.city.add(uni);
  const puffs: THREE.Group[] = [];
  const pg = new THREE.BoxGeometry(1.2, 0.5, 0.6);
  for (let i = 0; i < 46; i++) {
    const g = new THREE.Group();
    [0xff4a6a, 0xff9a3a, 0xffe14a, 0x4aff8a, 0x4ad0ff, 0xb04aff].forEach((c, k) => {
      const m = new THREE.Mesh(pg, Z.B(c) as THREE.Material);
      m.position.y = (k - 2.5) * 0.5;
      g.add(m);
    });
    g.visible = false;
    g.userData.life = 0;
    Z.city.add(g);
    puffs.push(g);
  }
  const sky: Sky = { uni, puffs, st: null, nextU: 4 };
  Z.spawnUnicorn = () => {
    const a = Math.random() * PI * 2;
    const s = V(Math.cos(a) * 170, R(34, 48), Math.sin(a) * 170);
    const e = V(-s.x + R(-30, 30), R(34, 52), -s.z + R(-30, 30));
    sky.st = { s, e, t: 0, L: s.distanceTo(e), acc: 0 };
    uni.visible = true;
  };
  Z.__sky = sky;
  return sky;
}
function tickSky(Z: DesignWorld, t: number, dt: number, announce: boolean) {
  const sky = ensureSky(Z), uni = sky.uni;
  sky.nextU -= dt;
  if (sky.nextU < 0 && !sky.st) {
    Z.spawnUnicorn();
    sky.nextU = R(16, 28);
    if (announce) sky.onSpawn?.();
  }
  const u = sky.st;
  if (u) {
    u.t += (dt * 22) / u.L;
    if (u.t > 1) {
      sky.st = null;
      uni.visible = false;
    } else {
      const p = u.s.clone().lerp(u.e, u.t);
      p.y += Math.sin(u.t * 10) * 3;
      uni.position.copy(p);
      uni.rotation.y = Math.atan2(u.e.x - u.s.x, u.e.z - u.s.z);
      uni.rotation.x = -Math.sin(u.t * 10) * 0.1;
      (uni.userData.wings as THREE.Object3D[]).forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.sin(t * 9) * 0.7));
      u.acc += dt;
      if (u.acc > 0.05) {
        u.acc = 0;
        const q = sky.puffs.find((x) => !x.visible);
        if (q) {
          q.visible = true;
          q.position.copy(p).add(V(0, 2.2, 0)).sub(V(Math.sin(uni.rotation.y) * 6, 0, Math.cos(uni.rotation.y) * 6));
          q.rotation.y = uni.rotation.y + PI / 2;
          q.userData.life = 1.6;
        }
      }
    }
  }
  for (const q of sky.puffs) {
    if (!q.visible) continue;
    q.userData.life -= dt;
    const k = Math.max(0, q.userData.life / 1.6);
    q.scale.set(2.2 * k + 0.1, k * 1.6 + 0.05, 2 * k + 0.1);
    if (q.userData.life <= 0) q.visible = false;
  }
}

// The design controller binds its pointer listeners once per canvas, so it is initialised once per page and
// forwards to whichever Game is current.
let current: Game | null = null;
let ctrlInited = false;
let sharedCam: THREE.PerspectiveCamera | null = null;

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly cityScene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly C: any;
  private globe: Globe;
  private remotes = new Map<string, RemoteAvatar>();
  private raf = 0;
  private last = performance.now();
  private clock = 0;
  private disposed = false;
  mode: Mode = "globe";
  ui: UiState;
  private subs = new Set<() => void>();

  // networking / prediction
  private buf: InputStep[] = [];
  private unacked: Unacked[] = [];
  private flushAt = 0;
  private placed = false;
  private jumpFlag = false;
  private actFlag: 0 | 1 | 2 = 0;
  private actBike = -1;
  private dragMoved = 0;
  private pointer = { x: 0, y: 0 };
  corrections = 0;
  corrLog: unknown[] = [];
  maxError = 0;

  // world behaviour
  private zone = "";
  private toastT = 0;
  private toastN = 0;
  private routeG = new THREE.Group();
  private chev: THREE.Mesh[] = [];
  private beam: THREE.Mesh;
  private route: TeleportPoint | null = null;
  private tour = { t: 0, phase: "", play: true };
  private capI = -1;
  private pc: THREE.CatmullRomCurve3;
  private tc: THREE.CatmullRomCurve3;

  // stats
  private frameTimes: number[] = [];
  private fpsFrames = 0;
  private fpsAt = performance.now();
  private fps = 0;
  private p95 = 0;
  quality: Quality = "high";
  onPick?: (userId: string) => void;
  onChatFocus?: () => void;
  onMenuKey?: (k: string) => void;

  private offs: Array<() => void> = [];
  private raycaster = new THREE.Raycaster();

  constructor(private canvas: HTMLCanvasElement, private conn: PlazaConnection, quality: Quality, private Z: DesignWorld) {
    const C = (this.C = Z.ctrl);
    current = this;
    // Renderer, camera and fog match the design app (zg-app.js): default colour pipeline, no tone mapping.
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    sharedCam ??= new THREE.PerspectiveCamera(55, 1, 0.3, 1800);
    this.camera = sharedCam;
    this.cityScene.fog = new THREE.Fog(0x9a6aa4, 70, 640);
    this.cityScene.add(Z.city);
    this.globe = new Globe(Z, canvas, this.camera, () => this.mode === "globe", (c) => this.patch({ globeSel: c }), () => void this.enterCity());
    this.pc = new THREE.CatmullRomCurve3(K.map((k) => V(...(k[0] as [number, number, number]))), false, "catmullrom", 0.5);
    this.tc = new THREE.CatmullRomCurve3(K.map((k) => V(...(k[1] as [number, number, number]))), false, "catmullrom", 0.5);

    const S = C.S;
    this.ui = {
      mode: "globe", menu: null, travFilter: "all", selId: null, routeId: null, toast: null, prompt: null, panel: null,
      disc: { bones: 0, ring: 0, ringDone: false, launch: false, buddy: false, done: false },
      badge: "cyan jacket · magenta visor", arrive: false, fadeOn: false, following: false, locked: false, helpHidden: false,
      globeSel: null, tour: { caption: null, playing: true, progress: 0 },
      opts: this.readOpts(S),
    };

    // ---- controller (design Z.ctrl), initialised once per page ----
    if (!ctrlInited) {
      C.init(this.camera, canvas, () => current?.blocked() ?? true, () => current?.mode ?? "globe");
      ctrlInited = true;
    }
    C.resetBikes();
    C.onLock = (on: boolean) => this.patch({ locked: on });
    C.onFollow = () => {
      this.patch({ following: false });
      this.toast("Stopped following", "");
    };
    C.jump = () => {
      C.jumpBuf = 0.14;
      this.jumpFlag = true;
    };
    C.interact = () => this.interact();
    C.respawn = () => this.respawn();

    // ---- hooks the world scripts call ----
    Z.panel = (title: string, html: string, list?: string[], links?: Array<{ t: string; u: string }>) => {
      C.clearInput();
      if (document.pointerLockElement) document.exitPointerLock();
      this.patch({ panel: { title, html, list: list ?? [], links: links ?? [] } });
    };
    Z.elder = () => this.elder();
    Z.pet = () => {
      Z.petPanel?.();
      this.toast("Good dog", "Tail wag: on");
    };
    Z.telescope = () => this.telescope();
    const sky = ensureSky(Z);
    sky.onSpawn = () => {
      if (this.mode === "city") this.toast("A unicorn is flying over", "Look up — rainbow trail");
    };
    ensureFireworks(Z);

    // route highlight (chevrons + beam), as in the design
    Z.city.add(this.routeG);
    {
      const cg = new THREE.ConeGeometry(0.9, 1.9, 3);
      cg.rotateX(PI / 2);
      const cm = new THREE.MeshBasicMaterial({ color: 0x3dffa0, transparent: true, opacity: 0.95 });
      for (let i = 0; i < 26; i++) {
        const m = new THREE.Mesh(cg, cm.clone());
        m.scale.y = 0.4;
        this.routeG.add(m);
        this.chev.push(m);
      }
    }
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.4, 70, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x3dffa0, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    Z.city.add(this.beam);
    this.beam.visible = false;
    this.routeG.visible = false;

    this.setQuality(quality);
    this.offs.push(
      conn.on("state", () => this.onState()),
      conn.on("snap", (s) => this.onSnap(s)),
      conn.on("denied", () => this.onDenied()),
    );
    this.bindDom();
    this.resize();
    this.globe.gv.focus = null;
    if (location.hash === "#city") void this.enterCity(true);
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---- store ----------------------------------------------------------------------------------------------------
  subscribe = (fn: () => void) => {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  };
  getUi = () => this.ui;
  private patch(p: Partial<UiState>) {
    this.ui = { ...this.ui, ...p };
    for (const fn of this.subs) fn();
  }
  private readOpts(S: any): Opts {
    return { sensX: S.sensX, sensY: S.sensY, invertY: S.invertY, recenter: S.recenter, capture: S.capture, pack: S.pack, halo: S.halo, rainbow: S.rainbow };
  }
  setOpt<K extends keyof Opts>(k: K, v: Opts[K]) {
    const C = this.C;
    C.S[k] = v;
    C.save();
    C.applyAcc();
    this.patch({ opts: this.readOpts(C.S) });
    if (k === "capture" && v) this.toast("Mouse capture on", "Click the scene to capture · Esc releases");
  }
  toast(a: string, b?: string) {
    window.clearTimeout(this.toastT);
    this.patch({ toast: { a, b, n: ++this.toastN } });
    this.toastT = window.setTimeout(() => this.patch({ toast: null }), 3200);
  }
  clearInput() {
    this.C.clearInput();
  }

  setQuality(q: Quality) {
    this.quality = q;
    this.renderer.setPixelRatio(q === "low" ? 0.75 : Math.min(window.devicePixelRatio || 1, 2));
    this.cityScene.fog = q === "high" ? new THREE.Fog(0x9a6aa4, 70, 640) : new THREE.Fog(0x9a6aa4, 50, 320);
    this.resize();
  }

  /** Programmatic camera (dev screenshots). */
  setView(yaw: number, pitch: number, dist: number) {
    const c = this.C.cam;
    c.yaw = yaw;
    c.pitch = Math.min(c.maxP, Math.max(c.minP, pitch));
    c.dist = dist;
    c.lastIn = this.C.t + 3600;
  }

  // ---- modes, menus -----------------------------------------------------------------------------------------------
  blocked(): boolean {
    return this.mode !== "city" || !!this.ui.panel || !!this.ui.menu || isTyping();
  }
  private setMode(m: Mode) {
    this.mode = m;
    if (m !== "city") this.closeMenus();
    this.patch({ mode: m });
  }
  private async fade(on: boolean) {
    this.patch({ fadeOn: on });
    await sleep(720);
  }
  closeMenus() {
    if (this.ui.menu) this.patch({ menu: null });
    if (document.activeElement && (document.activeElement as HTMLElement).blur && isTyping()) (document.activeElement as HTMLElement).blur();
  }
  openMenu(m: Exclude<MenuName, null>, filter?: TravelFilter) {
    if (this.mode !== "city") return;
    this.C.clearInput();
    if (document.pointerLockElement) document.exitPointerLock();
    this.patch({ menu: m, arrive: false, ...(m === "trav" ? { travFilter: filter ?? "all" } : {}) });
  }
  toggleMenu(m: Exclude<MenuName, null>) {
    if (this.ui.menu === m) this.closeMenus();
    else this.openMenu(m);
  }
  closePanel() {
    this.patch({ panel: null });
  }
  setTravFilter(f: TravelFilter) {
    this.patch({ travFilter: f });
  }
  selectDest(id: string | null) {
    this.patch({ selId: id });
    this.setRoute(id ? TELEPORT_POINTS.find((p) => p.id === id) ?? null : null);
  }
  dismissArrive() {
    this.patch({ arrive: false });
  }
  arriveChoice(a: "act" | "comm" | "explore") {
    this.patch({ arrive: false });
    if (a === "explore") this.toast("Explore", "Walk, cycle, or press M to travel");
    else this.openMenu("trav", a);
  }

  private setRoute(d: TeleportPoint | null) {
    this.route = d;
    this.routeG.visible = !!d;
    this.beam.visible = !!d;
    this.patch({ routeId: d ? d.id : null });
    if (d) {
      this.beam.position.set(d.cx, 35, d.cz);
      const c = new THREE.Color(d.color);
      (this.beam.material as THREE.MeshBasicMaterial).color.copy(c);
      this.chev.forEach((m) => (m.material as THREE.MeshBasicMaterial).color.copy(c));
    }
  }
  clearRoute() {
    this.setRoute(null);
    this.patch({ selId: null });
  }
  walkRoute() {
    this.closeMenus();
    if (this.route) this.toast(`Route to ${this.route.label}`, "Follow the green chevrons");
  }

  async enterCity(quick = false) {
    if (!quick) {
      this.globe.focus(this.globe.gc, 3);
      await sleep(1400);
      await this.fade(true);
    }
    this.setMode("city");
    this.C.resetCamera();
    this.C.cam.snap = true;
    if (!quick) {
      this.toast("Genesis City", "Welcome to the central square");
      this.patch({ arrive: true });
    }
    await this.fade(false);
  }
  async toGlobe() {
    if (this.mode === "tour") return;
    await this.fade(true);
    this.setMode("globe");
    this.globe.gv.dist = this.globe.gv.tdist = 5.4;
    this.globe.focus(this.globe.gc, 5.4);
    await this.fade(false);
  }
  async startTour() {
    if (this.mode === "tour") return;
    if (this.ui.panel) this.closePanel();
    this.tour.t = 0;
    this.tour.play = true;
    this.capI = -1;
    Z_nextU(this.Z, 5);
    if (this.mode === "city") await this.fade(true);
    this.closeMenus();
    this.setMode("tour");
    const g = this.globe.gv;
    g.dist = g.tdist = 7;
    g.focus = { y: -PI / 2 - (2.3 * PI) / 180, x: 0.85, d: 3.2 };
    this.tour.phase = "globe";
    this.patch({ tour: { caption: { a: "Earth, but weirder", b: "An alternate planet shaped by internet culture", n: "CHAPTER 00 · PLANET" }, playing: true, progress: 0 } });
    await this.fade(false);
  }
  private async tourToCity() {
    this.tour.phase = "trans";
    await this.fade(true);
    this.tour.phase = "city";
    this.tour.t = 0;
    this.capI = -1;
    await this.fade(false);
  }
  async exitTour() {
    this.tour.phase = "hold";
    await this.fade(true);
    this.setMode("city");
    this.C.resetCamera();
    this.C.cam.snap = true;
    this.tour.phase = "";
    await this.fade(false);
  }
  tourPlayPause() {
    this.tour.play = !this.tour.play;
    this.patch({ tour: { ...this.ui.tour, playing: this.tour.play } });
  }
  tourNext() {
    if (this.tour.phase === "globe") void this.tourToCity();
    else if (this.tour.phase === "city") this.tour.t = Math.min(TOT - 0.1, (Math.floor(this.tour.t / SEG) + 1) * SEG);
  }

  // ---- DOM ------------------------------------------------------------------------------------------------------
  private bindDom() {
    const C = this.C;
    const down = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.code === "Escape") {
        if (this.ui.menu) this.closeMenus();
        else if (this.ui.panel) this.closePanel();
        else if (this.mode === "tour") void this.exitTour();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (this.mode === "globe") {
        if (e.code === "KeyT") void this.startTour();
        return;
      }
      if (this.mode !== "city") return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.code === "KeyM") return this.toggleMenu("trav");
      if (e.code === "KeyO") return this.toggleMenu("opt");
      if (e.code === "KeyP") return this.toggleMenu("players");
      if (this.ui.panel || this.ui.menu) return;
      if (e.code === "Enter") {
        e.preventDefault();
        this.onChatFocus?.();
        return;
      }
      if (e.code === "KeyE") C.interact();
      else if (e.code === "KeyR") this.respawn();
      else if (e.code === "KeyV") {
        C.resetCamera();
        this.toast("Camera reset", "");
      } else if (e.code === "KeyF") this.toggleFollow();
      else if (e.code === "KeyG") void this.toGlobe();
      else if (e.code === "KeyT") void this.startTour();
      else if (e.code === "KeyH") this.patch({ helpHidden: !this.ui.helpHidden });
      else if (e.code === "Space") {
        if (!e.repeat) C.jump();
        C.keys.Space = true;
      } else C.keys[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      C.keys[e.code] = false;
    };
    const blur = () => C.clearInput();
    const resize = () => this.resize();
    const pdown = (e: PointerEvent) => {
      this.dragMoved = 0;
      this.pointer = { x: e.clientX, y: e.clientY };
    };
    const pmove = (e: PointerEvent) => {
      this.dragMoved += Math.abs(e.clientX - this.pointer.x) + Math.abs(e.clientY - this.pointer.y);
      this.pointer = { x: e.clientX, y: e.clientY };
    };
    const pup = (e: PointerEvent) => {
      if (this.mode === "city" && this.dragMoved < 5 && !document.pointerLockElement) this.pick(e);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", resize);
    this.canvas.addEventListener("pointerdown", pdown);
    this.canvas.addEventListener("pointermove", pmove);
    this.canvas.addEventListener("pointerup", pup);
    this.offs.push(() => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", resize);
      this.canvas.removeEventListener("pointerdown", pdown);
      this.canvas.removeEventListener("pointermove", pmove);
      this.canvas.removeEventListener("pointerup", pup);
    });
  }

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private pick(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects([...this.remotes.values()].map((a) => a.hit), false);
    const id = hits[0]?.object.userData.userId as string | undefined;
    if (id) this.onPick?.(id);
  }

  // ---- interaction ------------------------------------------------------------------------------------------------
  private interact() {
    const C = this.C;
    const n = C.near;
    if (!n || this.actFlag) return;
    if (n.t === "dis") {
      this.actFlag = 2;
      C.dismount();
    } else if (n.t === "bike") {
      this.actFlag = 1;
      this.actBike = this.Z.bikes.indexOf(n.b);
      C.mount(n.b);
    } else n.o.act();
  }
  private toggleFollow() {
    const C = this.C;
    C.follow = !C.follow;
    if (C.follow && C.bike) this.interactDismount();
    this.patch({ following: C.follow });
    this.toast(C.follow ? "Following the penguin" : "Stopped following", C.follow ? "Any movement key cancels" : "");
  }
  private interactDismount() {
    if (this.actFlag) return;
    this.actFlag = 2;
    this.C.dismount();
  }

  // ---- teleports (server decides; the design's fade + C.teleport are applied on the server's snap) --------------------
  private pendingTp: { fadeUp: boolean; label?: string; tag?: string } | null = null;
  async teleportTo(pt: TeleportPoint) {
    this.closeMenus();
    this.pendingTp = { fadeUp: true, label: pt.label, tag: pt.tag };
    await this.fade(true);
    this.conn.teleport(pt.id);
    window.setTimeout(() => {
      if (this.pendingTp) this.onDenied(); // no reply: do not leave the screen black
    }, 3000);
  }
  respawn() {
    if (this.mode !== "city") return;
    this.pendingTp = { fadeUp: false, label: "Respawned", tag: "Genesis Square" };
    this.conn.teleport(RESPAWN_ID);
  }
  private onDenied() {
    if (!this.pendingTp) return;
    const p = this.pendingTp;
    this.pendingTp = null;
    if (p.fadeUp) void this.fade(false);
    this.toast("Teleport is cooling down", "Try again in a moment");
  }

  // ---- network events ---------------------------------------------------------------------------------------------
  private selfState() {
    const players = (this.conn.room?.state as { players?: Map<string, any> } | undefined)?.players;
    return players?.get?.(this.conn.userId);
  }
  private bikeViews(): BikeView[] {
    const out: BikeView[] = [];
    (this.conn.room?.state as any)?.bikes?.forEach((b: any, k: string) => {
      out[+k] = { x: b.x, y: b.y, z: b.z, hy: b.hy, taken: !!b.taken };
    });
    return out;
  }

  private onSnap(s: SnapPayload) {
    const C = this.C;
    this.unacked = [];
    this.buf = [];
    this.actFlag = 0;
    this.placed = true;
    if (s.reason === "correction") {
      this.hardSet({ x: s.x, y: s.y, z: s.z, vx: 0, vz: 0, vy: 0, yaw: s.heading, grounded: true, coyote: 0, jumpBuf: 0, bike: s.bike, hy: s.heading, bsp: 0 });
      return;
    }
    C.teleport(s.x, s.z, s.fx, s.fz);
    C.pos.set(s.x, 0, s.z);
    C.y = s.y;
    if (s.fx === undefined) {
      C.yaw = s.heading;
      C.cam.yaw = s.heading;
    }
    C.avatar.root.position.set(s.x, s.y, s.z);
    const tp = this.pendingTp;
    this.pendingTp = null;
    if (tp) {
      if (tp.fadeUp) void this.fade(false);
      this.setRoute(null);
      this.patch({ selId: null });
      if (tp.label) this.toast(tp.label, tp.tag);
    }
  }

  private serverCtrl(me: any): CtrlState {
    return {
      x: me.x, y: me.y, z: me.z, vx: me.vx, vz: me.vz, vy: me.vy, yaw: me.heading, grounded: !!me.grounded,
      coyote: me.coyote, jumpBuf: me.jumpBuf, bike: me.bike, hy: me.hy, bsp: me.bsp,
    };
  }

  private hardSet(P: CtrlState) {
    const C = this.C, Z = this.Z;
    const localBike = C.bike ? Z.bikes.indexOf(C.bike) : -1;
    if (P.bike < 0 && localBike >= 0) C.dismount();
    if (P.bike >= 0 && localBike !== P.bike && Z.bikes[P.bike]) C.mount(Z.bikes[P.bike]);
    C.pos.set(P.x, 0, P.z);
    C.y = P.y;
    C.vel.set(P.vx, 0, P.vz);
    C.vy = P.vy;
    C.grounded = P.grounded;
    C.yaw = P.yaw;
    C.hy = P.hy;
    C.bsp = P.bsp;
    if (!C.bike) C.avatar.root.position.set(P.x, P.y, P.z);
  }

  /** State patch from the server: rebase on the acknowledged state, replay what the server has not seen, compare to what we show. */
  private onState() {
    const me = this.selfState();
    if (!me) return;
    const C = this.C, Z = this.Z;
    if (!this.placed) {
      this.placed = true;
      C.teleport(me.x, me.z);
      C.pos.set(me.x, 0, me.z);
      C.y = me.y;
      C.yaw = me.heading;
      C.cam.yaw = me.heading;
      C.cam.snap = true;
      return;
    }
    while (this.unacked.length && this.unacked[0]!.seq <= me.ackSeq) this.unacked.shift();
    // A mount/dismount was just pressed and its step has not been queued yet: the server cannot know about it, so there is nothing to compare.
    if (this.actFlag) return;
    const P = this.serverCtrl(me);
    const bikes = this.bikeViews();
    for (let i = 0; i < Z.bikes.length; i++) bikes[i] ??= { x: 0, y: 0, z: 0, hy: 0, taken: false };
    for (const u of this.unacked) for (const st of u.steps) stepCtrl(P, st as unknown as CtrlStep, bikes);
    for (const st of this.buf) stepCtrl(P, st as unknown as CtrlStep, bikes);
    const localBike = C.bike ? Z.bikes.indexOf(C.bike) : -1;
    const err = Math.hypot(P.x - C.pos.x, P.z - C.pos.z) + Math.abs(P.y - C.y) * 0.5;
    if (err > 0.02) {
      this.corrections++;
      this.maxError = Math.max(this.maxError, err);
      if (this.corrLog.length < 20)
        this.corrLog.push({ err: +err.toFixed(3), local: [+C.pos.x.toFixed(2), +C.pos.z.toFixed(2), +C.y.toFixed(2), localBike], server: [+P.x.toFixed(2), +P.z.toFixed(2), +P.y.toFixed(2), P.bike], ack: me.ackSeq, unacked: this.unacked.length, buf: this.buf.length });
    }
    if (P.bike !== localBike || err > 3) this.hardSet(P);
    else if (err > 0.15) {
      // small disagreement (e.g. a server-side collision we did not predict): blend instead of popping
      C.pos.x += (P.x - C.pos.x) * 0.4;
      C.pos.z += (P.z - C.pos.z) * 0.4;
      C.y += (P.y - C.y) * 0.4;
    }
  }

  // ---- loop -----------------------------------------------------------------------------------------------------
  private flush(force = false) {
    if (!this.conn.connected) {
      this.buf = [];
      return;
    }
    while (this.buf.length && (force || this.buf.length >= 1)) {
      const steps = this.buf.splice(0, INPUT_MAX_STEPS);
      const msg: InputMessage = this.conn.sendSteps(steps);
      this.unacked.push({ seq: msg.seq, steps });
    }
    if (this.unacked.length > 200) this.unacked.splice(0, this.unacked.length - 200);
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const rawDt = now - this.last;
    this.last = now;
    const dt = Math.min(0.05, rawDt / 1000);
    this.clock += Math.min(0.25, rawDt / 1000);
    const t = this.clock;

    this.frameTimes.push(rawDt);
    this.fpsFrames++;
    if (now - this.fpsAt >= 1000) {
      this.fps = (this.fpsFrames * 1000) / (now - this.fpsAt);
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      this.p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
      this.frameTimes = [];
      this.fpsFrames = 0;
      this.fpsAt = now;
    }

    const Z = this.Z, C = this.C, rd = this.renderer;
    if (this.mode === "globe") {
      this.globe.update(dt, t);
      rd.render(this.globe.scene, this.camera);
      return;
    }
    // city & tour
    for (const u of Z.updaters) u(t, dt);
    tickSky(Z, t, dt, this.mode === "city");
    for (const b of Z.bones) {
      if (b.got) continue;
      b.g.rotation.y = t;
      b.g.position.y = (b.y0 as number) + Math.sin(t * 2) * 0.15;
    }
    this.syncRemotes(dt);

    if (this.mode === "city") this.playerStep(dt, t, now);
    else if (this.tourFrame(dt, t)) return; // the tour already rendered the globe (or is holding on a fade)

    rd.render(this.cityScene, this.camera);
  };

  /** Returns true when this frame was already rendered (globe chapter / transition) or must be skipped. */
  private tourFrame(dt: number, t: number): boolean {
    const tour = this.tour, g = this.globe, C = this.C, rd = this.renderer;
    if (tour.phase === "hold") return true;
    if (tour.phase === "trans") {
      rd.render(this.globe.scene, this.camera);
      return true;
    }
    if (tour.phase === "globe") {
      if (tour.play) tour.t += dt;
      g.gv.dist += (g.gv.tdist - g.gv.dist) * (1 - Math.exp(-dt * 1.2));
      g.gv.tdist = Math.max(3.2, 7 - tour.t * 0.55);
      g.ease(dt, 1.6);
      g.place(t);
      this.patch({ tour: { ...this.ui.tour, progress: ((tour.t / 7) * 5) / 100 } });
      if (tour.t > 7) void this.tourToCity();
      rd.render(g.scene, this.camera);
      return true;
    }
    if (tour.phase === "city") {
      if (tour.play) tour.t += dt;
      const u = Math.min(0.9999, tour.t / TOT);
      this.camera.position.copy(this.pc.getPoint(u));
      this.camera.position.y += Math.sin(t * 0.6) * 0.15;
      this.camera.lookAt(this.tc.getPoint(u));
      const i = Math.min(K.length - 1, Math.round(tour.t / SEG));
      if (i !== this.capI) {
        this.capI = i;
        this.patch({ tour: { ...this.ui.tour, caption: { a: K[i]![2], b: K[i]![3], n: `CHAPTER ${String(i + 1).padStart(2, "0")} / ${K.length}` } } });
      }
      this.patch({ tour: { ...this.ui.tour, progress: tour.t / TOT } });
      if (tour.t >= TOT - 0.05) void this.exitTour();
    }
    // the player's own avatar keeps idling where it stands while the camera flies
    C.avatar.update({ speed: 0, grounded: true }, dt);
    return false;
  }

  /** One controller step for this frame: feel comes from the unmodified design controller; the same step is queued for the server. */
  private playerStep(dt: number, t: number, now: number) {
    const C = this.C, Z = this.Z, S = C.S;
    if (dt <= 0) return;
    const bl = this.blocked();
    const k = bl ? {} : C.keys;
    const f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), sprint = !!(k.ShiftLeft || k.ShiftRight);
    const yw = bl ? 0 : (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
    const yaw = C.cam.yaw + yw * 1.9 * dt * S.sensX;
    const sn = Math.sin(yaw), cs = Math.cos(yaw);
    let wx = sn * f - cs * s, wz = cs * f + sn * s, speed: 0 | 1 | 2 | 3 = sprint ? 1 : 0;
    if (C.follow && !(f || s) && Z.penguinState && !C.bike) {
      const pp = Z.penguinState.pos, dx = pp.x - C.pos.x, dz = pp.z - C.pos.z, d = Math.hypot(dx, dz);
      if (d > 4.5) {
        wx = dx / d;
        wz = dz / d;
        speed = d > 30 ? 3 : 2;
      } else wx = wz = 0;
    }
    const step: InputStep = {
      dt, wx, wz, speed, f, s, sprint, brake: !!k.Space, jump: this.jumpFlag, act: this.actFlag, bike: this.actBike,
    };
    this.jumpFlag = false;
    this.actFlag = 0;
    this.actBike = -1;

    C.step(dt, t);

    const idle =
      !f && !s && !step.jump && !step.act && !step.brake &&
      (C.bike ? Math.abs(C.bsp) < 1e-3 : C.grounded && Math.hypot(C.vel.x, C.vel.z) < 1e-3 && C.jumpBuf <= 0 && !(C.follow && wx));
    if (!idle) this.buf.push(step);
    if (this.buf.length && (now - this.flushAt >= FLUSH_MS || this.buf.length >= INPUT_MAX_STEPS)) {
      this.flushAt = now;
      this.flush();
    }

    // ---- world behaviour (zg-app.js playerStep) ----
    const pos = C.pos;
    const Pg = this.ui.disc;
    let disc = Pg;
    const setDisc = (p: Partial<Discoveries>) => {
      disc = { ...disc, ...p };
      this.patch({ disc });
    };
    for (const b of Z.bones) {
      if (!b.got && Math.hypot(b.x - pos.x, b.z - pos.z) < 2.4) {
        b.got = true;
        b.g.visible = false;
        setDisc({ bones: disc.bones + 1 });
        this.toast(`Bone found ${disc.bones}/3`, disc.bones >= 3 ? "Return to the Shiba Elder" : "");
      }
    }
    const rg = Z.rings[Z.ringNext];
    if (rg && !disc.ringDone && Math.hypot(rg.x - pos.x, rg.z - pos.z) < 3 && C.y < 4) {
      Z.ringNext++;
      Z.setRings();
      setDisc({ ring: Z.ringNext });
      if (Z.ringNext >= 5) {
        setDisc({ ringDone: true });
        this.setOpt("rainbow", true);
        ensureFireworks(Z)(pos.x, C.y + 10, pos.z);
        Z.spawnUnicorn?.();
        this.toast("Ring Run complete", "Rainbow wheels unlocked — a unicorn is on its way");
      } else this.toast(`Ring ${Z.ringNext}/5`, "");
    }
    if (!disc.buddy && Math.hypot(pos.x + 113, pos.z + 118) < 7) {
      setDisc({ buddy: true });
      this.toast("Penguin trail", "You found the Aurora Door");
    }
    let z = "";
    if (Math.hypot(pos.x, pos.z) < 22) z = "Genesis Square|The central square — cafés, bikes, routes";
    for (const d of Z.dest) if (!d.minor && Math.hypot(d.x - pos.x, d.z - pos.z) < (d.r ?? 0)) z = `${d.n}|${d.tag ?? ""}`;
    if (z !== this.zone) {
      this.zone = z;
      if (z) {
        const a = z.split("|");
        this.toast(a[0]!, a[1]);
      }
    }
    const n = C.near;
    const tx: string | null = n && !this.ui.menu ? (n.t === "dis" ? "Dismount" : n.t === "bike" ? "Mount neon bicycle" : n.o.label) : null;
    if (tx !== this.ui.prompt) this.patch({ prompt: tx });

    const route = this.route;
    if (route) {
      const dx = route.cx - pos.x, dz = route.cz - pos.z, d = Math.hypot(dx, dz);
      const a = Math.atan2(route.cz, route.cx), sx = Math.cos(a) * 22, sz = Math.sin(a) * 22, ex = route.x, ez = route.z;
      const L = Math.hypot(ex - sx, ez - sz), ang = Math.atan2(ex - sx, ez - sz);
      this.chev.forEach((m, i) => {
        const sv = (i / this.chev.length + t * 0.14) % 1;
        m.position.set(sx + (ex - sx) * sv, 0.5, sz + (ez - sz) * sv);
        m.rotation.y = ang;
        m.visible = L > 3;
      });
      if (d < 8) {
        this.setRoute(null);
        this.patch({ selId: null });
      }
    }
  }

  private syncRemotes(dt: number) {
    const Z = this.Z;
    const state = this.conn.room?.state as { players?: Map<string, any>; bikes?: Map<string, any> } | undefined;
    const seen = new Set<string>();
    const ridden = new Map<number, RemoteAvatar>();
    state?.players?.forEach((p: any, id: string) => {
      if (id === this.conn.userId) return;
      seen.add(id);
      const info = { userId: id, name: p.name as string, kind: (p.kind === "npc" ? "npc" : "user") as "user" | "npc", colorIndex: p.colorIndex as number, connected: p.connected as boolean };
      let av = this.remotes.get(id);
      if (!av) {
        av = new RemoteAvatar(Z, info);
        this.remotes.set(id, av);
      } else av.update(info);
      const bz = p.bike >= 0 ? Z.bikes[p.bike] ?? null : null;
      av.step(dt, { x: p.x, y: p.y, z: p.z, heading: p.bike >= 0 ? p.hy : p.heading, grounded: p.grounded, vy: p.vy, bike: bz ? p.bike : -1, bsp: p.bsp }, bz);
      if (bz) {
        bz.g.position.copy(av.pos);
        bz.g.rotation.set(0, av.heading, 0);
        bz.g.userData.wheels.forEach((w: THREE.Object3D) => (w.rotation.x += (p.bsp * dt) / 0.5));
        ridden.set(p.bike, av);
      }
    });
    for (const [id, av] of this.remotes) {
      if (!seen.has(id)) {
        av.dispose();
        this.remotes.delete(id);
      }
    }
    // bikes nobody local is riding mirror the server (taken flag and, for dropped bikes, position)
    state?.bikes?.forEach((b: any, key: string) => {
      const i = +key, zb = Z.bikes[i];
      if (!zb || this.C.bike === zb) return;
      zb.taken = !!b.taken;
      if (!b.taken) {
        zb.g.position.set(b.x, b.y, b.z);
        zb.g.rotation.set(0, b.hy, 0);
      }
    });
  }

  // ---- quest hooks (local flavour; nothing is persisted or rewarded) --------------------------------------------------
  private elder() {
    const Z = this.Z, d = this.ui.disc, n = d.bones;
    if (d.done) Z.panel("Shiba Elder", "Good boy. You already earned the <b>Good Boy</b> badge (prototype only; nothing is stored).");
    else if (n < 3)
      Z.panel("Shiba Elder <span class=\"tag\">Quest</span>", `Three glowing bones are scattered across Genesis City: one in this lounge, one behind the last frame in the art gallery, and one at the Aurora Door on Penguin Mountain.<br><br><b>Found ${n}/3.</b>`);
    else {
      this.patch({ disc: { ...d, done: true }, badge: "Good Boy badge · cyan jacket" });
      Z.panel("Quest complete <span class=\"tag\">Demo</span>", "All three bones returned. You earned the <b>Good Boy</b> badge (prototype reward, local to this tab).");
    }
  }
  private telescope() {
    const Z = this.Z, C = this.C, d = this.ui.disc;
    const T0 = Z.rocketT || 0, up = T0 > 14.5 && T0 < 22.5;
    if (up) {
      if (!d.launch) {
        this.patch({ disc: { ...d, launch: true } });
        this.setOpt("halo", true);
        ensureFireworks(Z)(C.pos.x, C.y + 12, C.pos.z);
        Z.panel("Launch spotted! <span class=\"tag\">Discovery</span>", "You caught the liftoff through the telescope. Reward: the <b>Spark Halo</b> — now on your avatar (toggle in Options).");
      } else Z.panel("Moonport telescope", "Liftoff in progress — you already hold the Spark Halo.");
    } else {
      Z.panel("Moonport telescope", `The stack is still assembling. Liftoff starts about <b>${Math.max(1, Math.round((14.5 - T0 + 24) % 24))} s</b> from now — come back when the engines glow.<br><br><span class="zg-sm">Spot a launch to earn the Spark Halo.</span>`);
    }
  }

  // ---- readouts for the UI ------------------------------------------------------------------------------------------
  stats(): GameStats {
    const C = this.C;
    return {
      fps: Math.round(this.fps * 10) / 10, frameMsP95: Math.round(this.p95 * 10) / 10, rtt: Math.round(this.conn.rtt),
      players: [...this.playerViews()].filter((p) => p.kind === "user").length,
      pending: this.unacked.reduce((n, u) => n + u.steps.length, 0) + this.buf.length,
      corrections: this.corrections, maxError: Math.round(this.maxError * 1000) / 1000,
      pos: { x: C.pos.x, z: C.pos.z }, camYaw: C.cam.yaw,
      drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles,
    };
  }

  /** Read straight from synchronised room state (not the render loop), so it stays accurate when frames are slow. */
  playerViews(): PlayerView[] {
    const state = this.conn.room?.state as { players?: Map<string, any> } | undefined;
    const rows: PlayerView[] = [];
    state?.players?.forEach((p: any, id: string) => {
      rows.push({ userId: id, name: p.name, kind: p.kind === "npc" ? "npc" : "user", colorIndex: p.colorIndex, connected: p.connected, isSelf: id === this.conn.userId, x: p.x, z: p.z, dist: 0 });
    });
    const me = rows.find((r) => r.isSelf);
    if (me && this.placed) {
      me.x = this.C.pos.x;
      me.z = this.C.pos.z;
    }
    for (const r of rows) r.dist = me ? Math.hypot(r.x - me.x, r.z - me.z) : 0;
    return rows;
  }

  /** Everything the minimap draws that is not in React state. */
  minimapData() {
    const C = this.C, Z = this.Z;
    return {
      pos: { x: C.pos.x, z: C.pos.z }, yaw: C.bike ? C.hy : C.yaw, camYaw: C.cam.yaw,
      route: this.route ? { x: this.route.cx, z: this.route.cz, label: this.route.label } : null,
      bikes: Z.bikes.filter((b) => !b.taken).map((b) => ({ x: b.g.position.x, z: b.g.position.z })),
      penguin: Z.penguinState ? { x: Z.penguinState.pos.x, z: Z.penguinState.pos.z } : null,
      dest: Z.dest as Array<{ k: string; n: string; x: number; z: number; c: string; minor?: boolean }>,
      players: this.playerViews().filter((p) => !p.isSelf),
    };
  }
  travelPoints() {
    return TELEPORT_POINTS;
  }
  cities() {
    return CITIES;
  }

  dispose() {
    this.disposed = true;
    if (current === this) current = null;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.toastT);
    for (const off of this.offs) off();
    this.globe.dispose();
    for (const a of this.remotes.values()) a.dispose();
    this.remotes.clear();
    this.Z.city.remove(this.routeG);
    this.Z.city.remove(this.beam);
    this.C.clearInput();
    this.renderer.dispose();
  }
}

function Z_nextU(Z: DesignWorld, n: number) {
  const sky = Z.__sky as Sky | undefined;
  if (sky) sky.nextU = n;
}
