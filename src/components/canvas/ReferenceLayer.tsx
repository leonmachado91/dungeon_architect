
"use client";

import { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import { useMapStore, useCurrentFloor, useFloorSpaces, useFloorEntities } from "@/stores";
import { renderSkeleton } from "@/lib/skeleton/renderer";
import type { Point } from "@/types";

interface ReferenceLayerProps {
    opacity: number;
    zoom: number;
    pan: Point;
}

export function ReferenceLayer({ opacity, zoom, pan }: ReferenceLayerProps) {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const dungeon = useMapStore((s) => s.dungeon);
    const currentFloor = useCurrentFloor();
    const spaces = useFloorSpaces();
    const entities = useFloorEntities();

    // Re-render skeleton when data changes
    useEffect(() => {
        if (!dungeon || !currentFloor) return;

        let isMounted = true;

        const generate = async () => {
            try {
                // Generate base64 skeleton
                const dataUrl = await renderSkeleton(dungeon, currentFloor.id);

                const img = new window.Image();
                img.src = dataUrl;
                img.onload = () => {
                    if (isMounted) setImage(img);
                };
            } catch (error) {
                console.error("[ReferenceLayer] Failed to render skeleton:", error);
            }
        };

        generate();

        return () => {
            isMounted = false;
        };
    }, [dungeon, currentFloor, spaces, entities]);

    if (!image) return null;

    return (
        <KonvaImage
            image={image}
            x={pan.x}
            y={pan.y}
            scaleX={zoom}
            scaleY={zoom}
            opacity={opacity}
            listening={false}
        />
    );
}
