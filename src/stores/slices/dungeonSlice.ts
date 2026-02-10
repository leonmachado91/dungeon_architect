import { MapSlice, DungeonSlice } from "../store-types";
import type { DungeonMap, Floor, Space, Entity, Connection } from "@/types";
import { mergePolygons } from "@/lib/polygonMerge";

export const createDungeonSlice: MapSlice<DungeonSlice> = (set) => ({
    dungeon: null,

    setDungeon: (dungeon: DungeonMap | null) => set((state) => {
        state.dungeon = dungeon;
        state.isDirty = true;
        if (dungeon && dungeon.floors.length > 0) {
            state.currentFloorId = dungeon.floors[0].id;
        }
    }),

    createEmptyDungeon: (name = "Novo Mapa") => set((state) => {
        const dungeonId = crypto.randomUUID();
        const floorId = crypto.randomUUID();

        state.dungeon = {
            meta: {
                id: dungeonId,
                name,
                theme: "medieval",
                atmosphere: "",
                resolution: "1024x1024",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            floors: [{
                id: floorId,
                dungeonId,
                level: 0,
                name: "Piso Térreo",
                rendered: false,
                spaces: [],
            }],
            connections: [],
            entities: [],
        };
        state.currentFloorId = floorId;
        state.selectedSpaceId = null;
        state.selectedEntityId = null;
        state.isDirty = true;
    }),

    updateDungeonMeta: (updates: Partial<DungeonMap["meta"]>) => set((state) => {
        if (state.dungeon) {
            Object.assign(state.dungeon.meta, updates);
            state.dungeon.meta.updatedAt = new Date();
            state.isDirty = true;
        }
    }),

    addFloor: (floor: Floor) => set((state) => {
        if (state.dungeon) {
            state.dungeon.floors.push(floor);
            state.isDirty = true;
        }
    }),

    updateFloor: (floorId: string, updates: Partial<Floor>) => set((state) => {
        if (state.dungeon) {
            const floor = state.dungeon.floors.find((f) => f.id === floorId);
            if (floor) {
                Object.assign(floor, updates);
                state.isDirty = true;
            }
        }
    }),

    removeFloor: (floorId: string) => set((state) => {
        if (state.dungeon) {
            state.dungeon.floors = state.dungeon.floors.filter((f) => f.id !== floorId);
            if (state.currentFloorId === floorId) {
                state.currentFloorId = state.dungeon.floors[0]?.id ?? null;
            }
            state.isDirty = true;
        }
    }),

    addSpace: (space: Space) => set((state) => {
        if (state.dungeon) {
            const floor = state.dungeon.floors.find((f) => f.id === space.floorId);
            if (floor) {
                floor.spaces.push(space);
                state.isDirty = true;
            }
        }
    }),

    updateSpace: (spaceId: string, updates: Partial<Space>) => set((state) => {
        if (state.dungeon) {
            for (const floor of state.dungeon.floors) {
                const space = floor.spaces.find((s) => s.id === spaceId);
                if (space) {
                    Object.assign(space, updates);
                    state.isDirty = true;
                    break;
                }
            }
        }
    }),

    removeSpace: (spaceId: string) => set((state) => {
        if (state.dungeon) {
            for (const floor of state.dungeon.floors) {
                floor.spaces = floor.spaces.filter((s) => s.id !== spaceId);
            }
            if (state.selectedSpaceId === spaceId) {
                state.selectedSpaceId = null;
            }
            state.isDirty = true;
        }
    }),

    mergeSpaces: (spaceIds: string[]) => set((state) => {
        if (!state.dungeon || !state.currentFloorId || spaceIds.length < 2) return;

        const floor = state.dungeon.floors.find(f => f.id === state.currentFloorId);
        if (!floor) return;

        const spacesToMerge = floor.spaces.filter(s => spaceIds.includes(s.id));
        if (spacesToMerge.length < 2) return;

        const baseSpace = spacesToMerge[0];
        const polygons = spacesToMerge.map(s => s.geometry);
        const mergedPolygons = mergePolygons(polygons);

        if (mergedPolygons.length === 0) return;

        const mergedSpace: Space = {
            ...baseSpace,
            id: crypto.randomUUID(),
            name: `${baseSpace.name} (merged)`,
            geometry: mergedPolygons[0],
        };

        floor.spaces = floor.spaces.filter(s => !spaceIds.includes(s.id));
        floor.spaces.push(mergedSpace);

        for (let i = 1; i < mergedPolygons.length; i++) {
            floor.spaces.push({
                ...baseSpace,
                id: crypto.randomUUID(),
                name: `${baseSpace.name} (merged ${i + 1})`,
                geometry: mergedPolygons[i],
            });
        }

        state.selectedSpaceId = mergedSpace.id;
        state.isDirty = true;
    }),

    duplicateSpace: (spaceId: string) => set((state) => {
        if (!state.dungeon || !state.currentFloorId) return;

        const floor = state.dungeon.floors.find((f) => f.id === state.currentFloorId);
        if (!floor) return;

        const space = floor.spaces.find((s) => s.id === spaceId);
        if (!space) return;

        const offsetPoints = space.geometry.points.map((p) => ({
            x: p.x + 40,
            y: p.y + 40,
        }));
        const offsetHoles = space.geometry.holes?.map(hole => hole.map(p => ({
            x: p.x + 40,
            y: p.y + 40
        })));

        const newSpace: Space = {
            ...space,
            id: crypto.randomUUID(),
            name: `${space.name} (copy)`,
            geometry: { points: offsetPoints, holes: offsetHoles },
            zones: [],
        };

        floor.spaces.push(newSpace);
        state.selectedSpaceId = newSpace.id;
        state.isDirty = true;
    }),

    addEntity: (entity: Entity) => set((state) => {
        if (state.dungeon) {
            state.dungeon.entities.push(entity);
            state.isDirty = true;
        }
    }),

    updateEntity: (entityId: string, updates: Partial<Entity>) => set((state) => {
        if (state.dungeon) {
            const entity = state.dungeon.entities.find((e) => e.id === entityId);
            if (entity) {
                Object.assign(entity, updates);
                state.isDirty = true;
            }
        }
    }),

    removeEntity: (entityId: string) => set((state) => {
        if (state.dungeon) {
            state.dungeon.entities = state.dungeon.entities.filter((e) => e.id !== entityId);
            if (state.selectedEntityId === entityId) {
                state.selectedEntityId = null;
            }
            state.isDirty = true;
        }
    }),

    duplicateEntity: (entityId: string) => set((state) => {
        if (!state.dungeon) return;

        const entity = state.dungeon.entities.find((e) => e.id === entityId);
        if (!entity) return;

        const newEntity: Entity = {
            ...entity,
            id: crypto.randomUUID(),
            name: `${entity.name} (copy)`,
            position: {
                x: entity.position.x + 40,
                y: entity.position.y + 40,
            },
        };

        state.dungeon.entities.push(newEntity);
        state.selectedEntityId = newEntity.id;
        state.isDirty = true;
    }),

    addConnection: (connection: Connection) => set((state) => {
        if (state.dungeon) {
            state.dungeon.connections.push(connection);
            state.isDirty = true;
        }
    }),

    removeConnection: (connectionId: string) => set((state) => {
        if (state.dungeon) {
            state.dungeon.connections = state.dungeon.connections.filter(
                (c) => c.id !== connectionId
            );
            state.isDirty = true;
        }
    }),
});
