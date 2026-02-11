"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { DungeonGraphSchema } from "@/schemas/graph";
import { layoutGraph } from "@/lib/generation/layoutEngine";
import { MODEL_IDS } from "@/lib/models";

// === System Prompt: Topology-Only Generation ===

const GRAPH_SYSTEM_PROMPT = `You are a master dungeon architect for tabletop RPGs.
Your task is to design the TOPOLOGY (rooms, connections, atmosphere) of a dungeon.

CRITICAL RULES:
1. You output a GRAPH — nodes (rooms/corridors) and edges (connections). NO coordinates.
2. Every node must be reachable from at least one other node (connected graph).
3. Corridors should connect rooms logically. Avoid isolated clusters.
4. Use "size" to indicate relative room size: small, medium, or large.
5. Include at least 1-2 entities (monsters, treasures, NPCs, furniture) per room.
6. Entity "roomId" must match a valid node "id".
7. Entity "placement" hints where to put it: center, corner, wall, or entrance.
8. descriptions and visualPrompts should be atmospheric and theme-appropriate.
9. The graph should tell a spatial story: entrance → challenges → climax → reward.`;

// === Main Generation Function ===

interface GenerateMapOptions {
    prompt: string;
    resolution?: "512x512" | "1024x1024" | "2048x2048";
    modelId?: string;
}

export async function generateMap({ prompt, resolution = "1024x1024", modelId }: GenerateMapOptions) {
    try {
        // --- Step 1: LLM generates abstract graph (no coordinates) ---

        const graphResult = await generateObject({
            model: google(modelId || MODEL_IDS.GEMINI_2_0_FLASH),
            schema: DungeonGraphSchema,
            system: GRAPH_SYSTEM_PROMPT,
            prompt: `Design a dungeon based on this description:

${prompt}

Requirements:
- Generate between 4 and 10 rooms/corridors.
- Include logical connections (doors, archways, secret passages).
- Add thematic entities (NPCs, monsters, treasures, interactive objects, furniture).
- Make it spatially interesting — branching paths, dead ends, hidden areas.`,
        });

        const graph = graphResult.object;

        // --- Step 2: Deterministic layout engine converts graph → geometry ---

        const dungeonMap = layoutGraph(graph);

        // Apply resolution override
        dungeonMap.meta.resolution = resolution;

        return {
            success: true,
            data: dungeonMap,
            graph, // expose graph for debugging
        };
    } catch (error) {
        console.error("[generateMap] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error generating map",
        };
    }
}
