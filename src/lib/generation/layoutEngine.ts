/**
 * Layout Engine — Block-Grid Pipeline
 *
 * Converts a BlockGrid (AI-generated abstract layout) into a concrete
 * DungeonMap with refined geometry, connections, and entities.
 *
 * Pipeline: Validate → Expand → Shape → Connect → Assemble
 */

import type { BlockGrid, Block, BlockExit } from "@/schemas/blockGrid";
import type { DungeonMap, Space, Connection, Entity, Point, Floor } from "@/types";
import { BLOCK_GRID, WORLD_BOUNDS, CORE_CONSTANTS } from "@/constants/core";
import {
    rectToPolygon,
    chamferRect,
    cutRectCorner,
    irregularCut,
    chaikinSubdivision,
    applyNoise,
    carveHoles,
    gridSnap,
    centroid,
    pointOnWall,
    generateLCorridor,
    type Rect,
    type Corner,
} from "./shapeGrammar";

// === Internal types ===

interface PlacedBlock extends Block {
    bounds: Rect;
    polygon: Point[];
    holes: Point[][];
}

interface ConnectionData {
    fromBlockId: string;
    toBlockId: string;
    fromPoint: Point;
    toPoint: Point;
    type: BlockExit["type"];
    state: BlockExit["state"];
}

export interface LayoutOptions {
    resolution?: string;
}

// === Main entry point ===

export function layoutBlockGrid(grid: BlockGrid, options?: LayoutOptions): DungeonMap {
    const validated = validateBlockGrid(grid);
    const placed = expandBlocks(validated);
    const shaped = applyShapeGrammar(placed);
    const { connections, corridors } = connectBlocks(shaped);
    return assembleDungeonMap(shaped, connections, corridors, validated, options);
}

// === Phase 0: Validate ===

function validateBlockGrid(grid: BlockGrid): BlockGrid {
    const { gridSize, blocks } = grid;

    if (blocks.length === 0) {
        throw new Error("[BlockGrid] No blocks provided");
    }

    const blockMap = new Map<string, Block>();
    for (const b of blocks) blockMap.set(b.id, b);

    const validatedBlocks: Block[] = blocks.map(block => {
        let { col, row, width, height, parentId } = block;
        const { exits } = block;

        // Clamp bounds
        if (col + width > gridSize) {
            width = gridSize - col;
            console.warn(`[Validate] Block "${block.id}" width clamped to ${width}`);
        }
        if (row + height > gridSize) {
            height = gridSize - row;
            console.warn(`[Validate] Block "${block.id}" height clamped to ${height}`);
        }
        if (col < 0) col = 0;
        if (row < 0) row = 0;

        // Validate parentId
        if (parentId) {
            const parent = blockMap.get(parentId);
            if (!parent || parent.role !== "container") {
                console.warn(`[Validate] Block "${block.id}" has invalid parentId "${parentId}", removing`);
                parentId = undefined;
            }
        }

        // Validate exits
        const validExits = exits.filter(exit => {
            if (!blockMap.has(exit.to)) {
                console.warn(`[Validate] Block "${block.id}" exit references unknown id "${exit.to}", removing`);
                return false;
            }
            return true;
        });

        // Ensure reciprocal exits
        for (const exit of validExits) {
            const target = blockMap.get(exit.to)!;
            const reciprocalSide = oppositeSide(exit.side);
            const hasReciprocal = target.exits.some(
                e => e.to === block.id && e.side === reciprocalSide
            );

            if (!hasReciprocal) {
                console.warn(
                    `[Validate] Adding reciprocal exit: "${exit.to}" → "${block.id}" on ${reciprocalSide}`
                );
                (target.exits as BlockExit[]).push({
                    side: reciprocalSide,
                    to: block.id,
                    type: exit.type,
                    state: exit.state,
                });
            }
        }

        // Warn orphans
        if (validExits.length === 0 && !parentId) {
            console.warn(`[Validate] Block "${block.id}" has no exits and no parent — orphan`);
        }

        return { ...block, col, row, width, height, exits: validExits, parentId };
    });

    // Detect overlaps (skip child → parent pairs)
    const grid2D: string[][] = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill("")
    );

    for (const block of validatedBlocks) {
        for (let r = block.row; r < block.row + block.height; r++) {
            for (let c = block.col; c < block.col + block.width; c++) {
                if (r >= gridSize || c >= gridSize) continue;
                const occupant = grid2D[r][c];
                if (occupant && occupant !== block.id) {
                    // Allow if one is child of the other
                    const isNested =
                        block.parentId === occupant ||
                        validatedBlocks.find(b => b.id === occupant)?.parentId === block.id;

                    if (!isNested) {
                        console.warn(
                            `[Validate] Overlap: "${block.id}" and "${occupant}" at cell (${c},${r})`
                        );
                    }
                }
                grid2D[r][c] = block.id;
            }
        }
    }

    return { ...grid, blocks: validatedBlocks };
}

// === Phase 1: Expand ===

function expandBlocks(grid: BlockGrid): PlacedBlock[] {
    const cellPx = Math.floor(
        (WORLD_BOUNDS.WIDTH - 2 * BLOCK_GRID.GRID_PADDING) / grid.gridSize
    );

    return grid.blocks.map(block => ({
        ...block,
        bounds: {
            x: BLOCK_GRID.GRID_PADDING + block.col * cellPx,
            y: BLOCK_GRID.GRID_PADDING + block.row * cellPx,
            w: block.width * cellPx,
            h: block.height * cellPx,
        },
        polygon: [],  // filled in Phase 2
        holes: [],    // filled in Phase 2
    }));
}

// === Phase 2: Apply Shape Grammar ===

function applyShapeGrammar(blocks: PlacedBlock[]): PlacedBlock[] {
    const blockMap = new Map<string, PlacedBlock>();
    for (const b of blocks) blockMap.set(b.id, b);

    // Process containers first, then everything else
    const containers = blocks.filter(b => b.role === "container");
    const others = blocks.filter(b => b.role !== "container");

    // Shape non-containers
    for (const block of others) {
        block.polygon = shapeForRole(block);
    }

    // Shape containers (with holes for children)
    for (const container of containers) {
        container.polygon = rectToPolygon(container.bounds);

        const children = blocks.filter(b => b.parentId === container.id);
        if (children.length > 0) {
            container.holes = carveHoles(
                children.map(c => c.bounds),
                4  // margin
            );
        }
    }

    // Apply organic refinement to all
    for (const block of blocks) {
        if (block.smoothing > 0) {
            const iterations = Math.max(1, Math.round(BLOCK_GRID.CHAIKIN_ITERATIONS * block.smoothing));
            block.polygon = chaikinSubdivision(block.polygon, iterations);

            // Also smooth holes
            block.holes = block.holes.map(hole =>
                chaikinSubdivision(hole, iterations)
            );
        }

        if (block.noiseAmount > 0) {
            const seed = simpleHashStr(block.id);
            block.polygon = applyNoise(
                block.polygon,
                block.noiseAmount,
                BLOCK_GRID.NOISE_FREQUENCY,
                seed,
            );
        }

        // Grid-snap everything
        block.polygon = gridSnap(block.polygon, CORE_CONSTANTS.GRID_SIZE);
        block.holes = block.holes.map(hole => gridSnap(hole, CORE_CONSTANTS.GRID_SIZE));
    }

    return blocks;
}

function shapeForRole(block: PlacedBlock): Point[] {
    switch (block.role) {
        case "hub":
            return chamferRect(block.bounds, BLOCK_GRID.CHAMFER_RATIO);

        case "climax":
            return chamferRect(block.bounds, BLOCK_GRID.CHAMFER_RATIO * 1.4);

        case "support": {
            // Cut the corner farthest from any exit
            const corner = farthestCorner(block);
            return cutRectCorner(block.bounds, corner, BLOCK_GRID.CUT_CORNER_RATIO);
        }

        case "secret":
            return irregularCut(block.bounds, simpleHashStr(block.id));

        case "entrance":
        case "corridor":
        case "open":
        case "container":
        default:
            return rectToPolygon(block.bounds);
    }
}

// === Phase 3: Connect ===

function connectBlocks(blocks: PlacedBlock[]): {
    connections: ConnectionData[];
    corridors: PlacedBlock[];
} {
    const blockMap = new Map<string, PlacedBlock>();
    for (const b of blocks) blockMap.set(b.id, b);

    const connections: ConnectionData[] = [];
    const corridors: PlacedBlock[] = [];
    const processedPairs = new Set<string>();

    for (const block of blocks) {
        for (const exit of block.exits) {
            const pairKey = [block.id, exit.to].sort().join("↔");
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            const target = blockMap.get(exit.to);
            if (!target) continue;

            const fromPoint = pointOnWall(block.polygon, exit.side);
            const reciprocal = target.exits.find(e => e.to === block.id);
            const toSide = reciprocal?.side || oppositeSide(exit.side);
            const toPoint = pointOnWall(target.polygon, toSide);

            const distance = Math.sqrt(
                (fromPoint.x - toPoint.x) ** 2 + (fromPoint.y - toPoint.y) ** 2
            );

            // Direct connection if blocks are close enough
            const cellPx = Math.floor(
                (WORLD_BOUNDS.WIDTH - 2 * BLOCK_GRID.GRID_PADDING) /
                (blocks[0]?.width > 0 ? 8 : 8) // fallback to 8
            );

            if (distance <= cellPx * 1.5) {
                connections.push({
                    fromBlockId: block.id,
                    toBlockId: exit.to,
                    fromPoint,
                    toPoint,
                    type: exit.type,
                    state: exit.state,
                });
            } else {
                // Generate auto-corridor
                connections.push({
                    fromBlockId: block.id,
                    toBlockId: exit.to,
                    fromPoint,
                    toPoint,
                    type: exit.type,
                    state: exit.state,
                });

                const lCorridor = generateLCorridor(fromPoint, toPoint, BLOCK_GRID.CORRIDOR_WIDTH_PX, true);

                const corridorId = `corridor-auto-${block.id}-${exit.to}`;
                corridors.push({
                    id: corridorId,
                    name: "Corridor",
                    type: "corridor",
                    role: "corridor",
                    col: 0, row: 0, width: 0, height: 0,
                    exits: [],
                    description: `Passage connecting ${block.name} to ${target.name}`,
                    lighting: "dim",
                    smoothing: 0,
                    noiseAmount: 0,
                    entities: [],
                    bounds: { x: 0, y: 0, w: 0, h: 0 },
                    polygon: lCorridor,
                    holes: [],
                });
            }
        }
    }

    return { connections, corridors };
}

// === Phase 4: Assemble ===

function assembleDungeonMap(
    blocks: PlacedBlock[],
    connections: ConnectionData[],
    corridors: PlacedBlock[],
    grid: BlockGrid,
    options?: LayoutOptions,
): DungeonMap {
    const dungeonId = crypto.randomUUID();
    const floorId = crypto.randomUUID();
    const now = new Date();

    // Build spaces from blocks
    const spaces: Space[] = [...blocks, ...corridors].map(block => ({
        id: block.id,
        floorId,
        name: block.name,
        description: block.description || "",
        visualPrompt: block.visualPrompt || "",
        geometry: {
            points: block.polygon,
            holes: block.holes.length > 0 ? block.holes : undefined,
        },
        zones: [],
        lighting: block.lighting || "dim",
        spaceType: block.type,
        floorType: block.floorType,
        smoothing: block.smoothing,
        noiseAmount: block.noiseAmount,
        parentId: block.parentId,
    }));

    // Build connections
    const mapConnections: Connection[] = connections.map(conn => ({
        id: crypto.randomUUID(),
        dungeonId,
        type: conn.type,
        from: {
            spaceId: conn.fromBlockId,
            position: conn.fromPoint,
        },
        to: {
            spaceId: conn.toBlockId,
            position: conn.toPoint,
        },
        state: conn.state,
    }));

    // Build entities
    const entities: Entity[] = [];
    for (const block of blocks) {
        for (const entity of block.entities) {
            const position = resolveEntityPosition(entity.position, block);

            entities.push({
                id: crypto.randomUUID(),
                dungeonId,
                type: entity.type,
                name: entity.name,
                description: entity.description || "",
                position,
                floorId,
                icon: entity.icon || "person",
            });
        }
    }

    // Build floor
    const floor: Floor = {
        id: floorId,
        dungeonId,
        level: 0,
        name: "Ground Floor",
        spaces,
        rendered: false,
    };

    // Resolve resolution
    const resolution = (options?.resolution || "1024x1024") as DungeonMap["meta"]["resolution"];

    return {
        meta: {
            id: dungeonId,
            name: grid.name,
            theme: grid.theme,
            atmosphere: grid.atmosphere,
            resolution,
            createdAt: now,
            updatedAt: now,
        },
        floors: [floor],
        connections: mapConnections,
        entities,
    };
}

// === Helpers ===

function oppositeSide(side: BlockExit["side"]): BlockExit["side"] {
    switch (side) {
        case "north": return "south";
        case "south": return "north";
        case "east": return "west";
        case "west": return "east";
    }
}

function farthestCorner(block: PlacedBlock): Corner {
    // Find the corner most distant from any exit
    const corners: { corner: Corner; x: number; y: number }[] = [
        { corner: "nw", x: block.bounds.x, y: block.bounds.y },
        { corner: "ne", x: block.bounds.x + block.bounds.w, y: block.bounds.y },
        { corner: "sw", x: block.bounds.x, y: block.bounds.y + block.bounds.h },
        { corner: "se", x: block.bounds.x + block.bounds.w, y: block.bounds.y + block.bounds.h },
    ];

    if (block.exits.length === 0) return "se";

    // Get exit positions
    const exitPoints = block.exits.map(e => pointOnWall(rectToPolygon(block.bounds), e.side));

    let maxDist = -1;
    let best: Corner = "se";

    for (const { corner, x, y } of corners) {
        let minDistToExit = Infinity;
        for (const ep of exitPoints) {
            const d = Math.sqrt((x - ep.x) ** 2 + (y - ep.y) ** 2);
            if (d < minDistToExit) minDistToExit = d;
        }
        if (minDistToExit > maxDist) {
            maxDist = minDistToExit;
            best = corner;
        }
    }

    return best;
}

function resolveEntityPosition(
    placement: "center" | "corner" | "wall" | "entrance",
    block: PlacedBlock,
): Point {
    switch (placement) {
        case "center":
            return centroid(block.polygon);

        case "corner": {
            // Pick the corner farthest from the first exit
            if (block.exits.length === 0) return centroid(block.polygon);
            const exitPt = pointOnWall(block.polygon, block.exits[0].side);
            let maxDist = -1;
            let best = block.polygon[0];
            for (const p of block.polygon) {
                const d = (p.x - exitPt.x) ** 2 + (p.y - exitPt.y) ** 2;
                if (d > maxDist) { maxDist = d; best = p; }
            }
            return best;
        }

        case "wall": {
            // Pick a wall point on a side without an exit
            const exitSides = new Set(block.exits.map(e => e.side));
            const sides: Array<"north" | "south" | "east" | "west"> = ["north", "south", "east", "west"];
            const freeSide = sides.find(s => !exitSides.has(s)) || "north";
            return pointOnWall(block.polygon, freeSide);
        }

        case "entrance": {
            if (block.exits.length === 0) return centroid(block.polygon);
            return pointOnWall(block.polygon, block.exits[0].side);
        }
    }
}

/** Hash a string to a number (for deterministic seed) */
function simpleHashStr(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}
