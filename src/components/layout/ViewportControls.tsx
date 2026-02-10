"use client";

import { useState, useEffect } from "react";
import { useViewportStore, useCurrentFloor, useSettingsStore } from "@/stores";
import { Grid, Image as ImageIcon, Box, Lock, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewportControls() {
    // Prevent hydration mismatch by only reading store after mount
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { layers, toggleLayer, isGeometryLocked } = useViewportStore();
    const { debugPlaceholder } = useSettingsStore();
    const currentFloor = useCurrentFloor();

    // During SSR/before hydration, use safe defaults
    const hasRender = isMounted ? !!currentFloor?.renderUrl : false;
    const canToggleRender = hasRender || debugPlaceholder;

    // Unlock if Render is active so user can turn it off even if image is missing
    const isRenderBtnDisabled = !canToggleRender && !layers.render.visible;

    const isLocked = isMounted ? isGeometryLocked() : false;
    const wireframeVisible = isMounted ? layers.wireframe.visible : true;
    const referenceVisible = isMounted ? layers.reference.visible : false;
    const renderVisible = isMounted ? layers.render.visible : false;

    return (
        <div className="flex items-center gap-1 bg-[var(--bg-hard)] p-1 rounded-md border border-[var(--gray)]/20">
            {/* Wireframe Toggle */}
            <button
                onClick={() => toggleLayer("wireframe")}
                className={cn(
                    "p-2 rounded hover:bg-[var(--bg-soft)] transition-colors relative group",
                    wireframeVisible ? "text-[var(--yellow)]" : "text-[var(--gray)]"
                )}
                title="Wireframe (Geometria)"
            >
                <Grid className="w-4 h-4" />
                {!wireframeVisible && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-hard)]/50">
                        <EyeOff className="w-3 h-3 text-[var(--gray)]" />
                    </div>
                )}
            </button>

            <div className="w-px h-4 bg-[var(--gray)]/20 mx-1" />

            {/* Reference Toggle */}
            <button
                onClick={() => toggleLayer("reference")}
                className={cn(
                    "p-2 rounded hover:bg-[var(--bg-soft)] transition-colors relative",
                    referenceVisible ? "text-[var(--teal)] bg-[var(--bg-soft)]" : "text-[var(--gray)]"
                )}
                title="Reference Map (Skeleton)"
            >
                <Box className="w-4 h-4" />
            </button>

            {/* Render Toggle */}
            <button
                onClick={() => toggleLayer("render")}
                disabled={isRenderBtnDisabled}
                className={cn(
                    "p-2 rounded hover:bg-[var(--bg-soft)] transition-colors relative",
                    renderVisible ? "text-[var(--purple)] bg-[var(--bg-soft)]" : "text-[var(--gray)]",
                    isRenderBtnDisabled && "opacity-50 cursor-not-allowed"
                )}
                title={canToggleRender ? "Arte Renderizada" : "Gere uma imagem primeiro"}
            >
                <ImageIcon className="w-4 h-4" />
            </button>

            {/* Lock Indicator - Only render after mount to prevent hydration mismatch */}
            {isLocked && (
                <div
                    className="ml-2 px-2 py-1 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded text-[var(--red)] text-xs flex items-center gap-1"
                    title="Geometria bloqueada. Desative Reference e Render para editar paredes."
                >
                    <Lock className="w-3 h-3" />
                    <span className="hidden xl:inline">Locked</span>
                </div>
            )}
        </div>
    );
}
