/**
 * Prompt Builder for Nanobanana AI Rendering
 *
 * Generates structured prompts for image generation
 * based on ROADMAP_POS_MVP.md Phase 6.6 template
 */

import type { DungeonMap, Floor } from "@/types";

// === Prompt Template ===

interface PromptBuildOptions {
    dungeon: DungeonMap;
    floor: Floor;
}

/**
 * Build the AI prompt for rendering a floor
 * Based on the optimized template from ROADMAP 6.6
 */
export function buildRenderPrompt({
    dungeon,
    floor,
}: PromptBuildOptions): string {
    // Build areas section
    const areasSection = floor.spaces
        .map((space) => {
            const lines = [
                `- ${space.name} (${space.spaceType}): ${space.visualPrompt || space.description || "A dungeon space"}`,
                `  Floor: ${space.floorType || "stone"} | Lighting: ${space.lighting}`,
            ];
            if (space.staticObjects) {
                lines.push(`  Contains: ${space.staticObjects}`);
            }
            return lines.join("\n");
        })
        .join("\n");

    // Build entity positions for layout key

    // Full prompt using simplified structure for better adherence
    // Full prompt using simplified structure for better adherence
    const prompt = `You are an architectural renderer.
Task: Generate a highly detailed top-down floor plan using the provided input image as a strict MASK MAP.

Input Mask Definitions (Hex Codes + Textures):
- #000000 (Black): Empty void / Outside — flat solid black
- #333333 (Dark Gray) with diagonal hatch lines: Solid Walls — hatched pattern indicates structural mass
- #FFFFFF (White) with subtle dot grid: Walkable Floor Space — dot pattern indicates open area
- #666666 (Medium Gray): Doors/Connections — flat gray rectangles between rooms
- #999999 (Light Gray): Windows — flat gray on wall edges

Strict Constraints:
1. Perspective: Top-down only (plan view).
2. Layout Adherence: You must follow the input MASK MAP EXACTLY. The hex codes above define the exact structure. Do not add any new rooms, corridors, or structures that are not present in the mask.
3. Content: No characters, no creatures, no text overlays.

Context:
Theme: ${dungeon.meta.theme}
Atmosphere: ${dungeon.meta.atmosphere}

Areas to render (texture details):
${areasSection}`;

    return prompt;
}

// === Utility Functions ===

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
}

// === Prompt Variations ===

export const STYLE_PRESETS = {
    classic: `Painterly fantasy illustration, muted earth tones with warm torchlight accents.
Detailed stone and wood textures. Hand-drawn aesthetic.
Clear visual distinction between walkable areas and obstacles.`,

    gritty: `Dark and atmospheric illustration with heavy shadows.
Worn stone textures, weathered wood, rusted metal.
Subtle color palette dominated by grays and browns.
Torchlight creates dramatic contrast.`,

    vibrant: `Rich and colorful fantasy illustration.
Saturated colors, magical lighting effects.
Detailed textures with visible brushstrokes.
Epic fantasy aesthetic.`,

    minimalist: `Clean, simplified dungeon map style.
Clear outlines, flat colors, minimal texture.
High contrast between spaces.
Board game aesthetic.`,

    realistic: `Photorealistic rendering of dungeon interior.
Detailed materials: rough stone, aged wood, tarnished metal.
Realistic lighting and shadows.
Architectural accuracy.`,
} as const;

export type StylePreset = keyof typeof STYLE_PRESETS;

/**
 * Build prompt with a specific style preset
 */
export function buildPromptWithStyle(
    options: PromptBuildOptions,
    style: StylePreset
): string {
    const basePrompt = buildRenderPrompt(options);
    const styleSection = STYLE_PRESETS[style];

    // Append style section to the prompt
    return `${basePrompt}\n\nVisual Style:\n${styleSection}`;
}
