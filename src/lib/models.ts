export const MODEL_IDS = {
    // Structure Models (Free Tier available: 2.5 Pro, 2.5 Flash, 2.5 Flash-Lite)
    GEMINI_3_PRO_PREVIEW: "gemini-3-pro-preview",
    GEMINI_3_FLASH_PREVIEW: "gemini-3-flash-preview",
    GEMINI_2_5_PRO: "gemini-2.5-pro",
    GEMINI_2_5_FLASH: "gemini-2.5-flash",
    GEMINI_2_5_FLASH_LITE: "gemini-2.5-flash-lite",

    // Render Models
    GEMINI_2_5_FLASH_IMAGE: "gemini-2.5-flash-image",
    GEMINI_3_PRO_IMAGE_PREVIEW: "gemini-3-pro-image-preview",

    // Legacy Models
    IMAGEN_LEGACY: "imagen-4.0-generate-001",
} as const;

export const STRUCTURE_MODELS = [
    { id: MODEL_IDS.GEMINI_2_5_FLASH, label: "Gemini 2.5 Flash (Recomendado)" },
    { id: MODEL_IDS.GEMINI_2_5_FLASH_LITE, label: "Gemini 2.5 Flash Lite (Mais rápido)" },
    { id: MODEL_IDS.GEMINI_2_5_PRO, label: "Gemini 2.5 Pro (Mais preciso)" },
    { id: MODEL_IDS.GEMINI_3_PRO_PREVIEW, label: "Gemini 3 Pro Preview (Pago)" },
    { id: MODEL_IDS.GEMINI_3_FLASH_PREVIEW, label: "Gemini 3 Flash Preview (Pago)" },
] as const;

export const RENDER_MODELS = [
    { id: MODEL_IDS.GEMINI_2_5_FLASH_IMAGE, label: "Nano Banana (Gemini 2.5 Flash)" },
    { id: MODEL_IDS.GEMINI_3_PRO_IMAGE_PREVIEW, label: "Nano Banana Pro (Gemini 3 Pro)" },
] as const;

// === Default Model IDs ===
export const DEFAULT_MODELS = {
    // gemini-2.5-flash: 10 RPM, 250 RPD on free tier (best balance)
    structure: MODEL_IDS.GEMINI_2_5_FLASH,
    render: MODEL_IDS.GEMINI_2_5_FLASH_IMAGE,
    // Legacy Imagen model for simple image generation (not controlnet-style)
    imagen_legacy: MODEL_IDS.IMAGEN_LEGACY,
} as const;

// === Types ===

export type StructureModelId = typeof STRUCTURE_MODELS[number]["id"];
export type RenderModelId = typeof RENDER_MODELS[number]["id"];
