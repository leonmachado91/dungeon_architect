# FASES FUTURAS (Pós-MVP)

> Roadmap de funcionalidades após o MVP inicial.

---

## Pendências do MVP (A Implementar)

> Features que estavam no escopo original mas foram adiadas.

| Feature | Prioridade | Descrição |
|---------|------------|-----------|
| **Inspector Panel** | 🔴 Alta | Painel lateral para edição detalhada de espaços e entidades |
| **Multi-andar UI** | 🟡 Média | Seletor de floors na interface |
| **Export básico** | 🟡 Média | Export JSON e PNG do mapa |
| **Ctrl+D Duplicate** | 🟢 Baixa | Duplicar elemento selecionado |
| **Keyboard nav completa** | 🟢 Baixa | Tab entre elementos do canvas |

---

## FASE 6: AI Rendering Avançado 🎯

> **Objetivo:** Refinar pipeline de geração AI com renderização de alta qualidade usando Gemini 2.5 Flash Image (Nanobanana).

### 6.1 Configuração de Modelos

| Tarefa | Descrição |
|--------|-----------|
| Modal de Config | Expandir botão config existente para abrir modal de configurações |
| Selector de Modelo (Estrutura) | Escolher modelo para geração de skeleton:<br>• gemini-3-pro-preview<br>• gemini-3-flash-preview<br>• gemini-2.5-pro<br>• gemini-flash-latest |
| Selector de Modelo (Render) | Escolher modelo para renderização:<br>• gemini-3-pro-image-preview (Nano Banana Pro)<br>• gemini-2.5-flash-image (Nano Banana) |

### 6.2 Inspector Panel (Prioritário)

> Editor detalhado de espaços e entidades na sidebar.

#### Space Inspector
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | text | Nome do espaço |
| type | select | Tipo do espaço (corridor, room, chamber, etc) |
| description | textarea | Descrição visual para o render |
| lighting | select | Tipo de iluminação (torch, ambient, dark) |
| floorType | select | Tipo de piso (stone, wood, dirt, water) |
| staticObjects | text | Objetos estáticos presentes |
| coverImage | file | Foto de referência para o render |
| notes | textarea | Notas do DM (não vai pro render) |

#### Entity Inspector
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | text | Nome da entidade |
| type | select | Tipo (door, window, stairs, trap, furniture, etc) |
| description | textarea | Descrição visual |
| icon | file | Ícone customizado |
| coverImage | file | Imagem de referência |
| properties | key-value | Propriedades customizadas |
| linkedFloorId | select | Para escadas: floor conectado |

### 6.3 Skeleton Avançado

| Tarefa | Descrição |
|--------|-----------|
| Schema Expandido | Portas, janelas, escadas, entidades com posições precisas |
| Merge Inteligente | Clipper2 para unir spaces adjacentes com detecção de paredes |
| Descrições por Elemento | Cada space/entity com descrição visual detalhada |
| Camadas Separadas | Floor, walls, doors, windows, props como layers distintas |

### 6.4 Sistema de Ícones/Formas Semânticos

> O skeleton deve usar formas **iconográficas reconhecíveis**, não simplificações abstratas.
> A AI precisa "entender" visualmente o que cada elemento representa.

#### Princípio: Grayscale + Forma Semântica

```
┌─────────────────────────────────────────────────────────────────┐
│  ABORDAGEM ICONOGRÁFICA                                         │
├─────────────────────────────────────────────────────────────────┤
│  • Cores: GRAYSCALE (evita contaminação de paleta)              │
│  • Formas: DETALHADAS o suficiente para serem reconhecíveis     │
│  • Estilo: ICONOGRÁFICO (não realista, mas simbólico claro)     │
│  • Variantes: Cada tipo tem forma própria                       │
└─────────────────────────────────────────────────────────────────┘
```

#### Catálogo de Entidades

##### 🚪 PORTAS (Doors)

| Tipo | SubTipo | Estado | Forma Visual | Cor |
|------|---------|--------|--------------|-----|
| door | single | closed | Retângulo com linha central | #666666 |
| door | single | open | Retângulo com arco de abertura | #666666 |
| door | single | locked | Retângulo com X | #666666 |
| door | double | closed | Retângulo duplo com linha central | #666666 |
| door | double | open | Retângulos com arcos opostos | #666666 |
| door | arch | open | Arco sem porta | #777777 |
| door | secret | closed | Linha tracejada (indicar parede falsa) | #555555 |
| door | gate | closed | Retângulo com grade vertical | #666666 |
| door | portcullis | closed | Retângulo com grade cruzada | #666666 |

##### 🪜 ESCADAS (Stairs)

| Tipo | Direção | Forma Visual | Cor |
|------|---------|--------------|-----|
| stairs | straight_up | Retângulo com linhas horizontais (degraus) + seta ↑ | #CCCCCC |
| stairs | straight_down | Retângulo com linhas horizontais + seta ↓ | #CCCCCC |
| stairs | spiral_up | Espiral com raios (degraus) + seta ↑ | #CCCCCC |
| stairs | spiral_down | Espiral com raios + seta ↓ | #CCCCCC |
| stairs | ladder_up | Retângulo estreito com rungs + seta ↑ | #BBBBBB |
| stairs | ladder_down | Retângulo estreito com rungs + seta ↓ | #BBBBBB |
| stairs | trapdoor | Quadrado com X e dobradiça | #AAAAAA |
| stairs | pit | Quadrado com gradiente escuro (buraco) | #444444 |

##### 🪟 JANELAS (Windows)

| Tipo | Estado | Forma Visual | Cor |
|------|--------|--------------|-----|
| window | barred | Frame com grades verticais | #999999 |
| window | open | Frame vazio | #999999 |
| window | shuttered | Frame com linhas diagonais | #888888 |
| window | arrow_slit | Retângulo muito estreito | #999999 |
| window | round | Círculo com frame | #999999 |

##### 🪑 MÓVEIS / PROPS (Furniture)

| Tipo | Forma Visual | Cor |
|------|--------------|-----|
| table_round | Círculo | #DDDDDD |
| table_rect | Retângulo | #DDDDDD |
| chair | Pequeno quadrado com encosto | #DDDDDD |
| bed | Retângulo com cabeceira | #DDDDDD |
| chest | Retângulo pequeno com tampa | #CCCCCC |
| barrel | Círculo com linhas horizontais | #CCCCCC |
| statue | Forma humanoide simplificada | #AAAAAA |
| altar | Retângulo com símbolo central | #BBBBBB |
| fireplace | Semicírculo na parede | #888888 |
| throne | Cadeira grande com detalhes | #AAAAAA |

##### 🔥 ILUMINAÇÃO (Light Sources)

| Tipo | Forma Visual | Cor |
|------|--------------|-----|
| torch_wall | Pequeno retângulo na parede | #EEEEEE |
| chandelier | Círculo com raios | #EEEEEE |
| brazier | Pequeno círculo no chão | #DDDDDD |
| candles | Grupo de pontos | #EEEEEE |
| magical_orb | Círculo com glow (borda suave) | #FFFFFF |

##### ⚠️ ARMADILHAS (Traps) - Opcional no skeleton

| Tipo | Forma Visual | Cor |
|------|--------------|-----|
| pressure_plate | Quadrado com borda interna | #777777 |
| spike_trap | Quadrado com pontos | #777777 |
| tripwire | Linha fina tracejada | #666666 |
| pit_trap | Quadrado com X (tampa) | #555555 |

#### Regras de Renderização do Skeleton

1. **Hierarquia de camadas (z-order):**
   - Piso (fundo)
   - Paredes
   - Portas/Janelas (cortam paredes)
   - Móveis/Props
   - Escadas
   - Iluminação (opcional)

2. **Orientação das entidades:**
   - Portas: perpendiculares à parede
   - Escadas: direção indicada por seta
   - Móveis: rotação livre baseada em `entity.rotation`

3. **Prompt com coordenadas:**
   ```text
   <layout_key>
   Position (120,80): Spiral staircase going up to floor 2
   Position (200,150): Wooden double door, currently open
   Position (50,100): Barred window overlooking the courtyard
   </layout_key>
   ```

### 6.5 Mapeamento Skeleton → Imagem

```
┌─────────────────────────────────────────────────────────────────┐
│  PIPELINE DE RENDERIZAÇÃO                                       │
├─────────────────────────────────────────────────────────────────┤
│  1. SKELETON GENERATION (Gemini 2.5 Pro)                        │
│     - Gerar estrutura JSON com geometria e descrições           │
│     - Cada space tem: name, type, description, lighting         │
│     - Entities (opcional): position, type, visualDescription    │
├─────────────────────────────────────────────────────────────────┤
│  2. SKELETON RENDERING (Canvas → PNG)                           │
│     - Exportar canvas como PNG em ESCALA DE CINZA               │
│     - Usar tons de cinza para evitar contaminação de cores      │
│     - Paredes: #333333 (cinza escuro)                           │
│     - Portas: #666666 (cinza médio)                             │
│     - Janelas: #999999 (cinza claro)                            │
│     - Escadas: #CCCCCC (cinza muito claro)                      │
│     - Pisos: #FFFFFF (branco) com textura de padrão sutil       │
├─────────────────────────────────────────────────────────────────┤
│  3. PROMPT CONSTRUCTION                                         │
│     - Juntar descrições de TODOS os spaces em narrativa         │
│     - Incluir lighting, atmosfera, tema do dungeon              │
│     - Especificar: "top-down view, static objects only"         │
│     - Semantic negative: "no characters, no creatures..."       │
├─────────────────────────────────────────────────────────────────┤
│  4. IMAGE GENERATION (Gemini 2.5 Flash Image / nanobanana)      │
│     - Enviar skeleton PNG (grayscale) como reference image      │
│     - Prompt estruturado com contexto de cada área              │
│     - Aspect ratio: match skeleton dimensions                   │
│     - Style: consistent fantasy dungeon aesthetic               │
├─────────────────────────────────────────────────────────────────┤
│  5. POST-PROCESSING                                             │
│     - Overlay grid opcional                                     │
│     - Salvar resultado no floor.renderUrl                       │
└─────────────────────────────────────────────────────────────────┘
```

**Por que GRAYSCALE?**
O nanobanana pode "contaminar" as cores do skeleton na imagem final. Usando tons de cinza, os elementos continuam distinguíveis pela AI sem influenciar a paleta de cores do resultado.

### 6.5 Restrições do Render

| Regra | Motivo |
|-------|--------|
| **APENAS objetos estáticos** | In-game elementos não podem mudar posição |
| **Sem NPCs/criaturas** | Posições dinâmicas controladas pelo jogo |
| **Sem sombras projetadas complexas** | Podem ficar inconsistentes com a iluminação do jogo |
| **Consistência de perspectiva** | Top-down view obrigatório (90°) |
| **Escala respeitada** | 1 grid = tamanho fixo em pixels |

> **Nota:** Efeitos de luz estáticos (glow de tochas, reflexos em metal) são permitidos. O que se evita é algo que pareça estar em movimento.

### 6.6 Prompt Template Otimizado para Nanobanana

```text
<task>
Generate a top-down fantasy dungeon map based on the provided grayscale layout.
The gray tones indicate structure: dark=walls, medium=doors, light=windows/stairs.
</task>

<context>
Setting: {dungeon.meta.theme} dungeon
Atmosphere: {dungeon.meta.atmosphere}
Time: {dungeon.meta.timeOfDay}
</context>

<areas>
{foreach space in floor.spaces:}
- {space.name} ({space.type}): {space.description}
  Floor: {space.floorType} | Lighting: {space.lighting}
  Contains: {space.staticObjects}
{endforeach}
</areas>

<style>
Painterly fantasy illustration, muted earth tones with warm torchlight accents.
Detailed stone and wood textures. Hand-drawn aesthetic.
Clear visual distinction between walkable areas and obstacles.
Consistent lighting from the described sources.
</style>

<constraints>
- Top-down perspective only (90 degrees)
- NO characters, creatures, NPCs, or living beings
- NO moving objects or dynamic elements
- Static furniture and props ONLY
- Respect the exact layout from the reference image
- Output resolution: {width}x{height}
</constraints>
```

**Best Practices para Nanobanana:**
1. **Semantic negatives** no `<constraints>` — dizer o que NÃO quer
2. **Structured sections** com tags XML — o modelo entende melhor
3. **Iterative refinement** — ajustar prompt baseado em resultados
4. **Reference image** sempre em grayscale para controle de layout

---

## FASE 7: Multi-Andar & Navegação ⏳

> **Objetivo:** Navegação completa entre floors do dungeon.

### Tarefas

| # | Tarefa | Descrição |
|---|--------|-----------|
| 7.1 | Floor Selector | Dropdown/tabs no header para trocar entre andares |
| 7.2 | Staircase Links | Conectar escadas entre floors via entity.linkedFloorId |
| 7.3 | Duplicate (Ctrl+D) | Duplicar espaço/entidade selecionada no mesmo floor |
| 7.4 | Copy/Paste Cross-Floor | Copiar elementos para outros andares |

---

## FASE 8: Export & Import ⏳

> **Objetivo:** Exportar mapas para uso externo.

### Tarefas

| # | Tarefa | Descrição |
|---|--------|-----------|
| 8.1 | Export PNG | Imagem renderizada em alta resolução |
| 8.2 | Export JSON | Dados completos do dungeon para backup |
| 8.3 | Import JSON | Carregar dungeon de arquivo |
| 8.4 | Import Image | Trace over uma imagem existente |

---

## FASE 9: Biblioteca & Templates ⏳

> **Objetivo:** Reutilização de assets e templates.

### Tarefas

| # | Tarefa | Descrição |
|---|--------|-----------|
| 9.1 | Entity Library | Biblioteca de entidades pré-definidas (portas, mesas, etc) |
| 9.2 | Room Templates | Salas prontas para arrastar (tavern, prison cell, etc) |
| 9.3 | Dungeon Templates | Dungeons completos como ponto de partida |
| 9.4 | Custom Presets | Salvar configurações próprias |
| 9.5 | Community Share | Compartilhar templates (futuro cloud) |

---

## Referências

- [Protótipos UI](./UI_prototype/) — Designs definitivos Stitch
- [Tech Stack](./TECH_STACK.md) — Bibliotecas aprovadas
- [UI/UX Plan](./UI_UX_PLAN.md) — Paleta Gruvbox e tokens
- [Canvas Strategy](./CANVAS_STRATEGY.md) — Arquitetura do editor
- [Data Models](./DATA_MODELS.md) — Schemas JSON
- [AI Prompts](./AI_PROMPTS.md) — Prompts de geração