import { StateCreator } from "zustand";
import type {
    DungeonMap, Floor, Space, Entity, Connection, EditorTool, Point
} from "@/types";

export interface DungeonSlice {
    dungeon: DungeonMap | null;

    setDungeon: (dungeon: DungeonMap | null) => void;
    createEmptyDungeon: (name?: string) => void;
    updateDungeonMeta: (updates: Partial<DungeonMap["meta"]>) => void;

    addFloor: (floor: Floor) => void;
    updateFloor: (floorId: string, updates: Partial<Floor>) => void;
    removeFloor: (floorId: string) => void;

    addSpace: (space: Space) => void;
    updateSpace: (spaceId: string, updates: Partial<Space>) => void;
    removeSpace: (spaceId: string) => void;
    mergeSpaces: (spaceIds: string[]) => void;
    duplicateSpace: (spaceId: string) => void;

    addEntity: (entity: Entity) => void;
    updateEntity: (entityId: string, updates: Partial<Entity>) => void;
    removeEntity: (entityId: string) => void;
    duplicateEntity: (entityId: string) => void;

    addConnection: (connection: Connection) => void;
    removeConnection: (connectionId: string) => void;
}

export interface EditorSlice {
    currentFloorId: string | null;
    selectedSpaceId: string | null;
    selectedEntityId: string | null;
    zoom: number;
    pan: Point;
    tool: EditorTool;
    isGenerating: boolean;
    isRendering: boolean;
    isSaving: boolean;
    isDirty: boolean;
    exportCanvas: (() => void) | null;

    setCurrentFloor: (floorId: string | null) => void;
    selectSpace: (spaceId: string | null) => void;
    selectEntity: (entityId: string | null) => void;
    setZoom: (zoom: number) => void;
    setPan: (pan: Point) => void;
    setTool: (tool: EditorTool) => void;
    setGenerating: (isGenerating: boolean) => void;
    setRendering: (isRendering: boolean) => void;
    setSaving: (isSaving: boolean) => void;
    markClean: () => void;
    setExportHandler: (handler: (() => void) | null) => void;
    reset: () => void;
}

export type MapStore = DungeonSlice & EditorSlice;

export type MapSlice<T> = StateCreator<
    MapStore,
    [["zustand/immer", never]],
    [],
    T
>;
