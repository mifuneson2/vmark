# Recursos

O VMark é um editor Markdown repleto de recursos projetado para fluxos de trabalho de escrita modernos. Veja o que está incluído.

## Modos de Edição

### Modo de Texto Rico (WYSIWYG)

O modo de edição padrão oferece uma experiência verdadeira de "o que você vê é o que você obtém":

- Visualização de formatação ao vivo enquanto você digita
- Revelação de sintaxe inline ao passar o cursor
- Barra de ferramentas intuitiva e menus de contexto
- Entrada de sintaxe markdown sem interrupções

### Modo Fonte

Alterne para edição em Markdown bruto com realce de sintaxe completo:

- Editor baseado no CodeMirror 6
- Realce de sintaxe completo
- Experiência familiar de editor de texto
- Perfeito para usuários avançados

Alterne entre os modos com `F6`.

### Peek de Fonte

Edite o Markdown bruto de um único bloco sem sair do modo WYSIWYG. Pressione `F5` para abrir o Peek de Fonte para o bloco na posição do cursor.

**Layout:**
- Barra de cabeçalho com rótulo do tipo de bloco e botões de ação
- Editor CodeMirror mostrando a fonte Markdown do bloco
- Bloco original exibido como visualização esmaecida (quando a visualização ao vivo está ATIVADA)

**Controles:**
| Ação | Atalho |
|------|--------|
| Salvar alterações | `Cmd/Ctrl + Enter` |
| Cancelar (reverter) | `Escape` |
| Alternar visualização ao vivo | Clique no ícone de olho |

**Visualização ao Vivo:**
- **DESATIVADA (padrão):** Edite livremente, alterações aplicadas somente ao salvar
- **ATIVADA:** Alterações aplicadas imediatamente enquanto você digita, visualização exibida abaixo

**Blocos excluídos:**
Alguns blocos possuem seus próprios mecanismos de edição e ignoram o Peek de Fonte:
- Blocos de código (incluindo Mermaid, LaTeX) — use duplo clique para editar
- Imagens em bloco — use o popup de imagem
- Frontmatter, blocos HTML, linhas horizontais

O Peek de Fonte é útil para edição precisa de Markdown (corrigindo sintaxe de tabela, ajustando indentação de lista) enquanto permanece no editor visual.

## Edição com Múltiplos Cursores

Edite vários locais simultaneamente — o VMark suporta múltiplos cursores completos nos modos WYSIWYG e Fonte.

| Ação | Atalho |
|------|--------|
| Adicionar cursor na próxima correspondência | `Mod + D` |
| Pular correspondência, ir para a próxima | `Mod + Shift + D` |
| Selecionar todas as ocorrências | `Mod + Shift + L` |
| Adicionar cursor acima/abaixo | `Mod + Alt + Cima/Baixo` |
| Adicionar cursor ao clicar | `Alt + Clique` |
| Desfazer último cursor | `Alt + Mod + Z` |
| Colapsar para cursor único | `Escape` |

Toda a edição padrão (digitação, exclusão, área de transferência, navegação) funciona em cada cursor independentemente. Com escopo de bloco por padrão para evitar edições não intencionais entre seções.

[Saiba mais →](/pt-BR/guide/multi-cursor)

## Auto-Par e Escape de Tab

Quando você digita um parêntese de abertura, aspas ou acento grave, o VMark insere automaticamente o par de fechamento. Pressione **Tab** para pular o caractere de fechamento em vez de usar a tecla de seta.

- Parênteses: `()` `[]` `{}`
- Aspas: `""` `''` `` ` ` ``
- CJK: `「」` `『』` `（）` `【】` `《》` `〈〉`
- Aspas curvas: `""` `''`
- Marcas de formatação em WYSIWYG: **negrito**, *itálico*, `código`, ~~tachado~~, links

Backspace exclui ambos os caracteres quando o par está vazio. Auto-par e pulo de parêntese com Tab estão **desabilitados dentro de blocos de código e código inline** — parênteses no código permanecem literais. Configurável em **Configurações → Editor**.

[Saiba mais →](/pt-BR/guide/tab-navigation)

## Formatação de Texto

### Estilos Básicos

- **Negrito**, *Itálico*, <u>Sublinhado</u>, ~~Tachado~~
- `Código inline`, ==Destaque==
- Subscrito e Sobrescrito
- Links, Links Wiki e Links de Favorito com popups de visualização
- Notas de rodapé com edição inline
- Alternância de comentário HTML (`Mod + /`)
- Comando de limpar formatação

### Transformações de Texto

Altere rapidamente o caso do texto via Formatar → Transformar:

| Transformação | Atalho |
|---------------|--------|
| MAIÚSCULAS | `Ctrl + Shift + U` (macOS) / `Alt + Shift + U` (Win/Linux) |
| minúsculas | `Ctrl + Shift + L` (macOS) / `Alt + Shift + L` (Win/Linux) |
| Capitalização de Título | `Ctrl + Shift + T` (macOS) / `Alt + Shift + T` (Win/Linux) |
| Alternar Caso | — |

### Elementos de Bloco

- Títulos 1-6 com atalhos fáceis (aumentar/diminuir nível com `Mod + Alt + ]`/`[`)
- Citações (aninhamento suportado)
- Blocos de código com realce de sintaxe
- Listas ordenadas, não ordenadas e de tarefas
- Linhas horizontais
- Tabelas com suporte completo de edição

### Quebras de Linha Duras

Pressione `Shift + Enter` para inserir uma quebra de linha dura dentro de um parágrafo.
O VMark usa o estilo de dois espaços por padrão para máxima compatibilidade.
Configure em **Configurações > Editor > Espaços em Branco**.

### Operações de Linha

Manipulação poderosa de linhas via Editar → Linhas:

| Ação | Atalho |
|------|--------|
| Mover Linha Acima | `Alt + Cima` |
| Mover Linha Abaixo | `Alt + Baixo` |
| Duplicar Linha | `Shift + Alt + Baixo` |
| Excluir Linha | `Mod + Shift + K` |
| Unir Linhas | `Mod + J` |
| Remover Linhas em Branco | — |
| Ordenar Linhas Crescente | `F4` |
| Ordenar Linhas Decrescente | `Shift + F4` |

## Tabelas

Edição completa de tabelas:

- Inserir tabelas via menu ou atalho
- Adicionar/excluir linhas e colunas
- Alinhamento de células (esquerda, centro, direita)
- Redimensionar colunas arrastando
- Barra de ferramentas contextual para ações rápidas
- Navegação por teclado (Tab, setas, Enter)

## Imagens

Suporte abrangente a imagens:

- Inserir via diálogo de arquivo
- Arrastar e soltar do sistema de arquivos
- Colar da área de transferência
- Copiar automaticamente para a pasta de ativos do projeto
- Redimensionar via menu de contexto
- Duplo clique para editar caminho da fonte, texto alternativo e dimensões
- Alternar entre exibição inline e em bloco

## Vídeo e Áudio

Suporte completo de mídia com tags HTML5:

- Inserir vídeo e áudio via seletor de arquivo na barra de ferramentas
- Arrastar e soltar arquivos de mídia no editor
- Copiar automaticamente para a pasta `.assets/` do projeto
- Clicar para editar caminho da fonte, título e pôster (vídeo)
- Suporte a incorporação do YouTube com iframes de privacidade aprimorada
- Fallback de sintaxe de imagem: `![](arquivo.mp4)` promovido automaticamente a vídeo
- Decoração no modo fonte com bordas coloridas específicas por tipo
- [Saiba mais →](/pt-BR/guide/media-support)

## Conteúdo Especial

### Caixas de Informação

Alertas no estilo Markdown do GitHub:

- NOTE — Informações gerais
- TIP — Sugestões úteis
- IMPORTANT — Informações importantes
- WARNING — Problemas potenciais
- CAUTION — Ações perigosas

### Seções Recolhíveis

Crie blocos de conteúdo expansíveis usando o elemento HTML `<details>`.

### Equações Matemáticas

Renderização LaTeX baseada no KaTeX:

- Matemática inline: `$E = mc^2$`
- Matemática em bloco: `$$...$$`
- Suporte completo à sintaxe LaTeX
- Mensagens de erro úteis com dicas de sintaxe

### Diagramas

Suporte a diagramas Mermaid com visualização ao vivo:

- Fluxogramas, diagramas de sequência, gráficos de Gantt
- Diagramas de classe, diagramas de estado, diagramas ER
- Painel de visualização ao vivo no modo Fonte (arrastar, redimensionar, zoom)
- [Saiba mais →](/pt-BR/guide/mermaid)

### Gráficos SVG

Renderize SVG bruto inline via blocos de código ` ```svg `:

- Renderização instantânea com pan, zoom e exportação PNG
- Visualização ao vivo nos modos WYSIWYG e Fonte
- Ideal para gráficos gerados por IA e ilustrações personalizadas
- [Saiba mais →](/pt-BR/guide/svg)

## Gênios de IA

Assistência de escrita com IA integrada com base no seu provedor escolhido:

- 13 gênios em quatro categorias — edição, criativo, estrutura e ferramentas
- Seletor no estilo Spotlight com pesquisa e prompts livres (`Mod + Y`)
- Renderização de sugestão inline — aceitar ou rejeitar com atalhos de teclado
- Suporta provedores CLI (Claude, Codex, Gemini, Ollama) e APIs REST

[Saiba mais →](/pt-BR/guide/ai-genies) | [Configurar provedores →](/pt-BR/guide/ai-providers)

## Pesquisar e Substituir

Abra a barra de pesquisa com `Mod + F`. Ela aparece inline na parte superior da área do editor e funciona nos modos WYSIWYG e Fonte.

**Navegação:**

| Ação | Atalho |
|------|--------|
| Encontrar próxima correspondência | `Enter` ou `Mod + G` |
| Encontrar correspondência anterior | `Shift + Enter` ou `Mod + Shift + G` |
| Usar seleção para pesquisa | `Mod + E` |
| Fechar barra de pesquisa | `Escape` |

**Opções de pesquisa** — alternar via botões na barra de pesquisa:

- **Diferenciar maiúsculas/minúsculas** — corresponder ao caso exato das letras
- **Palavra inteira** — corresponder apenas a palavras completas, não substrings
- **Expressão regular** — usar padrões regex (habilitar nas Configurações primeiro)

**Substituir:**

Clique no chevron de expansão na barra de pesquisa para revelar a linha de substituição. Digite o texto de substituição, então use **Substituir** (única correspondência) ou **Substituir Tudo** (todas as correspondências de uma vez). O contador de correspondências exibe a posição atual e o total (por exemplo, "3 de 12") para que você sempre saiba onde está.

## Opções de Exportação

O VMark oferece opções flexíveis de exportação para compartilhar seus documentos.

### Exportação HTML

Exportar para HTML autônomo com dois modos de empacotamento:

- **Modo pasta** (padrão): Cria `Documento/index.html` com ativos em uma subpasta
- **Modo arquivo único**: Cria um arquivo `.html` autocontido com imagens incorporadas

O HTML exportado inclui o [**VMark Reader**](/pt-BR/guide/export#vmark-reader) — controles interativos para configurações, sumário, lightbox de imagens e mais.

[Saiba mais sobre exportação →](/pt-BR/guide/export)

### Exportação PDF

Imprimir para PDF com diálogo nativo do sistema (`Cmd/Ctrl + P`).

### Copiar como HTML

Copiar conteúdo formatado para colar em outros aplicativos (`Cmd/Ctrl + Shift + C`).

### Formato de Cópia

Por padrão, copiar do WYSIWYG coloca texto simples (sem formatação) na área de transferência. Habilite o formato de cópia **Markdown** em **Configurações > Markdown > Colar e Entrada** para colocar sintaxe Markdown em `text/plain` em vez disso — títulos mantêm seus `#`, links mantêm seus URLs, etc. Útil ao colar em terminais, editores de código ou aplicativos de chat.

## Formatação CJK

Ferramentas de formatação de texto em Chinês/Japonês/Coreano integradas:

- Mais de 20 regras de formatação configuráveis
- Espaçamento CJK-Inglês
- Conversão de caracteres de largura total
- Normalização de pontuação
- Emparelhamento inteligente de aspas com detecção de apóstrofo/prime
- Proteção de construtos técnicos (URLs, versões, horários, decimais)
- Conversão contextual de aspas (curvas para CJK, retas para Latin)
- Alternar estilo de aspas no cursor (`Shift + Mod + '`)
- [Saiba mais →](/pt-BR/guide/cjk-formatting)

## Histórico de Documentos

- Salvamento automático com intervalo configurável
- Visualizar e restaurar versões anteriores
- Formato de armazenamento JSONL
- Histórico por documento

## Visualização e Foco

### Modo Foco (`F8`)

O Modo Foco esmaece todos os blocos exceto aquele que você está editando atualmente, reduzindo o ruído visual para que você possa se concentrar em um único parágrafo. O bloco ativo é destacado com opacidade total enquanto o conteúdo ao redor desaparece para uma cor suave. Alterne com `F8` — funciona nos modos WYSIWYG e Fonte e persiste até você desativar.

### Modo Máquina de Escrever (`F9`)

O Modo Máquina de Escrever mantém a linha ativa verticalmente centralizada no viewport, para que seus olhos fiquem em posição fixa enquanto o documento rola abaixo de você — como digitar em uma máquina de escrever física. Alterne com `F9`. Funciona em ambos os modos de edição e usa rolagem suave com um pequeno limiar para evitar ajustes instáveis em movimentos menores do cursor.

### Combinando Foco + Máquina de Escrever

O Modo Foco e o Modo Máquina de Escrever podem ser habilitados simultaneamente. Juntos, fornecem um ambiente de escrita totalmente livre de distrações: os blocos ao redor são esmaecidos *e* a linha atual fica centralizada na tela.

### Quebra de Linha (`Alt + Z`)

Alterne a quebra de linha suave com `Alt + Z`. Quando habilitado, linhas longas são quebradas na largura do editor em vez de rolar horizontalmente. A configuração persiste entre sessões.

## Utilitários de Texto

O VMark inclui utilitários para limpeza e formatação de texto, disponíveis no menu Formatar:

### Limpeza de Texto (Formatar → Limpeza de Texto)

- **Remover Espaços no Fim**: Remover espaços em branco ao final das linhas
- **Recolher Linhas em Branco**: Reduzir múltiplas linhas em branco para uma única

### Formatação CJK (Formatar → CJK)

Ferramentas de formatação de texto em Chinês/Japonês/Coreano integradas. [Saiba mais →](/pt-BR/guide/cjk-formatting)

### Limpeza de Imagens (Arquivo → Limpar Imagens Não Utilizadas)

Encontre e remova imagens órfãs da sua pasta de ativos.

## Terminal Integrado

Painel de terminal integrado com múltiplas sessões, copiar/colar, pesquisa, caminhos de arquivo e URLs clicáveis, menu de contexto, sincronização de tema e configurações de fonte configuráveis. Alterne com `` Ctrl + ` ``. [Saiba mais →](/pt-BR/guide/terminal)

## Atualização Automática

O VMark verifica atualizações automaticamente e pode baixar e instalar dentro do aplicativo:

- Verificação automática de atualizações ao iniciar
- Instalação de atualização com um clique
- Visualização das notas de versão antes de atualizar

## Suporte a Área de Trabalho

- Abrir pastas como áreas de trabalho
- Navegação na árvore de arquivos na barra lateral
- Alternância rápida de arquivos
- Rastreamento de arquivos recentes
- Tamanho e posição da janela lembrados entre sessões

[Saiba mais →](/pt-BR/guide/workspace-management)

## Personalização

### Temas

Cinco temas de cores integrados:

- Branco (limpo, minimalista)
- Papel (branco quente)
- Menta (toque verde suave)
- Sépia (visual vintage)
- Noturno (modo escuro)

### Fontes

Configure fontes separadas para:

- Texto Latin
- Texto CJK (Chinês/Japonês/Coreano)
- Monoespaçado (código)

### Layout

Ajuste:

- Tamanho da fonte
- Altura de linha
- Espaçamento de bloco (lacuna entre parágrafos e blocos)
- Espaçamento de letras CJK (espaçamento sutil para legibilidade CJK)
- Largura do editor
- Tamanho da fonte de elementos de bloco (listas, citações, tabelas, alertas)
- Alinhamento de títulos (esquerda ou centro)
- Alinhamento de imagem e tabela (esquerda ou centro)

### Atalhos de Teclado

Todos os atalhos são personalizáveis em Configurações → Atalhos.

## Detalhes Técnicos

O VMark é construído com tecnologia moderna:

| Componente | Tecnologia |
|-----------|------------|
| Framework Desktop | Tauri v2 (Rust) |
| Frontend | React 19, TypeScript |
| Gerenciamento de Estado | Zustand v5 |
| Editor de Texto Rico | Tiptap (ProseMirror) |
| Editor de Fonte | CodeMirror 6 |
| Estilização | Tailwind CSS v4 |

Todo o processamento acontece localmente na sua máquina — sem serviços em nuvem, sem contas necessárias.
