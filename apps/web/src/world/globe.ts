import * as THREE from "three";
import type { DesignWorld } from "./design";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The "Earth, alternate" globe from the Claude Design V2 app (zg-app.js), ported to TypeScript. Visual logic unchanged. */
const PI = Math.PI;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const LAND: number[][][] = [[[-168,66],[-141,70],[-110,73],[-85,70],[-78,60],[-62,58],[-56,50],[-67,44],[-75,38],[-81,31],[-80,25],[-90,29],[-97,26],[-97,19],[-88,16],[-83,10],[-78,8],[-86,12],[-105,20],[-112,30],[-118,34],[-124,40],[-125,49],[-135,58],[-150,60],[-165,58]],[[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-70,76]],[[-78,8],[-62,11],[-50,0],[-35,-6],[-40,-22],[-48,-27],[-58,-38],[-65,-45],[-70,-55],[-75,-50],[-72,-30],[-70,-18],[-81,-5]],[[-10,36],[-9,43],[-2,47],[-5,50],[5,53],[10,55],[10,58],[20,60],[30,70],[40,68],[40,45],[28,41],[20,38],[12,38],[3,43]],[[-6,50],[2,52],[-2,58],[-6,56]],[[-17,21],[-10,30],[-5,36],[10,37],[22,33],[32,31],[35,25],[43,12],[51,12],[40,-5],[40,-15],[35,-25],[20,-35],[15,-28],[12,-5],[9,4],[-8,5],[-17,14]],[[28,41],[40,45],[40,68],[60,70],[100,78],[140,72],[180,68],[170,60],[160,55],[142,50],[140,40],[128,35],[122,30],[120,22],[108,18],[105,10],[100,2],[98,10],[92,20],[80,8],[73,18],[67,25],[57,25],[52,16],[44,12],[35,28],[35,36],[28,36]],[[130,32],[140,36],[142,44],[140,42],[135,34]],[[114,-22],[130,-12],[142,-11],[153,-26],[147,-38],[135,-35],[115,-34]],[[95,-5],[105,-6],[118,-8],[110,-9]],[[-180,-72],[180,-72],[180,-90],[-180,-90]]];

export interface City {
  n: string;
  lon: number;
  lat: number;
  ok?: boolean;
  d: string;
  g?: THREE.Group;
  cap?: THREE.Mesh;
}
export const CITIES: City[] = [
  { n: "Genesis City", lon: 2.3, lat: 48.9, ok: true, d: "The first open city of Thrillancer: a mash-up of Earth landmarks, built by its community. Walk or cycle in." },
  { n: "New York", lon: -74, lat: 40.7, d: "Blueprint — not yet built. A future community tender could open here." },
  { n: "Dubai", lon: 55.3, lat: 25.2, d: "Blueprint — not yet built." },
  { n: "Tokyo", lon: 139.7, lat: 35.7, d: "Blueprint — not yet built." },
  { n: "Lagos", lon: 3.4, lat: 6.5, d: "Blueprint — not yet built." },
];

export class Globe {
  readonly scene = new THREE.Scene();
  readonly gc = CITIES[0]!;
  sel: City | null = null;
  gv: { dist: number; tdist: number; idle: number; focus: { y: number; x: number; d: number } | null } = { dist: 7.4, tdist: 7.4, idle: 0, focus: null };
  private pivot = new THREE.Group();
  private spin = new THREE.Group();
  private hits: THREE.Object3D[] = [];
  private dragging = false;
  private px = 0;
  private py = 0;
  private moved = 0;
  private rc = new THREE.Raycaster();
  private offs: Array<() => void> = [];

  constructor(Z: DesignWorld, private canvas: HTMLCanvasElement, private cam: THREE.PerspectiveCamera, private active: () => boolean, private onSelect: (c: City) => void, private onEnter: () => void) {
    const gs = this.scene;
    gs.background = new THREE.Color(0x06041a);
    {
      const n = 900, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * PI * 2, b = Math.acos(Math.random() * 2 - 1), r = 60;
        p.set([r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      gs.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.25, color: 0xcfc8ff })));
    }
    gs.add(new THREE.AmbientLight(0x8a7cff, 0.7));
    const gl1 = new THREE.DirectionalLight(0xffc89a, 1.15);
    gl1.position.set(5, 3, 6);
    gs.add(gl1);
    const gl2 = new THREE.DirectionalLight(0x6a5cff, 0.5);
    gl2.position.set(-6, -2, -3);
    gs.add(gl2);
    const etex = Z.tex(2048, 1024, (g: CanvasRenderingContext2D, W: number, H: number) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#2a2a9a");
      gr.addColorStop(0.5, "#1a2a8a");
      gr.addColorStop(1, "#241a6a");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(160,150,255,.14)";
      g.lineWidth = 2;
      for (let l = -180; l <= 180; l += 30) { g.beginPath(); g.moveTo(((l + 180) / 360) * W, 0); g.lineTo(((l + 180) / 360) * W, H); g.stroke(); }
      for (let l = -60; l <= 60; l += 30) { g.beginPath(); g.moveTo(0, ((90 - l) / 180) * H); g.lineTo(W, ((90 - l) / 180) * H); g.stroke(); }
      LAND.forEach((poly, k) => {
        g.beginPath();
        poly.forEach((p, i) => {
          const x = ((p[0]! + 180) / 360) * W, y = ((90 - p[1]!) / 180) * H;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        });
        g.closePath();
        g.fillStyle = k === 10 ? "#e8e4ff" : k === 1 ? "#dfe8f4" : "#4fc08a";
        g.fill();
        g.lineWidth = 5;
        g.strokeStyle = "#8af5c0";
        g.stroke();
        g.fillStyle = "rgba(20,90,70,.28)";
        g.fill();
      });
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * W, y = Math.random() * H * 0.8 + H * 0.1;
        const d = g.getImageData(x, y, 1, 1).data;
        if (d[1]! > 150 && d[0]! < 120) { g.fillStyle = "rgba(255,210,120,.8)"; g.fillRect(x, y, 3, 3); }
      }
    });
    gs.add(this.pivot);
    this.pivot.add(this.spin);
    this.spin.add(new THREE.Mesh(new THREE.SphereGeometry(2, 56, 36), new THREE.MeshStandardMaterial({ map: etex, flatShading: true, roughness: 0.85 })));
    Z.glow(0x6a5cff, 7.4, 0, 0, 0, gs, 0.55);
    const dirOf = (lon: number, lat: number) => {
      const a = (lon * PI) / 180, b = (lat * PI) / 180;
      return V(Math.cos(b) * Math.cos(a), Math.sin(b), -Math.cos(b) * Math.sin(a));
    };
    CITIES.forEach((c) => {
      const d = dirOf(c.lon, c.lat), col = c.ok ? 0x3dffa0 : 0x4de8ff;
      const g = new THREE.Group();
      g.position.copy(d.clone().multiplyScalar(2));
      g.quaternion.setFromUnitVectors(V(0, 1, 0), d);
      this.spin.add(g);
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), new THREE.MeshBasicMaterial({ color: col }));
      pin.rotation.x = PI;
      pin.position.y = 0.3;
      g.add(pin);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(c.ok ? 0.07 : 0.045, 8, 6), new THREE.MeshBasicMaterial({ color: col }));
      cap.position.y = 0.44;
      g.add(cap);
      Z.glow(col, c.ok ? 0.9 : 0.5, 0, 0.44, 0, g, 0.9);
      const lb = Z.label([c.n], 1.5, 0.4, { w: 384, border: c.ok ? "#3dffa0" : null, fg: c.ok ? "#3dffa0" : "#cfe", weight: "700" });
      lb.position.set(0, 0.62, 0);
      lb.scale.set(0.62, 0.17, 1);
      lb.userData.c = c;
      this.hits.push(lb);
      g.add(lb);
      c.g = g;
      c.cap = cap;
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      h.position.y = 0.3;
      h.userData.c = c;
      g.add(h);
      this.hits.push(h);
    });
    this.spin.rotation.y = -PI / 2 - 0.5;
    this.pivot.rotation.x = 0.5;

    const down = (e: PointerEvent) => {
      if (!this.active()) return;
      this.dragging = true; this.px = e.clientX; this.py = e.clientY; this.moved = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    };
    const move = (e: PointerEvent) => {
      if (!this.dragging || !this.active()) return;
      const dx = e.clientX - this.px, dy = e.clientY - this.py;
      this.px = e.clientX; this.py = e.clientY; this.moved += Math.abs(dx) + Math.abs(dy);
      this.spin.rotation.y += dx * 0.006 * (this.gv.dist / 6);
      this.pivot.rotation.x = Math.max(-1.3, Math.min(1.3, this.pivot.rotation.x + dy * 0.005));
      this.gv.focus = null; this.gv.idle = 0;
    };
    const up = (e: PointerEvent) => {
      this.dragging = false;
      if (this.active() && this.moved < 6) {
        const r = canvas.getBoundingClientRect();
        this.rc.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 } as THREE.Vector2, this.cam);
        const h = this.rc.intersectObjects(this.hits)[0];
        if (h) this.select(h.object.userData.c as City);
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!this.active()) return;
      e.preventDefault();
      this.gv.tdist = Math.max(3.2, Math.min(9, this.gv.tdist + e.deltaY * 0.004));
      if (this.gv.focus) this.gv.focus.d = this.gv.tdist;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    this.offs.push(() => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("wheel", wheel);
    });
  }

  focus(c: City, dist: number) {
    this.gv.focus = { y: -PI / 2 - (c.lon * PI) / 180, x: (c.lat * PI) / 180, d: dist };
  }
  select(c: City) {
    if (c.ok && this.sel === c) return this.onEnter();
    this.sel = c;
    this.onSelect(c);
    this.focus(c, 4.2);
  }
  /** Per-frame globe motion shared by the globe mode and the tour's first chapter (rate = easing speed of the focus). */
  ease(dt: number, rate: number) {
    const f = this.gv.focus, k = 1 - Math.exp(-dt * rate);
    if (f) {
      let dy = f.y - this.spin.rotation.y;
      dy = ((((dy + PI) % (PI * 2)) + PI * 2) % (PI * 2)) - PI;
      this.spin.rotation.y += dy * k;
      this.pivot.rotation.x += (f.x - this.pivot.rotation.x) * k;
    }
  }
  update(dt: number, t: number) {
    const gv = this.gv;
    gv.idle += dt;
    if (gv.idle > 4 && !this.dragging && !gv.focus) this.spin.rotation.y += dt * 0.12;
    if (gv.focus) { this.ease(dt, 3); gv.tdist = gv.focus.d; }
    gv.dist += (gv.tdist - gv.dist) * (1 - Math.exp(-dt * 3));
    this.place(t);
  }
  place(t: number) {
    this.cam.position.set(0, 0, this.gv.dist);
    this.cam.lookAt(0, 0, 0);
    this.gc.cap!.scale.setScalar(1 + Math.sin(t * 4) * 0.3);
  }
  setSpin(y: number) { this.spin.rotation.y = y; }
  dispose() { this.offs.forEach((o) => o()); }
}
