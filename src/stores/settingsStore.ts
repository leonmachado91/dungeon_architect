"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// === Model Options ===
import {
    MODEL_IDS,
    STRUCTURE_MODELS,
    RENDER_MODELS,
    DEFAULT_MODELS,
    type StructureModelId,
    type RenderModelId
} from "@/lib/models";

// Re-export for compatibility if needed (optional)
export { MODEL_IDS, DEFAULT_MODELS };

interface SettingsState {
    // AI Models
    structureModel: StructureModelId;
    renderModel: RenderModelId;

    // Actions
    setStructureModel: (model: StructureModelId) => void;
    setRenderModel: (model: RenderModelId) => void;

    // Debug
    debugFit: boolean;
    setDebugFit: (enabled: boolean) => void;
    debugPlaceholder: boolean;
    setDebugPlaceholder: (enabled: boolean) => void;
}

// === Store ===

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Defaults - using centralized DEFAULT_MODELS
            structureModel: DEFAULT_MODELS.structure,
            renderModel: DEFAULT_MODELS.render,

            // Actions
            setStructureModel: (model) => set({ structureModel: model }),
            setRenderModel: (model) => set({ renderModel: model }),

            // Debug defaults
            debugFit: false,
            setDebugFit: (enabled) => set({ debugFit: enabled }),
            debugPlaceholder: false,
            setDebugPlaceholder: (enabled) => set({ debugPlaceholder: enabled }),
        }),
        {
            name: "dungeon-architect-settings",
        }
    )
);
