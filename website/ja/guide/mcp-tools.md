# MCP ツールリファレンス

このページでは、Claude（または他の AI アシスタント）が VMark に接続する際に利用できるすべての MCP ツールを文書化します。

VMark は**コンポジットツール**、**プロトコルツール**、**リソース**のセットを公開しています — すべて以下に文書化されています。コンポジットツールは`action`パラメーターを使用して操作を選択します — これにより、すべての機能へのアクセスを保ちながらトークンのオーバーヘッドを削減します。

::: tip 推奨ワークフロー
ほとんどのライティングタスクでは、少数のアクションだけが必要です:

**理解:** `structure` → `get_digest`、`document` → `search`
**読み取り:** `structure` → `get_section`、`document` → `read_paragraph` / `get_content`
**書き込み:** `structure` → `update_section` / `insert_section`、`document` → `write_paragraph` / `smart_insert`
**制御:** `editor` → `undo` / `redo`、`suggestions` → `accept` / `reject`
**ファイル:** `workspace` → `save`、`tabs` → `switch` / `list`

残りのアクションは高度な自動化シナリオのための細かい制御を提供します。
:::

::: tip Mermaid ダイアグラム
MCP 経由で AI を使用して Mermaid ダイアグラムを生成する場合、[mermaid-validator MCP サーバー](/ja/guide/mermaid#mermaid-validator-mcp-server-syntax-checking)のインストールを検討してください — ダイアグラムがドキュメントに到達する前に、同じ Mermaid v11 パーサーを使用して構文エラーをキャッチします。
:::

---

## `document`

ドキュメントコンテンツの読み取り、書き込み、検索、変換。12 アクション。

すべてのアクションはオプションの`windowId`（string）パラメーターを受け付け、特定のウィンドウを対象にします。デフォルトはフォーカスされているウィンドウです。

### `get_content`

ドキュメントコンテンツ全体を Markdown テキストとして取得します。

### `set_content`

ドキュメントコンテンツ全体を置き換えます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `content` | string | はい | 新しいドキュメントコンテンツ（Markdown サポート）。 |

::: warning 空のドキュメントのみ
安全のため、このアクションは対象ドキュメントが**空**の場合のみ許可されます。空でないドキュメントには、代わりに`insert_at_cursor`、`apply_diff`、または`selection` → `replace`を使用してください — これらはユーザーの承認を必要とする提案を作成します。
:::

### `insert_at_cursor`

現在のカーソル位置にテキストを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `text` | string | はい | 挿入するテキスト（Markdown サポート）。 |

**返り値:** `{ message, position, suggestionId?, applied }`

::: tip 提案システム
デフォルトでは、このアクションはユーザーの承認を必要とする**提案**を作成します。テキストがゴーストテキストのプレビューとして表示されます。ユーザーは承認（Enter）または拒否（Escape）できます。設定 → 統合で**編集を自動承認**が有効の場合、変更は即座に適用されます。
:::

### `insert_at_position`

特定の文字位置にテキストを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `text` | string | はい | 挿入するテキスト（Markdown サポート）。 |
| `position` | number | はい | 文字位置（0 インデックス）。 |

**返り値:** `{ message, position, suggestionId?, applied }`

### `search`

ドキュメント内のテキストを検索します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `query` | string | はい | 検索するテキスト。 |
| `caseSensitive` | boolean | いいえ | 大文字小文字を区別した検索。デフォルト: false。 |

**返り値:** 位置と行番号を含むマッチの配列。

### `replace_in_source`

ProseMirror ノード境界をバイパスして、Markdown ソースレベルでテキストを置換します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `search` | string | はい | Markdown ソースで見つけるテキスト。 |
| `replace` | string | はい | 置換テキスト（Markdown サポート）。 |
| `all` | boolean | いいえ | すべての出現箇所を置換。デフォルト: false。 |

**返り値:** `{ count, message, suggestionIds?, applied }`

::: tip 使用するタイミング
まず`apply_diff`を使用してください — より速く、より正確です。検索テキストが書式設定の境界（太字、斜体、リンクなど）をまたいでいて、`apply_diff`が見つからない場合のみ`replace_in_source`にフォールバックしてください。
:::

### `batch_edit`

複数の操作をアトミックに適用します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `operations` | array | はい | 操作の配列（最大 100 件）。 |
| `baseRevision` | string | はい | 競合検出のための期待されるリビジョン。 |
| `requestId` | string | いいえ | 冪等性キー。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

各操作には`type`（`update`、`insert`、`delete`、`format`、または`move`）、`nodeId`、およびオプションで`text`/`content`が必要です。

**返り値:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

マッチポリシー制御付きでテキストを検索して置換します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `original` | string | はい | 見つけるテキスト。 |
| `replacement` | string | はい | 置換するテキスト。 |
| `baseRevision` | string | はい | 競合検出のための期待されるリビジョン。 |
| `matchPolicy` | string | いいえ | `first`、`all`、`nth`、または`error_if_multiple`。デフォルト: `first`。 |
| `nth` | number | いいえ | 置換するマッチの番号（0 インデックス、`nth`ポリシー用）。 |
| `scopeQuery` | object | いいえ | 検索を絞り込むスコープフィルター。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

**返り値:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

精密なターゲティングのためのコンテキストアンカリングを使用してテキストを置換します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `anchor` | object | はい | `{ text, beforeContext, afterContext }` |
| `replacement` | string | はい | 置換テキスト。 |
| `baseRevision` | string | はい | 競合検出のための期待されるリビジョン。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

### `read_paragraph`

インデックスまたはコンテンツマッチによってドキュメントから段落を読み取ります。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `target` | object | はい | `{ index: 0 }`または`{ containing: "text" }` |
| `includeContext` | boolean | いいえ | 周辺の段落を含める。デフォルト: false。 |

**返り値:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

ドキュメント内の段落を変更します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | 競合検出のためのドキュメントリビジョン。 |
| `target` | object | はい | `{ index: 0 }`または`{ containing: "text" }` |
| `operation` | string | はい | `replace`、`append`、`prepend`、または`delete`。 |
| `content` | string | 条件付き | 新しいコンテンツ（`delete`以外では必須）。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

**返り値:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

一般的なドキュメントの場所にコンテンツを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | 競合検出のためのドキュメントリビジョン。 |
| `destination` | varies | はい | 挿入先（下記参照）。 |
| `content` | string | はい | 挿入する Markdown コンテンツ。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

**宛先オプション:**
- `"end_of_document"` — 末尾に挿入
- `"start_of_document"` — 先頭に挿入
- `{ after_paragraph: 2 }` — インデックス 2 の段落の後に挿入
- `{ after_paragraph_containing: "conclusion" }` — テキストを含む段落の後に挿入
- `{ after_section: "Introduction" }` — セクション見出しの後に挿入

**返り値:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip 使用するタイミング
- **構造化されたドキュメント**（見出しあり）: `structure` → `get_section`、`update_section`、`insert_section`を使用
- **フラットなドキュメント**（見出しなし）: `document` → `read_paragraph`、`write_paragraph`、`smart_insert`を使用
- **ドキュメントの末尾**: `document` → `smart_insert`と`"end_of_document"`を使用
:::

---

## `structure`

ドキュメント構造クエリとセクション操作。8 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `get_ast`

ドキュメントの抽象構文木を取得します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `projection` | string[] | いいえ | 含めるフィールド: `id`、`type`、`text`、`attrs`、`marks`、`children`。 |
| `filter` | object | いいえ | `type`、`level`、`contains`、`hasMarks`でフィルタリング。 |
| `limit` | number | いいえ | 最大結果数。 |
| `offset` | number | いいえ | スキップ数。 |
| `afterCursor` | string | いいえ | カーソルページネーション用のノード ID。 |

**返り値:** ノードタイプ、位置、コンテンツを含む完全な AST。

### `get_digest`

ドキュメント構造のコンパクトなダイジェストを取得します。

**返り値:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

ドキュメント内のすべてのブロックをノード ID と共にリストします。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `query` | object | いいえ | `type`、`level`、`contains`、`hasMarks`でフィルタリング。 |
| `projection` | string[] | いいえ | 含めるフィールド。 |
| `limit` | number | いいえ | 最大結果数。 |
| `afterCursor` | string | いいえ | カーソルページネーション用のノード ID。 |

**返り値:** `{ revision, blocks[], hasMore, nextCursor? }`

ノード ID はプレフィックスを使用します: `h-0`（見出し）、`p-0`（段落）、`code-0`（コードブロック）など。

### `resolve_targets`

ミューテーションの事前チェック — クエリでノードを見つけます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `query` | object | はい | クエリ条件: `type`、`level`、`contains`、`hasMarks`。 |
| `maxResults` | number | いいえ | 最大候補数。 |

**返り値:** 解決されたターゲットの位置とタイプ。

### `get_section`

ドキュメントセクション（見出しと次の同じまたは高いレベルの見出しまでのコンテンツ）のコンテンツを取得します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `heading` | string \| object | はい | 見出しテキスト（string）または`{ level, index }`。 |
| `includeNested` | boolean | いいえ | サブセクションを含める。 |

**返り値:** 見出し、本文、位置を含むセクションコンテンツ。

### `update_section`

セクションのコンテンツを更新します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `target` | object | はい | `{ heading、byIndex、またはsectionId }` |
| `newContent` | string | はい | 新しいセクションコンテンツ（Markdown）。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

### `insert_section`

新しいセクションを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `after` | object | いいえ | 挿入後のセクションターゲット。 |
| `sectionHeading` | object | はい | `{ level, text }` — 見出しレベル（1-6）とテキスト。 |
| `content` | string | いいえ | セクション本文コンテンツ。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

### `move_section`

セクションを新しい場所に移動します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `section` | object | はい | 移動するセクション: `{ heading、byIndex、またはsectionId }`。 |
| `after` | object | いいえ | 移動後のセクションターゲット。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

---

## `selection`

テキスト選択とカーソルの読み取りと操作。5 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `get`

現在のテキスト選択を取得します。

**返り値:** `{ text, range: { from, to }, isEmpty }`

### `set`

選択範囲を設定します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `from` | number | はい | 開始位置（包含）。 |
| `to` | number | はい | 終了位置（除外）。 |

::: tip
テキストを選択せずにカーソルを配置するには、`from`と`to`に同じ値を使用します。
:::

### `replace`

選択されたテキストを新しいテキストで置き換えます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `text` | string | はい | 置換テキスト（Markdown サポート）。 |

**返り値:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip 提案システム
デフォルトでは、このアクションはユーザーの承認を必要とする**提案**を作成します。元のテキストには取り消し線が付き、新しいテキストがゴーストテキストとして表示されます。設定 → 統合で**編集を自動承認**が有効の場合、変更は即座に適用されます。
:::

### `get_context`

コンテキスト理解のためにカーソル周辺のテキストを取得します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `linesBefore` | number | いいえ | カーソル前の行数。デフォルト: 3。 |
| `linesAfter` | number | いいえ | カーソル後の行数。デフォルト: 3。 |

**返り値:** `{ before, after, currentLine, currentParagraph, block }`

`block`オブジェクトには以下が含まれます:

| フィールド | タイプ | 説明 |
|---------|------|-----|
| `type` | string | ブロックタイプ: `paragraph`、`heading`、`codeBlock`、`blockquote`など。 |
| `level` | number | 見出しレベル 1-6（見出しのみ） |
| `language` | string | コード言語（言語が設定されたコードブロックのみ） |
| `inList` | string | リスト内にある場合のリストタイプ: `bullet`、`ordered`、または`task` |
| `inBlockquote` | boolean | 引用ブロック内にある場合は`true` |
| `inTable` | boolean | テーブル内にある場合は`true` |
| `position` | number | ブロックが始まるドキュメント位置 |

### `set_cursor`

カーソル位置を設定します（選択をクリア）。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `position` | number | はい | 文字位置（0 インデックス）。 |

---

## `format`

テキスト書式設定、ブロックタイプ、リスト、リストバッチ操作。10 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `toggle`

現在の選択に書式設定マークを切り替えます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `mark` | string | はい | `bold`、`italic`、`code`、`strike`、`underline`、または`highlight` |

### `set_link`

選択されたテキストにハイパーリンクを作成します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `href` | string | はい | リンク URL。 |
| `title` | string | いいえ | リンクタイトル（ツールチップ）。 |

### `remove_link`

選択からハイパーリンクを削除します。追加パラメーターなし。

### `clear`

選択からすべての書式設定を削除します。追加パラメーターなし。

### `set_block_type`

現在のブロックを特定のタイプに変換します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `blockType` | string | はい | `paragraph`、`heading`、`codeBlock`、または`blockquote` |
| `level` | number | 条件付き | 見出しレベル 1-6（`heading`の場合は必須）。 |
| `language` | string | いいえ | コード言語（`codeBlock`用）。 |

### `insert_hr`

カーソルに水平線（`---`）を挿入します。追加パラメーターなし。

### `toggle_list`

現在のブロックのリストタイプを切り替えます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `listType` | string | はい | `bullet`、`ordered`、または`task` |

### `indent_list`

現在のリストアイテムのインデントを増やします。追加パラメーターなし。

### `outdent_list`

現在のリストアイテムのインデントを減らします。追加パラメーターなし。

### `list_modify`

リストの構造とコンテンツをバッチ変更します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `target` | object | はい | `{ listId }`、`{ selector }`、または`{ listIndex }` |
| `operations` | array | はい | リスト操作の配列。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

操作: `add_item`、`delete_item`、`update_item`、`toggle_check`、`reorder`、`set_indent`

---

## `table`

テーブル操作。3 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `insert`

カーソルに新しいテーブルを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `rows` | number | はい | 行数（最低 1 以上）。 |
| `cols` | number | はい | 列数（最低 1 以上）。 |
| `withHeaderRow` | boolean | いいえ | ヘッダー行を含めるかどうか。デフォルト: true。 |

### `delete`

カーソル位置のテーブルを削除します。追加パラメーターなし。

### `modify`

テーブルの構造とコンテンツをバッチ変更します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `target` | object | はい | `{ tableId }`、`{ afterHeading }`、または`{ tableIndex }` |
| `operations` | array | はい | テーブル操作の配列。 |
| `mode` | string | いいえ | 適用せずにプレビューするための`dryRun`。適用 vs 提案はユーザー設定で制御されます。 |

操作: `add_row`、`delete_row`、`add_column`、`delete_column`、`update_cell`、`set_header`

---

## `editor`

エディタ状態操作。3 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `undo`

最後の編集アクションを元に戻します。

### `redo`

最後に元に戻したアクションをやり直します。

### `focus`

エディタにフォーカスします（前面に表示し、入力を受け付ける状態にします）。

---

## `workspace`

ドキュメント、ウィンドウ、ワークスペース状態の管理。12 アクション。

特定のウィンドウで動作するアクションはオプションの`windowId`パラメーターを受け付けます。

### `list_windows`

開いているすべての VMark ウィンドウをリストします。

**返り値:** `{ label, title, filePath, isFocused, isAiExposed }`の配列

### `get_focused`

フォーカスされているウィンドウのラベルを取得します。

### `focus_window`

特定のウィンドウにフォーカスします。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `windowId` | string | はい | フォーカスするウィンドウラベル。 |

### `new_document`

新しい空のドキュメントを作成します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `title` | string | いいえ | オプションのドキュメントタイトル。 |

### `open_document`

ファイルシステムからドキュメントを開きます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `path` | string | はい | 開くファイルパス。 |

### `save`

現在のドキュメントを保存します。

### `save_as`

ドキュメントを新しいパスに保存します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `path` | string | はい | 新しいファイルパス。 |

### `get_document_info`

ドキュメントのメタデータを取得します。

**返り値:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

ウィンドウを閉じます。

### `list_recent_files`

最近開いたファイルをリストします。

**返り値:** `{ path, name, timestamp }`の配列（最大 10 件、最新順）。

### `get_info`

現在のワークスペース状態に関する情報を取得します。

**返り値:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

ディスクからアクティブなドキュメントを再読み込みします。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `force` | boolean | いいえ | 未保存の変更があっても強制的に再読み込み。デフォルト: false。 |

ドキュメントが無題または`force: true`なしで未保存の変更がある場合は失敗します。

---

## `tabs`

ウィンドウ内のエディタタブの管理。6 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `list`

ウィンドウ内のすべてのタブをリストします。

**返り値:** `{ id, title, filePath, isDirty, isActive }`の配列

### `switch`

特定のタブに切り替えます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `tabId` | string | はい | 切り替え先のタブ ID。 |

### `close`

タブを閉じます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `tabId` | string | いいえ | 閉じるタブ ID。デフォルトはアクティブなタブ。 |

### `create`

新しい空のタブを作成します。

**返り値:** `{ tabId }`

### `get_info`

詳細なタブ情報を取得します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `tabId` | string | いいえ | タブ ID。デフォルトはアクティブなタブ。 |

**返り値:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

最近閉じたタブを再度開きます。

**返り値:** `{ tabId, filePath, title }`、または利用可能なものがない場合はメッセージ。

VMark はウィンドウごとに最後に閉じた 10 個のタブを追跡します。

---

## `media`

数式、ダイアグラム、メディア、Wiki リンク、CJK 書式設定の挿入。11 アクション。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

### `math_inline`

インライン LaTeX 数式を挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `latex` | string | はい | LaTeX 式（例: `E = mc^2`）。 |

### `math_block`

ブロックレベルの数式を挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `latex` | string | はい | LaTeX 式。 |

### `mermaid`

Mermaid ダイアグラムを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `code` | string | はい | Mermaid ダイアグラムコード。 |

### `markmap`

Markmap マインドマップを挿入します。標準の Markdown 見出しを使用してツリーを定義します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `code` | string | はい | マインドマップツリーを定義する見出し付きの Markdown。 |

### `svg`

SVG グラフィックを挿入します。SVG はパン、ズーム、PNG エクスポート付きでインラインにレンダリングされます。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `code` | string | はい | SVG マークアップ（`<svg>`ルートを持つ有効な XML）。 |

### `wiki_link`

Wiki スタイルのリンクを挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `target` | string | はい | リンクターゲット（ページ名）。 |
| `displayText` | string | いいえ | 表示テキスト（ターゲットと異なる場合）。 |

**結果:** `[[target]]`または`[[target|displayText]]`

### `video`

HTML5 ビデオ要素を挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `src` | string | はい | ビデオファイルパスまたは URL。 |
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `title` | string | いいえ | title 属性。 |
| `poster` | string | いいえ | ポスター画像パスまたは URL。 |

### `audio`

HTML5 オーディオ要素を挿入します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `src` | string | はい | オーディオファイルパスまたは URL。 |
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `title` | string | いいえ | title 属性。 |

### `video_embed`

ビデオ埋め込み（iframe）を挿入します。YouTube（プライバシー強化）、Vimeo、Bilibili をサポートします。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `videoId` | string | はい | ビデオ ID（YouTube: 11 文字、Vimeo: 数値、Bilibili: BV ID）。 |
| `baseRevision` | string | はい | ドキュメントリビジョン。 |
| `provider` | string | いいえ | `youtube`（デフォルト）、`vimeo`、または`bilibili`。 |

### `cjk_punctuation`

半角と全角の句読点を変換します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `direction` | string | はい | `to-fullwidth`または`to-halfwidth`。 |

### `cjk_spacing`

CJK とラテン文字の間にスペースを追加または削除します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `spacingAction` | string | はい | `add`または`remove`。 |

---

## `suggestions`

ユーザー承認待ちの AI 生成編集提案の管理。5 アクション。

AI が`document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`、`selection` → `replace`、または`document` → `apply_diff` / `batch_edit`を使用すると、変更はユーザーの承認を必要とする提案としてステージングされます。

すべてのアクションはオプションの`windowId`パラメーターを受け付けます。

::: info 元に戻す/やり直しの安全性
提案は承認されるまでドキュメントを変更しません。これにより完全な元に戻す/やり直し機能が保持されます — ユーザーは承認後に元に戻すことができ、拒否しても履歴に何も残りません。
:::

::: tip 自動承認モード
設定 → 統合で**編集を自動承認**が有効の場合、変更は提案を作成せずに直接適用されます。以下のアクションは自動承認が無効（デフォルト）の場合にのみ必要です。
:::

### `list`

すべての保留中の提案をリストします。

**返り値:** `{ suggestions: [...], count, focusedId }`

各提案には`id`、`type`（`insert`、`replace`、`delete`）、`from`、`to`、`newContent`、`originalContent`、`createdAt`が含まれます。

### `accept`

特定の提案を承認し、変更をドキュメントに適用します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `suggestionId` | string | はい | 承認する提案の ID。 |

### `reject`

特定の提案を拒否し、変更なしで破棄します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `suggestionId` | string | はい | 拒否する提案の ID。 |

### `accept_all`

ドキュメント順にすべての保留中の提案を承認します。

### `reject_all`

すべての保留中の提案を拒否します。

---

## プロトコルツール

サーバー機能とドキュメント状態を照会するための 2 つのスタンドアロンツール。これらはコンポジットの`action`パターンを使用しません。

### `get_capabilities`

MCP サーバーの機能と利用可能なツールを取得します。

**返り値:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

楽観的ロックのための現在のドキュメントリビジョンを取得します。

| パラメーター | タイプ | 必須 | 説明 |
|-----------|------|------|-----|
| `windowId` | string | いいえ | ウィンドウ識別子。 |

**返り値:** `{ revision, lastUpdated }`

ミューテーションアクションでリビジョンを使用して同時編集を検出します。

---

## MCP リソース

ツールに加えて、VMark はこれらの読み取り専用リソースを公開します:

| リソース URI | 説明 |
|-----------|-----|
| `vmark://document/outline` | ドキュメント見出し階層 |
| `vmark://document/metadata` | ドキュメントメタデータ（パス、単語数など） |
| `vmark://windows/list` | 開いているウィンドウのリスト |
| `vmark://windows/focused` | 現在フォーカスされているウィンドウラベル |
