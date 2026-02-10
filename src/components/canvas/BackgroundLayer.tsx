"use client";

import { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import { useSettingsStore } from "@/stores";
import type { Point } from "@/types";

interface BackgroundLayerProps {
    imageUrl: string | undefined;
    zoom: number;
    pan: Point;
}

/**
 * Renders the reference/background image on the canvas.
 * Handles image loading and proper positioning with zoom/pan.
 */
export function BackgroundLayer({ imageUrl, zoom, pan }: BackgroundLayerProps) {
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    // Debug flags
    const { debugFit, debugPlaceholder } = useSettingsStore();

    // 2048x2048 Placeholder Generator
    useEffect(() => {
        if (debugPlaceholder) {
            const canvas = document.createElement("canvas");
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Draw checkerboard
                const tileSize = 256;
                for (let y = 0; y < 2048; y += tileSize) {
                    for (let x = 0; x < 2048; x += tileSize) {
                        ctx.fillStyle = (x + y) % (tileSize * 2) === 0 ? "#ff0000" : "#0000ff";
                        ctx.fillRect(x, y, tileSize, tileSize);
                    }
                }
                // Add text to confirm resolution
                ctx.fillStyle = "white";
                ctx.font = "100px Arial";
                ctx.fillText("2048x2048 NATIVE", 500, 1024);

                const img = new window.Image();
                img.src = canvas.toDataURL();
                img.onload = () => setImage(img);
                return;
            }
        }

        // Normal image loading
        let isMounted = true;
        let timer: ReturnType<typeof setTimeout> | null = null;

        if (!imageUrl) {
            timer = setTimeout(() => {
                if (isMounted) setImage(null);
            }, 0);
            return () => {
                if (timer) clearTimeout(timer);
            };
        }

        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = () => {
            if (isMounted) setImage(img);
        };

        img.onerror = () => {
            if (isMounted) setImage(null);
        };

        return () => {
            isMounted = false;
        };
    }, [imageUrl, debugPlaceholder]);

    if (!image) return null;

    // Apply fix if debugFit is enabled
    const props = debugFit ? {
        width: 1024, // WORLD_BOUNDS.WIDTH
        height: 1024, // WORLD_BOUNDS.HEIGHT
    } : {};

    return (
        <KonvaImage
            image={image}
            x={pan.x}
            y={pan.y}
            scaleX={zoom}
            scaleY={zoom}
            listening={false}
            opacity={0.8}
            {...props}
        />
    );
}
