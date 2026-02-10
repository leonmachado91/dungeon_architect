import { DungeonMap, Space, Entity } from '@/types/dungeon';
import { SKELETON_COLORS, SKELETON_DIMENSIONS } from './constants';
import { drawEntityShape } from './shapes';

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

    // 3. Desenhar Entidades (Portas, Janelas, Escadas)
    const floorEntities = dungeon.entities.filter(e => e.floorId === floorId);

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

function drawEntity(ctx: CanvasRenderingContext2D, entity: Entity, offX: number, offY: number) {
    drawEntityShape(ctx, entity, offX, offY);
}
