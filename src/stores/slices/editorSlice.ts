import { MapSlice, EditorSlice } from "../store-types";
import type { Point, EditorTool } from "@/types";

const initialState = {
    currentFloorId: null as string | null,
    selectedSpaceId: null as string | null,
    selectedEntityId: null as string | null,
    zoom: 1,
    pan: { x: 0, y: 0 } as Point,
    tool: "select" as EditorTool,
    isGenerating: false,
    isRendering: false,
    isSaving: false,
    isDirty: false,
    exportCanvas: null as (() => void) | null,
};

export const createEditorSlice: MapSlice<EditorSlice> = (set) => ({
    ...initialState,

    setCurrentFloor: (floorId: string | null) => set((state) => {
        state.currentFloorId = floorId;
        state.selectedSpaceId = null;
        state.selectedEntityId = null;
    }),

    selectSpace: (spaceId: string | null) => set((state) => {
        state.selectedSpaceId = spaceId;
        state.selectedEntityId = null;
    }),

    selectEntity: (entityId: string | null) => set((state) => {
        state.selectedEntityId = entityId;
        state.selectedSpaceId = null;
    }),

    setZoom: (zoom: number) => set((state) => {
        state.zoom = Math.max(0.25, Math.min(4, zoom));
    }),

    setPan: (pan: Point) => set((state) => {
        state.pan = pan;
    }),

    setTool: (tool: EditorTool) => set((state) => {
        state.tool = tool;
    }),

    setGenerating: (isGenerating: boolean) => set((state) => {
        state.isGenerating = isGenerating;
    }),

    setRendering: (isRendering: boolean) => set((state) => {
        state.isRendering = isRendering;
    }),

    setSaving: (isSaving: boolean) => set((state) => {
        state.isSaving = isSaving;
    }),

    markClean: () => set((state) => {
        state.isDirty = false;
    }),

    setExportHandler: (handler: (() => void) | null) => set((state) => {
        state.exportCanvas = handler;
    }),

    reset: () => set({ ...initialState, dungeon: null }),
});
