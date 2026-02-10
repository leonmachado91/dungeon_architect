"use client";

import { generateMap } from "@/actions";
import type { DungeonMap, Floor, Space } from "@/types";

/**
 * Converts AI-generated map response to the store format.
 * Handles all the mapping between API schema and local data model.
 */
export function convertToStoreDungeon(
    data: ReturnType<typeof generateMap> extends Promise<infer R>
        ? R extends { data: infer D } ? D : never
        : never
): DungeonMap {
    return {
        meta: {
            id: data?.id ?? crypto.randomUUID(),
            name: data?.name ?? "Dungeon Gerado",
            theme: data?.theme ?? "medieval",
            atmosphere: data?.atmosphere ?? "",
            resolution: "1024x1024",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        floors: (data?.floors ?? []).map((floor): Floor => ({
            id: floor.id,
            dungeonId: data?.id ?? "",
            level: floor.level,
            name: floor.name,
            rendered: false,
            spaces: floor.spaces.map((space): Space => ({
                id: space.id,
                floorId: floor.id,
                name: space.name,
                description: space.description ?? "",
                visualPrompt: space.visualPrompt ?? "",
                geometry: {
                    points: space.polygon.map((p) => ({ x: p.x, y: p.y })),
                },
                zones: [],
                lighting: space.lighting ?? "dim",
                spaceType: space.spaceType,
                floorType: space.floorType,
            })),
        })),
        connections: (data?.connections ?? []).map((conn) => ({
            id: conn.id,
            dungeonId: data?.id ?? "",
            type: conn.type,
            from: {
                spaceId: conn.fromSpaceId,
                position: { x: 0, y: 0 },
            },
            to: {
                spaceId: conn.toSpaceId,
                position: { x: 0, y: 0 },
            },
            state: conn.state,
            material: conn.material,
        })),
        entities: (data?.entities ?? []).map((entity) => ({
            id: entity.id,
            dungeonId: data?.id ?? "",
            type: entity.type,
            name: entity.name,
            description: entity.description ?? "",
            position: entity.position ?? { x: 0, y: 0 },
            floorId: entity.floorId,
            icon: entity.icon,
        })),
    };
}
