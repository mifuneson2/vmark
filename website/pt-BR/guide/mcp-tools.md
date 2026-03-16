# Referência de Ferramentas MCP

Esta página documenta todas as ferramentas MCP disponíveis quando o Claude (ou outros assistentes de IA) se conecta ao VMark.

O VMark expõe um conjunto de **ferramentas compostas**, **ferramentas de protocolo** e **recursos** — todos documentados abaixo. As ferramentas compostas usam um parâmetro `action` para selecionar a operação — isso reduz o overhead de tokens enquanto mantém todas as capacidades acessíveis.

::: tip Fluxo de Trabalho Recomendado
Para a maioria das tarefas de escrita, você só precisa de algumas ações:

**Entender:** `structure` → `get_digest`, `document` → `search`
**Ler:** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**Escrever:** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**Controlar:** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**Arquivos:** `workspace` → `save`, `tabs` → `switch` / `list`

As demais ações fornecem controle refinado para cenários de automação avançada.
:::

::: tip Diagramas Mermaid
Ao usar IA para gerar diagramas Mermaid via MCP, considere instalar o [servidor MCP mermaid-validator](/pt-BR/guide/mermaid#mermaid-validator-mcp-server-syntax-checking) — ele detecta erros de sintaxe usando os mesmos parsers do Mermaid v11 antes que os diagramas cheguem ao seu documento.
:::

---

## `document`

Ler, escrever, pesquisar e transformar o conteúdo do documento. 12 ações.

Todas as ações aceitam um parâmetro opcional `windowId` (string) para segmentar uma janela específica. O padrão é a janela em foco.

### `get_content`

Obter o conteúdo completo do documento como texto markdown.

### `set_content`

Substituir todo o conteúdo do documento.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `content` | string | Sim | Novo conteúdo do documento (suporta markdown). |

::: warning Somente Documentos Vazios
Por segurança, esta ação só é permitida quando o documento de destino está **vazio**. Para documentos não vazios, use `insert_at_cursor`, `apply_diff` ou `selection` → `replace` — estes criam sugestões que requerem aprovação do usuário.
:::

### `insert_at_cursor`

Inserir texto na posição atual do cursor.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `text` | string | Sim | Texto a inserir (suporta markdown). |

**Retorna:** `{ message, position, suggestionId?, applied }`

::: tip Sistema de Sugestões
Por padrão, esta ação cria uma **sugestão** que requer aprovação do usuário. O texto aparece como prévia fantasma. Os usuários podem aceitar (Enter) ou rejeitar (Escape). Se **Aprovar edições automaticamente** estiver habilitado em Configurações → Integrações, as alterações são aplicadas imediatamente.
:::

### `insert_at_position`

Inserir texto em uma posição de caractere específica.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `text` | string | Sim | Texto a inserir (suporta markdown). |
| `position` | number | Sim | Posição do caractere (baseado em 0). |

**Retorna:** `{ message, position, suggestionId?, applied }`

### `search`

Pesquisar texto no documento.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `query` | string | Sim | Texto a pesquisar. |
| `caseSensitive` | boolean | Não | Pesquisa com distinção de maiúsculas/minúsculas. Padrão: false. |

**Retorna:** Array de correspondências com posições e números de linha.

### `replace_in_source`

Substituir texto no nível do código-fonte markdown, contornando os limites de nós do ProseMirror.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `search` | string | Sim | Texto a encontrar no código-fonte markdown. |
| `replace` | string | Sim | Texto de substituição (suporta markdown). |
| `all` | boolean | Não | Substituir todas as ocorrências. Padrão: false. |

**Retorna:** `{ count, message, suggestionIds?, applied }`

::: tip Quando usar
Use `apply_diff` primeiro — é mais rápido e preciso. Recorra a `replace_in_source` apenas quando o texto de pesquisa atravessa limites de formatação (negrito, itálico, links, etc.) e `apply_diff` não consegue encontrá-lo.
:::

### `batch_edit`

Aplicar múltiplas operações atomicamente.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `operations` | array | Sim | Array de operações (máx 100). |
| `baseRevision` | string | Sim | Revisão esperada para detecção de conflitos. |
| `requestId` | string | Não | Chave de idempotência. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

Cada operação requer `type` (`update`, `insert`, `delete`, `format` ou `move`), `nodeId` e opcionalmente `text`/`content`.

**Retorna:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

Encontrar e substituir texto com controle de política de correspondência.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `original` | string | Sim | Texto a encontrar. |
| `replacement` | string | Sim | Texto para substituir. |
| `baseRevision` | string | Sim | Revisão esperada para detecção de conflitos. |
| `matchPolicy` | string | Não | `first`, `all`, `nth` ou `error_if_multiple`. Padrão: `first`. |
| `nth` | number | Não | Qual correspondência substituir (baseado em 0, para política `nth`). |
| `scopeQuery` | object | Não | Filtro de escopo para restringir a pesquisa. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

**Retorna:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

Substituir texto usando ancoragem de contexto para segmentação precisa.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `anchor` | object | Sim | `{ text, beforeContext, afterContext }` |
| `replacement` | string | Sim | Texto de substituição. |
| `baseRevision` | string | Sim | Revisão esperada para detecção de conflitos. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

### `read_paragraph`

Ler um parágrafo do documento por índice ou correspondência de conteúdo.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `target` | object | Sim | `{ index: 0 }` ou `{ containing: "texto" }` |
| `includeContext` | boolean | Não | Incluir parágrafos ao redor. Padrão: false. |

**Retorna:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

Modificar um parágrafo no documento.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento para detecção de conflitos. |
| `target` | object | Sim | `{ index: 0 }` ou `{ containing: "texto" }` |
| `operation` | string | Sim | `replace`, `append`, `prepend` ou `delete`. |
| `content` | string | Condicional | Novo conteúdo (obrigatório exceto para `delete`). |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

**Retorna:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

Inserir conteúdo em locais comuns do documento.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento para detecção de conflitos. |
| `destination` | varia | Sim | Onde inserir (veja abaixo). |
| `content` | string | Sim | Conteúdo markdown a inserir. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

**Opções de destino:**
- `"end_of_document"` — Inserir no final
- `"start_of_document"` — Inserir no início
- `{ after_paragraph: 2 }` — Inserir após o parágrafo no índice 2
- `{ after_paragraph_containing: "conclusão" }` — Inserir após parágrafo contendo texto
- `{ after_section: "Introdução" }` — Inserir após o título da seção

**Retorna:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip Quando Usar
- **Documentos estruturados** (com títulos): Use `structure` → `get_section`, `update_section`, `insert_section`
- **Documentos simples** (sem títulos): Use `document` → `read_paragraph`, `write_paragraph`, `smart_insert`
- **Fim do documento**: Use `document` → `smart_insert` com `"end_of_document"`
:::

---

## `structure`

Consultas de estrutura do documento e operações de seção. 8 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `get_ast`

Obter a árvore de sintaxe abstrata do documento.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `projection` | string[] | Não | Campos a incluir: `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | object | Não | Filtrar por `type`, `level`, `contains`, `hasMarks`. |
| `limit` | number | Não | Máx de resultados. |
| `offset` | number | Não | Quantidade a ignorar. |
| `afterCursor` | string | Não | ID de nó para paginação por cursor. |

**Retorna:** AST completa com tipos de nó, posições e conteúdo.

### `get_digest`

Obter um resumo compacto da estrutura do documento.

**Retorna:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

Listar todos os blocos no documento com seus IDs de nó.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `query` | object | Não | Filtrar por `type`, `level`, `contains`, `hasMarks`. |
| `projection` | string[] | Não | Campos a incluir. |
| `limit` | number | Não | Máx de resultados. |
| `afterCursor` | string | Não | ID de nó para paginação por cursor. |

**Retorna:** `{ revision, blocks[], hasMore, nextCursor? }`

Os IDs de nó usam prefixos: `h-0` (título), `p-0` (parágrafo), `code-0` (bloco de código), etc.

### `resolve_targets`

Verificação prévia para mutações — encontrar nós por consulta.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `query` | object | Sim | Critérios de consulta: `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | number | Não | Máx de candidatos. |

**Retorna:** Posições e tipos de alvo resolvidos.

### `get_section`

Obter conteúdo de uma seção do documento (título e seu conteúdo até o próximo título de mesmo nível ou superior).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `heading` | string \| object | Sim | Texto do título (string) ou `{ level, index }`. |
| `includeNested` | boolean | Não | Incluir subseções. |

**Retorna:** Conteúdo da seção com título, corpo e posições.

### `update_section`

Atualizar o conteúdo de uma seção.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento. |
| `target` | object | Sim | `{ heading, byIndex, ou sectionId }` |
| `newContent` | string | Sim | Novo conteúdo da seção (markdown). |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

### `insert_section`

Inserir uma nova seção.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento. |
| `after` | object | Não | Alvo de seção para inserir após. |
| `sectionHeading` | object | Sim | `{ level, text }` — nível do título (1-6) e texto. |
| `content` | string | Não | Conteúdo do corpo da seção. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

### `move_section`

Mover uma seção para um novo local.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento. |
| `section` | object | Sim | Seção a mover: `{ heading, byIndex, ou sectionId }`. |
| `after` | object | Não | Alvo de seção para mover após. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

---

## `selection`

Ler e manipular seleção de texto e cursor. 5 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `get`

Obter a seleção de texto atual.

**Retorna:** `{ text, range: { from, to }, isEmpty }`

### `set`

Definir o intervalo de seleção.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `from` | number | Sim | Posição inicial (inclusiva). |
| `to` | number | Sim | Posição final (exclusiva). |

::: tip
Use o mesmo valor para `from` e `to` para posicionar o cursor sem selecionar texto.
:::

### `replace`

Substituir o texto selecionado por novo texto.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `text` | string | Sim | Texto de substituição (suporta markdown). |

**Retorna:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip Sistema de Sugestões
Por padrão, esta ação cria uma **sugestão** que requer aprovação do usuário. O texto original aparece com tachado, e o novo texto aparece como prévia fantasma. Se **Aprovar edições automaticamente** estiver habilitado em Configurações → Integrações, as alterações são aplicadas imediatamente.
:::

### `get_context`

Obter texto ao redor do cursor para compreensão de contexto.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `linesBefore` | number | Não | Linhas antes do cursor. Padrão: 3. |
| `linesAfter` | number | Não | Linhas após o cursor. Padrão: 3. |

**Retorna:** `{ before, after, currentLine, currentParagraph, block }`

O objeto `block` contém:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | string | Tipo de bloco: `paragraph`, `heading`, `codeBlock`, `blockquote`, etc. |
| `level` | number | Nível do título 1-6 (somente para títulos) |
| `language` | string | Linguagem do código (somente para blocos de código com linguagem definida) |
| `inList` | string | Tipo de lista se dentro de uma lista: `bullet`, `ordered` ou `task` |
| `inBlockquote` | boolean | `true` se dentro de uma citação |
| `inTable` | boolean | `true` se dentro de uma tabela |
| `position` | number | Posição no documento onde o bloco começa |

### `set_cursor`

Definir a posição do cursor (limpa a seleção).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `position` | number | Sim | Posição do caractere (baseado em 0). |

---

## `format`

Formatação de texto, tipos de bloco, listas e operações em lote de listas. 10 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `toggle`

Alternar uma marca de formatação na seleção atual.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `mark` | string | Sim | `bold`, `italic`, `code`, `strike`, `underline` ou `highlight` |

### `set_link`

Criar um hiperlink no texto selecionado.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `href` | string | Sim | URL do link. |
| `title` | string | Não | Título do link (dica). |

### `remove_link`

Remover hiperlink da seleção. Sem parâmetros adicionais.

### `clear`

Remover toda a formatação da seleção. Sem parâmetros adicionais.

### `set_block_type`

Converter o bloco atual para um tipo específico.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `blockType` | string | Sim | `paragraph`, `heading`, `codeBlock` ou `blockquote` |
| `level` | number | Condicional | Nível do título 1-6 (obrigatório para `heading`). |
| `language` | string | Não | Linguagem do código (para `codeBlock`). |

### `insert_hr`

Inserir uma linha horizontal (`---`) no cursor. Sem parâmetros adicionais.

### `toggle_list`

Alternar tipo de lista no bloco atual.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `listType` | string | Sim | `bullet`, `ordered` ou `task` |

### `indent_list`

Aumentar a indentação do item de lista atual. Sem parâmetros adicionais.

### `outdent_list`

Diminuir a indentação do item de lista atual. Sem parâmetros adicionais.

### `list_modify`

Modificar em lote a estrutura e o conteúdo de uma lista.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento. |
| `target` | object | Sim | `{ listId }`, `{ selector }` ou `{ listIndex }` |
| `operations` | array | Sim | Array de operações de lista. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

Operações: `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

Operações de tabela. 3 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `insert`

Inserir uma nova tabela no cursor.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `rows` | number | Sim | Número de linhas (deve ser pelo menos 1). |
| `cols` | number | Sim | Número de colunas (deve ser pelo menos 1). |
| `withHeaderRow` | boolean | Não | Se deve incluir uma linha de cabeçalho. Padrão: true. |

### `delete`

Excluir a tabela na posição do cursor. Sem parâmetros adicionais.

### `modify`

Modificar em lote a estrutura e o conteúdo de uma tabela.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `baseRevision` | string | Sim | Revisão do documento. |
| `target` | object | Sim | `{ tableId }`, `{ afterHeading }` ou `{ tableIndex }` |
| `operations` | array | Sim | Array de operações de tabela. |
| `mode` | string | Não | `dryRun` para visualizar sem aplicar. Aplicar vs sugerir é controlado pela configuração do usuário. |

Operações: `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

Operações de estado do editor. 3 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `undo`

Desfazer a última ação de edição.

### `redo`

Refazer a última ação desfeita.

### `focus`

Focar o editor (trazê-lo para a frente, pronto para entrada).

---

## `workspace`

Gerenciar documentos, janelas e estado da área de trabalho. 12 ações.

Ações que operam em uma janela específica aceitam um parâmetro opcional `windowId`.

### `list_windows`

Listar todas as janelas VMark abertas.

**Retorna:** Array de `{ label, title, filePath, isFocused, isAiExposed }`

### `get_focused`

Obter o rótulo da janela em foco.

### `focus_window`

Focar uma janela específica.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `windowId` | string | Sim | Rótulo da janela a focar. |

### `new_document`

Criar um novo documento vazio.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `title` | string | Não | Título opcional do documento. |

### `open_document`

Abrir um documento do sistema de arquivos.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `path` | string | Sim | Caminho do arquivo a abrir. |

### `save`

Salvar o documento atual.

### `save_as`

Salvar o documento em um novo caminho.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `path` | string | Sim | Novo caminho do arquivo. |

### `get_document_info`

Obter metadados do documento.

**Retorna:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

Fechar uma janela.

### `list_recent_files`

Listar arquivos abertos recentemente.

**Retorna:** Array de `{ path, name, timestamp }` (até 10 arquivos, mais recente primeiro).

### `get_info`

Obter informações sobre o estado atual da área de trabalho.

**Retorna:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

Recarregar o documento ativo do disco.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `force` | boolean | Não | Forçar recarga mesmo se o documento tiver alterações não salvas. Padrão: false. |

Falha se o documento não tiver título ou tiver alterações não salvas sem `force: true`.

---

## `tabs`

Gerenciar abas do editor dentro das janelas. 6 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `list`

Listar todas as abas em uma janela.

**Retorna:** Array de `{ id, title, filePath, isDirty, isActive }`

### `switch`

Alternar para uma aba específica.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `tabId` | string | Sim | ID da aba para alternar. |

### `close`

Fechar uma aba.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `tabId` | string | Não | ID da aba a fechar. Padrão é a aba ativa. |

### `create`

Criar uma nova aba vazia.

**Retorna:** `{ tabId }`

### `get_info`

Obter informações detalhadas da aba.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `tabId` | string | Não | ID da aba. Padrão é a aba ativa. |

**Retorna:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

Reabrir a aba fechada mais recentemente.

**Retorna:** `{ tabId, filePath, title }` ou mensagem se nenhuma disponível.

O VMark mantém registro das últimas 10 abas fechadas por janela.

---

## `media`

Inserir matemática, diagramas, mídia, links wiki e formatação CJK. 11 ações.

Todas as ações aceitam um parâmetro opcional `windowId`.

### `math_inline`

Inserir matemática LaTeX inline.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `latex` | string | Sim | Expressão LaTeX (ex: `E = mc^2`). |

### `math_block`

Inserir uma equação matemática em nível de bloco.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `latex` | string | Sim | Expressão LaTeX. |

### `mermaid`

Inserir um diagrama Mermaid.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `code` | string | Sim | Código do diagrama Mermaid. |

### `markmap`

Inserir um mapa mental Markmap. Usa títulos Markdown padrão para definir a árvore.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `code` | string | Sim | Markdown com títulos definindo a árvore do mapa mental. |

### `svg`

Inserir um gráfico SVG. O SVG renderiza inline com pan, zoom e exportação PNG.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `code` | string | Sim | Marcação SVG (XML válido com raiz `<svg>`). |

### `wiki_link`

Inserir um link no estilo wiki.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `target` | string | Sim | Alvo do link (nome da página). |
| `displayText` | string | Não | Texto de exibição (se diferente do alvo). |

**Resultado:** `[[target]]` ou `[[target|displayText]]`

### `video`

Inserir um elemento de vídeo HTML5.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `src` | string | Sim | Caminho ou URL do arquivo de vídeo. |
| `baseRevision` | string | Sim | Revisão do documento. |
| `title` | string | Não | Atributo de título. |
| `poster` | string | Não | Caminho ou URL da imagem de pôster. |

### `audio`

Inserir um elemento de áudio HTML5.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `src` | string | Sim | Caminho ou URL do arquivo de áudio. |
| `baseRevision` | string | Sim | Revisão do documento. |
| `title` | string | Não | Atributo de título. |

### `video_embed`

Inserir um embed de vídeo (iframe). Suporta YouTube (privacidade aprimorada), Vimeo e Bilibili.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `videoId` | string | Sim | ID do vídeo (YouTube: 11 chars, Vimeo: numérico, Bilibili: ID BV). |
| `baseRevision` | string | Sim | Revisão do documento. |
| `provider` | string | Não | `youtube` (padrão), `vimeo` ou `bilibili`. |

### `cjk_punctuation`

Converter pontuação entre meia largura e largura total.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `direction` | string | Sim | `to-fullwidth` ou `to-halfwidth`. |

### `cjk_spacing`

Adicionar ou remover espaçamento entre caracteres CJK e latinos.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `spacingAction` | string | Sim | `add` ou `remove`. |

---

## `suggestions`

Gerenciar sugestões de edição geradas por IA pendentes de aprovação do usuário. 5 ações.

Quando a IA usa `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace` ou `document` → `apply_diff` / `batch_edit`, as alterações são armazenadas como sugestões que requerem aprovação do usuário.

Todas as ações aceitam um parâmetro opcional `windowId`.

::: info Segurança de Desfazer/Refazer
As sugestões não modificam o documento até serem aceitas. Isso preserva a funcionalidade completa de desfazer/refazer — os usuários podem desfazer após aceitar, e rejeitar não deixa rastros no histórico.
:::

::: tip Modo de Aprovação Automática
Se **Aprovar edições automaticamente** estiver habilitado em Configurações → Integrações, as alterações são aplicadas diretamente sem criar sugestões. As ações abaixo só são necessárias quando a aprovação automática está desabilitada (o padrão).
:::

### `list`

Listar todas as sugestões pendentes.

**Retorna:** `{ suggestions: [...], count, focusedId }`

Cada sugestão inclui `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent` e `createdAt`.

### `accept`

Aceitar uma sugestão específica, aplicando suas alterações ao documento.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `suggestionId` | string | Sim | ID da sugestão a aceitar. |

### `reject`

Rejeitar uma sugestão específica, descartando-a sem alterações.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `suggestionId` | string | Sim | ID da sugestão a rejeitar. |

### `accept_all`

Aceitar todas as sugestões pendentes na ordem do documento.

### `reject_all`

Rejeitar todas as sugestões pendentes.

---

## Ferramentas de Protocolo

Duas ferramentas autônomas para consultar capacidades do servidor e estado do documento. Estas não usam o padrão composto `action`.

### `get_capabilities`

Obter as capacidades do servidor MCP e ferramentas disponíveis.

**Retorna:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

Obter a revisão atual do documento para bloqueio otimista.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `windowId` | string | Não | Identificador da janela. |

**Retorna:** `{ revision, lastUpdated }`

Use a revisão em ações de mutação para detectar edições concorrentes.

---

## Recursos MCP

Além das ferramentas, o VMark expõe estes recursos somente leitura:

| URI do Recurso | Descrição |
|----------------|-----------|
| `vmark://document/outline` | Hierarquia de títulos do documento |
| `vmark://document/metadata` | Metadados do documento (caminho, contagem de palavras, etc.) |
| `vmark://windows/list` | Lista de janelas abertas |
| `vmark://windows/focused` | Rótulo da janela atualmente em foco |
