"use client";

import dynamic from "next/dynamic";

// Dynamic import for Konva (requires client-side only)
const MapCanvas = dynamic(
    () => import("@/components/canvas/MapCanvas").then((mod) => mod.MapCanvas),
    {
        ssr: false,
        loading: () => (
            <div className="flex-1 bg-[var(--bg-hard)] flex items-center justify-center">
                <div className="text-[var(--fg)]/40 animate-pulse">
                    Carregando canvas...
                </div>
            </div>
        )
    }
);

export function Canvas() {
    return (
        <div className="flex-1 relative overflow-hidden h-full">
            <MapCanvas />
        </div>
    );
}
