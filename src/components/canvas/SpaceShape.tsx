"use client";

import { Group, Line, Text } from "react-konva";
import type { Space, Point } from "@/types";

const GRID_SIZE = 40;

const SPACE_COLORS: Record<string, string> = {
    room: "#458588",      // Gruvbox blue
    corridor: "#689d6a",  // Gruvbox aqua
    stairs: "#d79921",    // Gruvbox yellow
    outdoor: "#98971a",   // Gruvbox green
};

function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
    return Math.round(value / gridSize) * gridSize;
}

export interface SpaceShapeProps {
    space: Space;
    isSelected: boolean;
    zoom: number;
    pan: Point;
    onSelect: (id: string) => void;
    onDragEnd: (id: string, delta: Point) => void;
    isLocked: boolean;
}

/**
 * Renders a Space polygon on the canvas.
 * Handles selection, dragging (with snap to grid), and visual appearance.
 */
export function SpaceShape({ space, isSelected, zoom, pan, onSelect, onDragEnd, isLocked }: SpaceShapeProps) {
    if (!space.geometry?.points?.length) return null;

    const color = SPACE_COLORS[space.spaceType] || SPACE_COLORS.room;

    // Calculate bounding box for the group
    const minX = Math.min(...space.geometry.points.map(p => p.x));
    const minY = Math.min(...space.geometry.points.map(p => p.y));

    // Points relative to the group origin
    const relativePoints = space.geometry.points.flatMap((p) => [
        (p.x - minX) * zoom,
        (p.y - minY) * zoom,
    ]);

    // Calculate center for label
    const centerX = space.geometry.points.reduce((sum, p) => sum + p.x - minX, 0) / space.geometry.points.length;
    const centerY = space.geometry.points.reduce((sum, p) => sum + p.y - minY, 0) / space.geometry.points.length;

    return (
        <Group
            x={minX * zoom + pan.x}
            y={minY * zoom + pan.y}
            draggable={!isLocked}
            onClick={() => onSelect(space.id)}
            onTap={() => onSelect(space.id)}
            onDragEnd={(e) => {
                const node = e.target;
                const newX = (node.x() - pan.x) / zoom;
                const newY = (node.y() - pan.y) / zoom;

                const deltaX = snapToGrid(newX - minX);
                const deltaY = snapToGrid(newY - minY);

                // Reset visual position (store updates actual position)
                node.x(minX * zoom + pan.x);
                node.y(minY * zoom + pan.y);

                if (deltaX !== 0 || deltaY !== 0) {
                    onDragEnd(space.id, { x: deltaX, y: deltaY });
                }
            }}
        >
            <Line
                points={relativePoints}
                closed
                fill={`${color}40`}
                stroke={isSelected ? "#fabd2f" : color}
                strokeWidth={isSelected ? 3 : 2}
                hitStrokeWidth={10}
            />
            <Text
                x={centerX * zoom - 40}
                y={centerY * zoom - 8}
                width={80}
                text={space.name}
                fontSize={12}
                fill="#ebdbb2"
                align="center"
                listening={false}
            />
        </Group>
    );
}

export { SPACE_COLORS, snapToGrid };
