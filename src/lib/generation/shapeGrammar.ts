/**
 * Shape Grammar — Pure geometry functions for the Block-Grid engine.
 *
 * Transforms rectangular bounds into refined polygons based on room roles,
 * applies organic smoothing/noise, and handles containment (holes).
 * All functions are pure and deterministic (given the same seed).
 */

import type { Point } from "@/types";
import { BLOCK_GRID, CORE_CONSTANTS } from "@/constants/core";

// === Internal types ===

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type Corner = "nw" | "ne" | "sw" | "se";

// === Conversion helpers ===

/** Convert a Rect to a 4-point clockwise polygon */
export function rectToPolygon(rect: Rect): Point[] {
    const { x, y, w, h } = rect;
    return [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
    ];
}

/** Get bounding rect of a polygon */
export function polygonBounds(points: Point[]): Rect {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// === Shape Grammar transforms ===

/**
 * Chamfer all 4 corners of a rect → octagonal polygon (8 points).
 * `ratio` is the fraction of the shorter side to cut (e.g., 0.15).
 */
export function chamferRect(rect: Rect, ratio: number = BLOCK_GRID.CHAMFER_RATIO): Point[] {
    const { x, y, w, h } = rect;
    const cut = Math.floor(Math.min(w, h) * ratio);

    if (cut < 4) return rectToPolygon(rect);

    return [
        { x: x + cut, y },           // top-left chamfer start
        { x: x + w - cut, y },       // top-right chamfer start
        { x: x + w, y: y + cut },    // right-top chamfer end
        { x: x + w, y: y + h - cut }, // right-bottom chamfer start
        { x: x + w - cut, y: y + h }, // bottom-right chamfer end
        { x: x + cut, y: y + h },     // bottom-left chamfer start
        { x, y: y + h - cut },       // left-bottom chamfer end
        { x, y: y + cut },           // left-top chamfer end
    ];
}

/**
 * Cut one corner of a rect → L-shaped polygon (6 points).
 * `ratio` is the fraction of the side to cut (e.g., 0.3).
 */
export function cutRectCorner(
    rect: Rect,
    corner: Corner,
    ratio: number = BLOCK_GRID.CUT_CORNER_RATIO,
): Point[] {
    const { x, y, w, h } = rect;
    const cutW = Math.floor(w * ratio);
    const cutH = Math.floor(h * ratio);

    switch (corner) {
        case "nw":
            return [
                { x: x + cutW, y },
                { x: x + w, y },
                { x: x + w, y: y + h },
                { x, y: y + h },
                { x, y: y + cutH },
                { x: x + cutW, y: y + cutH },
            ];
        case "ne":
            return [
                { x, y },
                { x: x + w - cutW, y },
                { x: x + w - cutW, y: y + cutH },
                { x: x + w, y: y + cutH },
                { x: x + w, y: y + h },
                { x, y: y + h },
            ];
        case "sw":
            return [
                { x, y },
                { x: x + w, y },
                { x: x + w, y: y + h },
                { x: x + cutW, y: y + h },
                { x: x + cutW, y: y + h - cutH },
                { x, y: y + h - cutH },
            ];
        case "se":
            return [
                { x, y },
                { x: x + w, y },
                { x: x + w, y: y + h - cutH },
                { x: x + w - cutW, y: y + h - cutH },
                { x: x + w - cutW, y: y + h },
                { x, y: y + h },
            ];
    }
}

/**
 * Irregular cut — deterministic pseudo-random corner cut based on seed.
 * Produces a 5-7 point polygon. Used for "secret" rooms.
 */
export function irregularCut(rect: Rect, seed: number): Point[] {
    const hash = simpleHash(seed);
    const corners: Corner[] = ["nw", "ne", "sw", "se"];
    const corner = corners[hash % 4];
    // Vary the ratio between 0.2 and 0.45
    const ratio = 0.2 + (((hash >> 4) % 25) / 100);
    return cutRectCorner(rect, corner, ratio);
}

// === Organic refinement ===

/**
 * Chaikin's corner-cutting algorithm — smooths a polygon by
 * replacing each edge with two new points at 25%/75%.
 */
export function chaikinSubdivision(points: Point[], iterations: number): Point[] {
    let result = [...points];

    for (let iter = 0; iter < iterations; iter++) {
        const next: Point[] = [];
        const n = result.length;

        for (let i = 0; i < n; i++) {
            const current = result[i];
            const nextPt = result[(i + 1) % n];

            next.push({
                x: current.x * 0.75 + nextPt.x * 0.25,
                y: current.y * 0.75 + nextPt.y * 0.25,
            });
            next.push({
                x: current.x * 0.25 + nextPt.x * 0.75,
                y: current.y * 0.25 + nextPt.y * 0.75,
            });
        }

        result = next;
    }

    return result;
}

/**
 * Apply simplex-like noise displacement to polygon points.
 * Uses a simple deterministic hash-based noise (no external dependency).
 * `amount` (0-1) scales the displacement; `frequency` controls granularity.
 */
export function applyNoise(
    points: Point[],
    amount: number,
    frequency: number = BLOCK_GRID.NOISE_FREQUENCY,
    seed: number = 42,
): Point[] {
    if (amount <= 0) return points;

    const maxOffset = BLOCK_GRID.NOISE_MAX_OFFSET_PX * amount;

    return points.map((p, i) => {
        // Deterministic pseudo-noise based on position and seed
        const nx = hashNoise(p.x * frequency, p.y * frequency, seed + i);
        const ny = hashNoise(p.y * frequency, p.x * frequency, seed + i + 1000);

        return {
            x: p.x + nx * maxOffset,
            y: p.y + ny * maxOffset,
        };
    });
}

// === Containment ===

/**
 * Carve holes in a parent rect for each child rect.
 * Each hole is a rectangle with an optional margin inset.
 * Returns an array of hole polygons (each is Point[]).
 */
export function carveHoles(
    childRects: Rect[],
    margin: number = 4,
): Point[][] {
    return childRects.map(child => {
        const inset: Rect = {
            x: child.x - margin,
            y: child.y - margin,
            w: child.w + margin * 2,
            h: child.h + margin * 2,
        };
        // Holes use counter-clockwise winding
        return [
            { x: inset.x, y: inset.y },
            { x: inset.x, y: inset.y + inset.h },
            { x: inset.x + inset.w, y: inset.y + inset.h },
            { x: inset.x + inset.w, y: inset.y },
        ];
    });
}

// === Utilities ===

/** Snap all points to the nearest grid multiple */
export function gridSnap(points: Point[], gridSize: number = CORE_CONSTANTS.GRID_SIZE): Point[] {
    return points.map(p => ({
        x: Math.round(p.x / gridSize) * gridSize,
        y: Math.round(p.y / gridSize) * gridSize,
    }));
}

/** Calculate the centroid (geometric center) of a polygon */
export function centroid(points: Point[]): Point {
    let cx = 0, cy = 0;
    for (const p of points) {
        cx += p.x;
        cy += p.y;
    }
    return { x: cx / points.length, y: cy / points.length };
}

/**
 * Find a point on a specific wall (side) of a polygon.
 * `t` (0-1, default 0.5) controls position along the wall. 0.5 = midpoint.
 */
export function pointOnWall(
    polygon: Point[],
    side: "north" | "south" | "east" | "west",
    t: number = 0.5,
): Point {
    const bounds = polygonBounds(polygon);
    const { x, y, w, h } = bounds;

    switch (side) {
        case "north":
            return { x: x + w * t, y };
        case "south":
            return { x: x + w * t, y: y + h };
        case "east":
            return { x: x + w, y: y + h * t };
        case "west":
            return { x, y: y + h * t };
    }
}

/**
 * Generate an L-shaped corridor polygon between two points.
 * The corridor has a specified width and bends at a midpoint.
 * `horizontalFirst` controls whether the corridor goes horizontal then vertical.
 */
export function generateLCorridor(
    from: Point,
    to: Point,
    width: number = BLOCK_GRID.CORRIDOR_WIDTH_PX,
    horizontalFirst: boolean = true,
): Point[] {
    const halfW = width / 2;

    if (horizontalFirst) {
        // Horizontal segment from `from` to bend point, then vertical to `to`
        const bendX = to.x;
        return [
            // Outer top of horizontal segment
            { x: from.x, y: from.y - halfW },
            { x: bendX + halfW, y: from.y - halfW },
            // Outer side of vertical segment
            { x: bendX + halfW, y: to.y - halfW * Math.sign(to.y - from.y) },
            { x: bendX + halfW, y: to.y + halfW * Math.sign(to.y - from.y) || halfW },
            // Inner transition
            { x: bendX - halfW, y: to.y + halfW * Math.sign(to.y - from.y) || halfW },
            { x: bendX - halfW, y: from.y + halfW },
            { x: from.x, y: from.y + halfW },
        ];
    } else {
        // Vertical segment from `from` to bend point, then horizontal to `to`
        const bendY = to.y;
        return [
            { x: from.x - halfW, y: from.y },
            { x: from.x - halfW, y: bendY - halfW },
            { x: to.x - halfW * Math.sign(to.x - from.x), y: bendY - halfW },
            { x: to.x + halfW * Math.sign(to.x - from.x) || halfW, y: bendY - halfW },
            { x: to.x + halfW * Math.sign(to.x - from.x) || halfW, y: bendY + halfW },
            { x: from.x + halfW, y: bendY + halfW },
            { x: from.x + halfW, y: from.y },
        ];
    }
}

/**
 * Generate a straight rectangle corridor between two points.
 * Fallback when L-corridors would cross other blocks.
 */
export function generateStraightCorridor(
    from: Point,
    to: Point,
    width: number = BLOCK_GRID.CORRIDOR_WIDTH_PX,
): Point[] {
    const halfW = width / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return rectToPolygon({ x: from.x - halfW, y: from.y - halfW, w: width, h: width });

    // Perpendicular direction
    const nx = -dy / len * halfW;
    const ny = dx / len * halfW;

    return [
        { x: from.x + nx, y: from.y + ny },
        { x: to.x + nx, y: to.y + ny },
        { x: to.x - nx, y: to.y - ny },
        { x: from.x - nx, y: from.y - ny },
    ];
}

// === Internal helpers ===

/** Simple deterministic hash for seeded pseudo-randomness */
function simpleHash(n: number): number {
    let h = n | 0;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = (h >> 16) ^ h;
    return Math.abs(h);
}

/** Hash-based noise in [-1, 1] range */
function hashNoise(x: number, y: number, seed: number): number {
    const h = simpleHash(Math.floor(x * 1000) ^ Math.floor(y * 1000) ^ seed);
    return (h % 200 - 100) / 100;
}
