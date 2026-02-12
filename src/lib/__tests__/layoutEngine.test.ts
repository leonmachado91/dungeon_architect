import { describe, it, expect } from 'vitest';
import { layoutGraph } from '../generation/layoutEngine';
import type { DungeonGraph } from '@/schemas/graph';

/**
 * Helper para criar um DungeonGraph mínimo válido para testes.
 */
function createMinimalGraph(overrides?: Partial<DungeonGraph>): DungeonGraph {
    return {
        name: 'Test Dungeon',
        theme: 'Cave',
        atmosphere: 'Dark',
        nodes: [
            { id: 'room-1', name: 'Entrance', type: 'room', size: 'medium', description: 'Entry', visualPrompt: 'stone', lighting: 'dim' },
            { id: 'corridor-1', name: 'Hallway', type: 'corridor', size: 'small', description: 'Narrow', visualPrompt: 'dark', lighting: 'dark' },
            { id: 'room-2', name: 'Guard Room', type: 'room', size: 'large', description: 'Large room', visualPrompt: 'torches', lighting: 'bright' },
        ],
        edges: [
            { from: 'room-1', to: 'corridor-1', type: 'door', state: 'open' },
            { from: 'corridor-1', to: 'room-2', type: 'archway', state: 'open' },
        ],
        entities: [],
        ...overrides,
    };
}

describe('layoutGraph', () => {
    it('deveria retornar um DungeonMap com espaços no primeiro floor', () => {
        const graph = createMinimalGraph();
        const map = layoutGraph(graph);

        expect(map.floors).toHaveLength(1);
        expect(map.floors[0].spaces.length).toBeGreaterThanOrEqual(3);
    });

    it('deveria gerar connections para cada edge', () => {
        const graph = createMinimalGraph();
        const map = layoutGraph(graph);

        expect(map.connections).toHaveLength(2);
    });

    it('cada space deveria ter geometry com points', () => {
        const graph = createMinimalGraph();
        const map = layoutGraph(graph);
        const spaces = map.floors[0].spaces;

        for (const space of spaces) {
            expect(space.geometry).toBeDefined();
            expect(space.geometry.points.length).toBeGreaterThanOrEqual(4);
        }
    });

    it('cada connection deveria ter from e to com positions distintas', () => {
        const graph = createMinimalGraph();
        const map = layoutGraph(graph);

        for (const conn of map.connections) {
            expect(conn.from.position).toBeDefined();
            expect(conn.to.position).toBeDefined();
            // As posições from e to não devem ser idênticas (fix do bug #4)
            const samePoint =
                conn.from.position.x === conn.to.position.x &&
                conn.from.position.y === conn.to.position.y;
            expect(samePoint).toBe(false);
        }
    });

    it('deveria preencher metadata do mapa', () => {
        const graph = createMinimalGraph();
        const map = layoutGraph(graph);

        expect(map.meta.name).toBe('Test Dungeon');
        expect(map.meta.theme).toBe('Cave');
        expect(map.meta.atmosphere).toBe('Dark');
    });

    it('spaces devem ter coordenadas positivas dentro dos world bounds', () => {
        const graph = createMinimalGraph();
        const map = layoutGraph(graph);
        const spaces = map.floors[0].spaces;

        for (const space of spaces) {
            for (const point of space.geometry.points) {
                expect(point.x).toBeGreaterThanOrEqual(0);
                expect(point.y).toBeGreaterThanOrEqual(0);
                expect(point.x).toBeLessThanOrEqual(1024);
                expect(point.y).toBeLessThanOrEqual(1024);
            }
        }
    });

    it('deveria posicionar entidades relacionadas ao espaço correto', () => {
        const graph = createMinimalGraph({
            entities: [
                {
                    id: 'entity-1',
                    type: 'monster',
                    name: 'Goblin',
                    roomId: 'room-1',
                    placement: 'center',
                    icon: 'skull',
                },
            ],
        });
        const map = layoutGraph(graph);

        expect(map.entities).toHaveLength(1);
        expect(map.entities[0].name).toBe('Goblin');
        expect(map.entities[0].position).toBeDefined();
        expect(map.entities[0].position.x).toBeGreaterThan(0);
    });

    it('deveria lidar com grafo com muitos nós sem crash', () => {
        const nodes = Array.from({ length: 10 }, (_, i) => ({
            id: `room-${i}`,
            name: `Room ${i}`,
            type: 'room' as const,
            size: (['small', 'medium', 'large'] as const)[i % 3],
            description: `Room ${i}`,
            visualPrompt: 'stone',
            lighting: 'dim' as const,
        }));
        const edges = Array.from({ length: 9 }, (_, i) => ({
            from: `room-${i}`,
            to: `room-${i + 1}`,
            type: 'door' as const,
            state: 'open' as const,
        }));

        const graph = createMinimalGraph({ nodes, edges });
        const map = layoutGraph(graph);

        expect(map.floors[0].spaces.length).toBeGreaterThanOrEqual(3);
    });
});
