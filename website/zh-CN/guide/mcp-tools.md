# MCP 工具参考

本页面记录了 Claude（或其他 AI 助手）连接 VMark 时可用的所有 MCP 工具。

VMark 暴露了一组**复合工具**、**协议工具**和**资源**——全部记录如下。复合工具使用 `action` 参数选择操作——这减少了 token 开销，同时保持所有功能可访问。

::: tip 推荐工作流
对于大多数写作任务，你只需要少量操作：

**了解：** `structure` → `get_digest`，`document` → `search`
**读取：** `structure` → `get_section`，`document` → `read_paragraph` / `get_content`
**写入：** `structure` → `update_section` / `insert_section`，`document` → `write_paragraph` / `smart_insert`
**控制：** `editor` → `undo` / `redo`，`suggestions` → `accept` / `reject`
**文件：** `workspace` → `save`，`tabs` → `switch` / `list`

其余操作提供针对高级自动化场景的精细控制。
:::

::: tip Mermaid 图表
通过 MCP 使用 AI 生成 Mermaid 图表时，考虑安装 [mermaid-validator MCP 服务器](/zh-CN/guide/mermaid#mermaid-验证器-mcp-服务器语法检查)——它在图表进入你的文档之前使用相同的 Mermaid v11 解析器捕获语法错误。
:::

---

## `document`

读取、写入、搜索和转换文档内容。12 个操作。

所有操作接受可选的 `windowId`（字符串）参数以指定目标窗口，默认为当前聚焦窗口。

### `get_content`

获取完整文档内容（Markdown 文本）。

### `set_content`

替换整个文档内容。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `content` | string | 是 | 新文档内容（支持 Markdown）。 |

::: warning 仅限空文档
为安全起见，此操作只允许在目标文档**为空**时使用。对于非空文档，请使用 `insert_at_cursor`、`apply_diff` 或 `selection` → `replace`——这些操作会创建需要用户批准的建议。
:::

### `insert_at_cursor`

在当前光标位置插入文本。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `text` | string | 是 | 要插入的文本（支持 Markdown）。 |

**返回：** `{ message, position, suggestionId?, applied }`

::: tip 建议系统
默认情况下，此操作会创建需要用户批准的**建议**。文本以幽灵文字预览形式出现。用户可以接受（Enter）或拒绝（Escape）。如果在设置 → 集成中启用了**自动批准编辑**，更改会立即应用。
:::

### `insert_at_position`

在指定字符位置插入文本。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `text` | string | 是 | 要插入的文本（支持 Markdown）。 |
| `position` | number | 是 | 字符位置（从 0 开始）。 |

**返回：** `{ message, position, suggestionId?, applied }`

### `search`

在文档中搜索文本。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `query` | string | 是 | 要搜索的文本。 |
| `caseSensitive` | boolean | 否 | 区分大小写搜索。默认：false。 |

**返回：** 包含位置和行号的匹配数组。

### `replace_in_source`

在 Markdown 源码层面替换文本，绕过 ProseMirror 节点边界。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `search` | string | 是 | 在 Markdown 源码中查找的文本。 |
| `replace` | string | 是 | 替换文本（支持 Markdown）。 |
| `all` | boolean | 否 | 替换所有出现位置。默认：false。 |

**返回：** `{ count, message, suggestionIds?, applied }`

::: tip 何时使用
优先使用 `apply_diff`——它更快更精确。只有当搜索文本跨越格式边界（粗体、斜体、链接等）且 `apply_diff` 无法找到时，才回退到 `replace_in_source`。
:::

### `batch_edit`

原子性地应用多个操作。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `operations` | array | 是 | 操作数组（最多 100 个）。 |
| `baseRevision` | string | 是 | 用于冲突检测的预期版本。 |
| `requestId` | string | 否 | 幂等键。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

每个操作需要 `type`（`update`、`insert`、`delete`、`format` 或 `move`）、`nodeId`，以及可选的 `text`/`content`。

**返回：** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

使用匹配策略控制查找并替换文本。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `original` | string | 是 | 要查找的文本。 |
| `replacement` | string | 是 | 替换文本。 |
| `baseRevision` | string | 是 | 用于冲突检测的预期版本。 |
| `matchPolicy` | string | 否 | `first`、`all`、`nth` 或 `error_if_multiple`。默认：`first`。 |
| `nth` | number | 否 | 要替换的第几个匹配（从 0 开始，用于 `nth` 策略）。 |
| `scopeQuery` | object | 否 | 缩小搜索范围的过滤器。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

**返回：** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

使用上下文锚定精确替换文本。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `anchor` | object | 是 | `{ text, beforeContext, afterContext }` |
| `replacement` | string | 是 | 替换文本。 |
| `baseRevision` | string | 是 | 用于冲突检测的预期版本。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

### `read_paragraph`

按索引或内容匹配读取文档中的段落。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `target` | object | 是 | `{ index: 0 }` 或 `{ containing: "text" }` |
| `includeContext` | boolean | 否 | 包含周围段落。默认：false。 |

**返回：** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

修改文档中的段落。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 用于冲突检测的文档版本。 |
| `target` | object | 是 | `{ index: 0 }` 或 `{ containing: "text" }` |
| `operation` | string | 是 | `replace`、`append`、`prepend` 或 `delete`。 |
| `content` | string | 条件 | 新内容（`delete` 以外的操作都需要）。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

**返回：** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

在文档常见位置插入内容。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 用于冲突检测的文档版本。 |
| `destination` | 多种 | 是 | 插入位置（见下文）。 |
| `content` | string | 是 | 要插入的 Markdown 内容。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

**目标选项：**
- `"end_of_document"` — 在末尾插入
- `"start_of_document"` — 在开头插入
- `{ after_paragraph: 2 }` — 在索引为 2 的段落之后插入
- `{ after_paragraph_containing: "conclusion" }` — 在包含文本的段落之后插入
- `{ after_section: "Introduction" }` — 在指定章节标题之后插入

**返回：** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip 何时使用
- **结构化文档**（带标题）：使用 `structure` → `get_section`、`update_section`、`insert_section`
- **平面文档**（无标题）：使用 `document` → `read_paragraph`、`write_paragraph`、`smart_insert`
- **文档末尾**：使用 `document` → `smart_insert`，目标为 `"end_of_document"`
:::

---

## `structure`

文档结构查询和章节操作。8 个操作。

所有操作接受可选的 `windowId` 参数。

### `get_ast`

获取文档的抽象语法树。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `projection` | string[] | 否 | 要包含的字段：`id`、`type`、`text`、`attrs`、`marks`、`children`。 |
| `filter` | object | 否 | 按 `type`、`level`、`contains`、`hasMarks` 过滤。 |
| `limit` | number | 否 | 最大结果数。 |
| `offset` | number | 否 | 跳过数量。 |
| `afterCursor` | string | 否 | 用于游标分页的节点 ID。 |

**返回：** 包含节点类型、位置和内容的完整 AST。

### `get_digest`

获取文档结构的紧凑摘要。

**返回：** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

列出文档中所有块及其节点 ID。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `query` | object | 否 | 按 `type`、`level`、`contains`、`hasMarks` 过滤。 |
| `projection` | string[] | 否 | 要包含的字段。 |
| `limit` | number | 否 | 最大结果数。 |
| `afterCursor` | string | 否 | 用于游标分页的节点 ID。 |

**返回：** `{ revision, blocks[], hasMore, nextCursor? }`

节点 ID 使用前缀：`h-0`（标题）、`p-0`（段落）、`code-0`（代码块）等。

### `resolve_targets`

变更的预检——按查询查找节点。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `query` | object | 是 | 查询条件：`type`、`level`、`contains`、`hasMarks`。 |
| `maxResults` | number | 否 | 最大候选数。 |

**返回：** 解析后的目标位置和类型。

### `get_section`

获取文档章节的内容（标题及其内容，直到下一个同级或更高级标题）。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `heading` | string \| object | 是 | 标题文本（字符串）或 `{ level, index }`。 |
| `includeNested` | boolean | 否 | 包含子章节。 |

**返回：** 包含标题、正文和位置的章节内容。

### `update_section`

更新章节内容。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文档版本。 |
| `target` | object | 是 | `{ heading, byIndex 或 sectionId }` |
| `newContent` | string | 是 | 新章节内容（Markdown）。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

### `insert_section`

插入新章节。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文档版本。 |
| `after` | object | 否 | 插入其后的章节目标。 |
| `sectionHeading` | object | 是 | `{ level, text }` — 标题级别（1-6）和文本。 |
| `content` | string | 否 | 章节正文内容。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

### `move_section`

将章节移动到新位置。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文档版本。 |
| `section` | object | 是 | 要移动的章节：`{ heading, byIndex 或 sectionId }`。 |
| `after` | object | 否 | 移动到其后的章节目标。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

---

## `selection`

读取和操作文本选区与光标。5 个操作。

所有操作接受可选的 `windowId` 参数。

### `get`

获取当前文本选区。

**返回：** `{ text, range: { from, to }, isEmpty }`

### `set`

设置选区范围。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `from` | number | 是 | 起始位置（包含）。 |
| `to` | number | 是 | 结束位置（不包含）。 |

::: tip
将 `from` 和 `to` 设为相同值可在不选择文本的情况下定位光标。
:::

### `replace`

用新文本替换选中文本。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `text` | string | 是 | 替换文本（支持 Markdown）。 |

**返回：** `{ message, range, originalContent, suggestionId?, applied }`

::: tip 建议系统
默认情况下，此操作会创建需要用户批准的**建议**。原文显示删除线，新文本以幽灵文字显示。如果在设置 → 集成中启用了**自动批准编辑**，更改会立即应用。
:::

### `get_context`

获取光标周围的文本以了解上下文。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `linesBefore` | number | 否 | 光标前的行数。默认：3。 |
| `linesAfter` | number | 否 | 光标后的行数。默认：3。 |

**返回：** `{ before, after, currentLine, currentParagraph, block }`

`block` 对象包含：

| 字段 | 类型 | 描述 |
|------|------|------|
| `type` | string | 块类型：`paragraph`、`heading`、`codeBlock`、`blockquote` 等 |
| `level` | number | 标题级别 1-6（仅限标题） |
| `language` | string | 代码语言（仅限设置了语言的代码块） |
| `inList` | string | 如果在列表内，列表类型：`bullet`、`ordered` 或 `task` |
| `inBlockquote` | boolean | 如果在引用块内，则为 `true` |
| `inTable` | boolean | 如果在表格内，则为 `true` |
| `position` | number | 块开始的文档位置 |

### `set_cursor`

设置光标位置（清除选区）。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `position` | number | 是 | 字符位置（从 0 开始）。 |

---

## `format`

文本格式化、块类型、列表和列表批量操作。10 个操作。

所有操作接受可选的 `windowId` 参数。

### `toggle`

在当前选区切换格式标记。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `mark` | string | 是 | `bold`、`italic`、`code`、`strike`、`underline` 或 `highlight` |

### `set_link`

在选中文本上创建超链接。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `href` | string | 是 | 链接 URL。 |
| `title` | string | 否 | 链接标题（工具提示）。 |

### `remove_link`

移除选区中的超链接。无其他参数。

### `clear`

移除选区中的所有格式。无其他参数。

### `set_block_type`

将当前块转换为指定类型。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `blockType` | string | 是 | `paragraph`、`heading`、`codeBlock` 或 `blockquote` |
| `level` | number | 条件 | 标题级别 1-6（`heading` 必需）。 |
| `language` | string | 否 | 代码语言（用于 `codeBlock`）。 |

### `insert_hr`

在光标处插入水平线（`---`）。无其他参数。

### `toggle_list`

在当前块切换列表类型。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `listType` | string | 是 | `bullet`、`ordered` 或 `task` |

### `indent_list`

增加当前列表项的缩进。无其他参数。

### `outdent_list`

减少当前列表项的缩进。无其他参数。

### `list_modify`

批量修改列表的结构和内容。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文档版本。 |
| `target` | object | 是 | `{ listId }`、`{ selector }` 或 `{ listIndex }` |
| `operations` | array | 是 | 列表操作数组。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

操作：`add_item`、`delete_item`、`update_item`、`toggle_check`、`reorder`、`set_indent`

---

## `table`

表格操作。3 个操作。

所有操作接受可选的 `windowId` 参数。

### `insert`

在光标处插入新表格。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `rows` | number | 是 | 行数（至少 1）。 |
| `cols` | number | 是 | 列数（至少 1）。 |
| `withHeaderRow` | boolean | 否 | 是否包含标题行。默认：true。 |

### `delete`

删除光标位置处的表格。无其他参数。

### `modify`

批量修改表格的结构和内容。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文档版本。 |
| `target` | object | 是 | `{ tableId }`、`{ afterHeading }` 或 `{ tableIndex }` |
| `operations` | array | 是 | 表格操作数组。 |
| `mode` | string | 否 | `dryRun` 可在不应用的情况下预览。应用与建议由用户设置控制。 |

操作：`add_row`、`delete_row`、`add_column`、`delete_column`、`update_cell`、`set_header`

---

## `editor`

编辑器状态操作。3 个操作。

所有操作接受可选的 `windowId` 参数。

### `undo`

撤销上一次编辑操作。

### `redo`

重做上一次撤销的操作。

### `focus`

聚焦编辑器（将其置于前台，准备接受输入）。

---

## `workspace`

管理文档、窗口和工作区状态。12 个操作。

对特定窗口操作的操作接受可选的 `windowId` 参数。

### `list_windows`

列出所有已打开的 VMark 窗口。

**返回：** `{ label, title, filePath, isFocused, isAiExposed }` 数组

### `get_focused`

获取当前聚焦窗口的标签。

### `focus_window`

聚焦指定窗口。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `windowId` | string | 是 | 要聚焦的窗口标签。 |

### `new_document`

创建新的空文档。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `title` | string | 否 | 可选文档标题。 |

### `open_document`

从文件系统打开文档。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `path` | string | 是 | 要打开的文件路径。 |

### `save`

保存当前文档。

### `save_as`

将文档保存到新路径。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `path` | string | 是 | 新文件路径。 |

### `get_document_info`

获取文档元数据。

**返回：** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

关闭窗口。

### `list_recent_files`

列出最近打开的文件。

**返回：** `{ path, name, timestamp }` 数组（最多 10 个文件，最新的在前）。

### `get_info`

获取当前工作区状态信息。

**返回：** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

从磁盘重新加载活跃文档。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `force` | boolean | 否 | 即使文档有未保存的更改也强制重新加载。默认：false。 |

如果文档未命名或有未保存的更改且未设置 `force: true`，则操作失败。

---

## `tabs`

管理窗口内的编辑器标签页。6 个操作。

所有操作接受可选的 `windowId` 参数。

### `list`

列出窗口中所有标签页。

**返回：** `{ id, title, filePath, isDirty, isActive }` 数组

### `switch`

切换到指定标签页。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `tabId` | string | 是 | 要切换到的标签页 ID。 |

### `close`

关闭标签页。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `tabId` | string | 否 | 要关闭的标签页 ID。默认为活跃标签页。 |

### `create`

创建新的空标签页。

**返回：** `{ tabId }`

### `get_info`

获取详细的标签页信息。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `tabId` | string | 否 | 标签页 ID。默认为活跃标签页。 |

**返回：** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

重新打开最近关闭的标签页。

**返回：** `{ tabId, filePath, title }` 或无可用标签页时的提示信息。

VMark 每个窗口记录最近关闭的 10 个标签页。

---

## `media`

插入数学公式、图表、媒体、wiki 链接和中日韩格式化。11 个操作。

所有操作接受可选的 `windowId` 参数。

### `math_inline`

插入内联 LaTeX 数学公式。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `latex` | string | 是 | LaTeX 表达式（例如 `E = mc^2`）。 |

### `math_block`

插入块级数学公式。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `latex` | string | 是 | LaTeX 表达式。 |

### `mermaid`

插入 Mermaid 图表。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `code` | string | 是 | Mermaid 图表代码。 |

### `markmap`

插入 Markmap 思维导图。使用标准 Markdown 标题定义树形结构。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `code` | string | 是 | 包含定义思维导图树的标题的 Markdown。 |

### `svg`

插入 SVG 图形。SVG 内联渲染，支持平移、缩放和 PNG 导出。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `code` | string | 是 | SVG 标记（带 `<svg>` 根的有效 XML）。 |

### `wiki_link`

插入 wiki 风格链接。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `target` | string | 是 | 链接目标（页面名称）。 |
| `displayText` | string | 否 | 显示文本（如果与目标不同）。 |

**结果：** `[[target]]` 或 `[[target|displayText]]`

### `video`

插入 HTML5 视频元素。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `src` | string | 是 | 视频文件路径或 URL。 |
| `baseRevision` | string | 是 | 文档版本。 |
| `title` | string | 否 | title 属性。 |
| `poster` | string | 否 | 封面图路径或 URL。 |

### `audio`

插入 HTML5 音频元素。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `src` | string | 是 | 音频文件路径或 URL。 |
| `baseRevision` | string | 是 | 文档版本。 |
| `title` | string | 否 | title 属性。 |

### `video_embed`

插入视频嵌入（iframe）。支持 YouTube（隐私增强型）、Vimeo 和 Bilibili。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `videoId` | string | 是 | 视频 ID（YouTube：11 字符；Vimeo：数字；Bilibili：BV ID）。 |
| `baseRevision` | string | 是 | 文档版本。 |
| `provider` | string | 否 | `youtube`（默认）、`vimeo` 或 `bilibili`。 |

### `cjk_punctuation`

在半角和全角之间转换标点。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `direction` | string | 是 | `to-fullwidth` 或 `to-halfwidth`。 |

### `cjk_spacing`

在中日韩字符和拉丁字符之间添加或移除间距。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `spacingAction` | string | 是 | `add` 或 `remove`。 |

---

## `suggestions`

管理待用户批准的 AI 生成编辑建议。5 个操作。

当 AI 使用 `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`、`selection` → `replace` 或 `document` → `apply_diff` / `batch_edit` 时，更改会作为需要用户批准的建议暂存。

所有操作接受可选的 `windowId` 参数。

::: info 撤销/重做安全
建议在被接受之前不会修改文档。这保留了完整的撤销/重做功能——用户可以在接受后撤销，拒绝时不会在历史记录中留下任何痕迹。
:::

::: tip 自动批准模式
如果在设置 → 集成中启用了**自动批准编辑**，更改会直接应用，不会创建建议。下面的操作只在自动批准禁用时（默认）才需要。
:::

### `list`

列出所有待处理的建议。

**返回：** `{ suggestions: [...], count, focusedId }`

每条建议包含 `id`、`type`（`insert`、`replace`、`delete`）、`from`、`to`、`newContent`、`originalContent` 和 `createdAt`。

### `accept`

接受指定建议，将其更改应用到文档。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `suggestionId` | string | 是 | 要接受的建议 ID。 |

### `reject`

拒绝指定建议，丢弃而不应用更改。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `suggestionId` | string | 是 | 要拒绝的建议 ID。 |

### `accept_all`

按文档顺序接受所有待处理的建议。

### `reject_all`

拒绝所有待处理的建议。

---

## 协议工具

两个用于查询服务器功能和文档状态的独立工具。这些工具不使用复合 `action` 模式。

### `get_capabilities`

获取 MCP 服务器的功能和可用工具。

**返回：** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

获取当前文档版本（用于乐观锁）。

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `windowId` | string | 否 | 窗口标识符。 |

**返回：** `{ revision, lastUpdated }`

在变更操作中使用版本号来检测并发编辑。

---

## MCP 资源

除工具外，VMark 还暴露以下只读资源：

| 资源 URI | 描述 |
|----------|------|
| `vmark://document/outline` | 文档标题层级结构 |
| `vmark://document/metadata` | 文档元数据（路径、字数等） |
| `vmark://windows/list` | 已打开窗口列表 |
| `vmark://windows/focused` | 当前聚焦窗口标签 |
