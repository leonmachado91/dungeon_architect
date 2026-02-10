import { WORLD_BOUNDS, RENDER_CONSTANTS } from '@/constants/core';

export const SKELETON_COLORS = {
    FLOOR: '#FFFFFF',       // Branco para o chão
    WALL: '#333333',        // Cinza escuro para paredes
    DOOR: '#666666',        // Cinza médio para portas
    WINDOW: '#999999',      // Cinza claro para janelas
    STAIRS: '#CCCCCC',      // Cinza muito claro para escadas
    TEXT: '#000000',        // Preto para textos (debug)
    GRID: '#E5E5E5',        // Grid muito sutil (opcional)
    VOID: '#000000'         // Preto para o vazio (fora do mapa)
} as const;

export const SKELETON_DIMENSIONS = {
    GRID_SIZE: RENDER_CONSTANTS.SKELETON_GRID_SIZE,   // Use centralized constant
    WALL_THICKNESS: 10,     // Espessura da parede em pixels relativos
    DOOR_WIDTH: 60,         // Largura da porta
    CANVAS_SIZE: WORLD_BOUNDS.WIDTH,  // Use centralized world bounds
} as const;
