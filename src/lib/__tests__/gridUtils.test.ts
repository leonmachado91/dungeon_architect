import { describe, it, expect } from 'vitest';
import { snapToGrid, snapPointToGrid, getGridCellCenter, normalizePointsToGrid } from '../gridUtils';

// Default GRID_SIZE = 40

describe('snapToGrid', () => {
    it('deveria arredondar para o múltiplo de gridSize mais próximo', () => {
        expect(snapToGrid(42)).toBe(40);   // 42/40=1.05 → round=1 → 40
        expect(snapToGrid(60)).toBe(80);   // 60/40=1.5 → round=2 → 80
        expect(snapToGrid(39)).toBe(40);   // 39/40=0.975 → round=1 → 40
        expect(snapToGrid(19)).toBe(0);    // 19/40=0.475 → round=0 → 0
    });

    it('deve arredondar 0 para 0', () => {
        expect(snapToGrid(0)).toBe(0);
    });

    it('deve funcionar com valores negativos', () => {
        // -15/40=-0.375 → round=0 → 0 (may produce -0)
        expect(snapToGrid(-15) + 0).toBe(0);
        // -25/40=-0.625 → round=-1 → -40
        expect(snapToGrid(-25)).toBe(-40);
    });

    it('deveria suportar gridSize customizado', () => {
        expect(snapToGrid(33, 10)).toBe(30);
        expect(snapToGrid(37, 10)).toBe(40);
    });
});

describe('snapPointToGrid', () => {
    it('deveria snapar ambos eixos', () => {
        const result = snapPointToGrid({ x: 42, y: 83 });
        expect(result.x).toBe(40);
        expect(result.y).toBe(80);
    });

    it('deveria aceitar gridSize customizado', () => {
        const result = snapPointToGrid({ x: 17, y: 23 }, 10);
        expect(result.x).toBe(20);
        expect(result.y).toBe(20);
    });
});

describe('getGridCellCenter', () => {
    it('deveria retornar o centro da célula do grid', () => {
        // Point at (42, 83): cell starts at (40, 80), center should be (60, 100)
        const result = getGridCellCenter({ x: 42, y: 83 });
        // cellX = floor(42/40)*40 = 1*40 = 40
        // cellY = floor(83/40)*40 = 2*40 = 80
        expect(result.x).toBe(40 + 20); // 60
        expect(result.y).toBe(80 + 20); // 100
    });

    it('deveria funcionar no ponto (0,0)', () => {
        const result = getGridCellCenter({ x: 0, y: 0 });
        expect(result.x).toBe(20);
        expect(result.y).toBe(20);
    });
});

describe('normalizePointsToGrid', () => {
    it('deveria snapar todos os pontos ao grid', () => {
        const points = [
            { x: 42, y: 83 },
            { x: 100, y: 123 },
        ];
        const result = normalizePointsToGrid(points);
        expect(result).toEqual([
            { x: 40, y: 80 },
            { x: 120, y: 120 }, // 100/40=2.5 → round(2.5)=3 → 120; 123/40=3.075 → round(3.075)=3 → 120
        ]);
    });

    it('deveria retornar array vazio para input vazio', () => {
        expect(normalizePointsToGrid([])).toEqual([]);
    });
});
