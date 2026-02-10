export const MODEL_IDS = {
    // Structure Models
    GEMINI_3_PRO_PREVIEW: "gemini-3-pro-preview",
    GEMINI_3_FLASH_PREVIEW: "gemini-3-flash-preview",
    GEMINI_2_5_PRO: "gemini-2.5-pro",
    GEMINI_FLASH_LATEST: "gemini-flash-latest",
    GEMINI_2_0_FLASH: "gemini-2.0-flash",

    // Render Models
    GEMINI_2_5_FLASH_IMAGE: "gemini-2.5-flash-image",
    GEMINI_3_PRO_IMAGE_PREVIEW: "gemini-3-pro-image-preview",

    // Legacy Models
    IMAGEN_LEGACY: "imagen-4.0-generate-001",
} as const;

export const STRUCTURE_MODELS = [
    { id: MODEL_IDS.GEMINI_3_PRO_PREVIEW, label: "Gemini 3 Pro Preview" },
    { id: MODEL_IDS.GEMINI_3_FLASH_PREVIEW, label: "Gemini 3 Flash Preview" },
    { id: MODEL_IDS.GEMINI_2_5_PRO, label: "Gemini 2.5 Pro" },
    { id: MODEL_IDS.GEMINI_FLASH_LATEST, label: "Gemini Flash (Latest)" },
] as const;

export const RENDER_MODELS = [
    { id: MODEL_IDS.GEMINI_2_5_FLASH_IMAGE, label: "Nano Banana (Gemini 2.5 Flash)" },
    { id: MODEL_IDS.GEMINI_3_PRO_IMAGE_PREVIEW, label: "Nano Banana Pro (Gemini 3 Pro)" },
] as const;

// === Default Model IDs ===
export const DEFAULT_MODELS = {
    structure: MODEL_IDS.GEMINI_2_5_PRO,
    render: MODEL_IDS.GEMINI_2_5_FLASH_IMAGE,
    // Legacy Imagen model for simple image generation (not controlnet-style)
    imagen_legacy: MODEL_IDS.IMAGEN_LEGACY,
} as const;

// === Types ===

export type StructureModelId = typeof STRUCTURE_MODELS[number]["id"];
export type RenderModelId = typeof RENDER_MODELS[number]["id"];
