import { z } from "zod";

/** Experience manifest v0.1, see docs/EXPERIENCE_CONTRACT.md. Used from Milestone 4; defined now so the contract is code. */
export const ExperienceManifest = z.object({
  experienceId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: z.string().min(2).max(80),
  kind: z.enum(["camp", "activity"]),
  authorId: z.string().min(2).max(64),
  plotId: z.string().min(2).max(64),
  description: z.string().max(500),
  assetUrl: z.string().max(300).regex(/^\/assets\/[A-Za-z0-9._\-/]+\.(glb|gltf)$/, "assetUrl must be a /assets/*.glb|gltf path"),
  entryPoint: z.string().min(2).max(64),
  spawn: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  bounds: z.object({
    width: z.number().positive().max(40),
    height: z.number().positive().max(30),
    depth: z.number().positive().max(40),
  }),
  supportedFeatures: z.array(z.enum(["profile", "return-to-plaza", "chat", "activity-result"])).max(8),
  durationEstimateSeconds: z.number().int().min(0).max(3600),
  integrationMode: z.enum(["reviewed-first-party", "glb-only"]),
  publicationStatus: z.enum(["draft", "published", "rolled-back"]),
});
export type ExperienceManifest = z.infer<typeof ExperienceManifest>;
