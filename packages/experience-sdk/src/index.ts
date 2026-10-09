/**
 * Experience SDK: STUB. Implemented in Milestone 3 (entry / completion / return) and Milestone 4 (camp manifests).
 * Defined now so first-party activity modules and camps have a stable import path. Nothing here executes uploaded code.
 * See docs/EXPERIENCE_CONTRACT.md.
 */
import type { ExperienceManifest } from "@thrillancer/contracts";

export type { ExperienceManifest };

/** What a first-party activity module will receive from the server when a player is admitted (Milestone 3). */
export interface EntryTicket {
  experienceId: string;
  version: string;
  sessionId: string;
  expiresAt: number;
}

/** What a module reports back. The server validates it; a client-reported result is never trusted. */
export interface CompletionReport {
  eventId: string;
  sessionId: string;
  outcome: "completed" | "failed" | "abandoned";
  score?: number;
}

export const SDK_STATUS = "stub-milestone-1" as const;
