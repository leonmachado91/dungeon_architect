import { describe, it, expect } from 'vitest';
import { mergePolygons, polygonsOverlap, findOverlappingPairs } from '../polygonMerge';
import type { Polygon } from '@/types/dungeon';

/**
 * Helper — cria um retângulo como Polygon
 */
function rect(x: number, y: number, w: number, h: number): Polygon {
    return {
        points: [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
        ],
        holes: [],
    };
}

describe('mergePolygons', () => {
    it('retorna array vazio para input vazio', () => {
        expect(mergePolygons([])).toEqual([]);
    });

    it('retorna mesmo polígono se só um for passado', () => {
        const poly = rect(0, 0, 100, 100);
        const result = mergePolygons([poly]);

        expect(result).toHaveLength(1);
        expect(result[0].points.length).toBeGreaterThanOrEqual(4);
    });

    it('merge dois retângulos sobrepostos em um', () => {
        const a = rect(0, 0, 100, 100);
        const b = rect(50, 0, 100, 100); // sobrepõe 50px
        const result = mergePolygons([a, b]);

        expect(result).toHaveLength(1);
        // A área do merge deveria cobrir de x=0 a x=150
        const xs = result[0].points.map(p => p.x);
        expect(Math.min(...xs)).toBeCloseTo(0, 0);
        expect(Math.max(...xs)).toBeCloseTo(150, 0);
    });

    it('não merge retângulos que não se tocam', () => {
        const a = rect(0, 0, 50, 50);
        const b = rect(200, 200, 50, 50);
        const result = mergePolygons([a, b]);

        expect(result).toHaveLength(2);
    });

    it('preserva holes durante merge', () => {
        const outer = rect(0, 0, 200, 200);
        const hole: Polygon = {
            points: [
                { x: 0, y: 0 },
                { x: 200, y: 0 },
                { x: 200, y: 200 },
                { x: 0, y: 200 },
            ],
            holes: [[
                { x: 50, y: 50 },
                { x: 150, y: 50 },
                { x: 150, y: 150 },
                { x: 50, y: 150 },
            ]],
        };
        const result = mergePolygons([hole]);

        expect(result).toHaveLength(1);
        expect(result[0].holes).toBeDefined();
        expect(result[0].holes!.length).toBeGreaterThanOrEqual(1);
    });
});

describe('polygonsOverlap', () => {
    it('retorna true para retângulos sobrepostos', () => {
        const a = rect(0, 0, 100, 100);
        const b = rect(50, 50, 100, 100);
        expect(polygonsOverlap(a, b)).toBe(true);
    });

    it('retorna false para retângulos separados', () => {
        const a = rect(0, 0, 50, 50);
        const b = rect(200, 200, 50, 50);
        expect(polygonsOverlap(a, b)).toBe(false);
    });
});

describe('findOverlappingPairs', () => {
    it('retorna pares de índices sobrepostos', () => {
        const polys = [
            rect(0, 0, 100, 100),
            rect(50, 50, 100, 100),
            rect(500, 500, 50, 50),
        ];
        const pairs = findOverlappingPairs(polys);

        expect(pairs).toEqual([[0, 1]]);
    });

    it('retorna vazio se nenhum sobrepõe', () => {
        const polys = [
            rect(0, 0, 50, 50),
            rect(200, 200, 50, 50),
        ];
        expect(findOverlappingPairs(polys)).toEqual([]);
    });
});
