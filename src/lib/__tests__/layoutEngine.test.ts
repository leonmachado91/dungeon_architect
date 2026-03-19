import { describe, test, expect, vi } from 'vitest';
import { layoutBlockGrid } from '../generation/layoutEngine';
import type { BlockGrid } from '@/schemas/blockGrid';

/**
 * Helper para criar um BlockGrid mínimo válido para testes.
 */
function createMinimalGrid(overrides?: Partial<BlockGrid>): BlockGrid {
    return {
        name: "Test Dungeon",
        theme: "dungeon",
        atmosphere: "A dank test dungeon",
        gridSize: 8,
        blocks: [
            {
                id: "room-a",
                name: "Entrance",
                type: "room",
                role: "entrance",
                col: 0,
                row: 0,
                width: 2,
                height: 2,
                exits: [{ side: "east" as const, to: "room-b", type: "door" as const, state: "closed" as const }],
                description: "A stone entrance",
                lighting: "bright",
                smoothing: 0,
                noiseAmount: 0,
                entities: [],
            },
            {
                id: "room-b",
                name: "Main Hall",
                type: "room",
                role: "hub",
                col: 3,
                row: 0,
                width: 3,
                height: 3,
                exits: [{ side: "west" as const, to: "room-a", type: "door" as const, state: "closed" as const }],
                description: "A grand hall",
                lighting: "dim",
                smoothing: 0,
                noiseAmount: 0,
                entities: [
                    {
                        type: "treasure" as const,
                        name: "Gold Chest",
                        description: "A chest of gold",
                        icon: "monetization_on",
                        position: "center" as const,
                    },
                ],
            },
        ],
        ...overrides,
    };
}

// Set up crypto.randomUUID for Node test env
if (typeof globalThis.crypto === 'undefined') {
    const { randomUUID } = await import('node:crypto');
    Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID },
        writable: true,
    });
}

describe('layoutBlockGrid', () => {
    test('should generate a DungeonMap with correct structure', () => {
        const grid = createMinimalGrid();
        const map = layoutBlockGrid(grid);

        // Basic structure checks
        expect(map.meta).toBeDefined();
        expect(map.meta.name).toBe("Test Dungeon");
        expect(map.meta.theme).toBe("dungeon");
        expect(map.floors).toHaveLength(1);
        expect(map.connections.length).toBeGreaterThanOrEqual(1);
        expect(map.entities.length).toBeGreaterThanOrEqual(1);
    });

    test('spaces should have valid polygon geometry', () => {
        const grid = createMinimalGrid();
        const map = layoutBlockGrid(grid);

        const floor = map.floors[0];
        expect(floor.spaces.length).toBeGreaterThanOrEqual(2);

        for (const space of floor.spaces) {
            expect(space.geometry.points.length).toBeGreaterThanOrEqual(3);
            for (const point of space.geometry.points) {
                expect(typeof point.x).toBe('number');
                expect(typeof point.y).toBe('number');
                expect(point.x).toBeGreaterThanOrEqual(0);
                expect(point.y).toBeGreaterThanOrEqual(0);
            }
        }
    });

    test('connections should reference valid space ids', () => {
        const grid = createMinimalGrid();
        const map = layoutBlockGrid(grid);

        const spaceIds = new Set(map.floors[0].spaces.map(s => s.id));

        for (const conn of map.connections) {
            expect(spaceIds.has(conn.from.spaceId)).toBe(true);
            expect(spaceIds.has(conn.to.spaceId)).toBe(true);
        }
    });

    test('entities should have valid positions inside the map', () => {
        const grid = createMinimalGrid();
        const map = layoutBlockGrid(grid);

        expect(map.entities.length).toBe(1);
        const entity = map.entities[0];

        expect(entity.name).toBe("Gold Chest");
        expect(entity.type).toBe("treasure");
        expect(typeof entity.position.x).toBe('number');
        expect(typeof entity.position.y).toBe('number');
    });

    test('should clamp blocks that exceed grid bounds', () => {
        const grid = createMinimalGrid({
            blocks: [
                {
                    id: "overflow",
                    name: "Overflow Room",
                    type: "room",
                    role: "open",
                    col: 6,
                    row: 7,
                    width: 5,  // exceeds 8
                    height: 3, // exceeds 8
                    exits: [],
                    description: "Should be clamped",
                    lighting: "dim",
                    smoothing: 0,
                    noiseAmount: 0,
                    entities: [],
                },
            ],
        });

        // Should not throw, just warn and clamp
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const map = layoutBlockGrid(grid);
        expect(map.floors[0].spaces.length).toBeGreaterThanOrEqual(1);
        consoleSpy.mockRestore();
    });

    test('should handle organic smoothing and noise', () => {
        const grid = createMinimalGrid();
        grid.blocks[0].smoothing = 0.7;
        grid.blocks[0].noiseAmount = 0.5;

        const map = layoutBlockGrid(grid);
        const space = map.floors[0].spaces.find(s => s.id === "room-a");

        expect(space).toBeDefined();
        // Smoothed polygon should have more points than a rectangle
        expect(space!.geometry.points.length).toBeGreaterThan(4);
        expect(space!.smoothing).toBe(0.7);
        expect(space!.noiseAmount).toBe(0.5);
    });

    test('should create auto-corridors for distant blocks', () => {
        const grid = createMinimalGrid({
            blocks: [
                {
                    id: "far-a",
                    name: "Far Room A",
                    type: "room",
                    role: "entrance",
                    col: 0,
                    row: 0,
                    width: 2,
                    height: 2,
                    exits: [{ side: "east" as const, to: "far-b", type: "door" as const, state: "closed" as const }],
                    description: "",
                    lighting: "dim",
                    smoothing: 0,
                    noiseAmount: 0,
                    entities: [],
                },
                {
                    id: "far-b",
                    name: "Far Room B",
                    type: "room",
                    role: "hub",
                    col: 6,
                    row: 0,
                    width: 2,
                    height: 2,
                    exits: [{ side: "west" as const, to: "far-a", type: "door" as const, state: "closed" as const }],
                    description: "",
                    lighting: "dim",
                    smoothing: 0,
                    noiseAmount: 0,
                    entities: [],
                },
            ],
        });

        const map = layoutBlockGrid(grid);

        // Should have 2 room spaces + 1 auto-corridor
        expect(map.floors[0].spaces.length).toBe(3);
        const corridor = map.floors[0].spaces.find(s => s.id.startsWith("corridor-auto-"));
        expect(corridor).toBeDefined();
    });

    test('should handle containers with children as holes', () => {
        const grid = createMinimalGrid({
            blocks: [
                {
                    id: "forest",
                    name: "Dark Forest",
                    type: "outdoor",
                    role: "container",
                    col: 0,
                    row: 0,
                    width: 6,
                    height: 6,
                    exits: [],
                    description: "A dense forest",
                    lighting: "dim",
                    smoothing: 0.5,
                    noiseAmount: 0.3,
                    entities: [],
                },
                {
                    id: "clearing",
                    name: "Forest Clearing",
                    type: "room",
                    role: "open",
                    col: 2,
                    row: 2,
                    width: 2,
                    height: 2,
                    exits: [],
                    parentId: "forest",
                    description: "A small clearing",
                    lighting: "bright",
                    smoothing: 0,
                    noiseAmount: 0,
                    entities: [],
                },
            ],
        });

        const map = layoutBlockGrid(grid);
        const forest = map.floors[0].spaces.find(s => s.id === "forest");

        expect(forest).toBeDefined();
        // Container should have holes carved for children
        expect(forest!.geometry.holes).toBeDefined();
        expect(forest!.geometry.holes!.length).toBe(1);
    });
});
