import { z } from "zod";

// === Graph Node Schema (Room/Corridor — NO coordinates) ===

export const GraphNodeSchema = z.object({
    id: z.string().describe("Unique id, e.g. 'room-1', 'corridor-2'"),
    name: z.string().describe("Descriptive name, e.g. 'Guard Room', 'Main Hall'"),
    type: z.enum(["room", "corridor", "stairs", "outdoor"]),
    size: z.enum(["small", "medium", "large"]).describe(
        "Relative size: small=100-150px, medium=150-250px, large=250-400px"
    ),
    description: z.string().describe("Short atmospheric description"),
    visualPrompt: z.string().describe(
        "What this space looks like (e.g. 'stone floor with torch sconces')"
    ),
    lighting: z.enum(["dark", "dim", "bright", "magical"]).default("dim"),
    floorType: z.string().optional().describe("e.g. 'stone', 'wood', 'dirt', 'water'"),
});

// === Graph Edge Schema (Connection between nodes) ===

export const GraphEdgeSchema = z.object({
    from: z.string().describe("Source node id"),
    to: z.string().describe("Target node id"),
    type: z.enum(["door", "archway", "secret", "window", "stairs", "ladder", "rope", "portal"]),
    state: z.enum(["open", "closed", "locked", "hidden"]).default("closed"),
    material: z.string().optional().describe("e.g. 'iron', 'wood', 'stone'"),
});

// === Graph Entity Schema (Items/NPCs to place) ===

export const GraphEntitySchema = z.object({
    id: z.string().describe("Unique id, e.g. 'entity-1'"),
    type: z.enum(["npc", "monster", "treasure", "hazard", "interactive", "furniture", "wall_feature"]),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().default("person").describe(
        "Icon name: person, skull, gem, flame, star, box, chair, bookshelf"
    ),
    roomId: z.string().describe("Which room this entity belongs in"),
    placement: z.enum(["center", "corner", "wall", "entrance"]).default("center")
        .describe("Relative placement hint inside the room"),
});

// === Full Dungeon Graph Schema (what the LLM produces) ===

export const DungeonGraphSchema = z.object({
    name: z.string().describe("Dungeon name"),
    theme: z.string().describe("e.g. 'Ancient Temple', 'Underground Prison'"),
    atmosphere: z.string().describe("e.g. 'Damp and foreboding', 'Mystical glow'"),
    nodes: z.array(GraphNodeSchema).min(3).max(12).describe(
        "All rooms and corridors. Must have at least 3 nodes."
    ),
    edges: z.array(GraphEdgeSchema).min(2).describe(
        "Connections between nodes. Every node must be reachable."
    ),
    entities: z.array(GraphEntitySchema).default([]).describe(
        "NPCs, monsters, treasures, furniture to place inside rooms"
    ),
});

// === Type exports ===

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type GraphEntity = z.infer<typeof GraphEntitySchema>;
export type DungeonGraph = z.infer<typeof DungeonGraphSchema>;
