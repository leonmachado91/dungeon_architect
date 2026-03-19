import { DungeonMap, Space, Entity } from '@/types/dungeon';
import { SKELETON_COLORS, SKELETON_DIMENSIONS } from './constants';
import { drawEntityShape } from './shapes';

// === Structural entity types (drawn on skeleton) ===
// Dynamic entities (npc, monster, treasure, etc.) are excluded
const STRUCTURAL_ENTITY_TYPES = new Set(['door', 'window', 'wall_feature', 'stairs']);

// === Semantic Texture Patterns ===

/**
 * Creates a visible grid pattern for walkable floor areas.
 * Helps the AI understand scale and identify open spaces.
 */
function createFloorPattern(ctx: CanvasRenderingContext2D): CanvasPattern | string {
    const size = 12;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = size;
    patternCanvas.height = size;
    const pCtx = patternCanvas.getContext('2d');
    if (!pCtx) return SKELETON_COLORS.FLOOR;

    // White background
    pCtx.fillStyle = SKELETON_COLORS.FLOOR;
    pCtx.fillRect(0, 0, size, size);

    // Grid lines — visible thin lines
    pCtx.strokeStyle = '#DDDDDD';
    pCtx.lineWidth = 1;
    // Horizontal line at bottom edge
    pCtx.beginPath();
    pCtx.moveTo(0, size - 0.5);
    pCtx.lineTo(size, size - 0.5);
    pCtx.stroke();
    // Vertical line at right edge
    pCtx.beginPath();
    pCtx.moveTo(size - 0.5, 0);
    pCtx.lineTo(size - 0.5, size);
    pCtx.stroke();

    return ctx.createPattern(patternCanvas, 'repeat') || SKELETON_COLORS.FLOOR;
}

/**
 * Creates a diagonal hatch pattern for solid walls.
 * Clearly differentiates solid mass from void and floor.
 */
function createWallPattern(ctx: CanvasRenderingContext2D): CanvasPattern | string {
    const size = 6;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = size;
    patternCanvas.height = size;
    const pCtx = patternCanvas.getContext('2d');
    if (!pCtx) return SKELETON_COLORS.WALL;

    // Dark gray background
    pCtx.fillStyle = SKELETON_COLORS.WALL;
    pCtx.fillRect(0, 0, size, size);

    // Diagonal hatch lines — visible contrast
    pCtx.strokeStyle = '#555555';
    pCtx.lineWidth = 2;
    pCtx.beginPath();
    // Main diagonal
    pCtx.moveTo(0, size);
    pCtx.lineTo(size, 0);
    pCtx.stroke();
    // Wrap-around diagonal for seamless tiling
    pCtx.beginPath();
    pCtx.moveTo(-size, size);
    pCtx.lineTo(size, -size);
    pCtx.stroke();
    pCtx.beginPath();
    pCtx.moveTo(0, size * 2);
    pCtx.lineTo(size * 2, 0);
    pCtx.stroke();

    return ctx.createPattern(patternCanvas, 'repeat') || SKELETON_COLORS.WALL;
}

// === Geometry Helpers ===

/** Calculate centroid of a polygon */
function getCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
    let cx = 0;
    let cy = 0;
    for (const p of points) {
        cx += p.x;
        cy += p.y;
    }
    return { x: cx / points.length, y: cy / points.length };
}

// === Main Renderer ===

/**
 * Gera uma imagem Base64 (PNG) do esqueleto semântico do dungeon
 */
export async function renderSkeleton(dungeon: DungeonMap, floorId: string): Promise<string> {
    // Encontrar o andar atual
    const floor = dungeon.floors.find(f => f.id === floorId);
    if (!floor) throw new Error(`Floor not found: ${floorId}`);

    // Forçar tamanho fixo para garantir alinhamento com Toolbar/Canvas
    const width = SKELETON_DIMENSIONS.CANVAS_SIZE;
    const height = SKELETON_DIMENSIONS.CANVAS_SIZE;

    const offsetX = 0;
    const offsetY = 0;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get 2D context');

    // Create texture patterns once
    const floorPattern = createFloorPattern(ctx);
    const wallPattern = createWallPattern(ctx);

    // 1. Preencher fundo (Vazio)
    ctx.fillStyle = SKELETON_COLORS.VOID;
    ctx.fillRect(0, 0, width, height);

    // Configurar junção de linhas para paredes suaves
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 2. Desenhar Spaces

    // Pass 1: Walls (Stroke) with hatch texture
    floor.spaces.forEach(space => {
        drawSpaceWall(ctx, space, offsetX, offsetY, wallPattern);
    });

    // Pass 2: Floors (Fill) with grid texture
    floor.spaces.forEach(space => {
        drawSpaceFloor(ctx, space, offsetX, offsetY, floorPattern);
    });

    // Pass 3: Inner space borders — dashed inset for child spaces
    floor.spaces.forEach(space => {
        if (space.parentId) {
            drawInnerBorder(ctx, space, offsetX, offsetY);
        }
    });

    // Pass 4: Space name labels — centered at polygon centroid
    ctx.font = SKELETON_DIMENSIONS.LABEL_FONT;
    ctx.fillStyle = SKELETON_COLORS.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    floor.spaces.forEach(space => {
        drawSpaceLabel(ctx, space, offsetX, offsetY);
    });

    // 5. Desenhar Entidades ESTRUTURAIS apenas (portas, janelas, escadas)
    const floorEntities = dungeon.entities.filter(
        e => e.floorId === floorId && STRUCTURAL_ENTITY_TYPES.has(e.type)
    );

    floorEntities.forEach(entity => {
        drawEntity(ctx, entity, offsetX, offsetY);
    });

    return canvas.toDataURL('image/png');
}

function drawSpaceWall(
    ctx: CanvasRenderingContext2D,
    space: Space,
    offX: number,
    offY: number,
    pattern: CanvasPattern | string,
) {
    if (!space.geometry || space.geometry.points.length < 3) return;

    ctx.beginPath();
    const points = space.geometry.points;
    ctx.moveTo(points[0].x + offX, points[0].y + offY);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x + offX, points[i].y + offY);
    }
    ctx.closePath();

    ctx.strokeStyle = pattern;
    ctx.lineWidth = SKELETON_DIMENSIONS.WALL_THICKNESS * 2;
    ctx.stroke();
}

function drawSpaceFloor(
    ctx: CanvasRenderingContext2D,
    space: Space,
    offX: number,
    offY: number,
    pattern: CanvasPattern | string,
) {
    if (!space.geometry || space.geometry.points.length < 3) return;

    ctx.beginPath();
    const points = space.geometry.points;
    ctx.moveTo(points[0].x + offX, points[0].y + offY);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x + offX, points[i].y + offY);
    }
    ctx.closePath();

    ctx.fillStyle = pattern;
    ctx.fill();
}

/** Draw a dashed inset border around inner (child) spaces */
function drawInnerBorder(
    ctx: CanvasRenderingContext2D,
    space: Space,
    offX: number,
    offY: number,
) {
    if (!space.geometry || space.geometry.points.length < 3) return;

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = SKELETON_COLORS.INNER_BORDER;
    ctx.lineWidth = 2;

    ctx.beginPath();
    const points = space.geometry.points;
    ctx.moveTo(points[0].x + offX, points[0].y + offY);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x + offX, points[i].y + offY);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

/** Draw space name label at centroid */
function drawSpaceLabel(
    ctx: CanvasRenderingContext2D,
    space: Space,
    offX: number,
    offY: number,
) {
    if (!space.geometry || space.geometry.points.length < 3) return;

    const centroid = getCentroid(space.geometry.points);
    const x = centroid.x + offX;
    const y = centroid.y + offY;

    // Draw a white background behind the text for readability
    const text = space.name;
    const metrics = ctx.measureText(text);
    const padding = 3;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 18;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
    ctx.fillStyle = SKELETON_COLORS.TEXT;
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawEntity(ctx: CanvasRenderingContext2D, entity: Entity, offX: number, offY: number) {
    drawEntityShape(ctx, entity, offX, offY);
}
