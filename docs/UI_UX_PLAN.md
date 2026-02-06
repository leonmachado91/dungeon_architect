# Dungeon Architect — Plano UI/UX

> Design system baseado nos protótipos definitivos Stitch.

---

## 1. Direção Visual

### Conceito: **Dark Fantasy Workshop**

Interface que evoca uma **oficina de cartógrafo medieval** com **tecnologia mágica**.

| Aspecto | Abordagem |
|---------|-----------|
| Mood | Misterioso, criativo, imersivo |
| Metáfora | Mesa de trabalho de um cartógrafo/mago |
| Base | **Gruvbox Dark** — paleta madura e coesa |
| Sensação | Ferramenta poderosa, não intimidadora |

### Anti-Padrões a Evitar

- ❌ UI genérica de "SaaS dashboard"
- ❌ Branco/cinza corporativo
- ❌ Ícones emoji
- ❌ Animações excessivas
- ❌ Light mode como padrão

---

## 2. Paleta de Cores — Gruvbox Dark

> **Definitivo:** Extraído dos protótipos Stitch.

```css
:root {
  /* === BACKGROUNDS === */
  --bg: #282828;           /* Main background */
  --bg-hard: #1d2021;      /* Canvas, deep areas */
  --bg-soft: #32302f;      /* Elevated surfaces */
  
  /* === ACCENTS === */
  --red: #cc241d;          /* Primary action (CTA) */
  --red-light: #fb4934;    /* Hover on red */
  --yellow: #d79921;       /* Highlights, borders, focus */
  --yellow-light: #fabd2f; /* Hover on yellow */
  --teal: #689d6a;         /* Secondary elements */
  --teal-light: #8ec07c;   /* Hover on teal */
  --green: #b8bb26;        /* Accents, success states */
  
  /* === TEXT === */
  --fg: #ebdbb2;           /* Primary text (cream) */
  --fg-alt: #a89984;       /* Secondary text */
  --gray: #928374;         /* Muted text, placeholders */
  
  /* === SEMANTIC === */
  --success: #b8bb26;
  --warning: #d79921;
  --error: #cc241d;
  --info: #689d6a;
}
```

### Skeleton Mask Colors

```css
/* Cores técnicas para o skeleton de geração */
--mask-floor: #FFFFFF;
--mask-wall: #FF0000;
--mask-door: #00FF00;
--mask-window: #00FFFF;
--mask-stairs: #FFFF00;
--mask-zone: #FF00FF;
--mask-void: #333333;
```

### Zone Colors (Canvas)

```css
/* Cores dos polígonos no canvas — derivadas do Gruvbox */
--zone-primary: rgba(204, 36, 29, 0.2);    /* Vermelho — selecionado */
--zone-secondary: rgba(184, 187, 38, 0.15); /* Verde — quartos */
--zone-connection: rgba(146, 131, 116, 0.15); /* Cinza — corredores */
--zone-special: rgba(69, 133, 136, 0.15);   /* Teal — áreas especiais */
```

---

## 3. Tipografia

### Font Stack

```css
--font-display: 'Cinzel Decorative', cursive;  /* Títulos, logo */
--font-body: 'Crimson Text', serif;            /* Corpo do texto */
--font-ui: 'Inter', sans-serif;                /* Labels, botões */
```

### Scale

| Uso | Size | Weight | Font |
|-----|------|--------|------|
| Logo/H1 | 24px | 400 | Cinzel Decorative |
| Section headers | 16px | 700 | Crimson Text |
| Labels | 12px | 700 | Inter |
| Body | 14px | 400 | Crimson Text |
| Captions | 10px | 700 | Inter |

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

---

## 4. Iconografia

### Material Symbols Outlined

> Usado nos protótipos. Consistente, customizável, peso variável.

```html
<span class="material-symbols-outlined">castle</span>
```

### Ícones Principais

| Ação | Ícone |
|------|-------|
| Logo | `castle` |
| Gerar | `auto_awesome` |
| Renderizar | `auto_fix_high` |
| Export | `file_download` |
| Undo | `undo` |
| Redo | `redo` |
| Settings | `settings` |
| Histórico | `history` |
| Andares | `layers` |
| Zoom + | `add_circle` |
| Zoom - | `remove_circle` |
| Editar | `edit` |
| Excluir | `delete` |
| Duplicar | `content_copy` |
| Inspector | `manage_search` |

---

## 5. Componentes Core

### 5.1 Header

```
┌─────────────────────────────────────────────────────────────────────┐
│  [🏰] DUNGEON ARCHITECT          [⏱️] [⚙️] [DA]                     │
│  ═══════════════════════════════════════════════════════════════════│
│  [Linha gradiente red → bg → red]                                   │
└─────────────────────────────────────────────────────────────────────┘
```

- Background: `--bg-hard`
- Border bottom: `--yellow` @ 30% opacity
- Logo: Cinzel Decorative, hover → amarelo
- Ícone do logo: rotating on hover (45deg)

### 5.2 Canvas

```
┌─────────────────────────────────────────────────────────────────────┐
│  [bg-hard com grid de linhas @ 40px]                                │
│                                                                     │
│  ┌─ Ornate corners (yellow @ 50%) ─┐                               │
│  │                                  │                               │
│  │   [Polígonos coloridos]         │                               │
│  │   [Labels centralizados]         │                               │
│  │   [Resize handles amarelos]      │                               │
│  │                                  │                               │
│  └──────────────────────────────────┘                               │
│                                                                     │
│  [Shadow inset: 60px rgba(0,0,0,0.4)]                              │
└─────────────────────────────────────────────────────────────────────┘
```

- Grid pattern: linhas `#ebdbb2` @ 5% opacity, 40px
- Border: 2px `--yellow` @ 20% opacity
- Ornate corners: cantos decorativos em amarelo

### 5.3 Toolbar (Bottom Floating)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [📚]  │  [➖][➕]  │  [↩️][↪️]  │  [⬇️]  │  [✨ RENDERIZAR]          │
└──────────────────────────────────────────────────────────────────────┘
```

- Floating: bottom center, `-translate-y-1` on hover
- Background: `--bg` with `--gray` @ 40% border
- Renderizar button: `--red` bg, bold uppercase tracking-widest

### 5.4 Sidebar

```
┌──────────────────────────────────┐
│  [PROMPT LIVRE] | [FORM GUIADO] │  ← Tabs
├──────────────────────────────────┤
│  ══ CONFIGURAÇÃO ══             │  ← Section header
│                                  │
│  [Form fields...]                │
│                                  │
│  [✨ GERAR ESTRUTURA]            │  ← Primary CTA
└──────────────────────────────────┘
```

- Width: 320px
- Tabs: active = `--red` border-bottom + bg-soft
- Section headers: `--yellow` text, linha horizontal através
- Inputs: `--bg-hard` bg, `--yellow` focus ring

### 5.5 Inspector Panel

```
┌──────────────────────────────────┐
│  🔍 INSPETOR                    │  ← Yellow uppercase
├──────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │ [Icon] SELECIONADO       │   │  ← Selected item card
│  │        Salão Principal   │   │
│  │        "Descrição..."    │   │
│  └──────────────────────────┘   │
│                                  │
│  Nome: [___________]             │
│  Largura: [14] Altura: [12]      │
│  Tipo de Piso: [Dropdown ▼]      │
│  Atmosfera: [○][○][○][○][○]      │
│                                  │
│  [Excluir]    [Duplicar]         │
└──────────────────────────────────┘
```

- Selected item: `--red` @ 40% border, icon colored
- Delete button: hover → `--red`
- Duplicate button: hover → `--teal`

---

## 6. Estados

### Empty State

```
┌────────────────────────────────────────────┐
│                                            │
│           [📍 icon @ 20% opacity]          │
│                                            │
│       O mapa aguarda...                   │
│       (italic, Crimson Text)               │
│                                            │
└────────────────────────────────────────────┘
```

### Loading/Generating

- Shimmer animation no skeleton
- Progress indicator quando possível

### Selection State

- Border stroke width: 3px (vs 2px default)
- Resize handles: 3x3px amarelos nos cantos
- Label com background blur

---

## 7. Micro-Interações

| Elemento | Interação |
|----------|-----------|
| Botões | `hover:scale-105 active:scale-95` |
| Cards | `hover:border-color transition-all` |
| Toolbar | `hover:-translate-y-1` |
| Logo icon | `hover:rotate-45` |
| Focus | `ring-1 ring-yellow` |

### Timing

- Transitions: 200-300ms
- Easing: `ease-out` entrada, `ease-in` saída
- Respeitar `prefers-reduced-motion`

---

## 8. Layout System

### Breakpoints

| Nome | Width | Comportamento |
|------|-------|---------------|
| Desktop XL | ≥1440px | Sidebar 360px |
| Desktop | ≥1280px | Sidebar 320px |
| Tablet | 768-1279px | Sidebar colapsível |
| Mobile | <768px | Não suportado (mensagem) |

### Z-Index Scale

```css
--z-canvas: 1;
--z-grid-overlay: 10;
--z-entities: 20;
--z-toolbar: 30;
--z-sidebar: 20;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-tooltip: 500;
--z-overlay: 50;
```

---

## 9. Acessibilidade

- ✅ Contraste 4.5:1 mínimo (WCAG AA)
- ✅ Focus visible em todos elementos interativos
- ✅ Navegação por teclado
- ✅ Labels em todos os inputs
- ✅ `prefers-reduced-motion` respeitado

### Focus Ring

```css
*:focus-visible {
  outline: none;
  ring: 1px solid var(--yellow);
}
```

---

## 10. Referência Visual

### Protótipos Definitivos

| Tela | Arquivo |
|------|---------|
| Canvas Editando | `UI_prototype/dungeon_architect_canva/` |
| Form Guiado | `UI_prototype/dungeon_architect_form/` |
| Prompt Livre | `UI_prototype/dungeon_architect_prompt/` |

Cada pasta contém:
- `code.html` — Código fonte completo
- `screen.png` — Screenshot da tela
