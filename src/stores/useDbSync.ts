"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMapStore } from "./mapStore";
import { getDatabase, dungeons, floors, spaces, zones, connections, entities } from "@/db";
import { eq, and, notInArray } from "drizzle-orm";
import debug from "@/lib/debug";
import type { DungeonMap, Floor, Space, Zone, Connection, Entity } from "@/types";

const DEBOUNCE_MS = 300;

/**
 * Hook to sync Zustand store with PGLite database
 * - Loads data on mount
 * - Saves changes with debounce
 */
export function useDbSync(dungeonId?: string) {
    const dungeon = useMapStore((s) => s.dungeon);
    const isDirty = useMapStore((s) => s.isDirty);
    const setDungeon = useMapStore((s) => s.setDungeon);
    const setSaving = useMapStore((s) => s.setSaving);
    const markClean = useMapStore((s) => s.markClean);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false);

    // Load dungeon from DB
    const loadDungeon = useCallback(async (id: string) => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        try {
            const db = await getDatabase();

            // Fetch dungeon
            const [dungeonRecord] = await db
                .select()
                .from(dungeons)
                .where(eq(dungeons.id, id));

            if (!dungeonRecord) {
                debug.log("[Sync] Dungeon not found:", id);
                isLoadingRef.current = false;
                return;
            }

            // Fetch floors
            const floorRecords = await db
                .select()
                .from(floors)
                .where(eq(floors.dungeonId, id));

            // Fetch spaces and zones for each floor
            const floorsWithSpaces: Floor[] = await Promise.all(
                floorRecords.map(async (floor) => {
                    const spaceRecords = await db
                        .select()
                        .from(spaces)
                        .where(eq(spaces.floorId, floor.id));

                    // Fetch zones for each space
                    const spacesWithZones: Space[] = await Promise.all(
                        spaceRecords.map(async (s) => {
                            const zoneRecords = await db
                                .select()
                                .from(zones)
                                .where(eq(zones.spaceId, s.id));

                            return {
                                id: s.id,
                                floorId: s.floorId ?? floor.id,
                                name: s.name,
                                description: s.description ?? "",
                                visualPrompt: s.visualPrompt ?? "",
                                geometry: s.geometry ?? { points: [] },
                                zones: zoneRecords.map((z): Zone => ({
                                    id: z.id,
                                    spaceId: z.spaceId ?? s.id,
                                    name: z.name,
                                    description: z.description ?? "",
                                    visualPrompt: z.visualPrompt ?? "",
                                    area: z.area ?? { points: [] },
                                })),
                                lighting: s.lighting ?? "dim",
                                spaceType: s.spaceType ?? "room",
                                floorType: s.floorType ?? undefined,
                            };
                        })
                    );

                    return {
                        id: floor.id,
                        dungeonId: floor.dungeonId ?? id,
                        level: floor.level,
                        name: floor.name,
                        rendered: floor.rendered ?? false,
                        renderUrl: floor.renderUrl ?? undefined,
                        spaces: spacesWithZones,
                    };
                })
            );

            // Fetch connections
            const connectionRecords = await db
                .select()
                .from(connections)
                .where(eq(connections.dungeonId, id));

            const loadedConnections: Connection[] = connectionRecords.map((c) => ({
                id: c.id,
                dungeonId: c.dungeonId ?? id,
                type: c.type ?? "door",
                from: {
                    spaceId: c.fromSpaceId ?? "",
                    position: c.fromPosition ?? { x: 0, y: 0 },
                },
                to: {
                    spaceId: c.toSpaceId ?? "",
                    position: c.toPosition ?? { x: 0, y: 0 },
                },
                state: c.state ?? "closed",
                material: c.material ?? undefined,
            }));

            // Fetch entities
            const entityRecords = await db
                .select()
                .from(entities)
                .where(eq(entities.dungeonId, id));

            const loadedEntities: Entity[] = entityRecords.map((e) => ({
                id: e.id,
                dungeonId: e.dungeonId ?? id,
                floorId: e.floorId ?? "",
                type: e.type ?? "npc",
                name: e.name,
                description: e.description ?? "",
                position: e.position ?? { x: 0, y: 0 },
                icon: e.icon ?? "person",
                interactionScript: e.interactionScript ?? undefined,
            }));

            const dungeonMap: DungeonMap = {
                meta: {
                    id: dungeonRecord.id,
                    name: dungeonRecord.name,
                    theme: dungeonRecord.theme,
                    atmosphere: dungeonRecord.atmosphere ?? "",
                    resolution: dungeonRecord.resolution ?? "1024x1024",
                    createdAt: dungeonRecord.createdAt ?? new Date(),
                    updatedAt: dungeonRecord.updatedAt ?? new Date(),
                },
                floors: floorsWithSpaces,
                connections: loadedConnections,
                entities: loadedEntities,
            };

            setDungeon(dungeonMap);
            markClean();
            debug.log("[Sync] Dungeon loaded:", id, {
                floors: floorsWithSpaces.length,
                connections: loadedConnections.length,
                entities: loadedEntities.length,
            });
        } catch (error) {
            console.error("[Sync] Error loading dungeon:", error);
        } finally {
            isLoadingRef.current = false;
        }
    }, [setDungeon, markClean]);

    // Save dungeon to DB
    const saveDungeon = useCallback(async () => {
        const currentDungeon = useMapStore.getState().dungeon;
        if (!currentDungeon) return;

        setSaving(true);

        try {
            const db = await getDatabase();

            // Upsert dungeon
            await db
                .insert(dungeons)
                .values({
                    id: currentDungeon.meta.id,
                    name: currentDungeon.meta.name,
                    theme: currentDungeon.meta.theme,
                    atmosphere: currentDungeon.meta.atmosphere,
                    resolution: currentDungeon.meta.resolution,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: dungeons.id,
                    set: {
                        name: currentDungeon.meta.name,
                        theme: currentDungeon.meta.theme,
                        atmosphere: currentDungeon.meta.atmosphere,
                        resolution: currentDungeon.meta.resolution,
                        updatedAt: new Date(),
                    },
                });

            // Upsert floors, spaces, and zones
            for (const floor of currentDungeon.floors) {
                await db
                    .insert(floors)
                    .values({
                        id: floor.id,
                        dungeonId: currentDungeon.meta.id,
                        level: floor.level,
                        name: floor.name,
                        rendered: floor.rendered,
                        renderUrl: floor.renderUrl,
                    })
                    .onConflictDoUpdate({
                        target: floors.id,
                        set: {
                            level: floor.level,
                            name: floor.name,
                            rendered: floor.rendered,
                            renderUrl: floor.renderUrl,
                        },
                    });

                // Get current space IDs in state
                const currentSpaceIds = floor.spaces.map(s => s.id);

                // Delete spaces that are no longer in state
                if (currentSpaceIds.length > 0) {
                    await db
                        .delete(spaces)
                        .where(
                            and(
                                eq(spaces.floorId, floor.id),
                                notInArray(spaces.id, currentSpaceIds)
                            )
                        );
                } else {
                    await db.delete(spaces).where(eq(spaces.floorId, floor.id));
                }

                // Upsert spaces and zones
                for (const space of floor.spaces) {
                    await db
                        .insert(spaces)
                        .values({
                            id: space.id,
                            floorId: floor.id,
                            name: space.name,
                            description: space.description,
                            visualPrompt: space.visualPrompt,
                            geometry: space.geometry,
                            lighting: space.lighting,
                            spaceType: space.spaceType,
                            floorType: space.floorType,
                        })
                        .onConflictDoUpdate({
                            target: spaces.id,
                            set: {
                                name: space.name,
                                description: space.description,
                                visualPrompt: space.visualPrompt,
                                geometry: space.geometry,
                                lighting: space.lighting,
                                spaceType: space.spaceType,
                                floorType: space.floorType,
                            },
                        });

                    // Handle zones
                    const currentZoneIds = space.zones.map(z => z.id);

                    if (currentZoneIds.length > 0) {
                        await db
                            .delete(zones)
                            .where(
                                and(
                                    eq(zones.spaceId, space.id),
                                    notInArray(zones.id, currentZoneIds)
                                )
                            );
                    } else {
                        await db.delete(zones).where(eq(zones.spaceId, space.id));
                    }

                    for (const zone of space.zones) {
                        await db
                            .insert(zones)
                            .values({
                                id: zone.id,
                                spaceId: space.id,
                                name: zone.name,
                                description: zone.description,
                                visualPrompt: zone.visualPrompt,
                                area: zone.area,
                            })
                            .onConflictDoUpdate({
                                target: zones.id,
                                set: {
                                    name: zone.name,
                                    description: zone.description,
                                    visualPrompt: zone.visualPrompt,
                                    area: zone.area,
                                },
                            });
                    }
                }
            }

            // Handle connections
            const currentConnectionIds = currentDungeon.connections.map(c => c.id);

            if (currentConnectionIds.length > 0) {
                await db
                    .delete(connections)
                    .where(
                        and(
                            eq(connections.dungeonId, currentDungeon.meta.id),
                            notInArray(connections.id, currentConnectionIds)
                        )
                    );
            } else {
                await db.delete(connections).where(eq(connections.dungeonId, currentDungeon.meta.id));
            }

            for (const conn of currentDungeon.connections) {
                await db
                    .insert(connections)
                    .values({
                        id: conn.id,
                        dungeonId: currentDungeon.meta.id,
                        type: conn.type,
                        fromSpaceId: conn.from.spaceId,
                        fromPosition: conn.from.position,
                        toSpaceId: conn.to.spaceId,
                        toPosition: conn.to.position,
                        state: conn.state,
                        material: conn.material,
                    })
                    .onConflictDoUpdate({
                        target: connections.id,
                        set: {
                            type: conn.type,
                            fromSpaceId: conn.from.spaceId,
                            fromPosition: conn.from.position,
                            toSpaceId: conn.to.spaceId,
                            toPosition: conn.to.position,
                            state: conn.state,
                            material: conn.material,
                        },
                    });
            }

            // Handle entities
            const currentEntityIds = currentDungeon.entities.map(e => e.id);

            if (currentEntityIds.length > 0) {
                await db
                    .delete(entities)
                    .where(
                        and(
                            eq(entities.dungeonId, currentDungeon.meta.id),
                            notInArray(entities.id, currentEntityIds)
                        )
                    );
            } else {
                await db.delete(entities).where(eq(entities.dungeonId, currentDungeon.meta.id));
            }

            for (const entity of currentDungeon.entities) {
                await db
                    .insert(entities)
                    .values({
                        id: entity.id,
                        dungeonId: currentDungeon.meta.id,
                        floorId: entity.floorId,
                        type: entity.type,
                        name: entity.name,
                        description: entity.description,
                        position: entity.position,
                        icon: entity.icon,
                        interactionScript: entity.interactionScript,
                    })
                    .onConflictDoUpdate({
                        target: entities.id,
                        set: {
                            floorId: entity.floorId,
                            type: entity.type,
                            name: entity.name,
                            description: entity.description,
                            position: entity.position,
                            icon: entity.icon,
                            interactionScript: entity.interactionScript,
                        },
                    });
            }

            markClean();
            debug.log("[Sync] Dungeon saved:", currentDungeon.meta.id);
        } catch (error) {
            console.error("[Sync] Error saving dungeon:", error);
        } finally {
            setSaving(false);
        }
    }, [setSaving, markClean]);

    // Load on mount
    useEffect(() => {
        if (dungeonId) {
            loadDungeon(dungeonId);
        }
    }, [dungeonId, loadDungeon]);

    // Debounced save on changes
    useEffect(() => {
        if (!isDirty || !dungeon) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveDungeon();
        }, DEBOUNCE_MS);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [isDirty, dungeon, saveDungeon]);

    // Save immediately on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            const state = useMapStore.getState();
            if (state.isDirty && state.dungeon) {
                saveDungeon();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [saveDungeon]);

    return {
        loadDungeon,
        saveDungeon,
    };
}
