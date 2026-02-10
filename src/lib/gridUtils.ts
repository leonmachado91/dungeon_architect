import { CORE_CONSTANTS } from "@/constants/core";
import { Point } from "@/types";

/**
 * Snaps a value to the nearest grid line.
 */
export function snapToGrid(value: number, gridSize: number = CORE_CONSTANTS.GRID_SIZE): number {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps a point to the nearest grid intersection.
 */
export function snapPointToGrid(point: Point, gridSize: number = CORE_CONSTANTS.GRID_SIZE): Point {
    return {
        x: snapToGrid(point.x, gridSize),
        y: snapToGrid(point.y, gridSize),
    };
}

/**
 * Gets the center of the grid cell containing the point.
 */
export function getGridCellCenter(point: Point, gridSize: number = CORE_CONSTANTS.GRID_SIZE): Point {
    const cellX = Math.floor(point.x / gridSize) * gridSize;
    const cellY = Math.floor(point.y / gridSize) * gridSize;
    return {
        x: cellX + gridSize / 2,
        y: cellY + gridSize / 2,
    };
}

/**
 * Normalizes a list of points to be aligned with the grid.
 */
export function normalizePointsToGrid(points: Point[], gridSize: number = CORE_CONSTANTS.GRID_SIZE): Point[] {
    return points.map(p => snapPointToGrid(p, gridSize));
}
