import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import { createDungeonSlice } from "./slices/dungeonSlice";
import { createEditorSlice } from "./slices/editorSlice";
import { MapStore } from "./store-types";

// Create the combined store
export const useMapStore = create<MapStore>()(
    temporal(
        immer((...a) => ({
            ...createDungeonSlice(...a),
            ...createEditorSlice(...a),
        })),
        {
            // Only track changes to the 'dungeon' field for undo/redo
            partialize: (state) => ({ dungeon: state.dungeon }),
            limit: 50, // Limit history size
        }
    )
);

// Optional: Selectors for performance (best practice is to export these or let components define them)
export const useDungeon = () => useMapStore((state) => state.dungeon);
export const useCurrentFloorId = () => useMapStore((state) => state.currentFloorId);

// Computed hooks to get current objects based on IDs
export const useCurrentFloor = () => {
    const dungeon = useMapStore((state) => state.dungeon);
    const currentFloorId = useMapStore((state) => state.currentFloorId);
    return dungeon?.floors.find((f) => f.id === currentFloorId) || null;
};

export const useFloorSpaces = () => {
    const currentFloor = useCurrentFloor();
    return currentFloor?.spaces || [];
};

export const useFloorEntities = () => {
    const dungeon = useMapStore((state) => state.dungeon);
    const currentFloorId = useMapStore((state) => state.currentFloorId);
    return dungeon?.entities?.filter(e => e.floorId === currentFloorId) || [];
};

// Re-export types
export type { MapStore };
