"use client";

import { Line } from "react-konva";
import type { Point } from "@/types";

const GRID_SIZE = 40;

interface GridLayerProps {
    width: number;
    height: number;
    zoom: number;
    pan: Point;
}

/**
 * Renders the background grid over the canvas.
 * Handles grid alignment with zoom and pan transformations.
 */
export function GridLayer({ width, height, zoom, pan }: GridLayerProps) {
    const lines: React.ReactNode[] = [];
    const gridStep = GRID_SIZE * zoom;

    // Don't render if grid is too small to see
    if (gridStep < 5) return null;

    const extraLines = 2;
    const offsetX = pan.x % gridStep;
    const offsetY = pan.y % gridStep;

    const numVertical = Math.ceil(width / gridStep) + extraLines * 2;
    const numHorizontal = Math.ceil(height / gridStep) + extraLines * 2;

    // Vertical lines
    for (let i = -extraLines; i < numVertical; i++) {
        const x = i * gridStep + offsetX;
        lines.push(
            <Line
                key={`v-${i}`}
                points={[x, 0, x, height]}
                stroke="rgba(235, 219, 178, 0.15)"
                strokeWidth={1}
            />
        );
    }

    // Horizontal lines
    for (let i = -extraLines; i < numHorizontal; i++) {
        const y = i * gridStep + offsetY;
        lines.push(
            <Line
                key={`h-${i}`}
                points={[0, y, width, y]}
                stroke="rgba(235, 219, 178, 0.15)"
                strokeWidth={1}
            />
        );
    }

    return <>{lines}</>;
}

export { GRID_SIZE };
