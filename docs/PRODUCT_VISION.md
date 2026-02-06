# Dungeon Architect — Visão do Produto

> Plataforma AI-first para geração de mapas de RPG de mesa com renderização por IA e interatividade automática.

---

## 1. Proposta de Valor

| Problema | Solução |
|----------|---------|
| Ferramentas manuais são lentas | Geração procedural via prompt |
| IA genérica não é interativa | Skeleton semântico preserva interatividade |
| Mapas bonitos requerem skill artístico | Render por Gemini Image |
| Edição pós-geração é destrutiva | Inpainting seletivo + undo/redo |

---

## 2. Pipeline de Geração

```
┌────────────────────────────────────────────────────────────────────┐
│  INPUT                                                              │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐  │
│  │  Prompt Livre   │ OR  │  Form Guiado (gênero, tema, size)   │  │
│  └────────┬────────┘     └──────────────────┬──────────────────┘  │
│           └──────────────────┬──────────────┘                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  GEMINI PRO — Structured Output                               │  │
│  │  Gera JSON completo: spaces, zones, connections, entities    │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SKELETON GENERATOR                                           │  │
│  │  Converte JSON → Máscara técnica (cores semânticas)          │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  GEMINI IMAGE — Base Render                                   │  │
│  │  Skeleton + Prompt visual → Imagem renderizada               │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  INTERACTIVITY LAYER (automático)                             │  │
│  │  JSON → Polígonos clicáveis mapeados sobre o render          │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  INPAINTING LOOP (manual, sob demanda)                        │  │
│  │  Usuário seleciona área → Novo prompt → Re-render parcial    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Decisões de Design

| Aspecto | Decisão |
|---------|---------|
| Pipeline | Híbrido (base + inpainting manual) |
| Iteração | Ilimitada, até aprovação do usuário |
| Histórico | Undo/redo local |
| Grid | Sim, tudo em grid |
| Geometria | Polígonos arbitrários via merge de retângulos |
| Aninhamento | Não — usar zones como anotações semânticas |
| Input | Prompt livre OU form guiado |
| Export | JSON + imagem (backup/import) |
| VTT | Nenhuma integração (futuro) |
| Fog of War | Futuro |
| Edição | Totalmente editável pós-geração |
| Preview | Só após AI gerar skeleton |
| Histórico | Local, mapas podem virar templates |
| Resolução | Escolhida na criação |
| Multi-andar | Tabs separados + connections com validação espacial |
| Entidades móveis | Tokens/ícones separados do render |
| Consistência visual | Imagem do andar anterior como referência |

---

## 4. Sistema de Máscaras

### Palette de Cores Semânticas

| Cor | Hex | Significado |
|-----|-----|-------------|
| Branco | `#FFFFFF` | Chão / área caminhável |
| Vermelho | `#FF0000` | Parede sólida |
| Verde | `#00FF00` | Porta / Archway |
| Ciano | `#00FFFF` | Janela |
| Amarelo | `#FFFF00` | Escada / Conexão vertical |
| Magenta | `#FF00FF` | Zona especial (balcão, lareira) |
| Cinza escuro | `#333333` | Área fora do mapa |

> ⚠️ **Regra crítica**: Instruir Gemini Image para NUNCA reproduzir essas cores no render final.

---

## 5. Multi-Andar

- Cada andar é gerado e renderizado separadamente
- Conexões (escadas, cordas) validam posição espacial consistente
- Render subsequente recebe imagem anterior como referência para consistência visual
- Visualização via tabs

---

## 6. MVP Scope

### v1.0 (Local-First)
- [ ] Geração via prompt livre e form guiado
- [ ] Structured output (Gemini Pro)
- [ ] Skeleton generator (canvas → máscara)
- [ ] Base render (Gemini Image)
- [ ] Interatividade automática
- [ ] Editor de geometria (retângulos + merge)
- [ ] Zones semânticas
- [ ] Multi-andar (tabs + conexões)
- [ ] Inpainting manual
- [ ] Undo/redo
- [ ] Export JSON + imagem
- [ ] Histórico local

### Roadmap
| Versão | Features |
|--------|----------|
| v1.1 | Fog of War |
| v1.2 | Biblioteca de templates |
| v1.3 | Tokens customizáveis |
| v2.0 | Integração VTT |
| v2.1 | Colaboração em tempo real |

---

## 7. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Gemini não respeita cores da máscara | Prompt engineering + exemplos |
| Render inconsistente entre andares | Imagem anterior como referência |
| Merge de polígonos bugado | Lib testada (clipper.js) |
| Custo API alto | Caching agressivo |
