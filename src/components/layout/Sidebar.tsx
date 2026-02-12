"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { generateMap } from "@/actions";

import { useMapStore, useFloorEntities, useFloorSpaces } from "@/stores";
import { findOverlappingPairs } from "@/lib/polygonMerge";
import type { Entity, Resolution } from "@/types";

export function Sidebar() {
    const [activeTab, setActiveTab] = useState("prompt");
    const [prompt, setPrompt] = useState("");
    const [resolution, setResolution] = useState<Resolution>("1024x1024");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const setDungeon = useMapStore((s) => s.setDungeon);
    const setGenerating = useMapStore((s) => s.setGenerating);
    const createEmptyDungeon = useMapStore((s) => s.createEmptyDungeon);
    const dungeon = useMapStore((s) => s.dungeon);
    const selectedSpaceId = useMapStore((s) => s.selectedSpaceId);
    const selectedEntityId = useMapStore((s) => s.selectedEntityId);
    const addEntity = useMapStore((s) => s.addEntity);
    const mergeSpaces = useMapStore((s) => s.mergeSpaces);
    const currentFloor = dungeon?.floors[0];
    const spaces = useFloorSpaces();
    const selectedSpace = currentFloor?.spaces.find(s => s.id === selectedSpaceId);
    const entities = useFloorEntities();

    // Find overlapping spaces for merge button
    const overlappingPairs = spaces.length >= 2
        ? findOverlappingPairs(spaces.map(s => s.geometry))
        : [];
    const hasOverlaps = overlappingPairs.length > 0;

    const handleMergeOverlapping = () => {
        if (!hasOverlaps || overlappingPairs.length === 0) return;

        // Get all unique space IDs involved in overlaps
        const spaceIdsToMerge = new Set<string>();
        for (const [i, j] of overlappingPairs) {
            spaceIdsToMerge.add(spaces[i].id);
            spaceIdsToMerge.add(spaces[j].id);
        }

        mergeSpaces(Array.from(spaceIdsToMerge));
    };

    const handleAddEntity = () => {
        if (!dungeon || !currentFloor || !selectedSpace) return;

        // Calculate center of selected space for entity position
        const points = selectedSpace.geometry.points;
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

        const newEntity: Entity = {
            id: crypto.randomUUID(),
            dungeonId: dungeon.meta.id,
            floorId: currentFloor.id,
            type: "npc",
            name: `Entidade ${entities.length + 1}`,
            description: "",
            position: { x: centerX, y: centerY },
            icon: "person",
        };

        addEntity(newEntity);
    };

    const handleGenerate = () => {
        if (!prompt.trim()) {
            setError("Digite uma descrição para o mapa.");
            return;
        }

        setError(null);
        setGenerating(true);

        startTransition(async () => {
            try {
                const result = await generateMap({ prompt, resolution });

                if (result.success && result.data) {
                    setDungeon(result.data);
                } else {
                    setError(result.error ?? "Erro ao gerar estrutura.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro inesperado.");
            } finally {
                setGenerating(false);
            }
        });
    };

    const resolutionSteps: Resolution[] = ["512x512", "1024x1024", "2048x2048"];
    const resolutionIndex = resolutionSteps.indexOf(resolution);

    return (
        <aside className="w-80 bg-[var(--bg)] border-l border-[var(--yellow)]/15 flex flex-col shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsList className="grid grid-cols-3 bg-transparent border-b border-[var(--yellow)]/15 rounded-none h-12">
                    <TabsTrigger
                        value="prompt"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--red)] data-[state=active]:bg-[var(--bg-soft)] text-[var(--fg-alt)] data-[state=active]:text-[var(--fg)] uppercase text-xs tracking-widest font-medium"
                    >
                        AI
                    </TabsTrigger>
                    <TabsTrigger
                        value="form"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--red)] data-[state=active]:bg-[var(--bg-soft)] text-[var(--fg-alt)] data-[state=active]:text-[var(--fg)] uppercase text-xs tracking-widest font-medium"
                    >
                        Guiado
                    </TabsTrigger>
                    <TabsTrigger
                        value="manual"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--red)] data-[state=active]:bg-[var(--bg-soft)] text-[var(--fg-alt)] data-[state=active]:text-[var(--fg)] uppercase text-xs tracking-widest font-medium"
                    >
                        Manual
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="prompt" className="p-4 m-0 h-full">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-px flex-1 bg-[var(--yellow)]/30" />
                            <span className="text-[var(--yellow)] text-xs uppercase tracking-widest font-semibold">
                                Descrição
                            </span>
                            <div className="h-px flex-1 bg-[var(--yellow)]/30" />
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase tracking-wide text-[var(--fg-alt)] font-semibold mb-2 block">
                                    Detalhes do Mapa
                                </label>
                                <textarea
                                    className="w-full h-48 bg-[var(--bg-hard)] border border-[var(--yellow)]/20 rounded-md p-3 text-[var(--fg)] placeholder:text-[var(--gray)] resize-none focus:ring-1 focus:ring-[var(--yellow)] focus:border-[var(--yellow)]/40 font-[var(--font-crimson)] text-sm"
                                    placeholder="Uma taverna medieval com porão secreto onde cultistas se reúnem. Três quartos no andar de cima."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isPending}
                                />
                                <p className="text-xs text-[var(--gray)] mt-2 italic">
                                    Seja específico sobre materiais e iluminação.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-[var(--red)]/20 border border-[var(--red)]/50 rounded-md">
                                    <p className="text-[var(--red-light)] text-sm">{error}</p>
                                </div>
                            )}

                            {/* Resolution Slider */}
                            <div className="pt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs uppercase tracking-wide text-[var(--fg-alt)] font-semibold">
                                        Resolução
                                    </label>
                                    <span className="text-[var(--yellow)] font-semibold text-sm">
                                        {resolution.replace("x", " × ")}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="1"
                                    value={resolutionIndex >= 0 ? resolutionIndex : 1}
                                    onChange={(e) => setResolution(resolutionSteps[parseInt(e.target.value)])}
                                    className="w-full accent-[var(--yellow)]"
                                    disabled={isPending}
                                />
                                <div className="flex justify-between text-xs text-[var(--gray)] mt-1">
                                    <span>512</span>
                                    <span>1024</span>
                                    <span>2048</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="form" className="p-4 m-0 h-full">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-px flex-1 bg-[var(--yellow)]/30" />
                            <span className="text-[var(--yellow)] text-xs uppercase tracking-widest font-semibold">
                                Configuração
                            </span>
                            <div className="h-px flex-1 bg-[var(--yellow)]/30" />
                        </div>

                        <p className="text-[var(--fg-alt)] text-sm">
                            Formulário guiado em desenvolvimento...
                        </p>
                    </TabsContent>

                    <TabsContent value="manual" className="p-4 m-0 h-full">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-px flex-1 bg-[var(--yellow)]/30" />
                            <span className="text-[var(--yellow)] text-xs uppercase tracking-widest font-semibold">
                                Modo Manual
                            </span>
                            <div className="h-px flex-1 bg-[var(--yellow)]/30" />
                        </div>

                        {!dungeon ? (
                            <div className="space-y-4">
                                <p className="text-[var(--fg-alt)] text-sm">
                                    Crie um mapa vazio e desenhe spaces manualmente no canvas.
                                </p>
                                <Button
                                    className="w-full bg-[var(--teal)] hover:bg-[var(--teal)]/80 text-[var(--bg-hard)] font-bold uppercase tracking-widest text-sm py-6"
                                    onClick={() => createEmptyDungeon()}
                                >
                                    <MaterialIcon name="add_box" className="mr-2" size="sm" />
                                    Novo Mapa Vazio
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Dungeon Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--fg)] font-medium">{dungeon.meta.name}</span>
                                        <span className="text-[var(--fg-alt)] text-xs">
                                            {dungeon.floors[0]?.spaces.length ?? 0} spaces
                                        </span>
                                    </div>
                                    <div className="text-[var(--fg-alt)] text-sm">
                                        Use a ferramenta retângulo na toolbar para desenhar spaces.
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-[var(--yellow)]/30 text-[var(--fg-alt)] hover:bg-[var(--bg-soft)]"
                                        onClick={() => createEmptyDungeon()}
                                    >
                                        <MaterialIcon name="refresh" className="mr-2" size="sm" />
                                        Novo Mapa
                                    </Button>

                                    {/* Merge Overlapping Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-[var(--teal)]/50 text-[var(--teal)] hover:bg-[var(--teal)]/10 disabled:opacity-50"
                                        onClick={handleMergeOverlapping}
                                        disabled={!hasOverlaps}
                                        title={hasOverlaps ? `${overlappingPairs.length} par(es) sobreposto(s)` : "Nenhuma sobreposição detectada"}
                                    >
                                        <MaterialIcon name="merge" className="mr-2" size="sm" />
                                        {hasOverlaps ? `Mesclar ${overlappingPairs.length} Sobrepostos` : "Sem Sobreposições"}
                                    </Button>
                                </div>

                                {/* Space Editor - REMOVED (Use Indicator Panel) */}
                                <div>
                                    {selectedSpace ? (
                                        <div className="p-3 bg-[var(--bg-soft)] rounded border border-[var(--teal)]/20 text-center">
                                            <MaterialIcon name="edit" className="mb-1 text-[var(--teal)]" />
                                            <p className="text-sm font-medium text-[var(--fg)]">
                                                Editando: {selectedSpace.name}
                                            </p>
                                            <p className="text-xs text-[var(--fg-alt)]">
                                                Use o painel lateral esquerdo (Inspector) para editar propriedades.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-[var(--fg-alt)] text-sm text-center py-4 border border-dashed border-[var(--yellow)]/20 rounded">
                                            Selecione um space para ver detalhes no Inspector.
                                        </div>
                                    )}
                                </div>

                                {/* Entity Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-[var(--purple)]/30" />
                                        <span className="text-[var(--purple)] text-xs uppercase tracking-widest font-semibold">
                                            Entidades
                                        </span>
                                        <div className="h-px flex-1 bg-[var(--purple)]/30" />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleAddEntity}
                                            disabled={!selectedSpace}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-[var(--teal)] text-[var(--bg-hard)] rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            title={!selectedSpace ? "Selecione um space primeiro" : "Adicionar entidade"}
                                        >
                                            <MaterialIcon name="add" size="sm" />
                                            Nova Entidade
                                        </button>
                                    </div>

                                    {/* Entity List (Simplified) */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {entities.length === 0 ? (
                                            <div className="text-[var(--fg-alt)] text-xs text-center py-3 italic">
                                                Nenhuma entidade neste andar.
                                            </div>
                                        ) : (
                                            entities.map(entity => (
                                                <div
                                                    key={entity.id}
                                                    onClick={() => useMapStore.getState().selectEntity(entity.id)}
                                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedEntityId === entity.id
                                                        ? "bg-[var(--purple)]/20 border border-[var(--purple)]/40"
                                                        : "bg-[var(--bg-hard)] hover:bg-[var(--bg-soft)] border border-transparent"
                                                        }`}
                                                >
                                                    <MaterialIcon name={entity.icon || "token"} size="sm" className={selectedEntityId === entity.id ? "text-[var(--purple)]" : "text-[var(--fg-alt)]"} />
                                                    <span className="text-xs text-[var(--fg)] truncate flex-1">{entity.name}</span>
                                                    <span className="text-[10px] uppercase text-[var(--fg-alt)] bg-[var(--bg)] px-1 rounded">
                                                        {entity.type}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </div>

                {/* CTA Button */}
                <div className="p-4 border-t border-[var(--yellow)]/15">
                    <Button
                        className="w-full bg-[var(--red)] hover:bg-[var(--red-light)] text-[var(--fg)] font-bold uppercase tracking-widest text-sm py-6 disabled:opacity-50"
                        onClick={handleGenerate}
                        disabled={isPending || !prompt.trim()}
                    >
                        {isPending ? (
                            <>
                                <MaterialIcon name="hourglass_empty" className="mr-2 animate-pulse" size="sm" />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <MaterialIcon name="auto_awesome" className="mr-2" size="sm" />
                                Gerar Estrutura
                            </>
                        )}
                    </Button>
                </div>
            </Tabs >
        </aside >
    );
}
