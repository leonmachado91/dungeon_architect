
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LayerKey = 'render' | 'reference' | 'wireframe' | 'interactive';

interface LayerState {
    visible: boolean;
    opacity: number;
}

interface ViewportState {
    layers: Record<LayerKey, LayerState>;
    toggleLayer: (layer: LayerKey) => void;
    setLayerOpacity: (layer: LayerKey, opacity: number) => void;
    isGeometryLocked: () => boolean;
}

export const useViewportStore = create<ViewportState>()(
    persist(
        (set, get) => ({
            layers: {
                wireframe: { visible: true, opacity: 1.0 },
                reference: { visible: false, opacity: 0.5 },
                render: { visible: true, opacity: 1.0 },
                interactive: { visible: false, opacity: 1.0 },
            },
            toggleLayer: (layer) =>
                set((state) => ({
                    layers: {
                        ...state.layers,
                        [layer]: {
                            ...state.layers[layer],
                            visible: !state.layers[layer].visible,
                        },
                    },
                })),
            setLayerOpacity: (layer, opacity) =>
                set((state) => ({
                    layers: {
                        ...state.layers,
                        [layer]: {
                            ...state.layers[layer],
                            opacity,
                        },
                    },
                })),
            isGeometryLocked: () => {
                const { layers } = get();
                // Bloqueia se Reference ou Render estiverem visíveis
                // A camada Wireframe deve estar visível para editar, mas se outras estiverem por cima/ativo, bloqueia.
                // Regra do usuário: "apenas wireframe: controle total. algum outro view ta ativado: spaces ficam imóveis"

                const isReferenceActive = layers.reference.visible;
                const isRenderActive = layers.render.visible;

                if (isReferenceActive || isRenderActive) {
                    return true;
                }

                return false;
            },
        }),
        {
            name: 'dungeon-viewport-storage',
        }
    )
);
