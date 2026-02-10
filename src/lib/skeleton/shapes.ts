import { Entity } from '@/types/dungeon';
import { SKELETON_COLORS, SKELETON_DIMENSIONS } from './constants';

export function drawEntityShape(ctx: CanvasRenderingContext2D, entity: Entity, offX: number, offY: number) {
    const x = entity.position.x + offX;
    const y = entity.position.y + offY;

    // Salvar contexto para rotação
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((entity.rotation || 0) * Math.PI / 180);

    // Resetar a origem para desenhar centralizado
    // Assumindo que x,y é o centro da entidade. 
    // Se for top-left, precisaria de ajuste. O Canvas do Konva geralmente usa centro ou top-left dependendo da config.
    // Vamos assumir centro por enquanto, ajustável.

    switch (entity.type) {
        case 'door':
            drawDoor(ctx, entity);
            break;
        case 'window':
        case 'wall_feature': // Janelas geralmente são wall_feature
            drawWindow(ctx, entity);
            break;
        case 'stairs':
            drawStairs(ctx, entity);
            break;
        case 'furniture':
            drawFurniture(ctx, entity);
            break;
        default:
            // Fallback genérico
            drawGeneric(ctx);
    }

    ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, entity: Entity) {
    ctx.fillStyle = SKELETON_COLORS.DOOR;
    const w = SKELETON_DIMENSIONS.DOOR_WIDTH;
    const h = SKELETON_DIMENSIONS.WALL_THICKNESS * 1.5; // Um pouco mais grosso que a parede para destacar

    // Desenhar retângulo centrado
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Se for porta dupla, desenhar linha no meio
    if (entity.subtype === 'double') {
        ctx.fillStyle = SKELETON_COLORS.WALL;
        ctx.fillRect(-1, -h / 2, 2, h);
    }
}

function drawWindow(ctx: CanvasRenderingContext2D, entity: Entity) {
    ctx.fillStyle = SKELETON_COLORS.WINDOW;
    const w = 40; // Largura padrão da janela
    const h = SKELETON_DIMENSIONS.WALL_THICKNESS;

    ctx.fillRect(-w / 2, -h / 2, w, h);
}

function drawStairs(ctx: CanvasRenderingContext2D, entity: Entity) {
    ctx.fillStyle = SKELETON_COLORS.STAIRS;
    const w = 60;
    const h = 100;

    // Fundo da escada
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Degraus (Linhas)
    ctx.fillStyle = SKELETON_COLORS.WALL; // Linhas escuras
    const steps = 6;
    const stepHeight = h / steps;

    for (let i = 0; i < steps; i++) {
        ctx.fillRect(-w / 2, (-h / 2) + (i * stepHeight), w, 2);
    }

    // Seta de direção (triângulo simples)
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 + 10);
    ctx.lineTo(-10, -h / 2 + 25);
    ctx.lineTo(10, -h / 2 + 25);
    ctx.fill();
}

function drawFurniture(ctx: CanvasRenderingContext2D, entity: Entity) {
    // Móveis simples são formas cinza claro para indicar obstáculo
    ctx.fillStyle = '#BBBBBB';
    // Default box se não tivermos shape específico
    ctx.fillRect(-15, -15, 30, 30);
}

function drawGeneric(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#FF00FF'; // Magenta para debug (não deve acontecer no final)
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
}
