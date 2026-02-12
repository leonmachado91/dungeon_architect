import { describe, it, expect } from 'vitest';
import { isPointInBounds, clampPointToBounds, isRectInBounds, clampRectToBounds, clampMoveDelta } from '../bounds';

// WORLD_BOUNDS: MIN_X=0, MIN_Y=0, MAX_X=1024, MAX_Y=1024

describe('isPointInBounds', () => {
    it('retorna true para ponto dentro dos limites', () => {
        expect(isPointInBounds({ x: 512, y: 512 })).toBe(true);
    });

    it('retorna true para ponto na borda', () => {
        expect(isPointInBounds({ x: 0, y: 0 })).toBe(true);
        expect(isPointInBounds({ x: 1024, y: 1024 })).toBe(true);
    });

    it('retorna false para ponto fora dos limites', () => {
        expect(isPointInBounds({ x: -1, y: 512 })).toBe(false);
        expect(isPointInBounds({ x: 512, y: 1025 })).toBe(false);
    });
});

describe('clampPointToBounds', () => {
    it('não altera ponto já dentro dos limites', () => {
        expect(clampPointToBounds({ x: 500, y: 300 })).toEqual({ x: 500, y: 300 });
    });

    it('clampeia ponto abaixo do mínimo', () => {
        expect(clampPointToBounds({ x: -100, y: -50 })).toEqual({ x: 0, y: 0 });
    });

    it('clampeia ponto acima do máximo', () => {
        expect(clampPointToBounds({ x: 2000, y: 1500 })).toEqual({ x: 1024, y: 1024 });
    });
});

describe('isRectInBounds', () => {
    it('retorna true para retângulo inteiro dentro dos limites', () => {
        expect(isRectInBounds(100, 100, 500, 500)).toBe(true);
    });

    it('retorna true para retângulo exatamente nos limites', () => {
        expect(isRectInBounds(0, 0, 1024, 1024)).toBe(true);
    });

    it('retorna false se ultrapassar à esquerda', () => {
        expect(isRectInBounds(-1, 0, 500, 500)).toBe(false);
    });

    it('retorna false se ultrapassar à direita', () => {
        expect(isRectInBounds(0, 0, 1025, 500)).toBe(false);
    });
});

describe('clampRectToBounds', () => {
    it('não altera retângulo já dentro dos limites', () => {
        expect(clampRectToBounds(100, 100, 200, 200)).toEqual({
            x: 100, y: 100, width: 200, height: 200,
        });
    });

    it('clampeia posição negativa e mantém dimensão possível', () => {
        const result = clampRectToBounds(-50, -50, 200, 200);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        // Width should be clamped: min(1024-0, 200) = 200
        expect(result.width).toBe(200);
    });

    it('clampeia retângulo que ultrapassa MAX', () => {
        const result = clampRectToBounds(900, 900, 300, 300);
        // x=900, width = min(1024-900, 300) = 124
        expect(result.width).toBe(124);
        expect(result.height).toBe(124);
    });
});

describe('clampMoveDelta', () => {
    it('não altera delta que não sai dos limites', () => {
        const result = clampMoveDelta(100, 100, 200, 200, 50, 50);
        expect(result).toEqual({ x: 50, y: 50 });
    });

    it('limita delta negativo que sairia do MIN', () => {
        const result = clampMoveDelta(10, 10, 100, 100, -20, -20);
        // MinX=10, delta=-20 → 10+(-20)=-10 < 0 → clampedDelta = 0-10 = -10
        expect(result.x).toBe(-10);
        expect(result.y).toBe(-10);
    });

    it('limita delta positivo que sairia do MAX', () => {
        const result = clampMoveDelta(900, 900, 1000, 1000, 50, 50);
        // MaxX=1000, delta=50 → 1000+50=1050 > 1024 → clampedDelta = 1024-1000 = 24
        expect(result.x).toBe(24);
        expect(result.y).toBe(24);
    });
});
