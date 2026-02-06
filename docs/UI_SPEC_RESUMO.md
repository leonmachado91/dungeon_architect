### **1. Layout Principal**

O layout principal da aplicação é dividido em quatro áreas principais:

#### **1.1 Header (Cabeçalho)**

- **Logo**: Representação gráfica da marca "Dungeon Architect".

- **Histórico**: Botão para acessar versões ou ações anteriores realizadas no aplicativo.

- **Configurações**: Botão para acessar preferências ou ajustes gerais do aplicativo.

#### **1.2 Canvas**

- Área principal onde o mapa ou estrutura é exibido e editado, também chamado de editor.

- Pode exibir diferentes estados, como placeholders (espaço vazio com instruções), skeleton (esqueleto da estrutura) ou renderizações finais.

#### **1.3 Sidebar (Barra Lateral)**

- Área lateral que fornece ferramentas específicas para criar ou configurar o mapa.

- Contém diferentes abas:

  - **Prompt Livre**: Permite descrever a dungeon em texto livre.

  - **Form Guiado**: Permite configurar a dungeon por meio de campos pré-definidos e opções.

#### **1.4 Toolbar**

- Barra inferior com ferramentas rápidas:

  - **Andar**: Alterna entre diferentes andares do mapa.

  - **Zoom**: Ajusta o nível de aproximação da visualização.

  - **Undo / Redo**: Desfaz ou refaz ações realizadas.

  - **Export**: Exporta o mapa ou estrutura criada.

  - **Render**: Gera uma visualização final renderizada da estrutura.

---

### **2. Estados da Aplicação**

A interface pode estar em três estados principais:

#### **2.1 Estado Inicial (Vazio)**

- O Canvas está vazio, exibindo apenas um placeholder com instruções para começar.

- A Sidebar está configurada no modo "Criar Novo", permitindo iniciar a criação de uma nova estrutura.

- A Toolbar está desabilitada, exceto pelo botão "Histórico".

#### **2.2 Editando Estrutura**

- O Canvas exibe um esqueleto (skeleton) da estrutura, como uma grade ou polígonos coloridos representando diferentes áreas do mapa.

- A Sidebar exibe o inspector, que mostra detalhes sobre o item selecionado no Canvas.

- A Toolbar está totalmente habilitada.

#### **2.3 Visualizando Render**

- O Canvas exibe a versão renderizada da estrutura, com um overlay interativo (camada sobreposta que permite interagir com elementos específicos).

- A Sidebar exibe informações sobre o espaço clicado no mapa renderizado.

- Um botão adicional chamado "Inpainting" é ativado, permitindo ajustes na renderização final.

---

### **3. Componentes**

#### **3.1 Sidebar — Tab Prompt Livre**

- Permite ao usuário descrever a dungeon em texto livre, como em um campo de texto.

- Exemplo de descrição: "Uma taverna medieval com porão secreto onde cultistas se reúnem. Três quartos no andar de cima."

- Possui uma opção para ajustar a resolução do mapa gerado (exemplo: 1024x1024 pixels).

- Um botão "Gerar Estrutura" inicia o processo de criação do mapa com base na descrição fornecida.

#### **3.2 Sidebar — Tab Form Guiado**

- Permite configurar o mapa usando campos e opções predefinidas:

  - **Tipo**: Escolha do tipo de ambiente, como Taverna, Castelo, etc.

  - **Tema**: Estilo visual ou cultural, como Medieval.

  - **Atmosfera**: Adjetivo que define o tom do ambiente, como "Aconchegante".

  - **Tamanho**: Definido em escalas como Pequeno (P), Médio (M), Grande (G) e Épico.

  - **Andares**: Número de andares da estrutura.

  - **Features (Características)**: Elementos adicionais que podem ser incluídos na dungeon, como Porão, Quartos, Estábulo, Jardim, Torre ou Masmorras.


O Dungeon Architect é uma ferramenta voltada para a criação personalizada de mapas de dungeons, oferecendo flexibilidade por meio do uso de prompts livres ou formulários guiados. A interface é organizada para atender tanto iniciantes quanto usuários avançados, com diferentes estados e componentes que facilitam o processo criativo e técnico da criação de mapas virtuais.