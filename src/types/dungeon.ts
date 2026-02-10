/**
 * Dungeon Architect - Type Definitions
 * Based on DATA_MODELS.md specification
 */

// === Base Types ===

export interface Point {
    x: number;
    y: number;
}

export interface Polygon {
    points: Point[];
    /** 
     * Holes are defined as arrays of points. 
     * The points should differ in winding order (counter-clockwise) from the outer shell (clockwise), 
     * but most rendering/geometry libraries handle this if defined as holes.
     */
    holes?: Point[][];
}

export type Resolution = "512x512" | "1024x1024" | "2048x2048";

// === Main Schema ===

export interface DungeonMap {
    meta: MapMeta;
    floors: Floor[];
    connections: Connection[];
    entities: Entity[];
}

export interface MapMeta {
    id: string;
    name: string;
    theme: string;
    atmosphere: string;
    resolution: Resolution;
    createdAt: Date;
    updatedAt: Date;
}

// === Floors ===

export interface Floor {
    id: string;
    dungeonId: string;
    level: number;
    name: string;
    spaces: Space[];
    rendered: boolean;
    renderUrl?: string;
}

// === Spaces ===

export type SpaceType = "room" | "corridor" | "stairs" | "outdoor";
export type Lighting = "dark" | "dim" | "bright" | "magical";

export interface Space {
    id: string;
    floorId: string;
    name: string;
    description: string;
    visualPrompt: string;
    geometry: Polygon;
    zones: Zone[];
    lighting: Lighting;
    spaceType: SpaceType;
    floorType?: string;
    // Inspector Panel fields
    staticObjects?: string;
    coverImage?: string;
    notes?: string;
}

export interface Zone {
    id: string;
    spaceId: string;
    name: string;
    description: string;
    visualPrompt: string;
    area: Polygon;
}

// === Connections ===

export type ConnectionType =
    | "door"
    | "archway"
    | "secret"
    | "window"
    | "stairs"
    | "ladder"
    | "rope"
    | "portal";

export type ConnectionState = "open" | "closed" | "locked" | "hidden";

export interface Connection {
    id: string;
    dungeonId: string;
    type: ConnectionType;
    from: {
        spaceId: string;
        position: Point;
    };
    to: {
        spaceId: string;
        position: Point;
    };
    state?: ConnectionState;
    material?: string;
}

// === Entities ===

export type EntityType =
    | "npc"
    | "monster"
    | "treasure"
    | "hazard"
    | "interactive"
    | "door"
    | "window"
    | "stairs"
    | "furniture"
    | "wall_feature";

export interface Entity {
    id: string;
    dungeonId: string;
    type: EntityType;
    name: string;
    description: string;
    position: Point;
    floorId: string;
    icon: string;
    interactionScript?: string;
    // Inspector Panel fields
    coverImage?: string;
    properties?: Record<string, string>;
    linkedFloorId?: string;
    rotation?: number;
    subtype?: string;
}

// === Editor State ===

export type EditorTool = "select" | "draw" | "entity" | "pan" | "polygon";

export interface EditorState {
    currentDungeonId: string | null;
    currentFloorId: string | null;
    selectedSpaceId: string | null;
    selectedEntityId: string | null;
    zoom: number;
    pan: Point;
    tool: EditorTool;
    isGenerating: boolean;
    isRendering: boolean;
}
