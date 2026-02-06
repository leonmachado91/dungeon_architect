# Dungeon Architect — UI Specification

> Especificação de interface do usuário.

---

## Layout Principal

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER                                                               │
│  [Logo] Dungeon Architect              [Histórico] [Configurações]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────┐  ┌────────────────────────────────┐ │
│  │                             │  │  SIDEBAR                       │ │
│  │                             │  │                                │ │
│  │                             │  │  [Tab: Prompt | Form]          │ │
│  │                             │  │                                │ │
│  │        CANVAS               │  │  ┌────────────────────────┐   │ │
│  │     (Mapa/Editor)           │  │  │ Textarea / Form fields │   │ │
│  │                             │  │  └────────────────────────┘   │ │
│  │                             │  │                                │ │
│  │                             │  │  [Gerar Estrutura]            │ │
│  │                             │  │                                │ │
│  │                             │  │  ─────────────────────────    │ │
│  │                             │  │                                │ │
│  │                             │  │  INSPECTOR                    │ │
│  │                             │  │  (Detalhes do item selecionado)│ │
│  │                             │  │                                │ │
│  └─────────────────────────────┘  └────────────────────────────────┘ │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  TOOLBAR                                                              │
│  [Andar: Térreo ▼] [Zoom: 100%] [Undo] [Redo] [Export] [Render]      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Estados da Aplicação

### 1. Estado Inicial (Vazio)

- Canvas mostra placeholder com instrução
- Sidebar em modo "Criar Novo"
- Toolbar desabilitada (exceto Histórico)

### 2. Editando Estrutura

- Canvas mostra skeleton (grid + polígonos coloridos)
- Sidebar mostra inspector do item selecionado
- Toolbar habilitada

### 3. Visualizando Render

- Canvas mostra imagem renderizada + overlay interativo
- Sidebar mostra info do espaço clicado
- Botão "Inpainting" disponível

---

## Componentes

### Sidebar — Tab Prompt Livre

```
┌────────────────────────────────────────┐
│  📝 Descreva sua dungeon               │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ Uma taverna medieval com porão   │  │
│  │ secreto onde cultistas se        │  │
│  │ reúnem. Três quartos no andar    │  │
│  │ de cima.                         │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Resolução: [1024x1024 ▼]             │
│                                        │
│  [      Gerar Estrutura      ]        │
└────────────────────────────────────────┘
```

### Sidebar — Tab Form Guiado

```
┌────────────────────────────────────────┐
│  🏰 Configurar Mapa                    │
├────────────────────────────────────────┤
│                                        │
│  Tipo                                  │
│  [Taverna            ▼]               │
│                                        │
│  Tema                                  │
│  [Medieval           ▼]               │
│                                        │
│  Atmosfera                             │
│  [Aconchegante_______________]        │
│                                        │
│  Tamanho                               │
│  ●───○───○───○───○                    │
│  P   M       G   Épico                 │
│                                        │
│  Andares: [2]                          │
│                                        │
│  Features                              │
│  ☑ Porão   ☑ Quartos   ☐ Estábulo    │
│  ☐ Jardim  ☐ Torre     ☐ Masmorras   │
│                                        │
│  Segredo (opcional)                    │
│  [Culto se reúne no porão____]        │
│                                        │
│  Resolução: [1024x1024 ▼]             │
│                                        │
│  [      Gerar Estrutura      ]        │
└────────────────────────────────────────┘
```

### Inspector — Espaço Selecionado

```
┌────────────────────────────────────────┐
│  🚪 Salão Principal                    │
├────────────────────────────────────────┤
│                                        │
│  Nome                                  │
│  [Salão Principal____________]        │
│                                        │
│  Descrição (lore)                      │
│  ┌──────────────────────────────────┐  │
│  │ O coração da taverna, sempre     │  │
│  │ cheio de viajantes e mercadores. │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Prompt Visual                         │
│  ┌──────────────────────────────────┐  │
│  │ Medieval tavern hall, wooden     │  │
│  │ tables, stone fireplace, warm    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Iluminação: [Bright ▼]               │
│                                        │
│  ─────────────────────────────────    │
│  ZONES                                 │
│  ├ Balcão         [Editar] [Remover] │
│  └ Lareira        [Editar] [Remover] │
│                                        │
│  [+ Adicionar Zone]                   │
│                                        │
└────────────────────────────────────────┘
```

### Toolbar — Seletor de Andar

```
┌────────────────────────────────────────┐
│  Andar: [Térreo ▼]                    │
│         ├ 1º Andar    ✓ Renderizado   │
│         ├ Térreo      ✓ Renderizado   │
│         └ Porão       ○ Pendente      │
└────────────────────────────────────────┘
```

---

## Fluxos de Interação

### Fluxo 1: Gerar Novo Mapa

```
1. Usuário escolhe tab (Prompt ou Form)
2. Preenche informações
3. Seleciona resolução
4. Clica "Gerar Estrutura"
5. Loading state (skeleton sendo gerado)
6. Canvas mostra skeleton colorido
7. Sidebar mostra lista de espaços
8. Usuário pode editar estrutura
9. Clica "Render" na toolbar
10. Loading state (imagem sendo gerada)
11. Canvas mostra render final
12. Overlay interativo ativado
```

### Fluxo 2: Inpainting

```
1. Usuário está visualizando render
2. Clica em área que quer corrigir
3. Modal aparece com opções:
   - Área selecionada (highlight)
   - Campo de instrução
   - Botões [Cancelar] [Regenerar]
4. Após regenerar, área é atualizada
5. Histórico de versões disponível
```

### Fluxo 3: Multi-Andar

```
1. Mapa tem múltiplos andares
2. Seletor de andar na toolbar
3. Usuário troca entre andares
4. Cada andar pode ser renderizado independentemente
5. Ao renderizar andar 2+, imagem do anterior é referência
```

---

## Cores do Sistema

### Skeleton (Cores Técnicas)

| Elemento | Cor | Preview |
|----------|-----|---------|
| Chão | `#FFFFFF` | ⬜ |
| Parede | `#FF0000` | 🟥 |
| Porta/Archway | `#00FF00` | 🟩 |
| Janela | `#00FFFF` | 🟦 |
| Escada | `#FFFF00` | 🟨 |
| Zona especial | `#FF00FF` | 🟪 |
| Fora do mapa | `#333333` | ⬛ |

### UI — Gruvbox Dark (Definitivo)

> Paleta oficial extraída dos protótipos Stitch. Ver `UI_UX_PLAN.md` para especificação completa.

| Elemento | Cor | Nome |
|----------|-----|------|
| Background | `#282828` | bg |
| Surface/Hard | `#1d2021` | bg-hard |
| Surface/Soft | `#32302f` | bg-soft |
| Primary CTA | `#cc241d` | red |
| Highlights | `#d79921` | yellow |
| Secondary | `#689d6a` | teal |
| Accent | `#b8bb26` | green |
| Text primary | `#ebdbb2` | fg |
| Text secondary | `#a89984` | fg-alt |
| Muted | `#928374` | gray |

### Protótipos de Referência

| Tela | Caminho |
|------|---------|
| Canvas Editando | `docs/UI_prototype/dungeon_architect_canva/` |
| Form Guiado | `docs/UI_prototype/dungeon_architect_form/` |
| Prompt Livre | `docs/UI_prototype/dungeon_architect_prompt/` |

---

## Responsividade

### Desktop (≥1280px)
- Layout completo (canvas + sidebar)
- Sidebar sempre visível

### Tablet (768px - 1279px)
- Sidebar colapsável
- Canvas ocupa tela cheia quando sidebar fechada

### Mobile (< 768px)
- Não suportado no MVP
- Mostrar mensagem "Use um dispositivo maior"

---

## Acessibilidade

- Todos os botões com labels descritivos
- Contraste mínimo AA (4.5:1)
- Navegação por teclado no canvas
- Atalhos de teclado:
  - `Ctrl+Z`: Undo
  - `Ctrl+Y`: Redo
  - `Ctrl+E`: Export
  - `Ctrl+R`: Render
  - `1-9`: Trocar andar
