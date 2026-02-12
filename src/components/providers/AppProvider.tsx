"use client";

import { useEffect, useCallback } from "react";
import { useMapStore, useDbSync, useFloorSpaces, useFloorEntities } from "@/stores";
import { getDatabase, dungeons } from "@/db";
import { desc } from "drizzle-orm";
import debug from "@/lib/debug";

interface AppProviderProps {
    children: React.ReactNode;
}

/**
 * Root provider that handles:
 * - Auto-load last dungeon on mount
 * - Database sync with debounced save
 * - Global keyboard shortcuts (Delete, Undo/Redo, Tab navigation)
 */
export function AppProvider({ children }: AppProviderProps) {
    const dungeon = useMapStore((s) => s.dungeon);
    const selectedSpaceId = useMapStore((s) => s.selectedSpaceId);
    const selectedEntityId = useMapStore((s) => s.selectedEntityId);
    const selectSpace = useMapStore((s) => s.selectSpace);
    const selectEntity = useMapStore((s) => s.selectEntity);
    const removeSpace = useMapStore((s) => s.removeSpace);
    const removeEntity = useMapStore((s) => s.removeEntity);
    const duplicateSpace = useMapStore((s) => s.duplicateSpace);
    const duplicateEntity = useMapStore((s) => s.duplicateEntity);

    // Get floor elements for Tab navigation
    const spaces = useFloorSpaces();
    const entities = useFloorEntities();

    // Get the dungeon ID for sync hook
    const dungeonId = dungeon?.meta.id;

    // Connect database sync - returns loadDungeon function
    const { loadDungeon, saveDungeon } = useDbSync(dungeonId);

    // Auto-load last dungeon on mount
    useEffect(() => {
        async function loadLastDungeon() {
            try {
                const db = await getDatabase();

                // Get most recent dungeon
                const [lastDungeon] = await db
                    .select({ id: dungeons.id })
                    .from(dungeons)
                    .orderBy(desc(dungeons.updatedAt))
                    .limit(1);

                if (lastDungeon) {
                    debug.log("[App] Auto-loading last dungeon:", lastDungeon.id);
                    await loadDungeon(lastDungeon.id);
                }
            } catch (error) {
                console.error("[App] Error loading last dungeon:", error);
            }
        }

        // Only load if no dungeon is set
        if (!dungeon) {
            loadLastDungeon();
        }
    }, [loadDungeon]); // eslint-disable-line react-hooks/exhaustive-deps

    // Keyboard handler for Delete, Undo/Redo, Tab navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only handle if not in input/textarea
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        // Build selectable items list
        const selectableItems = [
            ...spaces.map((s) => ({ type: "space" as const, id: s.id })),
            ...entities.map((ent) => ({ type: "entity" as const, id: ent.id })),
        ];

        const getCurrentIndex = () => {
            if (selectedSpaceId) {
                return selectableItems.findIndex(
                    (item) => item.type === "space" && item.id === selectedSpaceId
                );
            }
            if (selectedEntityId) {
                return selectableItems.findIndex(
                    (item) => item.type === "entity" && item.id === selectedEntityId
                );
            }
            return -1;
        };

        const selectByIndex = (index: number) => {
            if (selectableItems.length === 0) return;
            const wrappedIndex =
                ((index % selectableItems.length) + selectableItems.length) %
                selectableItems.length;
            const item = selectableItems[wrappedIndex];
            if (item.type === "space") {
                selectSpace(item.id);
            } else {
                selectEntity(item.id);
            }
        };

        // Tab = Navigate between elements (only when canvas area is focused)
        if (e.key === "Tab") {
            const activeEl = document.activeElement;
            const isCanvasFocused = activeEl?.closest("[data-canvas]") !== null
                || activeEl === document.body;
            if (!isCanvasFocused) return; // let browser handle Tab normally
            e.preventDefault();
            const currentIndex = getCurrentIndex();
            if (e.shiftKey) {
                selectByIndex(currentIndex - 1);
            } else {
                selectByIndex(currentIndex + 1);
            }
            return;
        }

        // Escape = Deselect all
        if (e.key === "Escape") {
            selectSpace(null);
            selectEntity(null);
            return;
        }

        // Ctrl+Z = Undo
        if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
            e.preventDefault();
            const temporal = useMapStore.temporal.getState();
            if (temporal.pastStates.length > 0) {
                temporal.undo();
                // Mark as dirty and save immediately after undo
                useMapStore.setState({ isDirty: true });
                saveDungeon();
                debug.log("[App] Undo triggered + saved");
            }
            return;
        }

        // Ctrl+Y or Ctrl+Shift+Z = Redo
        if ((e.ctrlKey && e.key.toLowerCase() === "y") || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z")) {
            e.preventDefault();
            const temporal = useMapStore.temporal.getState();
            if (temporal.futureStates.length > 0) {
                temporal.redo();
                // Mark as dirty and save immediately after redo
                useMapStore.setState({ isDirty: true });
                saveDungeon();
                debug.log("[App] Redo triggered + saved");
            }
            return;
        }

        // Delete or Backspace to remove selected element
        if (e.key === "Delete" || e.key === "Backspace") {
            if (selectedSpaceId) {
                removeSpace(selectedSpaceId);
                debug.log("[App] Deleted space:", selectedSpaceId);
            } else if (selectedEntityId) {
                removeEntity(selectedEntityId);
                debug.log("[App] Deleted entity:", selectedEntityId);
            }
        }

        // Ctrl+S = Force save
        if (e.ctrlKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            saveDungeon();
            debug.log("[App] Force save triggered");
        }

        // Ctrl+D = Duplicate selected element
        if (e.ctrlKey && e.key.toLowerCase() === "d") {
            e.preventDefault();
            if (selectedSpaceId) {
                duplicateSpace(selectedSpaceId);
                debug.log("[App] Duplicated space:", selectedSpaceId);
            } else if (selectedEntityId) {
                duplicateEntity(selectedEntityId);
                debug.log("[App] Duplicated entity:", selectedEntityId);
            }
        }
    }, [selectedSpaceId, selectedEntityId, spaces, entities, selectSpace, selectEntity, removeSpace, removeEntity, duplicateSpace, duplicateEntity, saveDungeon]);

    // Register keyboard listeners
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return <>{children}</>;
}
