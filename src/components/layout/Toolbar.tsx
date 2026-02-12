"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useMapStore, useCurrentFloor, useFloorSpaces, useFloorEntities, useSettingsStore } from "@/stores";
import { renderFloorWithSkeleton } from "@/actions/generateImage";
import { renderSkeleton } from "@/lib/skeleton/renderer";
import { buildRenderPrompt } from "@/lib/promptBuilder";
import debug from "@/lib/debug";

interface ToolButtonProps {
    active: boolean;
    icon: string;
    title: string;
    onClick: () => void;
}

function ToolButton({ active, icon, title, onClick }: ToolButtonProps) {
    return (
        <button
            className={`p-2 rounded transition-colors ${active
                ? "bg-[var(--red)] text-[var(--fg)]"
                : "hover:bg-[var(--bg-soft)] text-[var(--fg-alt)]"
                }`}
            title={title}
            onClick={onClick}
        >
            <MaterialIcon name={icon} size="sm" />
        </button>
    );
}

export function Toolbar() {
    const [isRendering, setIsRendering] = useState(false);
    const [showFloorDropdown, setShowFloorDropdown] = useState(false);

    const exportCanvas = useMapStore((s) => s.exportCanvas);
    const tool = useMapStore((s) => s.tool);
    const setTool = useMapStore((s) => s.setTool);
    const dungeon = useMapStore((s) => s.dungeon);
    const updateFloor = useMapStore((s) => s.updateFloor);
    const selectedSpaceId = useMapStore((s) => s.selectedSpaceId);
    const selectedEntityId = useMapStore((s) => s.selectedEntityId);
    const removeSpace = useMapStore((s) => s.removeSpace);
    const removeEntity = useMapStore((s) => s.removeEntity);
    const currentFloorId = useMapStore((s) => s.currentFloorId);
    const setCurrentFloor = useMapStore((s) => s.setCurrentFloor);
    const addFloor = useMapStore((s) => s.addFloor);
    const removeFloorFn = useMapStore((s) => s.removeFloor);

    // Zundo temporal store for undo/redo
    const { undo, redo, pastStates, futureStates } = useMapStore.temporal.getState();
    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;
    const hasSelection = selectedSpaceId || selectedEntityId;

    const currentFloor = useCurrentFloor();
    const spaces = useFloorSpaces();
    const floors = dungeon?.floors || [];

    const handleDelete = () => {
        if (selectedSpaceId) {
            removeSpace(selectedSpaceId);
        } else if (selectedEntityId) {
            removeEntity(selectedEntityId);
        }
    };

    const handleUndo = () => {
        undo();
        useMapStore.setState({ isDirty: true });
    };

    const handleRedo = () => {
        redo();
        useMapStore.setState({ isDirty: true });
    };

    // Get entities for the current floor
    const entities = useFloorEntities();
    const renderModel = useSettingsStore((s) => s.renderModel);
    const { debugFit, debugPlaceholder, setDebugFit, setDebugPlaceholder } = useSettingsStore();

    const handleRender = async () => {
        debug.log("[Toolbar] handleRender called", {
            currentFloor: currentFloor?.id,
            spacesCount: spaces.length,
            entitiesCount: entities.length,
            isRendering
        });

        if (!currentFloor || !dungeon || spaces.length === 0 || isRendering) {
            debug.log("[Toolbar] Render aborted - conditions not met");
            return;
        }

        setIsRendering(true);
        debug.log("[Toolbar] Starting semantic render for floor:", currentFloor.id);

        try {
            // 1. Generate skeleton canvas (grayscale)
            // Using new Semantic Skeleton Renderer (Phase 6)
            debug.log("[Toolbar] Generating skeleton canvas...");

            const skeletonDataUrl = await renderSkeleton(dungeon, currentFloor.id);
            const skeletonBase64 = skeletonDataUrl.replace(/^data:image\/png;base64,/, "");
            debug.log("[Toolbar] Skeleton generated, size:", Math.round(skeletonBase64.length / 1024), "KB");

            // 3. Build structured prompt with XML sections
            const prompt = buildRenderPrompt({
                dungeon,
                floor: currentFloor,
            });
            debug.log("[Toolbar] Prompt generated, length:", prompt.length, "chars");

            // 4. Call AI with skeleton reference + prompt
            const result = await renderFloorWithSkeleton({
                prompt,
                skeletonBase64,
                renderModel,
            });
            debug.log("[Toolbar] renderFloorWithSkeleton result:", result.success);

            if (result.success && result.imageUrl) {
                debug.log("[Toolbar] Updating floor with renderUrl");
                updateFloor(currentFloor.id, {
                    renderUrl: result.imageUrl,
                    rendered: true
                });
                debug.log("[Toolbar] Floor updated successfully");
            } else {
                console.error("[Toolbar] Render failed:", result.error);
            }
        } catch (error) {
            console.error("[Toolbar] Render error:", error);
        } finally {
            setIsRendering(false);
            debug.log("[Toolbar] Render complete");
        }
    };

    const canRender = dungeon && currentFloor && spaces.length > 0 && !isRendering;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-toolbar)]">
            <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--gray)]/40 rounded-lg px-2 py-1.5 shadow-lg hover:-translate-y-0.5 transition-transform">
                {/* Tools */}
                <ToolButton
                    active={tool === "select"}
                    icon="near_me"
                    title="Selecionar (V)"
                    onClick={() => setTool("select")}
                />
                <ToolButton
                    active={tool === "draw"}
                    icon="crop_square"
                    title="Desenhar Retângulo (R)"
                    onClick={() => setTool("draw")}
                />
                <ToolButton
                    active={tool === "entity"}
                    icon="person_pin_circle"
                    title="Adicionar Entidade (E)"
                    onClick={() => setTool("entity")}
                />
                <ToolButton
                    active={tool === "pan"}
                    icon="pan_tool"
                    title="Mover Canvas (H)"
                    onClick={() => setTool("pan")}
                />

                <div className="w-px h-6 bg-[var(--gray)]/30 mx-1" />

                {/* Layers - Floor Selector */}
                <div className="relative">
                    <button
                        className={`p-2 rounded transition-colors flex items-center gap-1 ${showFloorDropdown ? "bg-[var(--yellow)]/20 text-[var(--yellow)]" : "hover:bg-[var(--bg-soft)] text-[var(--fg-alt)]"}`}
                        title="Andares"
                        onClick={() => setShowFloorDropdown(!showFloorDropdown)}
                    >
                        <MaterialIcon name="layers" size="sm" />
                        {currentFloor && (
                            <span className="text-xs font-medium">{currentFloor.name.replace("Andar ", "")}</span>
                        )}
                    </button>

                    {showFloorDropdown && (
                        <div
                            className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--bg)] border border-[var(--gray)]/30 rounded-lg shadow-xl z-50 overflow-hidden"
                            onMouseLeave={() => setShowFloorDropdown(false)}
                        >
                            <div className="p-2 border-b border-[var(--gray)]/20">
                                <span className="text-xs text-[var(--fg-alt)] uppercase tracking-wide">Andares</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                {floors.map((floor) => (
                                    <div key={floor.id} className="flex items-center w-full hover:bg-[var(--bg-soft)] group">
                                        <button
                                            className={`flex-1 px-3 py-2 text-left text-sm flex items-center gap-2 ${floor.id === currentFloorId
                                                ? "bg-[var(--yellow)]/10 text-[var(--yellow)]"
                                                : "text-[var(--fg)]"
                                                }`}
                                            onClick={() => {
                                                setCurrentFloor(floor.id);
                                                setShowFloorDropdown(false);
                                            }}
                                        >
                                            <MaterialIcon
                                                name={floor.id === currentFloorId ? "check_circle" : "layers"}
                                                size="sm"
                                            />
                                            <span className="flex-1 truncate">{floor.name}</span>
                                            <span className="text-xs text-[var(--fg-alt)]">L{floor.level}</span>
                                        </button>

                                        {floors.length > 1 && (
                                            <button
                                                className="p-1 mr-2 rounded hover:bg-[var(--red)]/20 text-[var(--fg-alt)] hover:text-[var(--red)] opacity-0 group-hover:opacity-100 transition-all"
                                                title="Deletar andar"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (floors.length <= 1) return;

                                                    const floorIndex = floors.findIndex((f) => f.id === floor.id);
                                                    removeFloorFn(floor.id);

                                                    // Select another floor if current was deleted
                                                    if (currentFloorId === floor.id) {
                                                        const nextIndex = floorIndex > 0 ? floorIndex - 1 : 0;
                                                        const nextFloor = floors.filter((f) => f.id !== floor.id)[nextIndex];
                                                        if (nextFloor) {
                                                            setCurrentFloor(nextFloor.id);
                                                        }
                                                    }
                                                }}
                                            >
                                                <MaterialIcon name="delete" size="sm" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[var(--gray)]/20 p-1">
                                <button
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--bg-soft)] rounded text-[var(--teal)]"
                                    onClick={() => {
                                        if (!dungeon) return;
                                        const newFloor = {
                                            id: crypto.randomUUID(),
                                            dungeonId: dungeon.meta.id,
                                            name: `Andar ${floors.length + 1}`,
                                            level: floors.length,
                                            spaces: [],
                                            rendered: false,
                                        };
                                        addFloor(newFloor);
                                        setCurrentFloor(newFloor.id);
                                        setShowFloorDropdown(false);
                                    }}
                                >
                                    <MaterialIcon name="add" size="sm" />
                                    <span>Adicionar andar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-[var(--gray)]/30 mx-1" />

                {/* Zoom Controls */}
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors"
                    title="Zoom Out"
                >
                    <MaterialIcon name="remove_circle" className="text-[var(--fg-alt)]" size="sm" />
                </button>
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors"
                    title="Zoom In"
                >
                    <MaterialIcon name="add_circle" className="text-[var(--fg-alt)]" size="sm" />
                </button>

                <div className="w-px h-6 bg-[var(--gray)]/30 mx-1" />

                {/* Undo/Redo */}
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-50"
                    title="Desfazer (Ctrl+Z)"
                    onClick={handleUndo}
                    disabled={!canUndo}
                >
                    <MaterialIcon name="undo" className="text-[var(--fg-alt)]" size="sm" />
                </button>
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-50"
                    title="Refazer (Ctrl+Y)"
                    onClick={handleRedo}
                    disabled={!canRedo}
                >
                    <MaterialIcon name="redo" className="text-[var(--fg-alt)]" size="sm" />
                </button>

                {/* Delete */}
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-50"
                    title="Excluir seleção (Delete)"
                    onClick={handleDelete}
                    disabled={!hasSelection}
                >
                    <MaterialIcon name="delete" className="text-[var(--fg-alt)]" size="sm" />
                </button>

                <div className="w-px h-6 bg-[var(--gray)]/30 mx-1" />

                {/* Export */}
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-50"
                    title="Exportar PNG"
                    onClick={() => exportCanvas?.()}
                    disabled={!exportCanvas}
                >
                    <MaterialIcon name="file_download" className="text-[var(--fg-alt)]" size="sm" />
                </button>

                <div className="w-px h-6 bg-[var(--gray)]/30 mx-1" />

                {/* Render Button */}
                <Button
                    className="bg-[var(--red)] hover:bg-[var(--red-light)] text-[var(--fg)] font-bold uppercase tracking-widest text-xs px-4 ml-1 disabled:opacity-50"
                    onClick={handleRender}
                    disabled={!canRender}
                    title={!dungeon ? "Crie um mapa primeiro" : spaces.length === 0 ? "Desenhe espaços no canvas" : "Gerar arte do mapa"}
                >
                    {isRendering ? (
                        <>
                            <MaterialIcon name="progress_activity" className="mr-1.5 animate-spin" size="sm" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <MaterialIcon name="auto_fix_high" className="mr-1.5" size="sm" />
                            Renderizar
                        </>
                    )}
                </Button>

                <div className="w-px h-6 bg-[var(--gray)]/30 mx-1" />

                {/* Debug Controls — only in development */}
                {process.env.NODE_ENV === "development" && (
                    <div className="flex flex-col gap-1">
                        <button
                            className={`p-1 text-[10px] rounded uppercase font-bold tracking-wider px-2 transition-colors ${debugFit
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-[var(--bg-soft)] text-[var(--fg-alt)] hover:text-[var(--fg)]"
                                }`}
                            onClick={() => setDebugFit(!debugFit)}
                            title="Forçar ajuste ao World Bounds (1024x1024)"
                        >
                            Fix Size
                        </button>
                        <button
                            className={`p-1 text-[10px] rounded uppercase font-bold tracking-wider px-2 transition-colors ${debugPlaceholder
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                : "bg-[var(--bg-soft)] text-[var(--fg-alt)] hover:text-[var(--fg)]"
                                }`}
                            onClick={() => setDebugPlaceholder(!debugPlaceholder)}
                            title="Usar Placeholder 2048x2048"
                        >
                            Test 2k
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

