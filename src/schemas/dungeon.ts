import { z } from "zod";

// === Point Schema ===
export const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
});

// === Zone Schema ===
export const ZoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    visualPrompt: z.string().optional(),
    area: z.array(PointSchema).optional(),
});

// === Space Schema ===
export const SpaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    spaceType: z.enum(["room", "corridor", "stairs", "outdoor"]),
    polygon: z.array(PointSchema),
    lighting: z.enum(["dark", "dim", "bright", "magical"]).default("dim"),
    floorType: z.string().optional(),
    description: z.string().optional(),
    visualPrompt: z.string().optional(),
    zones: z.array(ZoneSchema).default([]),
});

// === Floor Schema ===
export const FloorSchema = z.object({
    id: z.string(),
    level: z.number(),
    name: z.string(),
    spaces: z.array(SpaceSchema),
});

// === Connection Schema ===
export const ConnectionSchema = z.object({
    id: z.string(),
    type: z.enum(["door", "archway", "secret", "window", "stairs", "ladder", "rope", "portal"]),
    fromSpaceId: z.string(),
    toSpaceId: z.string(),
    state: z.enum(["open", "closed", "locked", "hidden"]).default("closed"),
    material: z.string().optional(),
});

// === Entity Schema ===
export const EntitySchema = z.object({
    id: z.string(),
    type: z.enum(["npc", "monster", "treasure", "hazard", "interactive"]),
    name: z.string(),
    description: z.string().optional(),
    floorId: z.string(),
    position: PointSchema.optional(),
    icon: z.string().default("person"),
});

// === DungeonMap Schema (for AI generation) ===
export const DungeonMapSchema = z.object({
    id: z.string(),
    name: z.string(),
    theme: z.string(),
    atmosphere: z.string().optional(),
    floors: z.array(FloorSchema),
    connections: z.array(ConnectionSchema).default([]),
    entities: z.array(EntitySchema).default([]),
});

// === Type exports ===
export type PointInput = z.infer<typeof PointSchema>;
export type ZoneInput = z.infer<typeof ZoneSchema>;
export type SpaceInput = z.infer<typeof SpaceSchema>;
export type FloorInput = z.infer<typeof FloorSchema>;
export type ConnectionInput = z.infer<typeof ConnectionSchema>;
export type EntityInput = z.infer<typeof EntitySchema>;
export type DungeonMapInput = z.infer<typeof DungeonMapSchema>;
