import { Clipper, FillRule, Paths64, Path64, Point64 } from "clipper2-js";
import type { Polygon } from "@/types/dungeon";

// Scale factor to ensure integer precision in Clipper
const SCALAR = 1000;

/**
 * Gets the signed area of a path.
 * Positive = CCW (shell), Negative = CW (hole)
 */
function getSignedArea(path: Path64): number {
    return Clipper.area(path);
}

/**
 * Converts a dungeon Polygon to Clipper Paths64 with scaling.
 * Uses XOR approach: shells are added as subject, holes are subtracted.
 */
function polygonToSubjectAndClip(polygon: Polygon): { subject: Paths64; clip: Paths64 } {
    const subject = new Paths64();
    const clip = new Paths64();

    // Add outer shell as subject (will be CCW)
    const shellPath = new Path64();
    for (const p of polygon.points) {
        shellPath.push(new Point64(Math.round(p.x * SCALAR), Math.round(p.y * SCALAR)));
    }
    // Ensure shell is CCW (positive area)
    if (getSignedArea(shellPath) < 0) {
        shellPath.reverse();
    }
    subject.push(shellPath);

    // Add holes as clip paths (will be subtracted)
    if (polygon.holes && polygon.holes.length > 0) {
        for (const hole of polygon.holes) {
            const holePath = new Path64();
            for (const p of hole) {
                holePath.push(new Point64(Math.round(p.x * SCALAR), Math.round(p.y * SCALAR)));
            }
            // Ensure hole is CCW for clipping (will become a hole when subtracted)
            if (getSignedArea(holePath) < 0) {
                holePath.reverse();
            }
            clip.push(holePath);
        }
    }

    return { subject, clip };
}

/**
 * [Bug #1 Fix] Merges multiple polygons into one using a two-phase approach:
 * 1. Union all outer shells
 * 2. Subtract all holes from the union result
 * 
 * This ensures holes are properly preserved during merge operations.
 */
export function mergePolygons(polygons: Polygon[]): Polygon[] {
    if (polygons.length === 0) return [];

    // Phase 1: Collect all shells and all holes separately
    const allShells = new Paths64();
    const allHoles = new Paths64();

    for (const poly of polygons) {
        const { subject, clip } = polygonToSubjectAndClip(poly);
        // Add shells
        for (let i = 0; i < subject.length; i++) {
            allShells.push(subject[i]);
        }
        // Add holes
        for (let i = 0; i < clip.length; i++) {
            allHoles.push(clip[i]);
        }
    }

    // Phase 2: Union all shells first
    let unionResult = Clipper.Union(allShells, undefined, FillRule.NonZero);

    // Phase 3: Subtract all holes from the union result
    if (allHoles.length > 0) {
        // Convert unionResult to Paths64 if needed
        const unionPaths = new Paths64();
        for (let i = 0; i < unionResult.length; i++) {
            unionPaths.push(unionResult[i]);
        }

        // Use Difference to subtract holes
        unionResult = Clipper.Difference(unionPaths, allHoles, FillRule.NonZero);
    }

    // Phase 4: Separate resulting shells and holes based on area sign
    const shells: Path64[] = [];
    const holes: Path64[] = [];

    for (let i = 0; i < unionResult.length; i++) {
        const path = unionResult[i];
        const area = getSignedArea(path);

        // Positive area = CCW = Outer Shell
        // Negative area = CW = Hole
        if (area > 0) {
            shells.push(path);
        } else if (area < 0) {
            holes.push(path);
        }
    }

    // Phase 5: Convert shells to Polygons and assign holes
    const resultPolygons: Polygon[] = shells.map(shell => ({
        points: shell.map(p => ({ x: p.x / SCALAR, y: p.y / SCALAR })),
        holes: []
    }));

    // Assign holes to correct shells using containment test
    for (const holePath of holes) {
        if (holePath.length === 0) continue;

        // Get centroid of hole for more robust containment test
        let sumX = 0, sumY = 0;
        for (const p of holePath) {
            sumX += p.x;
            sumY += p.y;
        }
        const centroid = new Point64(
            Math.round(sumX / holePath.length),
            Math.round(sumY / holePath.length)
        );

        // Find which shell contains this hole
        let assigned = false;
        for (let s = 0; s < shells.length; s++) {
            const shellPath = shells[s];
            // Use Clipper.pointInPolygon: 0=outside, 1=inside, -1=on boundary
            const result = Clipper.pointInPolygon(centroid, shellPath);
            if (result !== 0) { // Inside or on boundary
                resultPolygons[s].holes!.push(
                    holePath.map(p => ({ x: p.x / SCALAR, y: p.y / SCALAR }))
                );
                assigned = true;
                break;
            }
        }

        // If hole wasn't assigned (edge case), add it to the first shell
        if (!assigned && shells.length > 0) {
            resultPolygons[0].holes!.push(
                holePath.map(p => ({ x: p.x / SCALAR, y: p.y / SCALAR }))
            );
        }
    }

    return resultPolygons;
}

/**
 * Check if two polygons overlap or touch
 */
export function polygonsOverlap(poly1: Polygon, poly2: Polygon): boolean {
    const { subject: subject1 } = polygonToSubjectAndClip(poly1);
    const { subject: subject2 } = polygonToSubjectAndClip(poly2);

    const intersection = Clipper.Intersect(subject1, subject2, FillRule.NonZero);
    return intersection.length > 0;
}

/**
 * Find all overlapping pairs
 */
export function findOverlappingPairs(polygons: Polygon[]): [number, number][] {
    const pairs: [number, number][] = [];
    for (let i = 0; i < polygons.length; i++) {
        for (let j = i + 1; j < polygons.length; j++) {
            if (polygonsOverlap(polygons[i], polygons[j])) {
                pairs.push([i, j]);
            }
        }
    }
    return pairs;
}
