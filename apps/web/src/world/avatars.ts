import * as THREE from "three";
import type { DesignWorld } from "./design";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AvatarInfo {
  userId: string;
  name: string;
  kind: "user" | "npc";
  colorIndex: number;
  connected: boolean;
}

/** Looks cycled for other visitors. Every one is built by the design's own `Z.makeAvatar` (V2 IK rig). */
const LOOKS: Array<Record<string, unknown>> = [
  { jacket: 0xff4fd8, visor: 0x4de8ff, hair: 0x2a1a40, style: "short", neon: 0xff4fd8 },
  { jacket: 0xffc24a, visor: 0xff4fd8, hair: 0x3a2a22, style: "long", neon: 0xffc24a, hat: "beanie" },
  { jacket: 0x9a86e0, visor: 0x3dffa0, hair: 0x5a3a2a, style: "bun", neon: 0x9a86e0 },
  { jacket: 0x3dffa0, visor: 0xff4fd8, hair: 0x14101c, style: "curly", neon: 0x3dffa0 },
  { jacket: 0xff7a9a, visor: 0x4de8ff, hair: 0x2a1a40, style: "pony", neon: 0xff7a9a },
  { jacket: 0x4de8ff, visor: 0xffc24a, hair: 0x3a2a22, style: "quiff", neon: 0x4de8ff, hat: "cap" },
  { jacket: 0xff9a4a, visor: 0x3dffa0, hair: 0x5a3a2a, style: "short", neon: 0xff9a4a },
  { jacket: 0x7affc8, visor: 0xff4fd8, hair: 0x14101c, style: "long", neon: 0x7affc8 },
];
const BOT_LOOK = { jacket: 0xb9b2ff, visor: 0xb9b2ff, skin: 0xcfc9ff, hair: 0x6a5cff, style: "short", neon: 0xb9b2ff, pants: 0x1a1630 };

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Another person (or the bot) in the plaza, rendered with the design's avatar rig. Position, heading, jump and bike
 * state all come from the server's replicated state; this class only smooths them for display.
 */
export class RemoteAvatar {
  readonly A: any;
  readonly root: THREE.Group;
  readonly hit: THREE.Mesh;
  private tag: THREE.Sprite | null = null;
  private ring: THREE.Mesh;
  private lastKey = "";
  readonly pos = new THREE.Vector3();
  heading = 0;
  private speed = 0;
  private turn = 0;
  private crank = 0;
  private placed = false;
  riding = -1;

  constructor(private Z: DesignWorld, public info: AvatarInfo) {
    this.A = Z.makeAvatar(info.kind === "npc" ? BOT_LOOK : LOOKS[info.colorIndex % LOOKS.length]!);
    this.root = this.A.root;
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.05, 4, 28),
      new THREE.MeshBasicMaterial({ color: info.kind === "npc" ? 0xb9b2ff : 0x9a8cff, transparent: true, opacity: 0.7 }),
    );
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.06;
    this.root.add(this.ring);
    this.hit = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.1;
    this.hit.userData.userId = info.userId;
    this.root.add(this.hit);
    Z.city.add(this.root);
    this.refresh(true);
  }

  update(info: AvatarInfo) {
    this.info = info;
    this.refresh(false);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = info.connected ? 0.7 : 0.2;
  }

  private refresh(force: boolean) {
    const { name, kind, connected } = this.info;
    const key = `${name}|${kind}|${connected}`;
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    if (this.tag) {
      this.root.remove(this.tag);
      (this.tag.material as THREE.SpriteMaterial).map?.dispose();
      this.tag.material.dispose();
    }
    const lines = [kind === "npc" ? `${name} · BOT` : name];
    if (!connected) lines.push("reconnecting…");
    this.tag = this.Z.label(lines, lines.length > 1 ? 1.8 : 1.2, lines.length > 1 ? 0.7 : 0.5, {
      w: 256,
      border: kind === "npc" ? "#b9b2ff" : "#9a8cff",
      fg: kind === "npc" ? "#cfc9ff" : "#ffffff",
    });
    if (name.length > 8) this.tag.scale.x = Math.min(3.4, 0.2 * name.length + 0.4);
    this.tag.position.set(0, this.riding >= 0 ? 3.3 : 3, 0);
    this.root.add(this.tag);
  }

  /** Smooth toward the replicated state. `bike` is the bike group this player is riding (or null). */
  step(dt: number, s: { x: number; y: number; z: number; heading: number; grounded: boolean; vy: number; bike: number; bsp: number }, bike: { g: THREE.Group } | null) {
    if (!this.placed) {
      this.pos.set(s.x, s.y, s.z);
      this.heading = s.heading;
      this.placed = true;
    }
    const k = 1 - Math.exp(-dt * 14);
    const px = this.pos.x, pz = this.pos.z;
    this.pos.x += (s.x - this.pos.x) * k;
    this.pos.y += (s.y - this.pos.y) * k;
    this.pos.z += (s.z - this.pos.z) * k;
    const dh = wrap(s.heading - this.heading);
    this.heading += dh * Math.min(1, dt * 12);
    const raw = dt > 0 ? Math.hypot(this.pos.x - px, this.pos.z - pz) / dt : 0;
    this.speed += (Math.min(raw, 16) - this.speed) * Math.min(1, dt * 8);
    this.turn += ((dt > 0 ? dh / dt : 0) * 0.35 - this.turn) * Math.min(1, dt * 8);
    const sp = this.speed < 0.3 ? 0 : this.speed;

    if (s.bike >= 0 && bike) {
      if (this.riding !== s.bike) {
        bike.g.add(this.root);
        this.root.position.set(0, 0.315, -0.2);
        this.root.rotation.set(0, 0, 0);
        this.ring.visible = false;
        this.riding = s.bike;
        this.tag?.position.set(0, 3.3, 0);
      }
      this.crank += sp * dt * 2.2;
      this.A.update({ riding: true, crank: this.crank, speed: sp, grounded: true }, dt);
    } else {
      if (this.riding >= 0) {
        this.Z.city.add(this.root);
        this.ring.visible = true;
        this.riding = -1;
        this.tag?.position.set(0, 3, 0);
      }
      this.root.position.copy(this.pos);
      this.root.rotation.y = this.heading;
      this.A.update({ speed: sp, grounded: s.grounded, vy: s.vy, turn: this.turn }, dt);
    }
  }

  dispose() {
    this.root.parent?.remove(this.root);
    if (this.tag) {
      (this.tag.material as THREE.SpriteMaterial).map?.dispose();
      this.tag.material.dispose();
    }
    this.ring.geometry.dispose();
    (this.ring.material as THREE.Material).dispose();
    this.hit.geometry.dispose();
  }
}
