import { z } from "zod";

// === Exit Schema ===

export const BlockExitSchema = z.object({
    side: z.enum(["north", "south", "east", "west"]),
    to: z.string().describe("Target block id"),
    type: z.enum(["door", "archway", "secret", "stairs", "ladder", "window"]),
    state: z.enum(["open", "closed", "locked", "hidden"]).optional(),
});

// === Entity Schema ===

export const BlockEntitySchema = z.object({
    type: z.enum([
        "npc", "monster", "treasure", "hazard",
        "interactive", "furniture", "wall_feature",
    ]),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    position: z.enum(["center", "corner", "wall", "entrance"]).optional(),
});

// === Block Schema ===
// Kept flat and simple to maximize Gemini compatibility.
// Defaults are applied post-parse in applyBlockDefaults().

export const BlockSchema = z.object({
    id: z.string().describe("Unique slug, e.g. 'main-hall', 'corridor-1'"),
    name: z.string().describe("Display name"),
    type: z.enum(["room", "corridor", "stairs", "outdoor"]),
    role: z.enum([
        "entrance", "hub", "support", "secret",
        "climax", "corridor", "open", "container",
    ]),
    col: z.number().describe("Column position (0-indexed)"),
    row: z.number().describe("Row position (0-indexed)"),
    width: z.number().describe("Width in grid cells (1-6)"),
    height: z.number().describe("Height in grid cells (1-6)"),
    exits: z.array(BlockExitSchema),
    description: z.string().optional().describe("Atmospheric description of this location — mood, senses, notable features"),
    visualPrompt: z.string().optional(),
    lighting: z.enum(["dark", "dim", "bright", "magical"]).optional(),
    floorType: z.string().optional(),
    smoothing: z.number().optional().describe(
        "0=angular/geometric, 1=fully curved. Use 0.7-1.0 for caves, 0 for built rooms"
    ),
    noiseAmount: z.number().optional().describe(
        "Wall irregularity. 0=smooth, 0.5=rough stone, 0.8=natural cave walls"
    ),
    parentId: z.string().optional(),
    entities: z.array(BlockEntitySchema).optional(),
});

// === Top-level Grid ===

export const BlockGridSchema = z.object({
    name: z.string().describe("Dungeon/location name"),
    theme: z.string().describe("e.g. 'Ancient Temple', 'Dark Forest', 'Underground Prison'"),
    atmosphere: z.string().describe("e.g. 'Damp and cold, echoing drips'"),
    gridSize: z.number().describe("Grid dimension (NxN), should match the requested size"),
    blocks: z.array(BlockSchema).describe(
        "All blocks placed on the grid. NO overlapping blocks."
    ),
});

// === Post-parse defaults ===

// Types defined explicitly to avoid circular ReturnType references
type RawBlockGrid = z.infer<typeof BlockGridSchema>;

export interface BlockExit {
    side: "north" | "south" | "east" | "west";
    to: string;
    type: "door" | "archway" | "secret" | "stairs" | "ladder" | "window";
    state: "open" | "closed" | "locked" | "hidden";
}

export interface BlockEntity {
    type: "npc" | "monster" | "treasure" | "hazard" | "interactive" | "furniture" | "wall_feature";
    name: string;
    description?: string;
    icon: string;
    position: "center" | "corner" | "wall" | "entrance";
}

export interface Block {
    id: string;
    name: string;
    type: "room" | "corridor" | "stairs" | "outdoor";
    role: "entrance" | "hub" | "support" | "secret" | "climax" | "corridor" | "open" | "container";
    col: number;
    row: number;
    width: number;
    height: number;
    exits: BlockExit[];
    description: string; // Defaulted to empty string if missing (Phase 1 may omit)
    visualPrompt?: string;
    lighting: "dark" | "dim" | "bright" | "magical";
    floorType?: string;
    smoothing: number;
    noiseAmount: number;
    parentId?: string;
    entities: BlockEntity[];
}

export interface BlockGrid {
    name: string;
    theme: string;
    atmosphere: string;
    gridSize: number;
    blocks: Block[];
}

export function applyBlockDefaults(grid: RawBlockGrid): BlockGrid {
    return {
        ...grid,
        gridSize: Math.max(6, Math.min(12, Math.round(grid.gridSize))),
        blocks: grid.blocks.map(block => ({
            ...block,
            col: Math.max(0, Math.round(block.col)),
            row: Math.max(0, Math.round(block.row)),
            width: Math.max(1, Math.min(6, Math.round(block.width))),
            height: Math.max(1, Math.min(6, Math.round(block.height))),
            description: block.description || "",
            lighting: block.lighting || "dim" as const,
            smoothing: clamp01(block.smoothing ?? 0),
            noiseAmount: clamp01(block.noiseAmount ?? 0),
            entities: (block.entities || []).map(e => ({
                ...e,
                icon: e.icon || "person",
                position: e.position || "center" as const,
            })),
            exits: block.exits.map(e => ({
                ...e,
                state: e.state || "closed" as const,
            })),
        })),
    };
}

function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

