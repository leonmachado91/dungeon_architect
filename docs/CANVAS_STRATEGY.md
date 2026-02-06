# Dungeon Architect — Estratégia do Canvas

> Arquitetura de renderização e gerenciamento de estado do editor de mapas.

---

## 1. Princípios Core

O editor deve ser performático (60fps) e responsivo. Para isso, separamos estritamente quem guarda os dados ("Verdade") de quem os mostra ("Visual").

1.  **State Separation (Separação de Estado):**
    *   **Persistent State (DB/PGLite):** A "Fonte da Verdade". Onde o JSON do `DungeonMap` é salvo. Operações de Save/Load ocorrem aqui.
    *   **Runtime State (Zustand):** O "Rascunho Rápido". Onde ocorrem as interações em tempo real (arrastar token, zoom, pan).

2.  **Optimistic Updates:**
    *   Ao mover um objeto, atualizamos o Zustand *imediatamente*.
    *   O salvamento no PGLite ocorre em background (debounced, ex: após 500ms sem input) para não travar a UI.

---

## 2. Layers do Canvas (Konva)

Usaremos `react-konva` para gerenciar a renderização em camadas (Layers). Isso evita redesenhar o fundo estático (pesado) quando apenas um token se move.

| Ordem (Z-Index) | Layer Name | Conteúdo | Interatividade |
| :--- | :--- | :--- | :--- |
| **3 (Topo)** | `UI Layer` | Ferramentas, cursores, anéis de seleção, régua. | Alta (Eventos de mouse) |
| **2** | `Entities Layer` | Tokens (`Entity`), NPCs, Monstros. | Alta (Drag & Drop) |
| **1** | `Zones Layer` | Polígonos de zonas (`Space`, `Zone`). Semi-transparente. | Média (Click p/ editar, Hover) |
| **0 (Fundo)** | `Background Layer` | Imagem gerada pela IA (`renderUrl`) + Grid. | Baixa (Apenas Pan/Zoom global) |

---

## 3. Fluxo de Dados: Entidades

Como um `Entity` (ex: um Goblin) sai do banco e aparece na tela:

### 3.1. Load (Inicialização)
1.  **DB Fetch:** App busca `DungeonMap` do PGLite.
2.  **Hydrate:** Dados populam a store do Zustand (`useEditorStore`).
3.  **Render:** React Konva lê o Zustand e renderiza componentes `<EntityToken />` na `ModelsLayer`.

### 3.2. Interaction (Arrastar Token)
1.  **User Action:** Usuário clica e arrasta um Goblin.
2.  **Konva Event:** `onDragMove` dispara.
3.  **State Update:**
    *   Atualiza coordenadas `x,y` no **Zustand** (Ephemeral).
    *   *NÃO* chama o banco ainda.
4.  **Re-render:** O componente `<EntityToken />` se move na tela instantaneamente.

### 3.3. Sync (Persistência)
1.  **Debounce:** Usuário solta o token (`onDragEnd`).
2.  **DB Save:** Uma função `saveToDb()` é agendada para rodar após X ms ou imediatamente.
3.  **Commit:** O novo JSON do mapa é gravado no PGLite.

---

## 4. Implementação Técnica

### Exemplo de Componente (Conceitual)

```tsx
// MapCanvas.tsx
function MapCanvas() {
  const mapData = useStore(state => state.map);
  const updateEntity = useStore(state => state.updateEntity);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Fundo Estático - Só re-renderiza se imagem mudar */}
      <Layer>
        <BackgroundImage src={mapData.renderUrl} />
        <GridRenderer resolution={mapData.meta.resolution} />
      </Layer>

      {/* Entidades Interativas - Re-renderiza rápido */}
      <Layer>
        {mapData.entities.map(entity => (
          <EntityToken 
            key={entity.id}
            data={entity}
            onDragEnd={(e) => {
              updateEntity(entity.id, { 
                position: { x: e.target.x(), y: e.target.y() } 
              });
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
}
```
