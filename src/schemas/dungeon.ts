import { z } from "zod";

// === Base Schemas ===

export const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export const PolygonSchema = z.object({
    points: z.array(PointSchema),
    holes: z.array(z.array(PointSchema)).optional(),
});

// === Zone Schema ===

export const ZoneSchema = z.object({
    id: z.string(),
    spaceId: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    visualPrompt: z.string().optional(),
    area: PolygonSchema.optional(),
});

// === Space Schema ===

export const SpaceSchema = z.object({
    id: z.string(),
    floorId: z.string(),
    name: z.string(),
    description: z.string().default(""),
    visualPrompt: z.string().default(""),
    geometry: PolygonSchema,
    zones: z.array(ZoneSchema).default([]),
    lighting: z.enum(["dark", "dim", "bright", "magical"]).default("dim"),
    spaceType: z.enum(["room", "corridor", "stairs", "outdoor"]),
    floorType: z.string().optional(),
    staticObjects: z.string().optional(),
    coverImage: z.string().optional(),
    notes: z.string().optional(),
});

// === Floor Schema ===

export const FloorSchema = z.object({
    id: z.string(),
    dungeonId: z.string(),
    level: z.number(),
    name: z.string(),
    spaces: z.array(SpaceSchema),
    rendered: z.boolean().default(false),
    renderUrl: z.string().optional(),
});

// === Connection Schema ===

export const ConnectionSchema = z.object({
    id: z.string(),
    dungeonId: z.string(),
    type: z.enum(["door", "archway", "secret", "window", "stairs", "ladder", "rope", "portal"]),
    from: z.object({
        spaceId: z.string(),
        position: PointSchema,
    }),
    to: z.object({
        spaceId: z.string(),
        position: PointSchema,
    }),
    state: z.enum(["open", "closed", "locked", "hidden"]).default("closed"),
    material: z.string().optional(),
});

// === Entity Schema ===

export const EntitySchema = z.object({
    id: z.string(),
    dungeonId: z.string(),
    type: z.enum([
        "npc", "monster", "treasure", "hazard", "interactive",
        "door", "window", "stairs", "furniture", "wall_feature",
    ]),
    name: z.string(),
    description: z.string().default(""),
    floorId: z.string(),
    position: PointSchema,
    icon: z.string().default("person"),
    interactionScript: z.string().optional(),
    coverImage: z.string().optional(),
    properties: z.record(z.string(), z.string()).optional(),
    linkedFloorId: z.string().optional(),
    rotation: z.number().optional(),
    subtype: z.string().optional(),
});

// === DungeonMap Schema ===

export const DungeonMapSchema = z.object({
    meta: z.object({
        id: z.string(),
        name: z.string(),
        theme: z.string(),
        atmosphere: z.string().default(""),
        resolution: z.enum(["512x512", "1024x1024", "2048x2048"]).default("1024x1024"),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
    }),
    floors: z.array(FloorSchema),
    connections: z.array(ConnectionSchema).default([]),
    entities: z.array(EntitySchema).default([]),
});

// === Type exports (inferred from Zod) ===

export type PointInput = z.infer<typeof PointSchema>;
export type PolygonInput = z.infer<typeof PolygonSchema>;
export type ZoneInput = z.infer<typeof ZoneSchema>;
export type SpaceInput = z.infer<typeof SpaceSchema>;
export type FloorInput = z.infer<typeof FloorSchema>;
export type ConnectionInput = z.infer<typeof ConnectionSchema>;
export type EntityInput = z.infer<typeof EntitySchema>;
export type DungeonMapInput = z.infer<typeof DungeonMapSchema>;
