# PLAN: Block-Grid Engine (v2 — Refinado)

> Substituir o sistema atual (DungeonGraph + BFS Grid) por um pipeline Block-Grid onde a AI posiciona blocos num grid selecionável e a engine traduz em geometria refinada com suporte a formas orgânicas, espaços negativos (holes), e containers.

---

## Proposed Changes

Organizados por dependência — implementar nesta ordem.

---

### 1. Schema Layer

#### [NEW] [blockGrid.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/schemas/blockGrid.ts)

Schema Zod para output da AI. Substitui `DungeonGraphSchema`.

```typescript
import { z } from "zod";

// --- Sub-schemas ---

export const BlockExitSchema = z.object({
    side: z.enum(["north", "south", "east", "west"]),
    to: z.string().describe("Target block id"),
    type: z.enum(["door", "archway", "secret", "stairs", "ladder", "window"]),
    state: z.enum(["open", "closed", "locked", "hidden"]).default("closed"),
});

export const BlockEntitySchema = z.object({
    type: z.enum([
        "npc", "monster", "treasure", "hazard",
        "interactive", "furniture", "wall_feature"
    ]),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().default("person"),
    position: z.enum(["center", "corner", "wall", "entrance"]).default("center"),
});

// --- Main Block ---

export const BlockSchema = z.object({
    id: z.string().describe("Unique slug, e.g. 'main-hall', 'corridor-1'"),
    name: z.string().describe("Display name"),
    type: z.enum(["room", "corridor", "stairs", "outdoor"]),
    role: z.enum([
        "entrance", "hub", "support", "secret",
        "climax", "corridor", "open", "container"
    ]).describe(
        "entrance=entry point, hub=central room, support=side room, " +
        "secret=hidden, climax=boss/finale, corridor=passage, " +
        "open=generic, container=large area with sub-spaces inside"
    ),
    col: z.number().int().min(0).describe("Column position (0-indexed)"),
    row: z.number().int().min(0).describe("Row position (0-indexed)"),
    width: z.number().int().min(1).max(6).describe("Width in grid cells"),
    height: z.number().int().min(1).max(6).describe("Height in grid cells"),
    exits: z.array(BlockExitSchema).describe(
        "Each exit MUST have a reciprocal exit on the target block"
    ),
    description: z.string().describe("Atmospheric description for rendering"),
    visualPrompt: z.string().optional().describe(
        "Visual details: materials, objects, atmosphere"
    ),
    lighting: z.enum(["dark", "dim", "bright", "magical"]).default("dim"),
    floorType: z.string().optional().describe("e.g. 'stone', 'dirt', 'wood', 'grass'"),
    // Organic shape parameters (engine uses these to refine geometry)
    smoothing: z.number().min(0).max(1).default(0).describe(
        "0=angular/geometric, 1=fully curved. Use 0.7-1.0 for caves, 0 for built rooms"
    ),
    noiseAmount: z.number().min(0).max(1).default(0).describe(
        "Wall irregularity. 0=smooth, 0.5=rough stone, 0.8=natural cave walls"
    ),
    // Containment — sub-space inside a container
    parentId: z.string().optional().describe(
        "If this block is inside a container block, set to parent's id"
    ),
    entities: z.array(BlockEntitySchema).default([]),
});

// --- Top-level Grid ---

export const BlockGridSchema = z.object({
    name: z.string().describe("Dungeon/location name"),
    theme: z.string().describe("e.g. 'Ancient Temple', 'Dark Forest', 'Underground Prison'"),
    atmosphere: z.string().describe("e.g. 'Damp and cold, echoing drips'"),
    gridSize: z.number().int().min(6).max(12).describe("Grid dimension (NxN)"),
    blocks: z.array(BlockSchema).min(3).max(20).describe(
        "All blocks placed on the grid. NO overlapping blocks."
    ),
});

// --- Type exports ---

export type BlockExit = z.infer<typeof BlockExitSchema>;
export type BlockEntity = z.infer<typeof BlockEntitySchema>;
export type Block = z.infer<typeof BlockSchema>;
export type BlockGrid = z.infer<typeof BlockGridSchema>;
```

**Decisões:**
- `.describe()` em todos os campos → ajuda o modelo a gerar output correto
- `role: "container"` → floresta, mercado, arena — com `parentId` nos filhos
- `smoothing` + `noiseAmount` → AI controla organicidade, engine aplica geometria
- Types exportados → consumidos pela engine e testes

---

#### [DELETE] [graph.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/schemas/graph.ts)

Remover completamente. Consumidores atuais (todos serão migrados):
- `generateMap.ts` → migra pra `BlockGridSchema`
- `layoutEngine.ts` → reescrito
- `layoutEngine.test.ts` → reescrito

---

#### [MODIFY] [index.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/schemas/index.ts)

```diff
-export * from "./graph";
+export * from "./blockGrid";
 export * from "./dungeon";
```

---

#### [MODIFY] [dungeon.ts (schema)](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/schemas/dungeon.ts)

Adicionar campos de organicidade ao `SpaceSchema` — o renderer e o Inspector Panel precisam deles:

```diff
 export const SpaceSchema = z.object({
     // ... existing fields ...
     notes: z.string().optional(),
+    // Organic shape metadata (set by engine, editable by user post-gen)
+    smoothing: z.number().min(0).max(1).default(0),
+    noiseAmount: z.number().min(0).max(1).default(0),
 });
```

---

#### [MODIFY] [dungeon.ts (types)](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/types/dungeon.ts)

Manter sincronizado com o Zod schema — adicionar ao interface `Space`:

```diff
 export interface Space {
     // ... existing fields ...
     notes?: string;
+    smoothing?: number;
+    noiseAmount?: number;
 }
```

---

### 2. Constants

#### [MODIFY] [core.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/constants/core.ts)

```typescript
/** Block-Grid Engine configuration */
export const BLOCK_GRID = {
    DEFAULT_GRID_SIZE: 8,
    GRID_PADDING: 20,           // px margin around entire grid
    MIN_BLOCKS: 3,
    MAX_BLOCKS: 20,
    CORRIDOR_WIDTH_PX: 40,      // auto-corridor width
    // Shape Grammar
    CHAMFER_RATIO: 0.15,        // octagonal chamfer as fraction of shorter side
    CUT_CORNER_RATIO: 0.3,      // L-shape cut as fraction of shorter side
    // Organic refinement
    CHAIKIN_ITERATIONS: 2,      // smoothing subdivision passes
    NOISE_FREQUENCY: 0.05,      // simplex noise frequency
    NOISE_MAX_OFFSET_PX: 12,    // max displacement in pixels
    // Grid size options available to user
    GRID_SIZE_OPTIONS: [6, 8, 10] as const,
} as const;

export type GridSize = typeof BLOCK_GRID.GRID_SIZE_OPTIONS[number];
```

---

### 3. Engine Layer

#### [NEW] [shapeGrammar.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/lib/generation/shapeGrammar.ts)

Funções puras de geometria. Testáveis isoladamente, sem dependências de state.

```typescript
// Tipos internos
interface Rect { x: number; y: number; w: number; h: number }
type Corner = "nw" | "ne" | "sw" | "se";

// Conversões
export function rectToPolygon(rect: Rect): Point[]
export function polygonBounds(polygon: Point[]): Rect

// Shape Grammar transforms
export function chamferRect(rect: Rect, ratio: number): Point[]
export function cutRectCorner(rect: Rect, corner: Corner, ratio: number): Point[]
export function irregularCut(rect: Rect, seed: number): Point[]

// Organic refinement
export function chaikinSubdivision(pts: Point[], iterations: number): Point[]
export function applySimplexNoise(
    pts: Point[], amount: number, frequency: number, seed: number
): Point[]

// Containment
export function carveHoles(outerRect: Rect, childRects: Rect[], margin: number): Point[][]

// Utilities
export function gridSnap(pts: Point[], gridSize: number): Point[]
export function centroid(pts: Point[]): Point
export function pointOnWall(
    polygon: Point[], side: "north"|"south"|"east"|"west", t?: number
): Point
```

**Dependência:** `simplex-noise` (npm) — ~2KB, pure JS, zero deps.

```bash
pnpm add simplex-noise
```

---

#### [MODIFY] [layoutEngine.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/lib/generation/layoutEngine.ts)

**Reescrita completa.** Exporta `layoutBlockGrid` que orquestra o pipeline de 5 fases.

```typescript
import type { BlockGrid, Block } from "@/schemas/blockGrid";
import type { DungeonMap, Space, Connection, Entity } from "@/types";
import { BLOCK_GRID, WORLD_BOUNDS } from "@/constants/core";
import * as shape from "./shapeGrammar";

interface PlacedBlock extends Block {
    bounds: Rect;
    polygon?: Point[];
    holes?: Point[][];
}

export function layoutBlockGrid(grid: BlockGrid, options?: LayoutOptions): DungeonMap {
    const validated  = validateBlockGrid(grid);           // Fase 0
    const placed     = expandBlocks(validated);           // Fase 1
    const shaped     = applyShapeGrammar(placed, grid);   // Fase 2
    const connected  = connectBlocks(shaped);             // Fase 3
    return assembleDungeonMap(shaped, connected, grid, options);  // Fase 4
}
```

##### Fase 0 — `validateBlockGrid`

| Validação | Correção |
|-----------|----------|
| `col + width > gridSize` | Clamp width |
| Overlaps (exceto child→parent) | Empurra menor pra cell livre (BFS) |
| Exit.to → id inexistente | Remove exit + `console.warn` |
| A→B sem B→A recíproco | Adiciona B→A com side oposto |
| `parentId` → bloco inexistente ou não-container | Remove `parentId` |
| Block sem exits e sem `parentId` | `console.warn` (órfão) |
| 0 blocks ou gridSize inválido | **Throw** (irrecuperável) |

##### Fase 1 — `expandBlocks`

```
CELL_PX = floor((WORLD_WIDTH - 2 * PADDING) / gridSize)

block.bounds = {
    x: PADDING + col * CELL_PX,
    y: PADDING + row * CELL_PX,
    w: width * CELL_PX,
    h: height * CELL_PX,
}
```

##### Fase 2 — `applyShapeGrammar`

**Ordem:** Containers primeiro → depois children.

| Role | Transform | Pontos |
|------|-----------|--------|
| `entrance` | Retângulo | 4 |
| `hub` | `chamferRect(0.15)` | 8 |
| `support` | `cutRectCorner` (canto distante da entrada) | 6 |
| `secret` | `irregularCut` (seed = hash do block.id) | 5-7 |
| `climax` | `chamferRect(0.2)` | 8 |
| `corridor` | Retângulo | 4 |
| `open` | Retângulo | 4 |
| `container` | Retângulo + `carveHoles` dos children | 4 + holes |

Pós-transform:
1. Se `smoothing > 0` → `chaikinSubdivision(polygon, iterations * smoothing)`
2. Se `noiseAmount > 0` → `applySimplexNoise(polygon, amount, freq, seed)`
3. `gridSnap` todos os vértices

##### Fase 3 — `connectBlocks`

Pra cada par de exits recíprocos (A→B + B→A):

1. Calcular pontos: `pointOnWall(A.polygon, exit.side)` e `pointOnWall(B.polygon, exit.side)`
2. **Se adjacentes** (distância ≤ CELL_PX) → `Connection` direta
3. **Se não-adjacentes** → corridor automático via **L-path**:
   - Segmento 1: sai de A na direção do exit
   - Curva 90° na coluna/linha de B
   - Segmento 2: chega em B
   - Se L-path cruza bloco → tenta L invertido
   - Se ambos cruzam → corridor reto (força)
   - Largura: `CORRIDOR_WIDTH_PX`

> [!NOTE]
> A* pathfinding é v2. L-path resolve 90%+ dos casos reais.

##### Fase 4 — `assembleDungeonMap`

| Source | Target | Notas |
|--------|--------|-------|
| `PlacedBlock` | `Space` | polygon, holes, smoothing, noiseAmount |
| Exit pair | `Connection` | posições absolutas, type, state |
| `BlockEntity` | `Entity` | posição via centroid/pointOnWall/corner |
| Auto-corridors | `Space` | `spaceType: "corridor"` |

IDs gerados com `crypto.randomUUID()`.

---

### 4. AI Integration

#### [MODIFY] [generateMap.ts](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/actions/generateMap.ts)

Mudanças:
1. Import `BlockGridSchema` (não mais `DungeonGraphSchema`)
2. Aceitar `gridSize` como parâmetro
3. System prompt via `buildBlockGridPrompt(gridSize)`
4. Chamar `layoutBlockGrid` (não mais `layoutGraph`)
5. Expor `blockGrid` no retorno pra debugging
6. Se AI gera BlockGrid inválido → `validateBlockGrid` tenta corrigir antes de falhar

```typescript
interface GenerateMapOptions {
    prompt: string;
    resolution?: Resolution;
    gridSize?: GridSize;
    modelId?: string;
}

export async function generateMap(options: GenerateMapOptions) {
    const { prompt, resolution = "1024x1024", gridSize = 8, modelId } = options;

    const result = await generateObject({
        model: google(modelId || MODEL_IDS.GEMINI_2_0_FLASH),
        schema: BlockGridSchema,
        system: buildBlockGridPrompt(gridSize),
        prompt: buildUserPrompt(prompt, gridSize),
    });

    const blockGrid = result.object;
    const dungeonMap = layoutBlockGrid(blockGrid, { resolution });

    return { success: true, data: dungeonMap, blockGrid };
}
```

##### System Prompt

Prompt completo definido no plano — cobre grid rules, roles, exits, organic shapes, containers, narrative flow, e entities. Ver seção completa em [PLAN-map-generation.md](file:///e:/Dev/Agente%20Geral/dungeon_architect/docs/plan/PLAN-map-generation.md).

```
You are a master dungeon/location architect for tabletop RPGs.
You design locations by placing BLOCKS on a {gridSize}×{gridSize} GRID.

## GRID RULES
- Coordinates 0-indexed. Blocks MUST NOT overlap.
- col+width ≤ gridSize, row+height ≤ gridSize.

## ROLES
entrance, hub, support, secret, climax, corridor, open, container

## EXITS
Every exit must be reciprocal. north↔south, east↔west.

## ORGANIC SHAPES
smoothing (0-1) + noiseAmount (0-1) by environment type.

## CONTAINERS
container + parentId for nested areas.

## NARRATIVE FLOW
entrance → exploration → challenges → climax → reward.
```

##### User Prompt

Adapta range de blocks ao gridSize:
- 6×6 → 3-6 blocks
- 8×8 → 5-10 blocks
- 10×10 → 8-15 blocks

---

### 5. UI Layer

#### [MODIFY] [Sidebar.tsx](file:///e:/Dev/Agente%20Geral/dungeon_architect/src/components/layout/Sidebar.tsx)

**Grid Size Slider** — 3 posições (6, 8, 10), antes do resolution selector:

```tsx
const [gridSize, setGridSize] = useState<GridSize>(8);

// Slider com labels "Simples / Padrão / Detalhado"
// Passa pra generateMap({ prompt, resolution, gridSize })
```

**Smoothing/Noise no Inspector** — editáveis pós-geração:

Quando o usuário seleciona um Space no canvas, o Inspector Panel mostra dois sliders:
- **Suavidade** (smoothing 0-1)
- **Irregularidade** (noiseAmount 0-1)

Valores salvos no store e persistidos no `Space`. Garante controle pós-AI.

---

### 6. Cleanup

| Arquivo | Ação |
|---------|------|
| `schemas/graph.ts` | **DELETE** |
| `schemas/index.ts` | Trocar export graph → blockGrid |
| `lib/__tests__/layoutEngine.test.ts` | **REWRITE** |
| `actions/generateMap.ts` | Remover imports de graph |

---

## Dependencies

```bash
pnpm add simplex-noise    # ~2KB, pure JS, zero deps
```

---

## Scoped Out (v2)

| Feature | Motivo |
|---------|--------|
| Multi-floor | Grid separado por andar — complexidade alta |
| Megadungeons (50+ salas) | Grid maior ou multi-zone |
| Exits diagonais | Complexidade no connector |
| WFC interiores | Polimento post-MVP |
| A* corridors | L-path resolve 90%+ |

---

## Verification Plan

### Automated Tests (~35 tests)

```bash
pnpm test -- --run shapeGrammar.test.ts
pnpm test -- --run layoutEngine.test.ts
```

#### shapeGrammar.test.ts (~15)
- `rectToPolygon`: 4 pontos, área = w×h
- `chamferRect`: 8 pontos, dentro dos bounds, área < rect
- `cutRectCorner` (cada corner): 6 pontos, área < rect
- `irregularCut`: determinístico com mesma seed
- `chaikinSubdivision`: mais pontos, curvas suaves
- `applySimplexNoise`: deslocamento ≤ max offset, determinístico
- `carveHoles`: holes.length = children.length, holes dentro dos bounds
- `gridSnap`: pontos múltiplos do grid
- `centroid`: dentro do polygon
- `pointOnWall`: ponto na borda do polygon

#### layoutEngine.test.ts (~20)
- **Validate:** overlaps, exits recíprocos, bounds clamped, órfãos warned
- **Expand:** pixel coords pra gridSize 6/8/10, padding aplicado
- **Shape:** role→polygon correto (hub=8pts, support=6pts, corridor=4pts)
- **Connect:** adjacentes→Connection, não-adjacentes→corridor, L-path
- **Assemble:** output parseia com `DungeonMapSchema.parse()`
- **Container:** parent com holes, children encaixados
- **E2E:** `layoutBlockGrid` com fixture → DungeonMap válido

### Manual Verification
1. Gerar gridSize 6, 8, 10 → verificar visual progressivo
2. Prompt "caverna natural" → smoothing/noise visíveis
3. Prompt "floresta com acampamento" → container + sub-spaces
4. Prompt "dungeon clássica" → retângulos limpos (smoothing=0)
5. Editar smoothing/noise no Inspector → persiste
6. Gemini Flash vs Pro → comparar qualidade
7. Verificar `blockGrid` no console (devtools)
