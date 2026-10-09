import { z } from "zod";
import { CHAT_MAX_LENGTH, INPUT_MAX_DT_MS, INPUT_MAX_STEPS } from "./constants.ts";

const finite = z.number().finite();

/** Client -> server room messages. Everything is validated at runtime on the server. */
export const InputStep = z.object({
  dt: finite.gt(0).max(INPUT_MAX_DT_MS / 1000 + 1e-6),
  wx: finite.min(-1.5).max(1.5),
  wz: finite.min(-1.5).max(1.5),
  speed: z.number().int().min(0).max(3),
  f: z.number().int().min(-1).max(1),
  s: finite.min(-1).max(1),
  sprint: z.boolean(),
  brake: z.boolean(),
  jump: z.boolean(),
  act: z.number().int().min(0).max(2),
  bike: z.number().int().min(-1).max(63),
});
export type InputStep = z.infer<typeof InputStep>;

/** A batch of controller steps (one per rendered frame, each <= 50 ms), sent ~20 times per second. */
export const InputMessage = z.object({
  seq: z.number().int().min(0).max(2 ** 31),
  epoch: z.number().int().min(0).max(1_000_000),
  steps: z.array(InputStep).min(1).max(INPUT_MAX_STEPS),
});
export type InputMessage = z.infer<typeof InputMessage>;

export const ChatMessage = z.object({ text: z.string().max(CHAT_MAX_LENGTH * 4) });
export type ChatMessage = z.infer<typeof ChatMessage>;

export const TeleportMessage = z.object({ pointId: z.string().min(1).max(40) });
export const GotoPlayerMessage = z.object({ userId: z.string().min(1).max(64) });
export const PingMessage = z.object({ t: finite });
export const BlockMessage = z.object({ userId: z.string().uuid() });
export const REPORT_REASONS = ["spam", "harassment", "impersonation", "other"] as const;
export const ReportMessage = z.object({
  userId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  note: z.string().max(300).optional(),
});

export const ClientMessages = {
  input: InputMessage,
  chat: ChatMessage,
  teleport: TeleportMessage,
  gotoPlayer: GotoPlayerMessage,
  ping: PingMessage,
  block: BlockMessage,
  unblock: BlockMessage,
  report: ReportMessage,
} as const;

/** Server -> client payloads (documented, typed; clients treat them as untrusted-shape but trusted-source). */
export interface ChatBroadcast {
  id: string;
  fromId: string;
  name: string;
  text: string;
  ts: number;
  npc?: boolean;
}
export interface SnapPayload {
  x: number;
  y: number;
  z: number;
  heading: number;
  /** Facing target for teleports (design C.teleport fx, fz). */
  fx?: number;
  fz?: number;
  bike: number;
  seq: number;
  epoch: number;
  reason: "teleport" | "spawn" | "correction";
}
export interface WelcomePayload {
  userId: string;
  roomId: string;
  serverTime: number;
  epoch: number;
  blocked: string[];
  history: ChatBroadcast[];
}
export interface ChatErrorPayload {
  code: "rate_limited" | "invalid";
  retryAfterMs?: number;
}

/** Public profile as shown in the inspect card (HTTP: GET /api/profile/:id). */
export interface PublicProfile {
  userId: string;
  nickname: string;
  kind: "guest" | "wallet" | "npc";
  colorIndex: number;
  joinedAt: string;
  walletShort?: string;
  isBot: boolean;
  note?: string;
}

export interface SessionUser {
  userId: string;
  nickname: string;
  kind: "guest" | "wallet";
  colorIndex: number;
}
