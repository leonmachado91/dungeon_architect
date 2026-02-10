"use server";

import { generateImage } from "ai";
import { google } from "@ai-sdk/google";
import { DEFAULT_MODELS } from "@/lib/models";
import debug from "@/lib/debug";

// === Types ===

interface RenderFloorOptions {
    prompt: string;
    skeletonBase64: string; // Grayscale skeleton PNG as base64
    renderModel?: string;
    width?: number;
    height?: number;
}

interface GenerateImageResult {
    success: boolean;
    imageUrl?: string;
    imageBase64?: string;
    error?: string;
}

// === Legacy function (kept for compatibility) ===

interface GenerateImageOptions {
    prompt: string;
    width?: number;
    height?: number;
    style?: "fantasy" | "realistic" | "painted";
}

const DUNGEON_STYLE_PROMPT = `Create a top-down dungeon map illustration in a fantasy RPG style.
The image should look like a hand-drawn or digitally painted map suitable for tabletop RPGs.
Include stone textures, wooden floors, torches, shadows, and atmospheric lighting.
The style should be rich and detailed, with warm medieval fantasy colors.
The perspective is strictly top-down (bird's eye view).`;

export async function generateDungeonImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const { prompt, style = "fantasy" } = options;

    const styleModifiers = {
        fantasy: "fantasy RPG art style, warm colors, torch lighting",
        realistic: "realistic textures, photorealistic lighting, detailed stonework",
        painted: "oil painting style, artistic brushstrokes, impressionist lighting"
    };

    const fullPrompt = `${DUNGEON_STYLE_PROMPT}

Map description: ${prompt}

Style: ${styleModifiers[style]}`;

    debug.log("[generateDungeonImage] Starting with prompt:", fullPrompt.slice(0, 200));

    try {
        const result = await generateImage({
            model: google.image(DEFAULT_MODELS.imagen_legacy),
            prompt: fullPrompt,
        });

        debug.log("[generateDungeonImage] Result received, images:", result.images?.length);

        if (result.images && result.images.length > 0) {
            const image = result.images[0];

            let base64Data: string;
            if (typeof image.base64 === 'string') {
                base64Data = image.base64;
            } else if (image.uint8Array) {
                base64Data = Buffer.from(image.uint8Array).toString('base64');
            } else {
                throw new Error("No image data in response");
            }

            const dataUrl = `data:image/png;base64,${base64Data}`;

            return {
                success: true,
                imageUrl: dataUrl,
                imageBase64: base64Data,
            };
        }

        return {
            success: false,
            error: "Nenhuma imagem gerada",
        };
    } catch (error) {
        console.error("[generateDungeonImage] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem",
        };
    }
}

// === New: Semantic Render with Skeleton Reference ===

/**
 * Render a floor using skeleton reference image + structured prompt
 * This is the enhanced pipeline from ROADMAP Phase 6.3-6.6
 * Uses native @google/genai SDK for Nano Banana models (Gemini multimodal)
 */
export async function renderFloorWithSkeleton({
    prompt,
    skeletonBase64,
    renderModel = DEFAULT_MODELS.render,
}: RenderFloorOptions): Promise<GenerateImageResult> {
    debug.log("[renderFloorWithSkeleton] Starting render");
    debug.log("[renderFloorWithSkeleton] Prompt length:", prompt.length);
    debug.log("[renderFloorWithSkeleton] Skeleton size:", Math.round(skeletonBase64.length / 1024), "KB");
    debug.log("[renderFloorWithSkeleton] Model:", renderModel);

    try {
        // Import Google GenAI SDK dynamically to avoid issues with server actions
        const { GoogleGenAI } = await import("@google/genai");

        // Initialize client with API key from environment
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set in environment");
        }

        const ai = new GoogleGenAI({ apiKey });

        debug.log("[renderFloorWithSkeleton] Using model:", renderModel);

        // Build multimodal content with text prompt + skeleton image
        const contents = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: "image/png",
                    data: skeletonBase64,
                },
            },
        ];

        // Generate content using Nano Banana model
        // CRITICAL: responseModalities must be set to enable image generation
        const response = await ai.models.generateContent({
            model: renderModel,
            contents: contents,
            config: {
                responseModalities: ["Text", "Image"],
            },
        });

        debug.log("[renderFloorWithSkeleton] Response received");

        // Extract image from response parts
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) {
            throw new Error("No parts in response");
        }

        for (const part of parts) {
            if (part.inlineData) {
                const imageBase64 = part.inlineData.data;
                if (imageBase64) {
                    const dataUrl = `data:image/png;base64,${imageBase64}`;
                    debug.log("[renderFloorWithSkeleton] Success! Image generated");
                    return {
                        success: true,
                        imageUrl: dataUrl,
                        imageBase64: imageBase64,
                    };
                }
            }
            // Also log any text response (Gemini may include explanatory text)
            if (part.text) {
                debug.log("[renderFloorWithSkeleton] Model text response:", part.text.substring(0, 200));
            }
        }

        return {
            success: false,
            error: "Nenhuma imagem gerada - response não continha inlineData",
        };
    } catch (error) {
        console.error("[renderFloorWithSkeleton] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem",
        };
    }
}

// === Legacy: Simple render (without skeleton) ===

export async function renderFloor(floorId: string, spaces: unknown[]): Promise<GenerateImageResult> {
    debug.log("[renderFloor] Legacy render for floor:", floorId);
    debug.warn("[renderFloor] This function is deprecated. Use renderFloorWithSkeleton instead.");

    const spaceDescriptions = Array.isArray(spaces)
        ? spaces.map((s: unknown) => {
            const space = s as { name?: string; spaceType?: string; description?: string };
            return `${space.spaceType || 'room'}: ${space.name || 'unnamed'}`;
        }).join(", ")
        : "empty floor";

    const prompt = `A dungeon floor with the following spaces: ${spaceDescriptions}. 
The layout should show connected rooms and corridors with stone walls and wooden/stone floors.
Include torches, shadows, and atmospheric medieval dungeon lighting.`;

    return generateDungeonImage({ prompt, style: "fantasy" });
}
