# 🧠 Brainstorm: Nova Arquitetura de Geração de Mapas

> **Contexto:** A engine atual (`layoutEngine.ts`) usa BFS num grid 6×6 rígido que produz apenas retângulos idênticos, layouts lineares, e nenhuma variedade visual. O sistema precisa ser repensado do zero, mantendo o princípio híbrido (AI + Engine) mas redistribuindo responsabilidades: **AI gera dados semânticos leves**, **Engine constrói geometria complexa**.

## Princípios Acordados

| Princípio | Descrição |
|-----------|-----------|
| **AI = Semântica** | AI gera lore, tema, relações espaciais simples. Sem coordenadas, sem JSON complexo |
| **Engine = Geometria** | Engine resolve posicionamento, grid snap, formas complexas, corridors |
| **Grid Obrigatório** | Todo polígono respeita o grid de 40px. Engine garante snap |
| **Formas Complexas** | L-shapes, T-shapes, curvas, diagonais — não apenas retângulos |
| **Corridors como Spaces** | Passagens são first-class, conectam rooms visualmente |
| **Foco Gemini 3 Pro** | Mas arquitetura deve funcionar com modelos menores |

---

## O Problema Central

A interface entre AI e Engine precisa de um **vocabulário intermediário** — algo que:
1. A AI consiga gerar sem pensar em coordenadas (baixo custo cognitivo)
2. A Engine consiga interpretar pra produzir geometria precisa (alta fidelidade)
3. Seja expressivo o suficiente pra mapas complexos (liberdade criativa)

Esse vocabulário é a **chave** de toda a arquitetura. As opções abaixo diferem fundamentalmente em como definem esse vocabulário.

---

## Option A: "Semantic Blueprint" — AI descreve intenção espacial, Engine interpreta

### Conceito

A AI gera um **blueprint semântico** — um grafo onde cada node carrega **instruções qualitativas** em vez de coordenadas. A Engine tem um **interpretador de shapes** que traduz essas instruções em polígonos grid-aligned.

### Schema que a AI gera (exemplo)

```json
{
  "rooms": [
    {
      "id": "main-hall",
      "name": "Salão Principal",
      "shape": "rectangle",
      "size": "large",
      "features": ["alcove-east", "fireplace-north"],
      "description": "...",
      "visualPrompt": "..."
    },
    {
      "id": "storage",
      "shape": "L-shape",
      "size": "medium",
      "features": ["shelves-wall"],
      "description": "..."
    }
  ],
  "connections": [
    { "from": "main-hall", "to": "storage", "type": "door", "wall": "east" }
  ],
  "flow": ["entrance", "main-hall", "storage", "boss-room"]
}
```

### Como a Engine opera

1. **Shape Library**: Catálogo de templates de formas (rectangle, L-shape, T-shape, octagonal, circular, irregular) como arrays de grid cells
2. **Placement Solver**: Usa o `flow` como guia de ordem, coloca rooms tentando respeitar as direções relativas dos connections (`wall: "east"` → neighbor deve ficar a leste)
3. **Corridor Generator**: Gera corridors estreitos (1-2 cells de largura) conectando rooms que não são adjacentes
4. **Feature Resolver**: Interpreta `features` como sub-áreas/zones dentro do room (alcove = extensão de 1-2 cells, fireplace = zona na parede norte)

### Vocabulário da AI

```
shapes:    rectangle, L-shape, T-shape, cross, octagonal, circular, irregular
sizes:     tiny, small, medium, large, huge
walls:     north, south, east, west, northeast, northwest, southeast, southwest
features:  alcove-{dir}, pillar-center, elevated-{dir}, sunken-center, balcony-{dir}
```

✅ **Pros:**
- AI trabalha num nível alto e natural — "sala L-shape com alcove a leste"
- Shape library pode crescer sem mudar o schema da AI
- Engine tem controle total do grid snap e posicionamento
- Features (alcoves, elevated areas) criam riqueza visual sem custo pra AI
- Funciona com modelos menores (vocabulário simples e finito)

❌ **Cons:**
- Shape library limitada → AI limitada ao catálogo
- "irregular" é vago — como a engine decide o shape?
- Placement solver pode produzir layouts que ignoram a intenção da AI
- Features como "alcove-east" são ambíguas sem contexto dimensional

📊 **Effort:** Medium

---

## Option B: "Grid Stamp" — AI posiciona peças num grid normalizado de resolução baixa

### Conceito

A AI trabalha num **mini-grid semântico** (ex: 16×16) onde cada cell é uma "unidade de espaço". Ela "colore" cells com IDs de rooms, como num mapa de Tetris. A Engine depois expande cada cell pro grid real (40px), aplica smoothing/refinamento, e gera corridors.

### Schema que a AI gera (exemplo)

```json
{
  "gridSize": 16,
  "cells": {
    "main-hall": [[4,4],[5,4],[6,4],[4,5],[5,5],[6,5],[4,6],[5,6],[6,6]],
    "storage": [[7,4],[8,4],[7,5]],
    "corridor-1": [[7,5],[7,6]]
  },
  "rooms": {
    "main-hall": { "name": "Salão Principal", "lighting": "bright", ... },
    "storage": { "name": "Depósito", "lighting": "dim", ... }
  },
  "connections": [
    { "from": "main-hall", "to": "storage", "type": "door" }
  ]
}
```

### Como a Engine opera

1. **Grid Expansion**: Mapeia grid normalizado 16×16 → grid real 1024×1024 (cada cell = 64px, ou ajusta pro GRID_SIZE de 40px)
2. **Polygon Extraction**: Converte clusters de cells em polígonos otimizados (merge de cells adjacentes → contorno externo)
3. **Smoothing**: Opcionalmente suaviza cantos (chamfer) pra formas mais orgânicas
4. **Connection Placement**: Detecta onde rooms se tocam e posiciona portas/janelas automaticamente

### Ponto forte

A AI literalmente "desenha" o mapa colocando cells — formas arbitrárias surgem naturalmente. Uma sala L é um L de cells, uma sala circular é cells numa forma circular, um corridor é cells em linha. **Zero limite de formas**.

✅ **Pros:**
- Formas 100% livres — qualquer shape que caiba no grid
- AI tem controle espacial direto sem lidar com pixels ou coordenadas complexas
- Corridors são naturais (sequência de cells)
- Escalável — grid 16×16 ou 20×20 conforme necessidade
- Connection placement automático (onde rooms se tocam)

❌ **Cons:**
- Requer que a AI "pense espacialmente" em cells — contraria o princípio de "AI sem raciocínio espacial"
- Arrays de coordenadas de cells = JSON mais pesado
- AI pode colocar cells de maneira incoerente (rooms sobrepostas, shapes estranhos)
- Difícil de validar antes de renderizar
- Grid 16×16 para 1024px = cells de 64px, desalinhado com GRID_SIZE=40px

📊 **Effort:** Medium-High

---

## Option C: "Relational Graph + Procedural Engine" — AI descreve relações, Engine decide tudo

### Conceito

A AI gera **apenas relações semânticas** entre rooms — sem shapes, sem posições, sem coordenadas. A Engine usa um **algoritmo procedural robusto** (BSP-inspired ou force-directed) pra criar o layout inteiro a partir das relações.

### Schema que a AI gera (exemplo)

```json
{
  "name": "Cripta do Lorde Sombrio",
  "theme": "dark-gothic",
  "atmosphere": "Cold stone echoing with distant chanting",
  "rooms": [
    {
      "id": "entrance",
      "name": "Portão da Cripta",
      "role": "entrance",
      "importance": "minor",
      "description": "...",
      "visualPrompt": "..."
    },
    {
      "id": "main-hall",
      "name": "Salão dos Mortos",
      "role": "hub",
      "importance": "major",
      "description": "...",
      "entities": [
        { "type": "furniture", "name": "Altar Profano", "placement": "center" },
        { "type": "hazard", "name": "Pentagrama no chão", "placement": "center" }
      ]
    },
    {
      "id": "boss-room",
      "role": "climax",
      "importance": "major",
      "name": "Câmara do Ritual"
    }
  ],
  "connections": [
    { "from": "entrance", "to": "main-hall", "type": "archway" },
    { "from": "main-hall", "to": "boss-room", "type": "secret", "state": "hidden" }
  ]
}
```

### Como a Engine opera

1. **Role → Size Mapping**: `entrance=small`, `hub=large`, `climax=large`, `storage=small`, `passage=corridor`
2. **Role → Shape Selection**: `hub=octagonal/cross`, `climax=circular/large-rect`, `storage=L-shape`, `passage=corridor`
3. **Force-Directed Placement**: Usa spring-force model onde connections são "molas" que puxam rooms pra perto, e rooms se repelem quando se sobrepõem
4. **BSP Refinement**: Após convergir, ajusta posições pro grid e gera corridors
5. **Connection Resolution**: Posiciona portas/janelas onde rooms se encontram ou no final de corridors

### Ponto forte

AI pensa **apenas em narrativa e semântica** — a Engine cuida 100% do layout. Funciona perfeitamente até com modelos simples porque o schema é puramente narrativo.

✅ **Pros:**
- AI opera no nível mais natural possível — narrativa e semântica pura
- Funciona com qualquer modelo LLM (schema minimalista)
- Engine tem controle total → grid snap perfeito
- Roles (`hub`, `entrance`, `climax`) guiam layout inteligente
- `importance` diferencia salas principais de secundárias visualmente
- Pode gerar layouts completamente diferentes do mesmo grafo (re-roll)

❌ **Cons:**
- Menos controle do usuário sobre posicionamento → AI pede "sala ao norte do hall" e engine ignora
- Force-directed/BSP pode gerar layouts genéricos
- Shapes determinados pela engine, não pela narrativa (uma caverna natural deveria ser circular, mas engine decide)
- Perda de intencionalidade espacial da AI

📊 **Effort:** Medium

---

## Option D: "Hybrid Intent" — AI define intenção leve + Engine com shape grammar (Recomendada)

### Conceito

Combina os melhores aspectos: AI gera um **grafo relacional com dicas espaciais leves** (direção preferida, shape type, importance). A Engine tem uma **Shape Grammar** poderosa que interpreta as dicas + usa BSP/force-directed pra posicionamento, mas **respeita as intenções da AI quando possível**.

### Schema que a AI gera

```json
{
  "name": "Taverna do Dragão Enferrujado",
  "theme": "medieval-cozy",
  "atmosphere": "Warm firelight, the smell of roasted meat, laughter",
  "rooms": [
    {
      "id": "main-hall",
      "name": "Salão Principal",
      "role": "hub",
      "importance": "major",
      "shapeHint": "rectangle",
      "features": ["fireplace", "bar-counter"],
      "description": "O coração da taverna...",
      "visualPrompt": "Medieval tavern main hall...",
      "entities": [
        { "type": "npc", "name": "Bartender", "icon": "person", "placement": "bar-counter" },
        { "type": "furniture", "name": "Fireplace", "icon": "flame", "placement": "wall" }
      ]
    },
    {
      "id": "kitchen",
      "name": "Cozinha",
      "role": "support",
      "importance": "minor",
      "shapeHint": "rectangle",
      "features": ["oven"],
      "adjacentTo": "main-hall",
      "preferredDirection": "east"
    },
    {
      "id": "cellar",
      "name": "Porão",
      "role": "secret",
      "importance": "minor",
      "shapeHint": "irregular",
      "features": ["hidden-passage"],
      "adjacentTo": "kitchen"
    }
  ],
  "connections": [
    { "from": "main-hall", "to": "kitchen", "type": "archway" },
    { "from": "kitchen", "to": "cellar", "type": "stairs" },
    { "from": "main-hall", "to": "cellar", "type": "secret", "state": "hidden" }
  ]
}
```

### Como a Engine opera (4 fases)

```
AI Schema ──→ ① Resolver ──→ ② Placer ──→ ③ Shaper ──→ ④ Connector ──→ DungeonMap
                (roles)       (grid pos)    (polygons)    (corridors+
                                                          doors)
```

#### Fase 1: Resolver (Role → Properties)

Mapeia `role` + `importance` em propriedades concretas:

| Role | Importance | Size (grid cells) | Shape Pool |
|------|-----------|-------------------|------------|
| `entrance` | any | 2×2 – 3×2 | rect, arch |
| `hub` | major | 4×4 – 6×5 | rect, oct, cross |
| `hub` | minor | 3×3 – 4×3 | rect |
| `support` | any | 2×2 – 3×3 | rect, L-shape |
| `climax` | major | 4×4 – 5×5 | oct, circular, cross |
| `secret` | any | 2×2 – 3×2 | irregular, L-shape |
| `corridor` | any | 1×N | linear, L-corridor, T-junction |

Se a AI especificou `shapeHint`, a engine **prioriza** esse shape. Se não, escolhe aleatoriamente do pool.

#### Fase 2: Placer (Posicionamento no Grid)

Algoritmo de placement inspirado em **BSP + force-directed**:

1. Começa pelo room com `role: "entrance"` → coloca na borda do mapa
2. Segue connections: se `adjacentTo` e `preferredDirection` existem, tenta posicionar nessa direção
3. Se não tem direção preferida, usa force-directed: connections = atração, rooms = repulsão
4. Grid snap **obrigatório** em cada iteração
5. Overlap resolution: se dois rooms colidem, empurra o menor
6. Bounds check: tudo dentro de `WORLD_BOUNDS`

#### Fase 3: Shaper (Grid Cells → Polígonos)

Transforma a área reservada em polígono real:

- **Rectangle**: Simples retângulo grid-aligned
- **L-shape**: Retângulo com um canto recortado (cells removidas)
- **T-shape**: Retângulo com extensão lateral
- **Octagonal**: Retângulo com cantos chanfrados (45°)
- **Circular**: Aproximação por polígono com 8-12 vértices (snap pro grid)
- **Cross**: 4 extensões a partir de um centro
- **Irregular**: Noise-based shape dentro da área (Perlin noise pra decidir quais cells incluir)

Cada shape é um **array de grid cells** que é convertido em polígono externo via edge tracing.

#### Fase 4: Connector (Corridors + Portas)

1. Para cada `connection` no schema, encontra o ponto de contato entre os rooms
2. Se rooms são adjacentes → coloca porta/janela no ponto de contato
3. Se rooms não são adjacentes → gera corridor (space tipo corridor) com pathfinding A* no grid livre
4. Corridors evitam cruzar outros rooms (respeitam occupied cells)
5. Doors/windows são posicionados como entities no ponto exato de contato

### Features (Sub-áreas)

```
features: ["fireplace", "bar-counter", "alcove", "elevated-area"]
```

A Engine interpreta features como **zones** dentro do room:

| Feature | Interpretação |
|---------|--------------|
| `fireplace` | Zone de 1×1 na parede (aleatória ou `placement: wall-north`) |
| `bar-counter` | Zone retangular de 1×3 ao longo de uma parede |
| `alcove` | Extensão de 1×1 pra fora do room shape |
| `elevated-area` | Zone marcada "elevada" dentro do room |
| `hidden-passage` | Marca onde secret connection deve ficar |
| `oven` | Entity posicionada contra a parede |
| `pillar` | Entity no centro do room |

✅ **Pros:**
- AI gera dados naturais — roles, features, hints opcionais
- Engine tem inteligência plena pra layout com grid snap perfeito
- `shapeHint` dá liberdade sem exigir raciocínio espacial
- `preferredDirection` permite controle direcional leve sem coordenadas
- `features` criam riqueza via engine sem custo cognitivo pra AI
- Shape grammar pode crescer indefinidamente
- Corridors gerados por A* são sempre válidos e grid-aligned
- Works on dumb models too — schema é just narrative + enums

❌ **Cons:**
- Engine mais complexa de implementar (4 fases)
- `preferredDirection` pode conflitar com espaço disponível
- Irregular shapes baseados em noise podem parecer aleatórios
- Mais código = mais surface area pra bugs

📊 **Effort:** High (mas é investimento que paga na qualidade)

---

## Comparação Direta

| Critério | A: Semantic Blueprint | B: Grid Stamp | C: Relational Only | D: Hybrid Intent |
|----------|----------------------|---------------|--------------------|----|
| **Custo cognitivo AI** | Baixo | Alto | Mínimo | Baixo |
| **Liberdade de formas** | Limitada ao catálogo | Ilimitada | Engine decide | Alta (hint + pool) |
| **Grid compliance** | Engine garante | Precisa conversão | Engine garante | Engine garante |
| **Expressividade** | Média | Alta | Baixa | Alta |
| **Funciona com models ruins** | ✅ Sim | ❌ Não | ✅✅ Sim | ✅ Sim |
| **Controle do usuário** | Médio | Alto | Baixo | Médio-Alto |
| **Corridors** | Precisa gerar | Natural | Engine gera | A* pathfinding |
| **Complexidade da Engine** | Média | Média-Alta | Média | Alta |
| **Re-roll variação** | Média | Baixa (deterministic) | Alta | Alta |
| **Compatibilidade com schema existente** | Refactor médio | Refactor total | Refactor leve | Refactor médio |

---

## 💡 Recomendação

**Option D: Hybrid Intent** — porque:

1. **Equilibra os dois lados**: AI trabalha num nível semântico natural (`role`, `importance`, `features`, `shapeHint`), enquanto a Engine cuida de toda a complexidade espacial
2. **Escalável por design**: Adicionar novos shapes, features, ou roles é só expandir os mappings da engine
3. **Funciona com models burros**: O schema é feito de enums simples e strings — até um Flash consegue gerar
4. **Grid-first**: Toda a geometria nasce do grid, sem conversões frágeis
5. **Corridors inteligentes**: A* no grid livre gera passages que fazem sentido topologicamente
6. **Features = riqueza barata**: A AI diz "fireplace" e a engine cria uma zone na parede — zero raciocínio espacial pra AI, resultado visual rico

A Option C é uma boa alternativa se quiser começar mais simples e evoluir — a diferença é que perde `shapeHint`, `preferredDirection`, e `features`, que são os diferenciais de qualidade.

A Option B é frágil demais: pedir pra AI "pensar em grid cells" vai contra o princípio de reduzir carga cognitiva.

---

## Próximo Passo

Se a direção estiver aprovada, o próximo passo é um `PLAN-map-generation.md` com:
1. Novo schema (`DungeonBlueprintSchema`) pra substituir o `DungeonGraphSchema`
2. Shape Grammar library (shapes como arrays de grid cells)
3. Placement algorithm (BSP + force-directed hybrid)
4. Corridor generator (A* pathfinding)
5. Feature resolver (zones de sub-áreas)
6. System prompt otimizado pro Gemini 3 Pro
7. Testes unitários por fase

Qual direção quer seguir?
