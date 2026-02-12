/**
 * Layout Engine — Converts a DungeonGraph (abstract topology) into
 * concrete 2D geometry (DungeonMap with absolute pixel coordinates).
 *
 * Algorithm: BFS Grid Placement
 * 1. Start with the first node at grid center
 * 2. BFS through edges, placing each connected node in an adjacent free cell
 * 3. Convert grid cells to pixel rectangles within WORLD_BOUNDS (1024x1024)
 * 4. Generate corridors between connected rooms
 */

import type { DungeonGraph, GraphNode, GraphEdge, GraphEntity } from "@/schemas/graph";
import type { DungeonMap, Space, Connection, Entity, Point, Polygon } from "@/types/dungeon";
import { WORLD_BOUNDS } from "@/constants/core";

// === Constants ===

const GRID_COLS = 6;
const GRID_ROWS = 6;
const PADDING = 20; // px between rooms and world edge
const WALL_THICKNESS = 8;

// Size mappings (in grid cells)
const SIZE_MAP: Record<string, { w: number; h: number }> = {
    small: { w: 1, h: 1 },
    medium: { w: 2, h: 1 },
    large: { w: 2, h: 2 },
};

// Pixel sizes per grid cell
const CELL_W = Math.floor((WORLD_BOUNDS.WIDTH - PADDING * 2) / GRID_COLS);
const CELL_H = Math.floor((WORLD_BOUNDS.HEIGHT - PADDING * 2) / GRID_ROWS);

// Directions for BFS neighbor search: right, down, left, up
const DIRECTIONS: [number, number][] = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
];

// === Types ===

interface GridCell {
    col: number;
    row: number;
}

interface PlacedNode {
    node: GraphNode;
    cells: GridCell[]; // occupied cells
    bounds: { x: number; y: number; w: number; h: number }; // pixel bounds
}

// === Grid Helpers ===

function cellKey(col: number, row: number): string {
    return `${col},${row}`;
}

function isInGrid(col: number, row: number): boolean {
    return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

/**
 * Find a free adjacent cell (or group of cells for large rooms)
 * near the given anchor cell.
 */
function findFreeCell(
    anchor: GridCell,
    sizeKey: string,
    occupied: Set<string>,
): GridCell | null {
    const size = SIZE_MAP[sizeKey] || SIZE_MAP.medium;

    // Shuffle directions for variety
    const dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (const [dc, dr] of dirs) {
        const col = anchor.col + dc;
        const row = anchor.row + dr;

        // Check all cells this node would occupy
        let fits = true;
        for (let c = 0; c < size.w; c++) {
            for (let r = 0; r < size.h; r++) {
                const tc = col + c;
                const tr = row + r;
                if (!isInGrid(tc, tr) || occupied.has(cellKey(tc, tr))) {
                    fits = false;
                    break;
                }
            }
            if (!fits) break;
        }

        if (fits) return { col, row };
    }

    // Fallback: spiral search from anchor
    for (let radius = 2; radius <= Math.max(GRID_COLS, GRID_ROWS); radius++) {
        for (let dc = -radius; dc <= radius; dc++) {
            for (let dr = -radius; dr <= radius; dr++) {
                if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
                const col = anchor.col + dc;
                const row = anchor.row + dr;

                let fits = true;
                const size = SIZE_MAP[sizeKey] || SIZE_MAP.medium;
                for (let c = 0; c < size.w; c++) {
                    for (let r = 0; r < size.h; r++) {
                        const tc = col + c;
                        const tr = row + r;
                        if (!isInGrid(tc, tr) || occupied.has(cellKey(tc, tr))) {
                            fits = false;
                            break;
                        }
                    }
                    if (!fits) break;
                }
                if (fits) return { col, row };
            }
        }
    }

    return null;
}

// === Pixel Conversion ===

function cellToPixelBounds(cell: GridCell, sizeKey: string) {
    const size = SIZE_MAP[sizeKey] || SIZE_MAP.medium;
    const x = PADDING + cell.col * CELL_W;
    const y = PADDING + cell.row * CELL_H;
    const w = CELL_W * size.w - WALL_THICKNESS;
    const h = CELL_H * size.h - WALL_THICKNESS;
    return { x, y, w, h };
}

function boundsToPolygon(b: { x: number; y: number; w: number; h: number }): Polygon {
    return {
        points: [
            { x: b.x, y: b.y },
            { x: b.x + b.w, y: b.y },
            { x: b.x + b.w, y: b.y + b.h },
            { x: b.x, y: b.y + b.h },
        ],
    };
}

function boundsCenter(b: { x: number; y: number; w: number; h: number }): Point {
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/**
 * Project a target point onto the border of a rectangle.
 * Returns the point where the line from the rect center to the target
 * intersects the rect edge.
 */
function projectToBorder(
    b: { x: number; y: number; w: number; h: number },
    target: Point,
): Point {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;

    if (dx === 0 && dy === 0) {
        return { x: cx, y: b.y }; // fallback: top center
    }

    const hw = b.w / 2;
    const hh = b.h / 2;

    // Scale factor to reach the border
    const sx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
    const sy = dy !== 0 ? hh / Math.abs(dy) : Infinity;
    const s = Math.min(sx, sy);

    return {
        x: Math.round(cx + dx * s),
        y: Math.round(cy + dy * s),
    };
}

// === Adjacency Map ===

function buildAdjacencyMap(edges: GraphEdge[]): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    for (const edge of edges) {
        if (!adj.has(edge.from)) adj.set(edge.from, []);
        if (!adj.has(edge.to)) adj.set(edge.to, []);
        adj.get(edge.from)!.push(edge.to);
        adj.get(edge.to)!.push(edge.from);
    }
    return adj;
}

// === Entity Placement ===

function resolveEntityPosition(
    entity: GraphEntity,
    roomBounds: { x: number; y: number; w: number; h: number },
): Point {
    const margin = 30;
    switch (entity.placement) {
        case "center":
            return boundsCenter(roomBounds);
        case "corner":
            return { x: roomBounds.x + margin, y: roomBounds.y + margin };
        case "wall":
            return { x: roomBounds.x + roomBounds.w / 2, y: roomBounds.y + margin };
        case "entrance":
            return { x: roomBounds.x + roomBounds.w / 2, y: roomBounds.y + roomBounds.h - margin };
        default:
            return boundsCenter(roomBounds);
    }
}

// === Main Layout Function ===

export function layoutGraph(graph: DungeonGraph): DungeonMap {
    const adjacency = buildAdjacencyMap(graph.edges);
    const occupied = new Set<string>();
    const placedMap = new Map<string, PlacedNode>();

    // --- Phase 1: BFS Grid Placement ---

    const startNode = graph.nodes[0];
    const startCell: GridCell = {
        col: Math.floor(GRID_COLS / 2),
        row: Math.floor(GRID_ROWS / 2),
    };

    // Place start node
    const startSize = SIZE_MAP[startNode.size] || SIZE_MAP.medium;
    for (let c = 0; c < startSize.w; c++) {
        for (let r = 0; r < startSize.h; r++) {
            occupied.add(cellKey(startCell.col + c, startCell.row + r));
        }
    }

    const startBounds = cellToPixelBounds(startCell, startNode.size);
    placedMap.set(startNode.id, {
        node: startNode,
        cells: [startCell],
        bounds: startBounds,
    });

    // BFS queue
    const queue: string[] = [startNode.id];
    const visited = new Set<string>([startNode.id]);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentPlaced = placedMap.get(currentId)!;
        const neighbors = adjacency.get(currentId) || [];

        for (const neighborId of neighbors) {
            if (visited.has(neighborId)) continue;
            visited.add(neighborId);

            const neighborNode = graph.nodes.find(n => n.id === neighborId);
            if (!neighborNode) continue;

            // Find free cell adjacent to current
            const freeCell = findFreeCell(currentPlaced.cells[0], neighborNode.size, occupied);
            if (!freeCell) continue;

            // Mark occupied
            const nSize = SIZE_MAP[neighborNode.size] || SIZE_MAP.medium;
            for (let c = 0; c < nSize.w; c++) {
                for (let r = 0; r < nSize.h; r++) {
                    occupied.add(cellKey(freeCell.col + c, freeCell.row + r));
                }
            }

            const bounds = cellToPixelBounds(freeCell, neighborNode.size);
            placedMap.set(neighborId, {
                node: neighborNode,
                cells: [freeCell],
                bounds,
            });

            queue.push(neighborId);
        }
    }

    // Handle disconnected nodes (shouldn't happen with valid graph, but safety)
    for (const node of graph.nodes) {
        if (!placedMap.has(node.id)) {
            const fallback = findFreeCell(startCell, node.size, occupied);
            if (fallback) {
                const nSize = SIZE_MAP[node.size] || SIZE_MAP.medium;
                for (let c = 0; c < nSize.w; c++) {
                    for (let r = 0; r < nSize.h; r++) {
                        occupied.add(cellKey(fallback.col + c, fallback.row + r));
                    }
                }
                placedMap.set(node.id, {
                    node,
                    cells: [fallback],
                    bounds: cellToPixelBounds(fallback, node.size),
                });
            }
        }
    }

    // --- Phase 2: Convert to DungeonMap (with globally unique IDs) ---

    const dungeonId = crypto.randomUUID();
    const floorId = crypto.randomUUID();

    // Map LLM graph node IDs → unique DB space IDs
    const nodeIdMap = new Map<string, string>();
    for (const [graphId] of placedMap) {
        nodeIdMap.set(graphId, crypto.randomUUID());
    }

    // Spaces
    const spaces: Space[] = [];
    for (const [graphId, placed] of placedMap) {
        spaces.push({
            id: nodeIdMap.get(graphId)!,
            floorId,
            name: placed.node.name,
            description: placed.node.description,
            visualPrompt: placed.node.visualPrompt,
            geometry: boundsToPolygon(placed.bounds),
            zones: [],
            lighting: placed.node.lighting,
            spaceType: placed.node.type,
            floorType: placed.node.floorType,
        });
    }

    const connections: Connection[] = graph.edges.map((edge) => {
        const fromPlaced = placedMap.get(edge.from);
        const toPlaced = placedMap.get(edge.to);

        const fromCenter = fromPlaced ? boundsCenter(fromPlaced.bounds) : { x: 0, y: 0 };
        const toCenter = toPlaced ? boundsCenter(toPlaced.bounds) : { x: 0, y: 0 };

        // Calculate edge points: project midpoint onto each space's boundary
        const fromEdge = fromPlaced
            ? projectToBorder(fromPlaced.bounds, toCenter)
            : fromCenter;
        const toEdge = toPlaced
            ? projectToBorder(toPlaced.bounds, fromCenter)
            : toCenter;

        return {
            id: crypto.randomUUID(),
            dungeonId,
            type: edge.type,
            from: { spaceId: nodeIdMap.get(edge.from) || edge.from, position: fromEdge },
            to: { spaceId: nodeIdMap.get(edge.to) || edge.to, position: toEdge },
            state: edge.state,
            material: edge.material,
        };
    });

    // Entities
    const entities: Entity[] = graph.entities.map((gEntity) => {
        const room = placedMap.get(gEntity.roomId);
        const position = room
            ? resolveEntityPosition(gEntity, room.bounds)
            : { x: WORLD_BOUNDS.WIDTH / 2, y: WORLD_BOUNDS.HEIGHT / 2 };

        return {
            id: crypto.randomUUID(),
            dungeonId,
            type: gEntity.type,
            name: gEntity.name,
            description: gEntity.description || "",
            position,
            floorId,
            icon: gEntity.icon,
        };
    });

    // --- Phase 3: Assemble DungeonMap ---

    const now = new Date();

    const dungeonMap: DungeonMap = {
        meta: {
            id: dungeonId,
            name: graph.name,
            theme: graph.theme,
            atmosphere: graph.atmosphere,
            resolution: "1024x1024",
            createdAt: now,
            updatedAt: now,
        },
        floors: [
            {
                id: floorId,
                dungeonId,
                level: 0,
                name: "Ground Floor",
                spaces,
                rendered: false,
            },
        ],
        connections,
        entities,
    };

    return dungeonMap;
}
