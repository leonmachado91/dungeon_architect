"use client";

import { Group, Circle, Text } from "react-konva";
import type { Entity, Point } from "@/types";

const ENTITY_TYPE_COLORS: Record<string, string> = {
    npc: "#83a598",        // Gruvbox blue-green
    monster: "#fb4934",    // Gruvbox red
    treasure: "#fabd2f",   // Gruvbox yellow
    hazard: "#fe8019",     // Gruvbox orange
    interactive: "#d3869b", // Gruvbox purple
    door: "#b8bb26",       // Gruvbox green
    window: "#8ec07c",     // Gruvbox aqua
    stairs: "#d79921",     // Gruvbox dark yellow
    furniture: "#928374",  // Gruvbox gray
    wall_feature: "#a89984", // Gruvbox light gray
};

export interface EntityTokenProps {
    entity: Entity;
    zoom: number;
    pan: Point;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDragEnd: (id: string, position: Point) => void;
}

/**
 * Renders an Entity token on the canvas.
 * Displays as a colored circle with name label.
 */
export function EntityToken({ entity, zoom, pan, isSelected, onSelect, onDragEnd }: EntityTokenProps) {
    const x = (entity.position?.x ?? 0) * zoom + pan.x;
    const y = (entity.position?.y ?? 0) * zoom + pan.y;
    const radius = 15 * zoom;

    return (
        <Group
            x={x}
            y={y}
            draggable
            onClick={() => onSelect(entity.id)}
            onTap={() => onSelect(entity.id)}
            onDragEnd={(e) => {
                const node = e.target;
                const newX = (node.x() - pan.x) / zoom;
                const newY = (node.y() - pan.y) / zoom;

                // Reset visual position - store updates actual position
                node.x(x);
                node.y(y);

                onDragEnd(entity.id, { x: newX, y: newY });
            }}
        >
            <Circle
                radius={radius}
                fill={ENTITY_TYPE_COLORS[entity.type] || ENTITY_TYPE_COLORS.npc}
                stroke={isSelected ? "#fabd2f" : "#282828"}
                strokeWidth={isSelected ? 3 : 2}
            />
            <Text
                x={-radius}
                y={radius + 4}
                width={radius * 2}
                text={entity.name}
                fontSize={10}
                fill="#ebdbb2"
                align="center"
                listening={false}
            />
        </Group>
    );
}

export { ENTITY_TYPE_COLORS };
