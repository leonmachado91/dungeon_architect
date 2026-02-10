/**
 * Export utilities for Dungeon Architect
 * Exports dungeon maps as JSON or PNG
 * 
 * Bug #9 fix: PNG export now uses WORLD_BOUNDS for complete map capture
 */

import type { DungeonMap } from "@/types";
import { WORLD_BOUNDS } from "@/constants/core";

/**
 * Download a blob as a file
 */
function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export dungeon as JSON file
 */
export function exportAsJson(dungeon: DungeonMap, filename?: string) {
    const jsonString = JSON.stringify(dungeon, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const name = filename || `${dungeon.meta.name.replace(/\s+/g, "_")}.json`;
    downloadFile(blob, name);
}

/**
 * [Bug #9 Fix] Export the complete map (entire world bounds) as PNG file
 * Uses WORLD_BOUNDS to ensure the full map is captured, not just the viewport.
 * 
 * @param stageRef - Reference to Konva Stage
 * @param filename - Optional filename (defaults to dungeon name)
 * @param dungeonName - Optional dungeon name for filename
 */
export function exportAsPng(
    stageRef: {
        toDataURL: (config?: {
            pixelRatio?: number;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }) => string;
        scale: () => { x: number; y: number };
        position: () => { x: number; y: number };
    },
    filename?: string,
    dungeonName?: string
) {
    // Reset to export the entire map regardless of current view
    const config = {
        pixelRatio: 2, // High quality export
        x: WORLD_BOUNDS.MIN_X,
        y: WORLD_BOUNDS.MIN_Y,
        width: WORLD_BOUNDS.WIDTH,
        height: WORLD_BOUNDS.HEIGHT,
    };

    const dataUrl = stageRef.toDataURL(config);

    // Convert data URL to blob
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const name = filename || `${(dungeonName || "dungeon").replace(/\s+/g, "_")}.png`;
    downloadFile(blob, name);
}

/**
 * Export only the visible viewport as PNG
 * (Alternative for users who want to export what they see)
 */
export function exportViewportAsPng(
    stageRef: { toDataURL: (config?: { pixelRatio?: number }) => string },
    filename?: string,
    dungeonName?: string
) {
    const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });

    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const name = filename || `${(dungeonName || "dungeon")}_viewport.png`;
    downloadFile(blob, name);
}
