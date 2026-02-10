# Dungeon Architect — Roadmap de Implementação

> Plano detalhado de desenvolvimento do MVP.

---

## Status do Projeto

### MVP (Concluído)

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 0** | Fundação | ✅ Completa |
| **Fase 1** | Data Layer | ✅ Completa |
| **Fase 2** | AI Integration | ✅ Completa |
| **Fase 3** | Canvas & Editor | ✅ Completa |
| **Fase 4** | UI/UX | ✅ Completa |
| **MVP Essentials** | Auto-save, Undo/Redo, Delete | ✅ Completa |
| **Fase 5** | Polish & Verify | ✅ Completa |

### Pós-MVP (Roadmap Futuro)

| Fase        | Descrição                 | Status       |
| ----------- | ------------------------- | ------------ |
| **Fase 6**  | AI Rendering (nanobanana) | 🎯 Próxima   |
| **Fase 7**  | Multi-Andar & Navegação   | ⏳ Planejada  |
| **Fase 8**  | Export & Import           | ⏳ Planejada  |
| **Fase 9**  | Biblioteca & Templates    | ⏳ Planejada  |


---

## Visão Geral

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ✅ FASE 0: FUNDAÇÃO                                                     │
│  Setup do projeto, design tokens, componentes base                       │
├──────────────────────────────────────────────────────────────────────────┤
│  ✅ FASE 1: DATA LAYER                                                   │
│  PGLite setup, Drizzle schema, Zustand stores                            │
├──────────────────────────────────────────────────────────────────────────┤
│  ✅ FASE 2: AI INTEGRATION                                               │
│  Vercel AI SDK, Zod schemas, Gemini integration                          │
├──────────────────────────────────────────────────────────────────────────┤
│  ✅ FASE 3: CANVAS & EDITOR                                              │
│  React Konva, layers, polygon editor, manual mode                        │
├──────────────────────────────────────────────────────────────────────────┤
│  ✅ FASE 4: UI/UX                                                        │
│  Sidebar, Inspector, Toolbar, estados da aplicação                       │
├──────────────────────────────────────────────────────────────────────────┤
│  ⏳ FASE 5: POLISH & VERIFY                                              │
│  Testes, acessibilidade, performance, documentação                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## FASE 0: Fundação ✅

> **Objetivo:** Projeto rodando com estrutura base e design system configurado.

### Tarefas

| # | Tarefa | Detalhes | Verificação |
|---|--------|----------|-------------|
| 0.1 | Setup Next.js 15 | `npx create-next-app@latest --typescript --tailwind --app` | `npm run dev` funciona |
| 0.2 | Configurar shadcn/ui | `npx shadcn@latest init` com tema dark | Button renderiza |
| 0.3 | Design Tokens | CSS variables Gruvbox em `globals.css` | Cores aplicadas |
| 0.4 | Fonts | Google Fonts (Cinzel, Crimson Text, Inter) + Material Symbols | Fonts carregam |
| 0.5 | Layout base | Header, Sidebar, Canvas, Toolbar (estrutura) | Responsivo funciona |

### Arquivos Criados

```
src/
├── app/
│   ├── layout.tsx        # Root layout com fonts
│   ├── page.tsx          # Página principal
│   └── globals.css       # Design tokens Gruvbox
├── components/
│   ├── ui/               # shadcn components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Canvas.tsx
│   │   └── Toolbar.tsx
│   └── icons/            # Material Symbols wrapper
└── lib/
    └── utils.ts          # cn() e helpers
```

### Design Tokens (globals.css)

```css
:root {
  --bg: #282828;
  --bg-hard: #1d2021;
  --bg-soft: #32302f;
  --red: #cc241d;
  --red-light: #fb4934;
  --yellow: #d79921;
  --yellow-light: #fabd2f;
  --teal: #689d6a;
  --teal-light: #8ec07c;
  --green: #b8bb26;
  --fg: #ebdbb2;
  --fg-alt: #a89984;
  --gray: #928374;
}
```

---

## FASE 1: Data Layer ✅

> **Objetivo:** Banco local funcionando com schemas e estado global.

### Tarefas

| # | Tarefa | Detalhes | Verificação |
|---|--------|----------|-------------|
| 1.1 | Setup PGLite | `npm install @electric-sql/pglite` com dynamic import | Query retorna dados |
| 1.2 | Schema Drizzle | Tabelas: dungeons, floors, spaces, zones, entities | Migration roda |
| 1.3 | Zustand Store | `useMapStore` com actions CRUD | Estado atualiza |
| 1.4 | Zundo (Undo/Redo) | Middleware temporal no store | Ctrl+Z funciona |
| 1.5 | Sync DB ↔ Store | Debounced save para PGLite | Dados persistem após reload |

### Schema Drizzle

```typescript
// src/db/schema.ts
export const dungeons = pgTable('dungeons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  prompt: text('prompt'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const floors = pgTable('floors', {
  id: text('id').primaryKey(),
  dungeonId: text('dungeon_id').references(() => dungeons.id),
  level: integer('level').notNull(),
  name: text('name'),
  renderUrl: text('render_url'),
});

export const spaces = pgTable('spaces', {
  id: text('id').primaryKey(),
  floorId: text('floor_id').references(() => floors.id),
  name: text('name').notNull(),
  polygon: json('polygon').$type<number[][]>(),
  spaceType: text('space_type'),
  floorType: text('floor_type'),
});
```

### Zustand Store

```typescript
// src/stores/mapStore.ts
interface MapState {
  currentDungeon: DungeonMap | null;
  selectedSpaceId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  tool: 'select' | 'draw' | 'pan';
  // Actions
  setDungeon: (dungeon: DungeonMap) => void;
  selectSpace: (id: string | null) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  // ...
}
```

---

## FASE 2: AI Integration ✅

> **Objetivo:** Gerar estruturas de mapa via IA.

### Tarefas

| # | Tarefa | Detalhes | Verificação |
|---|--------|----------|-------------|
| 2.1 | Setup Vercel AI SDK | `npm install ai @ai-sdk/google` | Import sem erros |
| 2.2 | Zod Schemas | `DungeonMapSchema` completo | `parse()` valida JSON |
| 2.3 | Server Action: generateMap | `generateObject` com Gemini | Retorna JSON válido |
| 2.4 | Server Action: generateImage | Stub/placeholder por agora | Retorna URL mock |
| 2.5 | Form → Prompt | Converter Form Guiado em prompt textual | Prompt bem formado |

### Zod Schema

```typescript
// src/schemas/dungeon.ts
import { z } from 'zod';

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  spaceType: z.enum(['room', 'corridor', 'stairs', 'outdoor']),
  polygon: z.array(z.tuple([z.number(), z.number()])),
  floorType: z.string().optional(),
  description: z.string().optional(),
});

export const FloorSchema = z.object({
  id: z.string(),
  level: z.number(),
  name: z.string(),
  spaces: z.array(SpaceSchema),
});

export const DungeonMapSchema = z.object({
  id: z.string(),
  name: z.string(),
  theme: z.string(),
  floors: z.array(FloorSchema),
});
```

### Server Action

```typescript
// src/actions/generateMap.ts
'use server';

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { DungeonMapSchema } from '@/schemas/dungeon';

export async function generateMap(prompt: string) {
  const result = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: DungeonMapSchema,
    prompt: `Você é um arquiteto de dungeons para RPG...
    
    Descrição do usuário: ${prompt}`,
  });

  return result.object;
}
```

---

## FASE 3: Canvas & Editor ✅

> **Objetivo:** Canvas interativo para visualizar e editar mapas.

### Tarefas

| # | Tarefa | Detalhes | Verificação |
|---|--------|----------|-------------|
| 3.1 | Setup React Konva | `npm install react-konva konva` | Stage renderiza |
| 3.2 | Grid Layer | Linhas dinâmicas com zoom | Grid visível |
| 3.3 | Background Layer | Imagem de `renderUrl` | Imagem exibe |
| 3.4 | Zones Layer | Polígonos coloridos | Desenha corretamente |
| 3.5 | Entities Layer | Tokens draggáveis | Drag funciona |
| 3.6 | Skeleton Generator | Exportar canvas como PNG | PNG com cores certas |
| 3.7 | Polygon Editor | Desenhar/redimensionar | Novo Space criado |
| 3.8 | Clipper2 Merge | Unir polígonos adjacentes | 2 → 1 funciona |
| 3.9 | Pan & Zoom | Scroll zoom, middle-mouse pan | Navegação fluida |
| 3.10 | **Manual Mode: Novo Mapa** | Botão "Novo Mapa Vazio" cria dungeon sem AI | Dungeon vazio criado |
| 3.11 | **Manual Mode: Add Space** | Desenhar retângulo → cria space | Space aparece no canvas |
| 3.12 | **Manual Mode: Edit Space** | Editar nome, tipo, lighting via sidebar | Propriedades salvam |
| 3.13 | **Manual Mode: Add Entity** | Arrasta token da sidebar ao canvas | Entity posicionada |
| 3.14 | **Manual Mode: Render** | Gerar skeleton + chamar Gemini Image | Imagem renderizada sem geração AI prévia |

### Estrutura de Layers

```
Canvas (Konva Stage)
├── Grid Layer (static)
│   └── Lines dinâmicas baseadas no zoom
├── Background Layer
│   └── Image (renderUrl ou placeholder)
├── Zones Layer
│   └── Polígonos (Space→Zone mapping)
├── Entities Layer
│   └── Tokens (NPCs, objetos)
└── UI Layer
    └── Selection rings, handles, cursors
```

### Cores do Skeleton

```typescript
const SKELETON_COLORS = {
  floor: '#FFFFFF',
  wall: '#FF0000',
  door: '#00FF00',
  window: '#00FFFF',
  stairs: '#FFFF00',
  zone: '#FF00FF',
  void: '#333333',
} as const;
```

---

## FASE 4: UI/UX ✅

> **Objetivo:** Interface completa seguindo os protótipos.

### Tarefas

| # | Tarefa | Detalhes | Verificação |
|---|--------|----------|-------------|
| 4.1 | Sidebar: Prompt Livre | Textarea + botão Gerar | Gera mapa |
| 4.2 | Sidebar: Form Guiado | Tipo, Tema, Atmosfera, etc. | Form submete |
| 4.3 | Inspector | Detalhes do Space selecionado | Edição funciona |
| 4.4 | Toolbar: Andares | Selector de floor | Troca andar |
| 4.5 | Toolbar: Controles | Zoom, Undo, Redo, Export | Todos funcionam |
| 4.6 | Toolbar: Render | Botão para chamar AI de imagem | Loading state |
| 4.7 | Modal: Inpainting | Stub para correção de áreas | Modal abre |
| 4.8 | Empty State | Tela inicial sem mapa | Exibe corretamente |
| 4.9 | Loading States | Skeleton/shimmer durante AI | Feedback visual |

### Componentes por Tela

**Sidebar - Prompt Livre:**
- Textarea com placeholder
- Slider de resolução (512, 1024, 2048)
- Botão "Gerar Estrutura" (red, full-width)

**Sidebar - Form Guiado:**
- Select: Tipo (Cripta, Torre, Mina, Ruínas)
- Select: Tema (Pedra, Obsidiana, Musgo, Gelo)
- Toggle buttons: Atmosfera (Sombria, Mágica, Terror, Divina)
- Slider: Tamanho (P, M, G, Épico)
- Stepper: Andares
- Checkboxes: Features (Porão, Quartos, Torre, etc.)

**Inspector:**
- Card do item selecionado (ícone + nome + descrição)
- Input: Nome da Área
- Inputs: Largura/Altura
- Select: Tipo de Piso
- Color swatches: Atmosfera
- Botões: Excluir / Duplicar

---

## FASE 5: Polish & Verify ⏳

> **Objetivo:** Qualidade de produção.

### Tarefas

| # | Tarefa | Detalhes | Status |
|---|--------|----------|--------|
| 5.1 | Keyboard nav | Tab navega elementos | ⏳ |
| 5.2 | Focus rings | Outline amarelo em focus | ⏳ |
| 5.3 | Responsividade | Tablet: sidebar colapsa | ⏳ |
| 5.4 | Mobile block | Mensagem "use desktop" | ⏳ |
| 5.5 | Lint + TypeScript | `npm run lint && tsc --noEmit` | ⏳ |
| 5.6 | Security scan | `npm audit` | ⏳ |
| 5.7 | UX Audit | Verificar protótipos vs implementação | ⏳ |
| 5.8 | Lighthouse | Performance, A11y, Best Practices | ⏳ |
| 5.9 | README | Instruções de uso | ⏳ |

### Checklist Final

- [x] Usuário gera mapa via prompt ou form
- [x] Skeleton exibe no canvas
- [x] Polígonos são editáveis
- [x] Tokens podem ser arrastados
- [ ] Multi-andar funciona (navegação entre floors)
- [x] Undo/Redo funciona
- [ ] Export JSON + imagem funciona
- [x] Dados persistem localmente
- [x] Sem cores púrpura na UI

---

## Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| PGLite + SSR | Média | Alto | Dynamic import com `ssr: false` |
| Konva performance | Baixa | Médio | Batch rendering, layer caching |
| Gemini Image API | Média | Alto | Stub/placeholder, fallback DALL-E |
| Clipper2 edge cases | Baixa | Médio | Testes unitários extensivos |

---

## Dependências Entre Fases

```
FASE 0 ──────┬──────> FASE 1 ────────> FASE 3 ─────┐
             │                                      │
             └──────> FASE 2 ────────> FASE 4 ─────┤
                                                    │
                                                    v
                                               FASE 5
```

- **Fase 0** é pré-requisito para todas
- **Fase 1** (Data) e **Fase 2** (AI) podem rodar em paralelo
- **Fase 3** (Canvas) depende de Fase 1
- **Fase 4** (UI) depende de Fase 2 e 3
- **Fase 5** (Polish) é a última do MVP

---

## MVP Pendências (para fases futuras)

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Multi-andar | ⏳ | Navegação entre floors |
| Export JSON/PNG | ⏳ | Exportar mapa completo |
| Keyboard nav completa | ⏳ | Tab através de elementos |
| Tablet sidebar collapse | ⏳ | Sidebar responsiva |

---

