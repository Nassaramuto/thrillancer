import { schema, t, type SchemaType } from "@colyseus/schema";

/** Replicated to every client in the room. Kinematics are authoritative server values (see contracts/ctrl.ts). */
export const PlayerState = schema(
  {
    userId: t.string(),
    name: t.string(),
    kind: t.string(), // "user" | "npc"
    colorIndex: t.uint8(),
    x: t.float32(),
    y: t.float32(),
    z: t.float32(),
    vx: t.float32(),
    vz: t.float32(),
    vy: t.float32(),
    heading: t.float32(), // character yaw (bike heading while riding)
    grounded: t.boolean(),
    coyote: t.float32(),
    jumpBuf: t.float32(),
    bike: t.int8(), // -1 on foot, else bike index
    hy: t.float32(),
    bsp: t.float32(),
    connected: t.boolean(),
    ackSeq: t.uint32(),
  },
  "PlayerState",
);
export type PlayerState = SchemaType<typeof PlayerState>;

/** One of the plaza's shared neon bicycles. A ridden bike follows its rider; a dropped one stays where it is. */
export const BikeState = schema(
  { x: t.float32(), y: t.float32(), z: t.float32(), hy: t.float32(), taken: t.boolean(), by: t.string() },
  "BikeState",
);
export type BikeState = SchemaType<typeof BikeState>;

export const PlazaState = schema({ players: t.map(PlayerState), bikes: t.map(BikeState) }, "PlazaState");
export type PlazaState = SchemaType<typeof PlazaState>;
