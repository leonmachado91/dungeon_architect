# 🧱 Block-Grid Engine — Análise Refinada

> **Premissa:** A AI recebe um quadro de resolução selecionável pelo usuário, preenche com blocos de dados (posição, tamanho, saídas, propriedades), e a engine traduz isso no skeleton do mapa. O gridSize é uma opção do usuário antes de gerar.

---

## A Ideia em Uma Frase

A AI é uma **arquiteta com blocos de LEGO num tabuleiro**: ela visualiza mentalmente um grid NxN e posiciona blocos retangulares. Cada bloco carrega dados semânticos (nome, tipo, exits, entities). A engine recebe esse tabuleiro e converte em polígonos reais com shapes refinados, portas no lugar certo, e corridors automáticos.

---

## Por Que Faz Sentido

### 1. O Espaço Cognitivo é Gerenciável

Grid | Cells Totais | Complexidade pra AI | Cell em px (world 1024)
-----|-------------|---------------------|----------------------
6×6  | 36          | Trivial, mas pobre  | ~164px
8×8  | 64          | **Ideal** — xadrez  | ~124px
10×10| 100         | Aceitável com Pro   | ~99px
12×12| 144         | Arriscado           | ~82px

Um grid 8×8 é como um tabuleiro de xadrez. A AI coloca peças. Se usar Gemini 2.5 Pro, consegue raciocinar sobre 64 posições sem problemas — é um espaço trivial comparado com coordenadas absolutas (1024×1024 = 1 milhão de posições).

### 2. A AI Decide O Layout, Não Adevinha

O sistema atual (Option C / grafo relacional: `DungeonGraphSchema`) pede pra AI gerar relações abstratas e a engine decide onde colocar tudo. O resultado? Layouts genéricos porque a engine não tem intenção criativa.

Com Block-Grid, a AI decide:
- **Onde** cada sala fica (col, row)
- **Quão grande** é (width, height em cells)
- **Pra onde** as saídas apontam (east, south, etc.)
- **O que tem dentro** (entities, features)

A engine se concentra em **traduzir** isso fielmente, não em interpretar.

### 3. O Debug é Visual

```
Grid 8×8 — Gerado pela AI:

  0 1 2 3 4 5 6 7
0 . . . E E . . .     E = Entrance (2×2)
1 . . . E E . . .     H = Main Hall (3×3)
2 . . H H H . . .     C = Corridor (1×3)
3 . . H H H C . .     A = Armory (2×2)
4 . . H H H C . .     B = Boss Room (3×2)
5 . B B B . C . .
6 . B B B . A A .
7 . . . . . A A .
```

Quando algo dá errado, basta printar o grid da AI e verificar visualmente. Com o sistema relacional atual, o debug é opaco — "a engine fez force-directed e deu isso".

### 4. Corridors São Naturais

Um corridor é simplesmente um bloco estreito (1×3, 1×4) que a AI posiciona entre as salas. Não precisa de A* ou pathfinding. Se dois blocos não são adjacentes mas têm exits apontando um pro outro, a engine gera o corridor automaticamente preenchendo o gap.

---

## O Que Preocupa (e Como Mitigar)

### ⚠️ 1. Sobreposição de Blocos

**Risco:** AI coloca dois blocos na mesma posição.

**Mitigação em 3 camadas:**
1. **Prompt engineering:** Instrução clara: "You MUST verify that no two blocks overlap. Before placing a block, mentally check that the cells it would occupy are empty."
2. **Validação na engine:** `BlockValidator` detecta overlaps e tenta resolver (empurrar o menor bloco pra cell livre mais próxima)
3. **Schema design:** Usar coordenadas zero-indexed + limites claros no schema Zod (`col: z.number().min(0).max(gridSize-1)`)

### ⚠️ 2. Shapes Limitados a Retângulos

**Risco:** Se a AI coloca um bloco 3×2, o resultado é sempre um retângulo 3×2. Sem L-shapes, sem octogonais.

**Solução: Shape Grammar na Engine**

A AI não precisa se preocupar com shapes. Ela coloca blocos retangulares e define o `role`. A engine aplica transformações:

| Role (AI define) | Shape Grammar (Engine aplica) |
|-------------------|------------------------------|
| `entrance`        | Retângulo com arco frontal   |
| `hub`             | Chanfros nos cantos (octagonal) |
| `support`         | Recorta 1 canto (L-shape)   |
| `secret`          | Irregular (canto recortado + noise) |
| `climax`          | Octagonal grandioso          |
| `corridor`        | Mantém estreito, sem mudança |
| `open`            | Retângulo simples            |

A AI coloca um bloco `3×3` com `role: "hub"` → a engine chanfra os cantos automaticamente → resultado: octagonal.

### ⚠️ 3. Calibração do gridSize

**Risco:** Qual grid funciona melhor? Depende do modelo e da complexidade do mapa.

**Solução: Grid como opção do usuário na Sidebar.**

O slider de resolução atual (512/1024/2048) pode ser complementado com um seletor de "Detalhamento do Grid":

| Label na UI | gridSize | Descrição                    |
|-------------|----------|------------------------------|
| Simples     | 6×6      | 3-5 salas, layout básico     |
| Padrão      | 8×8      | 5-8 salas, bom equilíbrio    |
| Detalhado   | 10×10    | 8-12 salas, muita variedade  |

A AI recebe o `gridSize` no prompt e adapta. O usuário escolhe antes de gerar.

### ⚠️ 4. JSON Mais Pesado que o Grafo Relacional

**Realidade:** Sim, cada bloco precisa de `col`, `row`, `width`, `height` + exits + entities. Mas pra 8-12 rooms, o JSON é tipicamente 2-4KB — irrelevante para o contexto de modelos que lidam com 128K+ tokens.

---

## Projetos Existentes — O Que Reutilizar

A pesquisa mostrou que **nenhum projeto open-source faz exatamente Block-Grid + LLM**, mas existem componentes valiosos:

### ROT.js (`rot-js` no npm)

- **O que faz:** Toolkit roguelike com geradores de mapa (`Map.Digger`, `Map.Uniform`). Retorna rooms e corridors como callbacks por cell
- **O que podemos usar:** ❌ Não diretamente. Os geradores decidem o layout — a gente quer que a AI decida. Mas a lógica de **corridor carving** entre rooms é reutilizável como referência de algoritmo
- **Veredicto:** Inspiração, não dependência

### @halftheopposite/dungeon (BSP + Prefabs)

- **O que faz:** BSP divide o espaço → encaixa rooms pre-desenhadas → gera tilemap (2D array de inteiros)
- **O que podemos usar:**
  - A lógica de **tilemap rendering** (grid → 2D array de tiles) é análoga ao que nossa engine precisa
  - O conceito de **room templates** = nossa Shape Grammar
  - O editor visual como modelo de debugging
- **Veredicto:** Boa referência arquitetural

### ndwfc (Wave Function Collapse)

- **O que faz:** WFC genérico pra browser/Node
- **O que podemos usar:** Poderia preencher o **interior** de rooms com tiles variadas (pisos, decoração, paredes). Não pra posicionamento de rooms
- **Veredicto:** Feature futura de polimento, não pra v1

### Conclusão de Libs

**Nenhuma lib resolve nosso problema diretamente.** O pipeline Block-Grid → Engine é específico o suficiente que precisa ser implementado sob medida. Mas podemos:
1. **Referência de algoritmo** de corridor generation (ROT.js style)
2. **Referência de pattern** pra tilemap/template (halftheopposite style)
3. **Referência de schema** pra structured output (SKE-Layout paper)

---

## Schema Proposto

### O que a AI gera (`BlockGridSchema`)

```typescript
// Schema Zod — output da AI
const BlockSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["room", "corridor", "stairs", "outdoor"]),
    role: z.enum([
        "entrance", "hub", "support", "secret", 
        "climax", "corridor", "open"
    ]),
    col: z.number().int().min(0),
    row: z.number().int().min(0),
    width: z.number().int().min(1).max(5),
    height: z.number().int().min(1).max(5),
    exits: z.array(z.object({
        side: z.enum(["north", "south", "east", "west"]),
        to: z.string(),  // target block id
        type: z.enum([
            "door", "archway", "secret", "stairs", 
            "ladder", "window"
        ]),
        state: z.enum(["open", "closed", "locked", "hidden"])
            .default("closed"),
    })),
    description: z.string(),
    visualPrompt: z.string().optional(),
    lighting: z.enum(["dark", "dim", "bright", "magical"])
        .default("dim"),
    floorType: z.string().optional(),
    entities: z.array(z.object({
        type: z.enum([
            "npc", "monster", "treasure", "hazard", 
            "interactive", "furniture", "wall_feature"
        ]),
        name: z.string(),
        description: z.string().optional(),
        icon: z.string().default("person"),
        position: z.enum([
            "center", "corner", "wall", "entrance"
        ]).default("center"),
    })).default([]),
});

const BlockGridSchema = z.object({
    name: z.string(),
    theme: z.string(),
    atmosphere: z.string(),
    gridSize: z.number().int().min(6).max(12),
    blocks: z.array(BlockSchema).min(3).max(15),
});
```

### O que a Engine produz (`DungeonMap`)

O output final é o mesmo `DungeonMapSchema` que já existe — `Space[]` com `Polygon`, `Connection[]` com `from/to positions`, `Entity[]` com coordenadas absolutas. A engine é uma **função pura**:

```
BlockGrid → validate → expand → shape → connect → DungeonMap
```

Sem mudanças no renderer, no canvas, no banco de dados, nem nos exports.

---

## Pipeline da Engine (5 Fases)

### Fase 0: Validate

```
Input: BlockGrid (AI output)
Output: BlockGrid (validado/corrigido)
```

- Detecta blocos fora dos limites do grid
- Detecta sobreposições entre blocos
- Detecta exits que referenciam blocos inexistentes
- Detecta exits assimétricos (A→B mas B não tem exit→A)
- **Correções automáticas:**
  - Empurra bloco pra cell livre mais próxima
  - Reduz tamanho se ultrapassa grid bounds
  - Adiciona exit recíproco se faltante

### Fase 1: Expand

```
Input: BlockGrid (validado)
Output: PlacedBlock[] com bounds em pixels
```

- Converte meta-cell → pixel: `x = PADDING + col × CELL_SIZE`
- `CELL_SIZE = floor((WORLD_WIDTH - 2 × PADDING) / gridSize)`
- Calcula bounds retangulares pra cada bloco

### Fase 2: Shape

```
Input: PlacedBlock[] com bounds
Output: PlacedBlock[] com polygons refinados
```

- Aplica Shape Grammar baseada no `role`:
  - `hub` → chanfra cantos
  - `support` → recorta 1 canto (L-shape)
  - `secret` → recorta irregularmente
  - Default → retângulo
- Grid-snap todos os vértices dos polígonos

### Fase 3: Connect

```
Input: PlacedBlock[] com polygons
Output: Connection[] + corridor Space[] adicionais
```

- Pra cada `exit`, calcula posição da porta na parede correspondente
- Se blocos com exits recíprocos são adjacentes → porta direta
- Se não são adjacentes → gera corridor automático (bloco estreito conectando os dois)
- Corridor gerado como Space tipo "corridor"

### Fase 4: Assemble

```
Input: PlacedBlock[], Connection[], corridors
Output: DungeonMap
```

- Converte cada bloco em `Space` (com polygon, zones, metadata)
- Converte exits em `Connection` (com posições de border)
- Converte entities em `Entity` (com posições absolutas resolvidas)
- Monta o `DungeonMap` final

---

## A Resolução do Grid no Sidebar (UX)

Hoje o Sidebar tem um slider "Resolução" com 3 opções (512/1024/2048). A proposta é adicionar um segundo seletor:

```
┌──────────────────────────────────┐
│ 📐 Grid                          │
│                                  │
│  Simples (6×6)  →  Detalhado    │
│      ○─────●──────────○         │
│    Simples   Padrão   Detalhado │
│    3-5 salas  5-8     8-12      │
│                                  │
│ 🖼️ Resolução                     │
│                                  │
│      ○──●─────────────○         │
│     512   1024       2048       │
└──────────────────────────────────┘
```

- **Grid** controla quantos blocos a AI pode usar (complexidade do mapa)
- **Resolução** controla o tamanho do canvas/export (qualidade visual)

São ortogonais: um mapa 6×6 pode ser renderizado em 2048px (salas grandes e detalhadas), e um 10×10 pode caber em 1024px (salas menores mas numerosas).

### Integração no `generateMap.ts`

```typescript
interface GenerateMapOptions {
    prompt: string;
    resolution?: "512x512" | "1024x1024" | "2048x2048";
    gridSize?: 6 | 8 | 10;  // NOVO
    modelId?: string;
}
```

O `gridSize` é passado pro system prompt da AI:

```
You are placing blocks on a {gridSize}×{gridSize} grid.
Grid coordinates range from (0,0) to ({gridSize-1},{gridSize-1}).
```

---

## Comparação Final: Block-Grid vs Abordagem Atual vs Hybrid Intent

| Aspecto | Atual (Graph BFS) | Hybrid Intent (D) | Block-Grid + Shape Grammar |
|---------|--------------------|--------------------|---------------------------|
| AI decide posição | ❌ Não | ❌ Engine decide | ✅ AI decide via grid |
| AI decide tamanho | Via enum (s/m/l) | Via role→mapping | ✅ width×height livre |
| Shapes variados | ❌ Só retângulos | ✅ Shape Grammar | ✅ Shape Grammar |
| Grid compliance | ✅ BFS grid | ✅ Force-directed | ✅ Meta-grid → pixel |
| Carga cognitiva AI | Baixa | Baixa | Média (grid coords) |
| Debug | Opaco (BFS) | Opaco (forces) | ✅ Visual (grid ASCII) |
| Corridors | ❌ Não gera | A* pathfinding | Bloco estreito ou auto |
| User control | ❌ Nenhum | ❌ Engine decide | ✅ gridSize selecionável |
| Compatibilidade output | DungeonMap | DungeonMap | DungeonMap (idêntico) |
| Refactor necessário | - | layoutEngine total | layoutEngine total |
| Effort | - | Alto | **Médio-Alto** |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| AI sobrepõe blocos | Média | Alto | Prompt + Validator (Fase 0) |
| Layouts repetitivos | Média | Médio | Prompt com variação + temperature > 0 |
| Corridors longos demais | Baixa | Baixo | Limit max corridor length, flag |
| gridSize errado pra modelo fraco | Média | Médio | Default 8×8, testar com Flash |
| Shape Grammar irregular fica feio | Baixa | Médio | Fallback pra retângulo se noise dá errado |

---

## Resumo Executivo

**A abordagem Block-Grid é viável, realista, e resolve os problemas do sistema atual.** A combinação com Shape Grammar compensa a limitação de retângulos. O gridSize como opção do usuário dá controle sem complicar. O output final é o mesmo `DungeonMap` — sem mudanças no renderer/canvas/DB.

**O que muda:**
1. `schemas/graph.ts` → novo `schemas/blockGrid.ts` (BlockGridSchema)
2. `lib/generation/layoutEngine.ts` → reescrito como pipeline de 5 fases
3. `actions/generateMap.ts` → system prompt adaptado + recebe `gridSize`
4. `components/layout/Sidebar.tsx` → adiciona seletor de grid
5. `constants/core.ts` → novas constantes de grid defaults

**O que não muda:**
- `schemas/dungeon.ts` (output final)
- `types/dungeon.ts`
- `components/canvas/*` (renderer)
- `stores/*` (state management)
- `db/*` (banco de dados)
