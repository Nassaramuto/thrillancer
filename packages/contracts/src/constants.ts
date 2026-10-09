/** Shared tunables. Server is authoritative; the client reads these for prediction and UI only. */
export const PLAZA_ROOM = "plaza";
export const PLAZA_MAX_CLIENTS = 24;
export const PLAZA_RADIUS = 188; // walkable disc, metres (Claude Design Z.resolve bound)
export const PLAYER_RADIUS = 0.6;

export const WALK_SPEED = 4.8; // m/s
export const SPRINT_SPEED = 11.5; // m/s
export const INPUT_MAX_DT_MS = 50; // largest dt of one simulated step (the design controller clamps dt to 0.05 s)
export const INPUT_MAX_STEPS = 16; // steps per input message
export const INPUT_BUDGET_CAP_MS = 400; // max banked simulation time per player
export const INPUT_SEND_HZ = 20;
export const PATCH_RATE_MS = 50;

export const TELEPORT_COOLDOWN_MS = 1500;
export const RECONNECT_WINDOW_S = 20;

export const CHAT_MAX_LENGTH = 200;
export const CHAT_BUCKET_CAPACITY = 4; // burst
export const CHAT_REFILL_MS = 2000; // one token per 2s
export const CHAT_HISTORY = 40;

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export const SESSION_COOKIE = "zg_session";
export const SESSION_TTL_DAYS = 30;
export const ROOM_TICKET_TTL_S = 60;

/** Neon palette lifted from the Claude Design export (zg-city.js NEON + avatar accents). */
export const AVATAR_COLORS = [
  0x3dffa0, 0x4de8ff, 0xff4fd8, 0xffc24a, 0xff7a9a, 0x9a86e0, 0xff9a4a, 0x7affc8,
] as const;
export const NPC_COLOR = 0xb9b2ff;
