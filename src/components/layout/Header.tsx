"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { ViewportControls } from "./ViewportControls";
import { useMapStore } from "@/stores";
import { exportAsJson } from "@/lib/exportMap";
import { SettingsModal } from "./SettingsModal";

export function Header() {
    const dungeon = useMapStore((s) => s.dungeon);
    const exportCanvas = useMapStore((s) => s.exportCanvas);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleExportJson = () => {
        if (dungeon) {
            exportAsJson(dungeon);
            setShowExportMenu(false);
        }
    };

    const handleExportPng = () => {
        if (exportCanvas) {
            exportCanvas();
            setShowExportMenu(false);
        }
    };

    return (
        <header className="h-14 bg-[var(--bg-hard)] border-b border-[var(--yellow)]/20 flex items-center justify-between px-4 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer mr-4">
                <div className="p-1.5 border border-[var(--yellow)]/30 rounded transition-transform duration-300 group-hover:rotate-[15deg]">
                    <MaterialIcon
                        name="castle"
                        className="text-[var(--red)] group-hover:text-[var(--yellow)] transition-colors"
                    />
                </div>
                <h1 className="font-[var(--font-cinzel)] text-lg tracking-[0.15em] text-[var(--fg)] group-hover:text-[var(--yellow)] transition-colors uppercase hidden md:block">
                    Dungeon Architect
                </h1>
            </div>

            {/* Viewport Controls (Center-Left) */}
            <ViewportControls />

            {/* Actions (Right) */}
            <div className="flex items-center gap-2 ml-auto">
                {/* Export Button with Dropdown */}
                <div className="relative">
                    <button
                        className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors flex items-center gap-1"
                        title="Exportar"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={!dungeon}
                    >
                        <MaterialIcon
                            name="download"
                            className={dungeon ? "text-[var(--fg-alt)]" : "text-[var(--gray)]/40"}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {showExportMenu && (
                        <div
                            className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg)] border border-[var(--gray)]/30 rounded-lg shadow-lg z-50 overflow-hidden"
                            onMouseLeave={() => setShowExportMenu(false)}
                        >
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-[var(--fg)] hover:bg-[var(--bg-soft)] flex items-center gap-2"
                                onClick={handleExportJson}
                            >
                                <MaterialIcon name="data_object" size="sm" className="text-[var(--teal)]" />
                                Exportar JSON
                            </button>
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-[var(--fg)] hover:bg-[var(--bg-soft)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleExportPng}
                                disabled={!exportCanvas}
                            >
                                <MaterialIcon name="image" size="sm" className="text-[var(--yellow)]" />
                                Exportar PNG
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors"
                    title="Histórico"
                >
                    <MaterialIcon name="history" className="text-[var(--fg-alt)]" />
                </button>
                <button
                    className="p-2 rounded hover:bg-[var(--bg-soft)] transition-colors"
                    title="Configurações"
                    onClick={() => setShowSettings(true)}
                >
                    <MaterialIcon name="settings" className="text-[var(--fg-alt)]" />
                </button>
                <div className="ml-2 w-9 h-9 rounded-full bg-[var(--teal)] flex items-center justify-center text-sm font-semibold text-[var(--bg-hard)]">
                    DA
                </div>
            </div>

            {/* Modals */}
            <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
        </header>
    );
}
