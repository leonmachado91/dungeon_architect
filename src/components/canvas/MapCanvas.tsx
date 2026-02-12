"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Group, Text, Rect } from "react-konva";
import Konva from "konva";
import { useMapStore, useCurrentFloor, useFloorSpaces, useFloorEntities, useViewportStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { GridLayer, BackgroundLayer, SpaceShape, EntityToken, GRID_SIZE, snapToGrid, WorldBoundary } from "./index";
import { ReferenceLayer } from "./ReferenceLayer";
import { WORLD_BOUNDS } from "@/constants/core";
import { isPointInBounds, clampPointToBounds, clampMoveDelta } from "@/lib/bounds";
import type { Point } from "@/types";

// === Constants ===

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

// === Main Canvas ===

interface DrawingRect {
    startX: number;
    startY: number;
    width: number;
    height: number;
}

export function MapCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);

    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPointerPos, setLastPointerPos] = useState<Point>({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);

    // Store state - grouped with useShallow for performance
    const { dungeon, zoom, pan, tool, selectedSpaceId, selectedEntityId } = useMapStore(
        useShallow((s) => ({
            dungeon: s.dungeon,
            zoom: s.zoom,
            pan: s.pan,
            tool: s.tool,
            selectedSpaceId: s.selectedSpaceId,
            selectedEntityId: s.selectedEntityId,
        }))
    );

    // Store actions - stable references, no need for shallow
    const setZoom = useMapStore((s) => s.setZoom);
    const setPan = useMapStore((s) => s.setPan);
    const selectSpace = useMapStore((s) => s.selectSpace);
    const selectEntity = useMapStore((s) => s.selectEntity);
    const updateEntity = useMapStore((s) => s.updateEntity);
    const updateSpace = useMapStore((s) => s.updateSpace);
    const addSpace = useMapStore((s) => s.addSpace);
    const addEntity = useMapStore((s) => s.addEntity);
    const setExportHandler = useMapStore((s) => s.setExportHandler);

    const currentFloor = useCurrentFloor();
    const spaces = useFloorSpaces();
    const entities = useFloorEntities();

    // Viewport State
    const { layers, isGeometryLocked } = useViewportStore();
    const isLocked = isGeometryLocked();

    // Resize observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Wheel zoom
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - pan.x) / zoom,
            y: (pointer.y - pan.y) / zoom,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + direction * zoom * 0.1));

        const newPan = {
            x: pointer.x - mousePointTo.x * newZoom,
            y: pointer.y - mousePointTo.y * newZoom,
        };

        setZoom(newZoom);
        setPan(newPan);
    }, [zoom, pan, setZoom, setPan]);

    // Get world coordinates from screen coordinates
    const getWorldPosition = useCallback((stage: Konva.Stage, clientX: number, clientY: number): Point => {
        const rect = stage.container().getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        return {
            x: (screenX - pan.x) / zoom,
            y: (screenY - pan.y) / zoom,
        };
    }, [pan, zoom]);

    // Mouse down handler - handles drawing start and panning
    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        // Middle click = pan ONLY (Bug #3 fix)
        if (e.evt.button === 1) {
            setIsPanning(true);
            setLastPointerPos({ x: e.evt.clientX, y: e.evt.clientY });
            return;
        }

        // Right click = pan
        if (e.evt.button === 2) {
            setIsPanning(true);
            setLastPointerPos({ x: e.evt.clientX, y: e.evt.clientY });
            return;
        }

        // Left click with draw tool = start drawing (only on empty canvas)
        if (e.evt.button === 0 && tool === "draw" && currentFloor) {
            // Only start drawing if clicking on stage background
            if (e.target !== stage) return;

            const worldPos = getWorldPosition(stage, e.evt.clientX, e.evt.clientY);

            // Clamp start position to world bounds
            const clampedPos = clampPointToBounds(worldPos);
            const snappedX = snapToGrid(clampedPos.x);
            const snappedY = snapToGrid(clampedPos.y);

            // Only start drawing if within bounds
            if (!isPointInBounds({ x: snappedX, y: snappedY })) return;

            setIsDrawing(true);
            setDrawingRect({
                startX: snappedX,
                startY: snappedY,
                width: 0,
                height: 0,
            });
        }

        // Left click with pan tool = pan
        if (e.evt.button === 0 && tool === "pan") {
            setIsPanning(true);
            setLastPointerPos({ x: e.evt.clientX, y: e.evt.clientY });
        }

        // Left click with entity tool = place entity (Bug #5 fix)
        // Only create if clicking on empty canvas AND within bounds
        if (e.evt.button === 0 && tool === "entity" && currentFloor) {
            // Check if we clicked on an existing entity or space - if so, don't create
            const targetName = e.target.getClassName();
            // Only create entity if clicked on Stage background or empty Layer
            if (e.target !== stage && targetName !== "Layer") {
                return; // Clicked on something, let the click handler of that element work
            }

            const worldPos = getWorldPosition(stage, e.evt.clientX, e.evt.clientY);

            // Block entity creation outside bounds
            if (!isPointInBounds(worldPos)) return;

            const cellX = Math.floor(worldPos.x / GRID_SIZE) * GRID_SIZE;
            const cellY = Math.floor(worldPos.y / GRID_SIZE) * GRID_SIZE;
            const centerX = cellX + GRID_SIZE / 2;
            const centerY = cellY + GRID_SIZE / 2;

            // Final bounds check on snapped position
            if (!isPointInBounds({ x: centerX, y: centerY })) return;

            const newEntity = {
                id: crypto.randomUUID(),
                dungeonId: dungeon?.meta.id || "",
                floorId: currentFloor.id,
                name: `Entidade ${(entities?.length || 0) + 1}`,
                type: "interactive" as const,
                icon: "person",
                position: { x: centerX, y: centerY },
                description: "",
            };

            addEntity(newEntity);
            selectEntity(newEntity.id);
        }
    }, [tool, currentFloor, getWorldPosition, entities, addEntity, selectEntity, dungeon]);

    // Mouse move handler - handles drawing preview and panning
    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        // Handle panning
        if (isPanning) {
            const dx = e.evt.clientX - lastPointerPos.x;
            const dy = e.evt.clientY - lastPointerPos.y;
            setPan({ x: pan.x + dx, y: pan.y + dy });
            setLastPointerPos({ x: e.evt.clientX, y: e.evt.clientY });
            return;
        }

        // Handle drawing preview with grid snap
        if (isDrawing && drawingRect) {
            const worldPos = getWorldPosition(stage, e.evt.clientX, e.evt.clientY);
            // Snap end position to grid
            let snappedEndX = snapToGrid(worldPos.x);
            let snappedEndY = snapToGrid(worldPos.y);

            // Clamp to bounds
            snappedEndX = Math.max(0, Math.min(WORLD_BOUNDS.WIDTH, snappedEndX));
            snappedEndY = Math.max(0, Math.min(WORLD_BOUNDS.HEIGHT, snappedEndY));

            setDrawingRect({
                ...drawingRect,
                width: snappedEndX - drawingRect.startX,
                height: snappedEndY - drawingRect.startY,
            });
        }
    }, [isPanning, isDrawing, drawingRect, lastPointerPos, pan, setPan, getWorldPosition]);

    // Mouse up handler - finishes drawing and creates space
    const handleMouseUp = useCallback(() => {
        // End panning
        if (isPanning) {
            setIsPanning(false);
        }

        // End drawing and create space
        if (isDrawing && drawingRect && currentFloor) {
            // Normalize rectangle (handle negative width/height)
            const minWidth = 20;
            const minHeight = 20;
            let x = drawingRect.startX;
            let y = drawingRect.startY;
            let w = drawingRect.width;
            let h = drawingRect.height;

            if (w < 0) {
                x += w;
                w = -w;
            }
            if (h < 0) {
                y += h;
                h = -h;
            }

            // Only create space if it's large enough
            if (w >= minWidth && h >= minHeight) {
                const newSpace = {
                    id: crypto.randomUUID(),
                    floorId: currentFloor.id,
                    name: `Sala ${(spaces?.length || 0) + 1}`,
                    description: "",
                    visualPrompt: "",
                    geometry: {
                        points: [
                            { x, y },
                            { x: x + w, y },
                            { x: x + w, y: y + h },
                            { x, y: y + h },
                        ],
                    },
                    zones: [],
                    lighting: "dim" as const,
                    spaceType: "room" as const,
                };
                addSpace(newSpace);
                selectSpace(newSpace.id);
            }

            setIsDrawing(false);
            setDrawingRect(null);
        }
    }, [isPanning, isDrawing, drawingRect, currentFloor, spaces, addSpace, selectSpace]);

    // Entity drag handler
    const handleEntityDrag = useCallback((id: string, position: Point) => {
        // Snap entity position to grid cell center
        const cellX = Math.floor(position.x / GRID_SIZE) * GRID_SIZE;
        const cellY = Math.floor(position.y / GRID_SIZE) * GRID_SIZE;

        let centerX = cellX + GRID_SIZE / 2;
        let centerY = cellY + GRID_SIZE / 2;

        // Clamp to World Bounds
        centerX = Math.max(GRID_SIZE / 2, Math.min(WORLD_BOUNDS.WIDTH - GRID_SIZE / 2, centerX));
        centerY = Math.max(GRID_SIZE / 2, Math.min(WORLD_BOUNDS.HEIGHT - GRID_SIZE / 2, centerY));

        const snappedPosition = {
            x: centerX,
            y: centerY,
        };
        updateEntity(id, { position: snappedPosition });
    }, [updateEntity]);

    // Space drag handler - moves all geometry points by delta AND moves entities inside (Bug #4 fix)
    const handleSpaceDrag = useCallback((id: string, delta: Point) => {
        // Find the space and update its geometry
        const space = spaces.find(s => s.id === id);
        if (!space?.geometry?.points) return;

        // Calculate bounding box of the space BEFORE moving
        const minX = Math.min(...space.geometry.points.map(p => p.x));
        const maxX = Math.max(...space.geometry.points.map(p => p.x));
        const minY = Math.min(...space.geometry.points.map(p => p.y));
        const maxY = Math.max(...space.geometry.points.map(p => p.y));

        // Clamp delta to keep space within bounds (smooth clamping instead of blocking)
        const clampedDelta = clampMoveDelta(minX, minY, maxX, maxY, delta.x, delta.y);

        // Skip if no movement after clamping
        if (clampedDelta.x === 0 && clampedDelta.y === 0) return;

        // Move the space geometry with clamped delta
        const newPoints = space.geometry.points.map(p => ({
            x: p.x + clampedDelta.x,
            y: p.y + clampedDelta.y,
        }));

        // Move holes if they exist
        const newHoles = space.geometry.holes?.map(hole =>
            hole.map(p => ({
                x: p.x + clampedDelta.x,
                y: p.y + clampedDelta.y,
            }))
        );

        updateSpace(id, { geometry: { points: newPoints, holes: newHoles } });

        // Move all entities that are inside this space's bounding box
        entities.forEach(entity => {
            if (!entity.position) return;
            const ex = entity.position.x;
            const ey = entity.position.y;

            // Check if entity is inside the bounding box of the space
            if (ex >= minX && ex <= maxX && ey >= minY && ey <= maxY) {
                updateEntity(entity.id, {
                    position: {
                        x: ex + clampedDelta.x,
                        y: ey + clampedDelta.y,
                    }
                });
            }
        });
    }, [spaces, entities, updateSpace, updateEntity]);

    // Click on empty space deselects (only in select mode)
    const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.currentTarget && tool === "select") {
            selectSpace(null);
            selectEntity(null);
        }
    }, [selectSpace, selectEntity, tool]);

    // Export canvas to PNG (uses world bounds for full map capture)
    const exportToPng = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;

        // Uses exportAsPng from lib/exportMap which captures full world bounds
        import("@/lib/exportMap").then(({ exportAsPng }) => exportAsPng(stage));
    }, []);

    // Register export handler on mount
    useEffect(() => {
        setExportHandler(exportToPng);
        return () => setExportHandler(null);
    }, [setExportHandler, exportToPng]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 bg-[var(--bg-hard)]"
            onContextMenu={(e) => e.preventDefault()}
            data-canvas
        >
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleStageClick}
                style={{
                    cursor: isPanning
                        ? "grabbing"
                        : tool === "draw"
                            ? "crosshair"
                            : tool === "pan"
                                ? "grab"
                                : "default"
                }}
            >
                {/* Render Layer (Background) */}
                {layers.render.visible && currentFloor?.renderUrl && (
                    <Layer listening={false}>
                        <BackgroundLayer
                            imageUrl={currentFloor.renderUrl}
                            zoom={zoom}
                            pan={pan}
                        />
                    </Layer>
                )}

                {/* Reference Layer (Skeleton) */}
                {layers.reference.visible && (
                    <Layer listening={false} opacity={layers.reference.opacity}>
                        <ReferenceLayer
                            opacity={1} // Opacity controlled by layer prop
                            zoom={zoom}
                            pan={pan}
                        />
                    </Layer>
                )}

                {/* Grid Layer (always render if wireframe is active or just as guide?) */}
                {/* User usually wants grid with wireframe */}
                {layers.wireframe.visible && (
                    <Layer listening={false}>
                        <GridLayer
                            width={dimensions.width}
                            height={dimensions.height}
                            zoom={zoom}
                            pan={pan}
                        />
                        {/* World Boundary - visual indicator of valid area */}
                        <WorldBoundary zoom={zoom} pan={pan} />
                    </Layer>
                )}

                {/* Spaces Layer (Wireframe) - Bug #2 fix: Selected space renders last (on top) */}
                {layers.wireframe.visible && (
                    <Layer>
                        {[...spaces]
                            .sort((a, b) => {
                                // Selected space goes last (rendered on top)
                                if (a.id === selectedSpaceId) return 1;
                                if (b.id === selectedSpaceId) return -1;
                                return 0;
                            })
                            .map((space) => (
                                <SpaceShape
                                    key={space.id}
                                    space={space}
                                    isSelected={space.id === selectedSpaceId}
                                    zoom={zoom}
                                    pan={pan}
                                    onSelect={selectSpace}
                                    onDragEnd={handleSpaceDrag}
                                    isLocked={isLocked}
                                />
                            ))}
                    </Layer>
                )}

                {/* Entities Layer (Wireframe - entities are usually visible with wireframe) */}
                {/* Note: Entities are NOT locked by geometry lock rule, only spaces */}
                {layers.wireframe.visible && (
                    <Layer>
                        {entities.map((entity) => (
                            <EntityToken
                                key={entity.id}
                                entity={entity}
                                zoom={zoom}
                                pan={pan}
                                isSelected={entity.id === selectedEntityId}
                                onSelect={selectEntity}
                                onDragEnd={handleEntityDrag}
                            />
                        ))}
                    </Layer>
                )}

                {/* Drawing Preview Layer */}
                {isDrawing && drawingRect && (
                    <Layer listening={false}>
                        <Group x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
                            <Rect
                                x={Math.min(drawingRect.startX, drawingRect.startX + drawingRect.width)}
                                y={Math.min(drawingRect.startY, drawingRect.startY + drawingRect.height)}
                                width={Math.abs(drawingRect.width)}
                                height={Math.abs(drawingRect.height)}
                                fill="rgba(204, 36, 29, 0.2)"
                                stroke="#CC241D"
                                strokeWidth={2 / zoom}
                                dash={[8 / zoom, 4 / zoom]}
                            />
                        </Group>
                    </Layer>
                )}

                {/* Empty State */}
                {!dungeon && (
                    <Layer listening={false}>
                        <Text
                            x={dimensions.width / 2 - 100}
                            y={dimensions.height / 2}
                            width={200}
                            text="O mapa aguarda..."
                            fontSize={18}
                            fill="rgba(235, 219, 178, 0.4)"
                            fontStyle="italic"
                            align="center"
                        />
                    </Layer>
                )}
            </Stage>
        </div>
    );
}
