export const CORE_CONSTANTS = {
    GRID_SIZE: 40,
    CANVAS_BASE_WIDTH: 1024,
    CANVAS_BASE_HEIGHT: 1024,
    MIN_ZOOM: 0.25,
    MAX_ZOOM: 4,
} as const;

/**
 * World Bounds - Global limits for the map canvas (Bug #10)
 * All elements should stay within these bounds for proper AI/export alignment
 */
export const WORLD_BOUNDS = {
    MIN_X: 0,
    MIN_Y: 0,
    MAX_X: 1024,
    MAX_Y: 1024,
    WIDTH: 1024,
    HEIGHT: 1024,
} as const;

/**
 * Render constants - For AI generation and skeleton alignment (Bug #7/#8)
 */
export const RENDER_CONSTANTS = {
    SKELETON_SIZE: 1024,      // Fixed size for skeleton canvas
    AI_CANVAS_SIZE: 1024,     // AI expects this exact size
    GRID_CELL_SIZE: 40,       // Grid cell in world units
    SKELETON_GRID_SIZE: 100,  // Grid cell in skeleton render (scaled)
} as const;

export const COLORS = {
    GRUVBOX: {
        BG_HARD: "#1d2021",
        BG: "#282828",
        BG_SOFT: "#32302f",
        FG: "#ebdbb2",
        FG_ALT: "#a89984",
        GRAY: "#928374",
        RED: "#cc241d",
        RED_LIGHT: "#fb4934",
        GREEN: "#98971a",
        GREEN_LIGHT: "#b8bb26",
        YELLOW: "#d79921",
        YELLOW_LIGHT: "#fabd2f",
        BLUE: "#458588",
        BLUE_LIGHT: "#83a598",
        PURPLE: "#b16286",
        PURPLE_LIGHT: "#d3869b",
        AQUA: "#689d6a",
        AQUA_LIGHT: "#8ec07c",
        ORANGE: "#d65d0e",
        ORANGE_LIGHT: "#fe8019",
    },
    // Semantic mappings
    SPACES: {
        ROOM: "#458588",      // Blue
        CORRIDOR: "#689d6a",  // Aqua
        STAIRS: "#d79921",    // Yellow
        OUTDOOR: "#98971a",   // Green
    },
    ENTITIES: {
        NPC: "#83a598",       // Blue Light
        MONSTER: "#fb4934",   // Red Light
        TREASURE: "#fabd2f",  // Yellow Light
        HAZARD: "#fe8019",    // Orange Light
        INTERACTIVE: "#d3869b", // Purple Light
        FURNITURE: "#a89984", // Fg Alt
    },
    UI: {
        SELECTION: "#fabd2f", // Yellow Light
        GRID_LINES: "rgba(235, 219, 178, 0.15)",
        DRAW_PREVIEW_FILL: "rgba(204, 36, 29, 0.2)",
        DRAW_PREVIEW_STROKE: "#CC241D",
    }
} as const;
