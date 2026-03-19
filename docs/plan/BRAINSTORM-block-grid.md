# 🧱 Análise: Option E — "Block-Grid" (AI monta blocos num quadro)

> **Proposta do usuário:** A AI recebe um quadro (grid) de resolução X e preenche com "blocos de dados". Cada bloco tem posição simples, tamanho, propriedades (porta no canto direito, tipo de sala, etc). A engine depois traduz esses blocos num skeleton de mapa.

---

## Entendendo a Proposta

A ideia é que a AI funcione como um **arquiteto com blocos de LEGO**:

```
┌─────────────────────────────────────────┐
│  GRID 8×8                               │
│                                         │
│  ┌─────┐              ┌───┐            │
│  │HALL │──door──→      │ARM│            │
│  │ 3×3 │              │2×1│            │
│  └──┬──┘              └───┘            │
│     │ archway                           │
│  ┌──┴──────┐                            │
│  │ THRONE  │                            │
│  │  4×2    │                            │
│  └─────────┘                            │
│                                         │
└─────────────────────────────────────────┘

AI coloca → Engine traduz em polígonos reais
```

A AI **visualiza mentalmente** o grid e posiciona os blocos. Cada bloco contém:
- **Posição** no grid (ex: `col: 2, row: 1`)
- **Tamanho** em cells (ex: `width: 3, height: 3`)
- **Conexões** com salas vizinhas (ex: `"porta no lado east pro bloco 'armory'"`)
- **Propriedades** semânticas (nome, tipo, descrição, entities)

---

## Análise Realista de Viabilidade

### O que funciona bem ✅

1. **Posicionamento intuitivo** — Um grid 8×8 com coordenadas simples (0-7, 0-7) é algo que LLMs conseguem raciocinar. É como um tabuleiro de xadrez: "coloque a sala em C3 com tamanho 2×3". Gemini 3 Pro em particular tem capacidade de raciocínio espacial básico.

2. **Tamanhos variados** — A AI decide livremente se uma sala ocupa 2×2 ou 4×3 cells. Isso resolve o problema do layout atual (onde small=1×1 e large=2×2 é pobre demais).

3. **Conexões explícitas** — "porta no lado east" é mais claro que "adjacentTo: main-hall" porque comunica *onde* a conexão está e *pra onde* vai.

4. **Corridors naturais** — Um corridor é literalmente um bloco estreito (1×3, 1×4) que a AI posiciona entre salas. Não precisa de pathfinding algorítmico.

5. **Engine simples de traduzir** — Cada bloco vira um retângulo: `x = col × CELL_SIZE`, `y = row × CELL_SIZE`, `w = width × CELL_SIZE`, `h = height × CELL_SIZE`. Grid snap é **automático**.

### O que preocupa ⚠️

1. **Carga cognitiva da AI** — Fazer a AI "visualizar" um grid e posicionar blocos sem sobreposição é **raciocínio espacial ativo**. Isso é mais custoso que gerar uma lista semântica de rooms.

   **Contra-argumento:** Mas é significativamente mais barato do que gerar coordenadas absolutas em pixels (1024×1024). Um grid 8×8 tem apenas 64 posições possíveis — a AI trabalha num espaço reduzido e gerenciável.

2. **Sobreposição de blocos** — A AI pode colocar dois blocos na mesma posição. Sem validação no lado da AI, isso gera conflitos.

   **Mitigação:** A engine pode detectar e resolver sobreposições (empurrar blocos, redimensionar). Mas isso muda a intenção da AI.

   **Mitigação melhor:** Incluir no prompt uma instrução clara: "Não sobreponha blocos. Verifique que nenhum bloco ocupa cells já usadas."

3. **JSON mais pesado** — Cada bloco precisa de `col`, `row`, `width`, `height` + conexões + propriedades. Pra 8-12 rooms, o JSON é gerenciável, mas é mais verboso que um simples grafo relacional.

4. **Shapes limitados a retângulos** — Se a AI posiciona um bloco 3×2, é um retângulo 3×2. Pra salas L-shaped, a AI precisaria posicionar *múltiplos* blocos adjacentes com o mesmo ID (e isso é reconhecer formas compostas — complexo).

   **Mitigação parcial:** A engine pode pegar blocos adjacentes com o mesmo `roomId` e fundir num polígono — mas isso exige que a AI "divida" salas complexas em sub-blocos, que é cognitivamente custoso.

5. **Resolução do grid** — Qual tamanho?
   - 6×6 (atual): Poucas posições, blocos grandes, pouca variedade
   - 8×8: Bom equilíbrio, 64 cells, salas de 2×2 a 4×4
   - 10×10: Mais controle, mas AI precisa raciocinar sobre 100 posições
   - 12×12: Overkill — AI vai errar mais
   - **Recomendação: 8×8 ou 10×10** — dado WORLD_BOUNDS de 1024px e GRID_SIZE de 40px, temos 25.6 cells reais. Um meta-grid de 8×8 significaria cada meta-cell = ~3 cells reais (120px), o que é razoável.

### Veredicto

| Aspecto | Score (1-5) | Nota |
|---------|-------------|------|
| Viabilidade técnica | ⭐⭐⭐⭐ | Funciona, engine de tradução é direta |
| Custo cognitivo AI | ⭐⭐⭐ | Médio — precisa pensar espacial, mas grid pequeno |
| Variedade de formas | ⭐⭐ | Retângulos por padrão, L-shapes exigem sub-blocos |
| Qualidade do layout | ⭐⭐⭐⭐ | AI controla posicionamento — pode ser bom ou ruim |
| Facilidade de debugging | ⭐⭐⭐⭐⭐ | Grid visual = fácil de ver o que a AI fez |
| Compatibilidade com models fracos | ⭐⭐⭐ | Funciona, mas precision decai |

**Conclusão: Faz sentido sim.** Mas precisa de ajustes no schema pra equilibrar controle vs simplicidade.

---

## Proposta Refinada: "Block-Grid" otimizada

### Schema que a AI gera

```json
{
  "name": "Cripta do Lorde Sombrio",
  "theme": "dark-gothic",
  "atmosphere": "Cold stone, distant chanting echoes",
  "gridSize": 8,
  "blocks": [
    {
      "id": "entrance",
      "name": "Portão da Cripta",
      "type": "room",
      "role": "entrance",
      "col": 3,
      "row": 0,
      "width": 2,
      "height": 2,
      "exits": [
        { "side": "south", "to": "main-hall", "type": "archway" }
      ],
      "description": "Heavy iron gates...",
      "lighting": "dim",
      "entities": []
    },
    {
      "id": "main-hall",
      "name": "Salão dos Mortos",
      "type": "room",
      "role": "hub",
      "col": 2,
      "row": 2,
      "width": 4,
      "height": 3,
      "exits": [
        { "side": "north", "to": "entrance", "type": "archway" },
        { "side": "east", "to": "corridor-1", "type": "door" },
        { "side": "south", "to": "boss-room", "type": "secret" }
      ],
      "description": "Massive pillars...",
      "lighting": "torchlight",
      "entities": [
        { "type": "furniture", "name": "Altar Profano", "position": "center" },
        { "type": "hazard", "name": "Pentagrama", "position": "center" }
      ]
    },
    {
      "id": "corridor-1",
      "name": "Passage",
      "type": "corridor",
      "col": 6,
      "row": 3,
      "width": 1,
      "height": 3,
      "exits": [
        { "side": "west", "to": "main-hall", "type": "door" },
        { "side": "south", "to": "armory", "type": "door" }
      ]
    },
    {
      "id": "armory",
      "name": "Armaria",
      "type": "room",
      "role": "support",
      "col": 5,
      "row": 6,
      "width": 3,
      "height": 2,
      "exits": [
        { "side": "north", "to": "corridor-1", "type": "door" }
      ],
      "description": "Racks of rusted weapons...",
      "entities": [
        { "type": "treasure", "name": "Espada Encantada", "position": "wall" }
      ]
    },
    {
      "id": "boss-room",
      "name": "Câmara do Ritual",
      "type": "room",
      "role": "climax",
      "col": 1,
      "row": 5,
      "width": 4,
      "height": 3,
      "exits": [
        { "side": "north", "to": "main-hall", "type": "secret" }
      ],
      "description": "Dark energy swirls...",
      "entities": [
        { "type": "monster", "name": "Lorde Sombrio", "position": "center" }
      ]
    }
  ]
}
```

### O que a Engine faz com esses blocos

```
AI Block-Grid ──→ ① Validate ──→ ② Expand ──→ ③ Shape ──→ ④ Connect ──→ DungeonMap
                   (overlaps)     (→pixels)    (refine)    (doors+
                                                           corridors)
```

1. **Validate** — Detecta sobreposições, blocos fora do grid, exits sem match. Corrige automaticamente quando possível.
2. **Expand** — Converte coordenadas do meta-grid (8×8) pro grid real (1024px). `x = col × CELL_SIZE`, etc.
3. **Shape** — Opcionalmente aplica refinamentos pro bloco:
   - `role: "hub"` → pode chanfrar cantos pra ficar octagonal
   - `role: "secret"` → pode recortar um canto pra ficar irregular
   - `type: "corridor"` → mantém estreito, sem refinamento
4. **Connect** — Pra cada `exit`, calcula onde colocar a porta/archway na parede correspondente. Se dois blocos não são adjacentes mas têm exits apontando um pro outro, gera um corridor automático.

---

## Projetos Existentes como Referência

A pesquisa revelou que **nenhum projeto existente implementa exatamente este padrão** (LLM + block grid → engine tradução), mas existem **componentes reutilizáveis** muito valiosos:

### 1. `@halftheopposite/dungeon` (BSP + Prefabs)

- **O que faz:** Usa BSP pra dividir o espaço, depois encaixa rooms pré-desenhadas (prefabs) nos espaços. Gera tilemap 2D (array de inteiros) + JSON com rooms e corridors.
- **Relevância:** O conceito de "rooms pré-desenhadas que são encaixadas num espaço" é análogo à nossa engine que recebe blocos e os posiciona. A diferença é que nós temos a AI decidindo o posicionamento, não o BSP.
- **O que podemos usar:**
  - A lógica de **tilemap generation** (grid → 2D array de tiles)
  - O pattern de **room templates** (prefabs) → podemos criar shape templates
  - O **editor visual** como inspiração pra debugging
- **Link:** [github.com/halftheopposite/dungeon](https://github.com/halftheopposite/dungeon)
- **NPM:** `@halftheopposite/dungeon`

### 2. `ROT.js` — Roguelike Toolkit

- **O que faz:** Toolkit JS pra roguelikes. Inclui `Map.Digger` (carva rooms e corridors) e `Map.Uniform` (distribui rooms e conecta). Ambos retornam rooms, corridors, e um callback por cell.
- **Relevância direta:** O `Map.Uniform` faz algo parecido com o que queremos — distribui rooms num grid e depois gera corridors pra conectar. A diferença é que quem decide a distribuição é o algoritmo, não a AI.
- **O que podemos usar:**
  - O **corridor generation** entre rooms não-adjacentes (A* ou line-of-sight)
  - A API de `getRooms()` / `getCorridors()` como modelo pro nosso output
  - A lógica de **door placement** (onde rooms tocam corridors)
- **NPM:** `rot-js`
- **Docs:** [ondras.github.io/rot.js](https://ondras.github.io/rot.js/manual/#map/dungeon)

### 3. `random-dungeon-generator` (BSP → 2D array)

- **O que faz:** BSP simples que retorna um 2D array numérico (0=wall, 1=room, 2=corridor). Cada "room" é um retângulo com bounds.
- **Relevância:** Output extremamente simples — exatamente o tipo de representação que nossa engine precisa produzir antes de converter em polígonos.
- **NPM:** `random-dungeon-generator`

### 4. `ndwfc` (Wave Function Collapse genérico)

- **O que faz:** WFC para browser e Node. Aceita tiles com adjacency rules e gera grids respeitando constraints.
- **Relevância:** Poderia ser usado **dentro da engine** pra preencher o interior de blocos com tiles variados (diferentes pisos, paredes, decoração). Não pra o posicionamento de rooms em si, mas pra o refinamento visual.
- **NPM:** `ndwfc`

### 5. Padrões Acadêmicos (SKE-Layout, LaySPA)

Pesquisas de 2025 mostram LLMs gerando layouts espaciais via JSON:
- **SKE-Layout** extrai "spatial knowledge" do prompt ("altar no centro, colunas nos cantos") e gera bounding boxes
- **LaySPA** usa reinforcement learning pra otimizar layouts gerados por LLM
- **Insight:** A academia valida que LLMs **conseguem** raciocinar sobre posicionamento em grids simples, especialmente com prompts estruturados

---

## Comparação: Block-Grid vs Option D (Hybrid Intent)

| Aspecto | Block-Grid (E) | Hybrid Intent (D) |
|---------|----------------|-------------------|
| **Quem decide posição** | AI (direto) | Engine (force-directed) |
| **Quem decide tamanho** | AI (explícito) | Engine (role→size mapping) |
| **Carga na AI** | Média (grid coords) | Baixa (só semântica) |
| **Controle do layout** | Alto (AI decide tudo) | Médio (AI dá hints) |
| **Previsibilidade** | O que a AI monta, aparece | Engine pode surpreender |
| **Corridors** | AI cria ou engine gera | Engine sempre gera (A*) |
| **Shapes não-retangulares** | Difícil (precisa sub-blocos) | Fácil (shape grammar) |
| **Re-roll** | Pede nova geração à AI | Engine randomiza posições |
| **Debugging** | Fácil (grid visual) | Médio (force-directed opaco) |
| **Funciona com Flash** | Razoável | Muito bom |

---

## Proposta Combinada: Block-Grid + Shape Grammar

E se **combinarmos** a ideia Block-Grid com a Shape Grammar da Option D?

```
AI coloca blocos no grid (posição + tamanho + exits + role)
       ↓
Engine valida e expande blocos
       ↓
Shape Grammar refina: role → shape (hub=octagonal, secret=irregular)
       ↓
Connector gera doors e corridors extras
       ↓
DungeonMap com polígonos complexos
```

A AI usa coordenadas simples de grid pra decidir o layout espacial, mas **não precisa se preocupar com formas complexas**. A shape grammar da engine transforma blocos retangulares em polígonos refinados baseados no `role`:

| Block (AI vê) | Shape (Engine gera) |
|---------------|-------------------|
| `hub 4×3` | Octagonal com chanfros |
| `entrance 2×2` | Retângulo com arco frontal |
| `secret 2×2` | Irregular com canto recortado |
| `corridor 1×4` | Caminho estreito com curvas suaves |
| `support 3×2` | L-shape (recorte de 1 canto) |

**Vantagens desta combinação:**
- ✅ AI tem controle espacial (posiciona blocos)
- ✅ Shapes não são limitados a retângulos (engine refina)
- ✅ Grid coords são simples (8×8 → 64 posições)
- ✅ Debugging é visual (mapa de blocos antes do refinamento)
- ✅ Engine adiciona complexidade sem custo cognitivo pra AI

---

## 💡 Recomendação Final

A abordagem **Block-Grid + Shape Grammar** é viável e tem vantagens claras. Porém, vai exigir que calibremos bem o prompt pra evitar sobreposições e que a engine tenha um bom sistema de validação/correção.

### Riscos a monitorar

1. **AI sobrepondo blocos** — Mitigável com prompt engineering + validação na engine
2. **Layout previsível** — Se a AI sempre coloca entrance no topo e boss embaixo, os mapas ficam repetitivos. Precisamos de variação no prompt
3. **Corridors** — Se dois blocos com exits apontando um pro outro não são adjacentes, a engine precisa gerar corridor automático. Isso adiciona complexidade
4. **Calibração do gridSize** — Precisa de testes pra descobrir se 8×8 é ideal ou se 10×10 dá melhores resultados

### Próximo passo

Se a direção estiver confirmada, crio o `PLAN-map-generation.md` com:
1. Schema Zod do formato Block-Grid
2. System prompt otimizado pro Gemini 3 Pro
3. Engine: Validator → Expander → ShapeRefiner → Connector
4. Integração com o pipeline existente (substituindo `layoutEngine.ts`)
5. Testes por fase

Qual caminho quer seguir?
