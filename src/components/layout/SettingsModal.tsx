"use client";

import { Dialog } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores";
import { STRUCTURE_MODELS, RENDER_MODELS } from "@/lib/models";
import type { StructureModelId, RenderModelId } from "@/lib/models";
import { MaterialIcon } from "@/components/icons/MaterialIcon";

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Settings modal for AI model configuration.
 */
export function SettingsModal({ open, onClose }: SettingsModalProps) {
    const structureModel = useSettingsStore((s) => s.structureModel);
    const renderModel = useSettingsStore((s) => s.renderModel);
    const setStructureModel = useSettingsStore((s) => s.setStructureModel);
    const setRenderModel = useSettingsStore((s) => s.setRenderModel);

    return (
        <Dialog open={open} onClose={onClose} title="Configurações" className="w-[480px]">
            <div className="space-y-6">
                {/* AI Models Section */}
                <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)] mb-4">
                        <MaterialIcon name="psychology" size="sm" className="text-[var(--teal)]" />
                        Modelos de IA
                    </h3>

                    <div className="space-y-4">
                        {/* Structure Model */}
                        <div className="space-y-2">
                            <label className="text-sm text-[var(--fg-alt)]">
                                Modelo de Estrutura
                                <span className="text-[var(--gray)] ml-1">(geração JSON)</span>
                            </label>
                            <Select
                                value={structureModel}
                                onValueChange={(value) => setStructureModel(value as StructureModelId)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STRUCTURE_MODELS.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-[var(--gray)]">
                                Usado para gerar a estrutura do dungeon (salas, corredores, entidades)
                            </p>
                        </div>

                        {/* Render Model */}
                        <div className="space-y-2">
                            <label className="text-sm text-[var(--fg-alt)]">
                                Modelo de Render
                                <span className="text-[var(--gray)] ml-1">(geração de imagem)</span>
                            </label>
                            <Select
                                value={renderModel}
                                onValueChange={(value) => setRenderModel(value as RenderModelId)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RENDER_MODELS.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-[var(--gray)]">
                                Nanobanana para gerar a imagem artística do mapa
                            </p>
                        </div>
                    </div>
                </section>

                {/* Info */}
                <div className="bg-[var(--bg-soft)] rounded-lg p-3 text-sm text-[var(--fg-alt)]">
                    <div className="flex items-start gap-2">
                        <MaterialIcon name="info" size="sm" className="text-[var(--blue)] shrink-0 mt-0.5" />
                        <p>
                            As configurações são salvas automaticamente no navegador.
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
