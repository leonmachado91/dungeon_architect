import { WORLD_BOUNDS } from "@/constants/core";
import type { Point } from "@/types";

/**
 * Checks if a point is within world bounds
 */
export function isPointInBounds(point: Point): boolean {
    return (
        point.x >= WORLD_BOUNDS.MIN_X &&
        point.x <= WORLD_BOUNDS.MAX_X &&
        point.y >= WORLD_BOUNDS.MIN_Y &&
        point.y <= WORLD_BOUNDS.MAX_Y
    );
}

/**
 * Clamps a point to world bounds
 */
export function clampPointToBounds(point: Point): Point {
    return {
        x: Math.max(WORLD_BOUNDS.MIN_X, Math.min(WORLD_BOUNDS.MAX_X, point.x)),
        y: Math.max(WORLD_BOUNDS.MIN_Y, Math.min(WORLD_BOUNDS.MAX_Y, point.y)),
    };
}

/**
 * Checks if a rectangle (defined by min/max points) is fully within bounds
 */
export function isRectInBounds(minX: number, minY: number, maxX: number, maxY: number): boolean {
    return (
        minX >= WORLD_BOUNDS.MIN_X &&
        maxX <= WORLD_BOUNDS.MAX_X &&
        minY >= WORLD_BOUNDS.MIN_Y &&
        maxY <= WORLD_BOUNDS.MAX_Y
    );
}

/**
 * Clamps a rectangle to world bounds, returns clamped coordinates
 */
export function clampRectToBounds(
    x: number,
    y: number,
    width: number,
    height: number
): { x: number; y: number; width: number; height: number } {
    // Clamp start point
    const clampedX = Math.max(WORLD_BOUNDS.MIN_X, x);
    const clampedY = Math.max(WORLD_BOUNDS.MIN_Y, y);

    // Clamp dimensions
    const clampedWidth = Math.min(WORLD_BOUNDS.MAX_X - clampedX, width);
    const clampedHeight = Math.min(WORLD_BOUNDS.MAX_Y - clampedY, height);

    return {
        x: clampedX,
        y: clampedY,
        width: Math.max(0, clampedWidth),
        height: Math.max(0, clampedHeight),
    };
}

/**
 * Calculates the clamped delta for moving an object without going out of bounds
 */
export function clampMoveDelta(
    currentMinX: number,
    currentMinY: number,
    currentMaxX: number,
    currentMaxY: number,
    deltaX: number,
    deltaY: number
): Point {
    let clampedDeltaX = deltaX;
    let clampedDeltaY = deltaY;

    // Check X bounds
    if (currentMinX + deltaX < WORLD_BOUNDS.MIN_X) {
        clampedDeltaX = WORLD_BOUNDS.MIN_X - currentMinX;
    } else if (currentMaxX + deltaX > WORLD_BOUNDS.MAX_X) {
        clampedDeltaX = WORLD_BOUNDS.MAX_X - currentMaxX;
    }

    // Check Y bounds
    if (currentMinY + deltaY < WORLD_BOUNDS.MIN_Y) {
        clampedDeltaY = WORLD_BOUNDS.MIN_Y - currentMinY;
    } else if (currentMaxY + deltaY > WORLD_BOUNDS.MAX_Y) {
        clampedDeltaY = WORLD_BOUNDS.MAX_Y - currentMaxY;
    }

    return { x: clampedDeltaX, y: clampedDeltaY };
}
