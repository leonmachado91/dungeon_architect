# Dungeon Architect — Tech Stack

> Definição oficial das tecnologias e bibliotecas do projeto.

---

## 1. Core Framework

*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
    *   *Uso:* Full-stack framework. Todo o app vive aqui.
    *   *Justificativa:* Unifica frontend e backend, performance via Server Components, e fácil deploy.
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
    *   *Uso:* Obrigatório em todo o código.
    *   *Justificativa:* Garante segurança de tipos para os contratos complexos de dados (Schemas do `DungeonMap`).

---

## 2. Frontend & UI

*   **Component Library:** [shadcn/ui](https://ui.shadcn.com/)
    *   *Uso:* Componentes base (Botões, Modais, Inputs).
    *   *Justificativa:* Padrão de mercado, acessível, código aberto e customizável ("não reinventar a roda").
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    *   *Uso:* Estilização de layout e componentes.
*   **Map Editor (Canvas):** [React Konva](https://konvajs.org/docs/react/index.html)
    *   *Uso:* Renderização do mapa, drag-and-drop de tokens, desenho de zonas.
    *   *Justificativa:* Performance para canvas 2D interativo, gerenciamento de layers e eventos muito superior ao SVG puro.
*   **State Management (Client):** [Zustand](https://github.com/pmndrs/zustand)
    *   *Uso:* Estado global do editor de mapas (zoom, seleção, ferramentas).
    *   *Justificativa:* Mais simples e performático que Redux/Context para estados que mudam com frequência (60fps).

---

## 3. Backend & Data (Local-First)

*   **Database:** [PGLite](https://pglite.dev/) (Postgres WASM)
    *   *Uso:* Banco de dados SQL rodando inteiramente no navegador.
    *   *Justificativa:* Permite funcionamento **100% offline e local** sem configurar Docker/Servidores, mantendo o poder do SQL.
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
    *   *Uso:* Queries e migrações de banco.
    *   *Justificativa:* Leve, type-safe, e compatível tanto com PGLite quanto com Postgres real (caso migremos para nuvem no futuro).

---

## 4. AI & Validação

*   **AI SDK:** [Vercel AI SDK](https://sdk.vercel.ai/docs)
    *   *Uso:* Comunicação com LLMs (Gemini), streaming de respostas e tool calling.
    *   *Justificativa:* Abstração padrão que facilita troca de modelos e estruturação de dados.
*   **Validation:** [Zod](https://zod.dev/)
    *   *Uso:* Validação de schemas (como `DungeonMap`), forms e outputs da IA.
    *   *Justificativa:* Integração nativa com TypeScript e Vercel AI SDK (`generateObject`).
*   **Forms:** [React Hook Form](https://react-hook-form.com/) + `zod-resolver`
    *   *Uso:* Formulários complexos (criação de prompts guiada).

---

## 5. Utilitários

*   **Polygon Operations:** [Clipper2-JS](https://github.com/nicco/clipper2-js)
    *   *Uso:* Merge, union, intersection de polígonos no editor.
    *   *Justificativa:* Versão moderna do clipper.js, WASM-backed, MIT license.
*   **Undo/Redo:** [Zundo](https://github.com/charkour/zundo)
    *   *Uso:* History stack para ações do editor.
    *   *Justificativa:* Integração nativa com Zustand.

---

## 6. Referências

*   [Next.js App Router Docs](https://nextjs.org/docs/app)
*   [shadcn/ui Components](https://ui.shadcn.com/)
*   [Vercel AI SDK](https://sdk.vercel.ai/)
*   [PGLite](https://pglite.dev/)

### Protótipos UI

Os designs definitivos estão em `docs/UI_prototype/`:

| Tela | Pasta |
|------|-------|
| Canvas Editando | `dungeon_architect_canva/` |
| Form Guiado | `dungeon_architect_form/` |
| Prompt Livre | `dungeon_architect_prompt/` |
