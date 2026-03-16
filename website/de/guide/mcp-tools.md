# MCP-Werkzeuge-Referenz

Diese Seite dokumentiert alle MCP-Werkzeuge, die verfügbar sind, wenn Claude (oder andere KI-Assistenten) sich mit VMark verbinden.

VMark stellt eine Reihe von **zusammengesetzten Werkzeugen**, **Protokollwerkzeugen** und **Ressourcen** bereit — alle nachfolgend dokumentiert. Zusammengesetzte Werkzeuge verwenden einen `action`-Parameter zur Auswahl der Operation — dies reduziert den Token-Overhead und hält alle Fähigkeiten zugänglich.

::: tip Empfohlener Arbeitsablauf
Für die meisten Schreibaufgaben benötigen Sie nur eine Handvoll Aktionen:

**Verstehen:** `structure` → `get_digest`, `document` → `search`
**Lesen:** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**Schreiben:** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**Steuern:** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**Dateien:** `workspace` → `save`, `tabs` → `switch` / `list`

Die übrigen Aktionen bieten feinkörnige Kontrolle für fortgeschrittene Automatisierungsszenarien.
:::

::: tip Mermaid-Diagramme
Wenn Sie KI zur Generierung von Mermaid-Diagrammen über MCP verwenden, erwägen Sie die Installation des [mermaid-validator MCP-Servers](/de/guide/mermaid#mermaid-validator-mcp-server-syntaxpr%C3%BCfung) — er erkennt Syntaxfehler mit denselben Mermaid v11-Parsern, bevor Diagramme in Ihr Dokument gelangen.
:::

---

## `document`

Dokumentinhalt lesen, schreiben, suchen und transformieren. 12 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter (String), um ein bestimmtes Fenster anzusprechen. Standard ist das fokussierte Fenster.

### `get_content`

Den vollständigen Dokumentinhalt als Markdown-Text abrufen.

### `set_content`

Den gesamten Dokumentinhalt ersetzen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `content` | string | Ja | Neuer Dokumentinhalt (Markdown unterstützt). |

::: warning Nur leere Dokumente
Aus Sicherheitsgründen ist diese Aktion nur erlaubt, wenn das Zieldokument **leer** ist. Verwenden Sie für nicht-leere Dokumente stattdessen `insert_at_cursor`, `apply_diff` oder `selection` → `replace` — diese erstellen Vorschläge, die die Genehmigung des Benutzers erfordern.
:::

### `insert_at_cursor`

Text an der aktuellen Cursorposition einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `text` | string | Ja | Einzufügender Text (Markdown unterstützt). |

**Gibt zurück:** `{ message, position, suggestionId?, applied }`

::: tip Vorschlagssystem
Standardmäßig erstellt diese Aktion einen **Vorschlag**, der die Genehmigung des Benutzers erfordert. Der Text erscheint als Ghost-Text-Vorschau. Benutzer können annehmen (Eingabe) oder ablehnen (Escape). Wenn **Bearbeitungen automatisch genehmigen** in Einstellungen → Integrationen aktiviert ist, werden Änderungen sofort angewendet.
:::

### `insert_at_position`

Text an einer bestimmten Zeichenposition einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `text` | string | Ja | Einzufügender Text (Markdown unterstützt). |
| `position` | number | Ja | Zeichenposition (0-indiziert). |

**Gibt zurück:** `{ message, position, suggestionId?, applied }`

### `search`

Nach Text im Dokument suchen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `query` | string | Ja | Zu suchender Text. |
| `caseSensitive` | boolean | Nein | Groß-/Kleinschreibung beachten. Standard: false. |

**Gibt zurück:** Array von Übereinstimmungen mit Positionen und Zeilennummern.

### `replace_in_source`

Text auf Markdown-Quellebene ersetzen und dabei ProseMirror-Knotengrenzen umgehen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `search` | string | Ja | Zu suchender Text in der Markdown-Quelle. |
| `replace` | string | Ja | Ersetzungstext (Markdown unterstützt). |
| `all` | boolean | Nein | Alle Vorkommen ersetzen. Standard: false. |

**Gibt zurück:** `{ count, message, suggestionIds?, applied }`

::: tip Wann verwenden
Verwenden Sie zunächst `apply_diff` — es ist schneller und präziser. Weichen Sie auf `replace_in_source` nur aus, wenn der Suchtext Formatierungsgrenzen überschreitet (fett, kursiv, Links usw.) und `apply_diff` ihn nicht finden kann.
:::

### `batch_edit`

Mehrere Operationen atomar anwenden.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `operations` | array | Ja | Array von Operationen (max. 100). |
| `baseRevision` | string | Ja | Erwartete Revision zur Konflikterkennung. |
| `requestId` | string | Nein | Idempotenzschlüssel. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. Anwenden vs. Vorschlagen wird durch Benutzereinstellung gesteuert. |

Jede Operation erfordert `type` (`update`, `insert`, `delete`, `format` oder `move`), `nodeId` und optional `text`/`content`.

**Gibt zurück:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

Text mit Übereinstimmungsrichtlinien-Kontrolle suchen und ersetzen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `original` | string | Ja | Zu suchender Text. |
| `replacement` | string | Ja | Ersetzungstext. |
| `baseRevision` | string | Ja | Erwartete Revision zur Konflikterkennung. |
| `matchPolicy` | string | Nein | `first`, `all`, `nth` oder `error_if_multiple`. Standard: `first`. |
| `nth` | number | Nein | Welche Übereinstimmung ersetzen (0-indiziert, für `nth`-Richtlinie). |
| `scopeQuery` | object | Nein | Bereichsfilter zur Einschränkung der Suche. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

**Gibt zurück:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

Text mit Kontextverankerung für präzises Targeting ersetzen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `anchor` | object | Ja | `{ text, beforeContext, afterContext }` |
| `replacement` | string | Ja | Ersetzungstext. |
| `baseRevision` | string | Ja | Erwartete Revision zur Konflikterkennung. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

### `read_paragraph`

Einen Absatz aus dem Dokument nach Index oder Inhaltsübereinstimmung lesen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `target` | object | Ja | `{ index: 0 }` oder `{ containing: "text" }` |
| `includeContext` | boolean | Nein | Umgebende Absätze einschließen. Standard: false. |

**Gibt zurück:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

Einen Absatz im Dokument ändern.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision zur Konflikterkennung. |
| `target` | object | Ja | `{ index: 0 }` oder `{ containing: "text" }` |
| `operation` | string | Ja | `replace`, `append`, `prepend` oder `delete`. |
| `content` | string | Bedingt | Neuer Inhalt (außer bei `delete` erforderlich). |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

**Gibt zurück:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

Inhalt an häufigen Dokumentspeicherorten einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision zur Konflikterkennung. |
| `destination` | variiert | Ja | Einfügeort (siehe unten). |
| `content` | string | Ja | Einzufügender Markdown-Inhalt. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

**Zieloptionen:**
- `"end_of_document"` — Am Ende einfügen
- `"start_of_document"` — Am Anfang einfügen
- `{ after_paragraph: 2 }` — Nach Absatz mit Index 2 einfügen
- `{ after_paragraph_containing: "conclusion" }` — Nach Absatz mit Text einfügen
- `{ after_section: "Introduction" }` — Nach Abschnittsüberschrift einfügen

**Gibt zurück:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip Wann verwenden
- **Strukturierte Dokumente** (mit Überschriften): `structure` → `get_section`, `update_section`, `insert_section` verwenden
- **Flache Dokumente** (ohne Überschriften): `document` → `read_paragraph`, `write_paragraph`, `smart_insert` verwenden
- **Dokumentende**: `document` → `smart_insert` mit `"end_of_document"` verwenden
:::

---

## `structure`

Dokumentstrukturabfragen und Abschnittsoperationen. 8 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `get_ast`

Den abstrakten Syntaxbaum des Dokuments abrufen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `projection` | string[] | Nein | Einzuschließende Felder: `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | object | Nein | Filter nach `type`, `level`, `contains`, `hasMarks`. |
| `limit` | number | Nein | Max. Ergebnisse. |
| `offset` | number | Nein | Überspringanzahl. |
| `afterCursor` | string | Nein | Knoten-ID für Cursor-Paginierung. |

**Gibt zurück:** Vollständiger AST mit Knotentypen, Positionen und Inhalt.

### `get_digest`

Eine kompakte Zusammenfassung der Dokumentstruktur abrufen.

**Gibt zurück:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

Alle Blöcke im Dokument mit ihren Knoten-IDs auflisten.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `query` | object | Nein | Filter nach `type`, `level`, `contains`, `hasMarks`. |
| `projection` | string[] | Nein | Einzuschließende Felder. |
| `limit` | number | Nein | Max. Ergebnisse. |
| `afterCursor` | string | Nein | Knoten-ID für Cursor-Paginierung. |

**Gibt zurück:** `{ revision, blocks[], hasMore, nextCursor? }`

Knoten-IDs verwenden Präfixe: `h-0` (Überschrift), `p-0` (Absatz), `code-0` (Code-Block) usw.

### `resolve_targets`

Pre-Flight-Prüfung für Mutationen — Knoten nach Abfrage finden.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `query` | object | Ja | Abfritekriterien: `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | number | Nein | Max. Kandidaten. |

**Gibt zurück:** Aufgelöste Zielpositionen und -typen.

### `get_section`

Inhalt eines Dokumentabschnitts abrufen (Überschrift und ihr Inhalt bis zur nächsten gleichrangigen oder übergeordneten Überschrift).

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `heading` | string \| object | Ja | Überschriftentext (string) oder `{ level, index }`. |
| `includeNested` | boolean | Nein | Unterabschnitte einschließen. |

**Gibt zurück:** Abschnittsinhalt mit Überschrift, Textkörper und Positionen.

### `update_section`

Den Inhalt eines Abschnitts aktualisieren.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision. |
| `target` | object | Ja | `{ heading, byIndex, oder sectionId }` |
| `newContent` | string | Ja | Neuer Abschnittsinhalt (Markdown). |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

### `insert_section`

Einen neuen Abschnitt einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision. |
| `after` | object | Nein | Abschnittsziel, nach dem eingefügt werden soll. |
| `sectionHeading` | object | Ja | `{ level, text }` — Überschriftenebene (1-6) und Text. |
| `content` | string | Nein | Abschnittstextinhalt. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

### `move_section`

Einen Abschnitt an einen neuen Ort verschieben.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision. |
| `section` | object | Ja | Zu verschiebender Abschnitt: `{ heading, byIndex, oder sectionId }`. |
| `after` | object | Nein | Abschnittsziel, nach dem verschoben werden soll. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

---

## `selection`

Textauswahl und Cursor lesen und manipulieren. 5 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `get`

Die aktuelle Textauswahl abrufen.

**Gibt zurück:** `{ text, range: { from, to }, isEmpty }`

### `set`

Den Auswahlbereich festlegen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `from` | number | Ja | Startposition (inklusive). |
| `to` | number | Ja | Endposition (exklusive). |

::: tip
Verwenden Sie denselben Wert für `from` und `to`, um den Cursor zu positionieren, ohne Text auszuwählen.
:::

### `replace`

Ausgewählten Text durch neuen Text ersetzen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `text` | string | Ja | Ersetzungstext (Markdown unterstützt). |

**Gibt zurück:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip Vorschlagssystem
Standardmäßig erstellt diese Aktion einen **Vorschlag**, der die Genehmigung des Benutzers erfordert. Der Originaltext erscheint mit Durchstreichung, und der neue Text erscheint als Ghost-Text. Wenn **Bearbeitungen automatisch genehmigen** in Einstellungen → Integrationen aktiviert ist, werden Änderungen sofort angewendet.
:::

### `get_context`

Text rund um den Cursor für Kontextverständnis abrufen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `linesBefore` | number | Nein | Zeilen vor dem Cursor. Standard: 3. |
| `linesAfter` | number | Nein | Zeilen nach dem Cursor. Standard: 3. |

**Gibt zurück:** `{ before, after, currentLine, currentParagraph, block }`

Das `block`-Objekt enthält:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `type` | string | Blocktyp: `paragraph`, `heading`, `codeBlock`, `blockquote` usw. |
| `level` | number | Überschriftenebene 1-6 (nur für Überschriften) |
| `language` | string | Code-Sprache (nur für Code-Blöcke mit gesetzter Sprache) |
| `inList` | string | Listentyp wenn innerhalb einer Liste: `bullet`, `ordered` oder `task` |
| `inBlockquote` | boolean | `true` wenn innerhalb eines Blockzitats |
| `inTable` | boolean | `true` wenn innerhalb einer Tabelle |
| `position` | number | Dokumentposition, an der der Block beginnt |

### `set_cursor`

Die Cursorposition setzen (Auswahl löschen).

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `position` | number | Ja | Zeichenposition (0-indiziert). |

---

## `format`

Textformatierung, Blocktypen, Listen und Listen-Batch-Operationen. 10 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `toggle`

Eine Formatierungsmarkierung auf der aktuellen Auswahl umschalten.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `mark` | string | Ja | `bold`, `italic`, `code`, `strike`, `underline` oder `highlight` |

### `set_link`

Einen Hyperlink auf dem ausgewählten Text erstellen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `href` | string | Ja | Link-URL. |
| `title` | string | Nein | Link-Titel (Tooltip). |

### `remove_link`

Hyperlink aus der Auswahl entfernen. Keine zusätzlichen Parameter.

### `clear`

Alle Formatierungen aus der Auswahl entfernen. Keine zusätzlichen Parameter.

### `set_block_type`

Den aktuellen Block in einen bestimmten Typ konvertieren.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `blockType` | string | Ja | `paragraph`, `heading`, `codeBlock` oder `blockquote` |
| `level` | number | Bedingt | Überschriftenebene 1-6 (erforderlich für `heading`). |
| `language` | string | Nein | Code-Sprache (für `codeBlock`). |

### `insert_hr`

Eine horizontale Linie (`---`) am Cursor einfügen. Keine zusätzlichen Parameter.

### `toggle_list`

Listentyp für den aktuellen Block umschalten.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `listType` | string | Ja | `bullet`, `ordered` oder `task` |

### `indent_list`

Einzug des aktuellen Listenelements erhöhen. Keine zusätzlichen Parameter.

### `outdent_list`

Einzug des aktuellen Listenelements verringern. Keine zusätzlichen Parameter.

### `list_modify`

Die Struktur und den Inhalt einer Liste batch-weise ändern.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision. |
| `target` | object | Ja | `{ listId }`, `{ selector }` oder `{ listIndex }` |
| `operations` | array | Ja | Array von Listen-Operationen. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

Operationen: `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

Tabellenoperationen. 3 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `insert`

Eine neue Tabelle am Cursor einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `rows` | number | Ja | Anzahl der Zeilen (mindestens 1). |
| `cols` | number | Ja | Anzahl der Spalten (mindestens 1). |
| `withHeaderRow` | boolean | Nein | Ob eine Kopfzeile einzuschließen ist. Standard: true. |

### `delete`

Die Tabelle an der Cursorposition löschen. Keine zusätzlichen Parameter.

### `modify`

Struktur und Inhalt einer Tabelle batch-weise ändern.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `baseRevision` | string | Ja | Dokumentrevision. |
| `target` | object | Ja | `{ tableId }`, `{ afterHeading }` oder `{ tableIndex }` |
| `operations` | array | Ja | Array von Tabellen-Operationen. |
| `mode` | string | Nein | `dryRun` für Vorschau ohne Anwenden. |

Operationen: `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

Editor-Zustandsoperationen. 3 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `undo`

Die letzte Bearbeitungsaktion rückgängig machen.

### `redo`

Die zuletzt rückgängig gemachte Aktion wiederholen.

### `focus`

Den Editor fokussieren (in den Vordergrund bringen, bereit für Eingabe).

---

## `workspace`

Dokumente, Fenster und Arbeitsbereichszustand verwalten. 12 Aktionen.

Aktionen, die auf ein bestimmtes Fenster wirken, akzeptieren einen optionalen `windowId`-Parameter.

### `list_windows`

Alle geöffneten VMark-Fenster auflisten.

**Gibt zurück:** Array von `{ label, title, filePath, isFocused, isAiExposed }`

### `get_focused`

Die Bezeichnung des fokussierten Fensters abrufen.

### `focus_window`

Ein bestimmtes Fenster fokussieren.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `windowId` | string | Ja | Fensterbezeichnung zum Fokussieren. |

### `new_document`

Ein neues leeres Dokument erstellen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `title` | string | Nein | Optionaler Dokumenttitel. |

### `open_document`

Ein Dokument aus dem Dateisystem öffnen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `path` | string | Ja | Zu öffnender Dateipfad. |

### `save`

Das aktuelle Dokument speichern.

### `save_as`

Das Dokument unter einem neuen Pfad speichern.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `path` | string | Ja | Neuer Dateipfad. |

### `get_document_info`

Dokumentmetadaten abrufen.

**Gibt zurück:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

Ein Fenster schließen.

### `list_recent_files`

Zuletzt geöffnete Dateien auflisten.

**Gibt zurück:** Array von `{ path, name, timestamp }` (bis zu 10 Dateien, neueste zuerst).

### `get_info`

Informationen über den aktuellen Arbeitsbereichszustand abrufen.

**Gibt zurück:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

Das aktive Dokument von der Festplatte neu laden.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `force` | boolean | Nein | Neu laden erzwingen, auch bei ungespeicherten Änderungen. Standard: false. |

Schlägt fehl, wenn das Dokument unbenannt ist oder ungespeicherte Änderungen ohne `force: true` hat.

---

## `tabs`

Editor-Tabs innerhalb von Fenstern verwalten. 6 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `list`

Alle Tabs in einem Fenster auflisten.

**Gibt zurück:** Array von `{ id, title, filePath, isDirty, isActive }`

### `switch`

Zu einem bestimmten Tab wechseln.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `tabId` | string | Ja | Tab-ID zum Wechseln. |

### `close`

Einen Tab schließen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `tabId` | string | Nein | Zu schließende Tab-ID. Standard ist aktiver Tab. |

### `create`

Einen neuen leeren Tab erstellen.

**Gibt zurück:** `{ tabId }`

### `get_info`

Detaillierte Tab-Informationen abrufen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `tabId` | string | Nein | Tab-ID. Standard ist aktiver Tab. |

**Gibt zurück:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

Den zuletzt geschlossenen Tab wieder öffnen.

**Gibt zurück:** `{ tabId, filePath, title }` oder Meldung, wenn keiner verfügbar ist.

VMark verfolgt die letzten 10 geschlossenen Tabs pro Fenster.

---

## `media`

Mathematik, Diagramme, Medien, Wiki-Links und CJK-Formatierung einfügen. 11 Aktionen.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

### `math_inline`

Inline-LaTeX-Mathematik einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `latex` | string | Ja | LaTeX-Ausdruck (z.B. `E = mc^2`). |

### `math_block`

Eine Mathematikgleichung auf Blockebene einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `latex` | string | Ja | LaTeX-Ausdruck. |

### `mermaid`

Ein Mermaid-Diagramm einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `code` | string | Ja | Mermaid-Diagrammcode. |

### `markmap`

Eine Markmap-Mindmap einfügen. Verwendet Standard-Markdown-Überschriften zur Definition der Baumstruktur.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `code` | string | Ja | Markdown mit Überschriften, die den Mindmap-Baum definieren. |

### `svg`

Eine SVG-Grafik einfügen. Das SVG wird inline mit Schwenken, Zoomen und PNG-Export gerendert.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `code` | string | Ja | SVG-Markup (gültiges XML mit `<svg>`-Stammelement). |

### `wiki_link`

Einen Wiki-ähnlichen Link einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `target` | string | Ja | Link-Ziel (Seitenname). |
| `displayText` | string | Nein | Anzeigetext (wenn anders als Ziel). |

**Ergebnis:** `[[target]]` oder `[[target|displayText]]`

### `video`

Ein HTML5-Videoelement einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `src` | string | Ja | Video-Dateipfad oder URL. |
| `baseRevision` | string | Ja | Dokumentrevision. |
| `title` | string | Nein | Titel-Attribut. |
| `poster` | string | Nein | Poster-Bildpfad oder URL. |

### `audio`

Ein HTML5-Audioelement einfügen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `src` | string | Ja | Audio-Dateipfad oder URL. |
| `baseRevision` | string | Ja | Dokumentrevision. |
| `title` | string | Nein | Titel-Attribut. |

### `video_embed`

Ein Video-Einbettung (iframe) einfügen. Unterstützt YouTube (datenschutzverbessert), Vimeo und Bilibili.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `videoId` | string | Ja | Video-ID (YouTube: 11 Zeichen, Vimeo: numerisch, Bilibili: BV-ID). |
| `baseRevision` | string | Ja | Dokumentrevision. |
| `provider` | string | Nein | `youtube` (Standard), `vimeo` oder `bilibili`. |

### `cjk_punctuation`

Interpunktion zwischen halbbreiter und vollbreiter konvertieren.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `direction` | string | Ja | `to-fullwidth` oder `to-halfwidth`. |

### `cjk_spacing`

Abstände zwischen CJK- und lateinischen Zeichen hinzufügen oder entfernen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `spacingAction` | string | Ja | `add` oder `remove`. |

---

## `suggestions`

KI-generierte Bearbeitungsvorschläge verwalten, die auf Benutzergenehmigung warten. 5 Aktionen.

Wenn KI `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace` oder `document` → `apply_diff` / `batch_edit` verwendet, werden die Änderungen als Vorschläge bereitgestellt, die die Benutzergenehmigung erfordern.

Alle Aktionen akzeptieren einen optionalen `windowId`-Parameter.

::: info Rückgängig/Wiederholen-Sicherheit
Vorschläge ändern das Dokument nicht bis zur Annahme. Dies bewahrt die volle Rückgängig/Wiederholen-Funktionalität — Benutzer können nach der Annahme rückgängig machen, und das Ablehnen hinterlässt keine Spur im Verlauf.
:::

::: tip Automatischer Genehmigungsmodus
Wenn **Bearbeitungen automatisch genehmigen** in Einstellungen → Integrationen aktiviert ist, werden Änderungen direkt ohne Erstellung von Vorschlägen angewendet. Die folgenden Aktionen werden nur benötigt, wenn die automatische Genehmigung deaktiviert ist (Standard).
:::

### `list`

Alle ausstehenden Vorschläge auflisten.

**Gibt zurück:** `{ suggestions: [...], count, focusedId }`

Jeder Vorschlag enthält `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent` und `createdAt`.

### `accept`

Einen bestimmten Vorschlag annehmen und seine Änderungen auf das Dokument anwenden.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `suggestionId` | string | Ja | ID des anzunehmenden Vorschlags. |

### `reject`

Einen bestimmten Vorschlag ablehnen und verwerfen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `suggestionId` | string | Ja | ID des abzulehnenden Vorschlags. |

### `accept_all`

Alle ausstehenden Vorschläge in Dokumentreihenfolge annehmen.

### `reject_all`

Alle ausstehenden Vorschläge ablehnen.

---

## Protokollwerkzeuge

Zwei eigenständige Werkzeuge zur Abfrage von Server-Fähigkeiten und Dokumentzustand. Diese verwenden nicht das zusammengesetzte `action`-Muster.

### `get_capabilities`

Die Fähigkeiten und verfügbaren Werkzeuge des MCP-Servers abrufen.

**Gibt zurück:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

Die aktuelle Dokumentrevision für optimistisches Sperren abrufen.

| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `windowId` | string | Nein | Fensterbezeichner. |

**Gibt zurück:** `{ revision, lastUpdated }`

Verwenden Sie die Revision in Mutationsaktionen, um gleichzeitige Bearbeitungen zu erkennen.

---

## MCP-Ressourcen

Zusätzlich zu Werkzeugen stellt VMark diese schreibgeschützten Ressourcen bereit:

| Ressourcen-URI | Beschreibung |
|---------------|-------------|
| `vmark://document/outline` | Dokumentüberschriften-Hierarchie |
| `vmark://document/metadata` | Dokumentmetadaten (Pfad, Wörteranzahl usw.) |
| `vmark://windows/list` | Liste der geöffneten Fenster |
| `vmark://windows/focused` | Aktuell fokussierte Fensterbezeichnung |
