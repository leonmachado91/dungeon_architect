"use client";

import { Rect, Line } from "react-konva";
import { WORLD_BOUNDS } from "@/constants/core";
import type { Point } from "@/types";

interface WorldBoundaryProps {
    zoom: number;
    pan: Point;
}

/**
 * Visual indicator of the world bounds.
 * Shows the valid area where content can be placed.
 */
export function WorldBoundary({ zoom, pan }: WorldBoundaryProps) {
    const strokeWidth = 2 / zoom;
    const dashSize = 8 / zoom;

    // Calculate screen position
    const x = WORLD_BOUNDS.MIN_X * zoom + pan.x;
    const y = WORLD_BOUNDS.MIN_Y * zoom + pan.y;
    const width = WORLD_BOUNDS.WIDTH * zoom;
    const height = WORLD_BOUNDS.HEIGHT * zoom;

    return (
        <>
            {/* Subtle fill to indicate valid area */}
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="rgba(235, 219, 178, 0.02)"
                listening={false}
            />
            {/* Border with dashed style */}
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke="rgba(235, 219, 178, 0.3)"
                strokeWidth={strokeWidth}
                dash={[dashSize, dashSize]}
                listening={false}
            />
            {/* Corner markers for emphasis */}
            {/* Top-left */}
            <Line
                points={[
                    x, y + 20 / zoom,
                    x, y,
                    x + 20 / zoom, y,
                ]}
                stroke="#fabd2f"
                strokeWidth={strokeWidth * 1.5}
                listening={false}
            />
            {/* Top-right */}
            <Line
                points={[
                    x + width - 20 / zoom, y,
                    x + width, y,
                    x + width, y + 20 / zoom,
                ]}
                stroke="#fabd2f"
                strokeWidth={strokeWidth * 1.5}
                listening={false}
            />
            {/* Bottom-left */}
            <Line
                points={[
                    x, y + height - 20 / zoom,
                    x, y + height,
                    x + 20 / zoom, y + height,
                ]}
                stroke="#fabd2f"
                strokeWidth={strokeWidth * 1.5}
                listening={false}
            />
            {/* Bottom-right */}
            <Line
                points={[
                    x + width - 20 / zoom, y + height,
                    x + width, y + height,
                    x + width, y + height - 20 / zoom,
                ]}
                stroke="#fabd2f"
                strokeWidth={strokeWidth * 1.5}
                listening={false}
            />
        </>
    );
}
