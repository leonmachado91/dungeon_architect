# PLAN: Viewport Layering System (Blender-Style)

> **Contexto:** Evolução do "Debug View" para um sistema robusto de camadas de visualização (Viewport Layers), inspirado no Blender. O objetivo é permitir que o usuário componha sua visualização ativando/desativando e mesclando camadas (Wireframe, Reference, Render, Interactive).

## 1. Análise e Arquitetura

O sistema deixará de ser modos de "visão única" para se tornar um **Compositor de Camadas**. O Canvas renderizará uma pilha (stack) de camadas, onde a visibilidade e opacidade de cada uma podem ser controladas independentemente.

### 1.1 As Camadas (Layers)

| Ordem (Z-Index) | Nome da Camada | Descrição | Bloqueia Edição? |
| :--- | :--- | :--- | :--- |
| **0 (Bottom)** | **Render Layer** | A imagem final gerada pela IA (colorida). | **SIM** (Geometry Locked) |
| **1** | **Reference Layer** | O esqueleto semântico enviado para a IA (grayscale). | **SIM** (Geometry Locked) |
| **2** | **Wireframe Layer** | A geometria editável atual (paredes, polígonos, entidades). | **NÃO** (Se for a única ativa) |
| **3 (Top)** | **Interactive View** | (Futuro) Visualização otimizada par gameplay. | **SIM** |

### 1.2 Regra de Bloqueio (Interaction Logic)

A manipulação da geometria dos **SpaceShapes** (paredes/polígonos) só é permitida se:
1.  **Wireframe Layer** estiver ATIVA.
2.  **Referencia Layer** estiver INATIVA.
3.  **Render Layer** estiver INATIVA.

`const isGeometryLocked = !viewport.wireframe.visible || viewport.reference.visible || viewport.render.visible;`

> **Nota:** Entidades (portas, móveis) e propriedades (nome, tipo) continuam editáveis mesmo com o bloqueio de geometria, pois não alteram a estrutura fundamental do mapa (embora alterem o skeleton visualmente, o que é aceitável para ajustes finos).

### 1.3 Gerenciamento de Estado (`useViewportStore`)

```typescript
import { persist } from 'zustand/middleware';

interface ViewportState {
  layers: {
    render: { visible: boolean; opacity: number };
    reference: { visible: boolean; opacity: number };
    wireframe: { visible: boolean; opacity: number };
    interactive: { visible: boolean; opacity: number };
  };
  toggleLayer: (layer: keyof ViewportState['layers']) => void;
  setLayerOpacity: (layer: keyof ViewportState['layers'], opacity: number) => void;
  // Computed property helper
  isGeometryLocked: () => boolean;
}
```

## 2. Implementação Técnica

### 2.1 Otimização do `ReferenceLayer`

Como a geometria dos espaços é **bloqueada** quando essa camada está ativa, não precisamos re-renderizar o skeleton a todo momento por causa de drag-and-drop de paredes (pois ele está desabilitado).

- **Trigger de Renderização:**
    - Ao ativar a camada (Mount).
    - Ao alterar propriedades de `spaces` (tipo, cor).
    - Ao adicionar/remover/mover `entities` (pois entidades ainda são editáveis).

### 2.2 Refatoração do `MapCanvas.tsx`

```tsx
const isLocked = useViewportStore(s => s.isGeometryLocked());

<Stage>
  {/* Layer 0: AI Render */}
  {viewport.render.visible && (
      <RenderLayer opacity={viewport.render.opacity} />
  )}

  {/* Layer 1: Reference Skeleton */}
  {viewport.reference.visible && (
      <ReferenceLayer opacity={viewport.reference.opacity} />
  )}

  {/* Layer 2: Wireframe */}
  {viewport.wireframe.visible && (
      <WireframeLogic isLocked={isLocked} />
  )}
</Stage>
```

### 2.3 UI de Controle (`ViewportControls`)

Um componente no cabeçalho (Header) com estados persistidos.

- **Wireframe:** [Grid Icon] (Toggle)
- **Reference:** [Bone Icon] (Toggle)
- **Render:** [Image Icon] (Toggle - Disabled se não houver renderUrl)
- **Interactive:** [Play Icon] (Disabled - Future)

---

## 3. Plano de Tarefas

### Fase 1: Store e Controles (Persistência)
- [ ] **1.1 Criar `src/stores/viewportStore.ts`**:
    - Implementar com `persist` middleware (localStorage).
    - Adicionar lógica `isGeometryLocked`.
- [ ] **1.2 Criar `ViewportControls`**:
    - Componente de UI para header.
    - Botões com feedback visual de estado (Ativo/Inativo).

### Fase 2: Camadas e Bloqueio [COMPLETED]
- [x] **2.1 Implementar `ReferenceLayer`**:
    - Usar `renderSkeleton()` otimizado.
    - Reagir a mudanças no store, mas sabendo que geometria é estática.
- [x] **2.2 Atualizar `MapCanvas`**:
    - Integrar `useViewportStore`.
    - Passar prop `draggable={!isLocked}` para `SpaceShape`.
    - Desabilitar transformeres/editores de geometria se `isLocked`.

### Fase 3: Render Layer e Polimento [DEFERRED]
> **Nota:** Decidido manter opacidade fixa por enquanto (Render abaixo, Reference com opacidade fixa, Wireframe acima).

- [ ] **3.1 Migrar Background para `RenderLayer`**:
    - Criar componente dedicado.
    - Conectar opacidade ao store.
- [ ] **3.2 Ajustes Finais**:
    - Verificar performance e "flicker" ao trocar camadas.

---

## 4. Próximos Passos

1.  Iniciar implementação da **Fase 1**.
