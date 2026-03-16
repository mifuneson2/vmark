# Riferimento Strumenti MCP

Questa pagina documenta tutti gli strumenti MCP disponibili quando Claude (o altri assistenti IA) si connette a VMark.

VMark espone un insieme di **strumenti compositi**, **strumenti di protocollo** e **risorse** — tutti documentati di seguito. Gli strumenti compositi usano un parametro `action` per selezionare l'operazione — questo riduce il sovraccarico di token mantenendo accessibili tutte le capacità.

::: tip Flusso di Lavoro Consigliato
Per la maggior parte dei compiti di scrittura, bastano poche azioni:

**Comprendi:** `structure` → `get_digest`, `document` → `search`
**Leggi:** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**Scrivi:** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**Controlla:** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**File:** `workspace` → `save`, `tabs` → `switch` / `list`

Le azioni rimanenti forniscono controllo granulare per scenari di automazione avanzati.
:::

::: tip Diagrammi Mermaid
Quando si usa l'IA per generare diagrammi Mermaid tramite MCP, considera l'installazione del [server MCP mermaid-validator](/it/guide/mermaid#mermaid-validator-mcp-server-syntax-checking) — rileva gli errori di sintassi usando gli stessi parser Mermaid v11 prima che i diagrammi raggiungano il tuo documento.
:::

---

## `document`

Leggi, scrivi, cerca e trasforma il contenuto del documento. 12 azioni.

Tutte le azioni accettano un parametro opzionale `windowId` (stringa) per indirizzare una finestra specifica. Il valore predefinito è la finestra in primo piano.

### `get_content`

Ottieni il contenuto completo del documento come testo markdown.

### `set_content`

Sostituisci l'intero contenuto del documento.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `content` | stringa | Sì | Nuovo contenuto del documento (markdown supportato). |

::: warning Solo Documenti Vuoti
Per sicurezza, questa azione è consentita solo quando il documento di destinazione è **vuoto**. Per i documenti non vuoti, usa `insert_at_cursor`, `apply_diff`, o `selection` → `replace` — questi creano suggerimenti che richiedono l'approvazione dell'utente.
:::

### `insert_at_cursor`

Inserisci testo nella posizione corrente del cursore.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `text` | stringa | Sì | Testo da inserire (markdown supportato). |

**Restituisce:** `{ message, position, suggestionId?, applied }`

::: tip Sistema di Suggerimenti
Per impostazione predefinita, questa azione crea un **suggerimento** che richiede l'approvazione dell'utente. Il testo appare come anteprima fantasma. Gli utenti possono accettare (Invio) o rifiutare (Escape). Se **Approva automaticamente le modifiche** è abilitato in Impostazioni → Integrazioni, le modifiche vengono applicate immediatamente.
:::

### `insert_at_position`

Inserisci testo in una posizione specifica del carattere.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `text` | stringa | Sì | Testo da inserire (markdown supportato). |
| `position` | numero | Sì | Posizione del carattere (indice 0). |

**Restituisce:** `{ message, position, suggestionId?, applied }`

### `search`

Cerca testo nel documento.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `query` | stringa | Sì | Testo da cercare. |
| `caseSensitive` | booleano | No | Ricerca con distinzione maiuscole/minuscole. Predefinito: false. |

**Restituisce:** Array di corrispondenze con posizioni e numeri di riga.

### `replace_in_source`

Sostituisci testo al livello sorgente markdown, bypassando i confini dei nodi ProseMirror.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `search` | stringa | Sì | Testo da trovare nel sorgente markdown. |
| `replace` | stringa | Sì | Testo sostitutivo (markdown supportato). |
| `all` | booleano | No | Sostituisci tutte le occorrenze. Predefinito: false. |

**Restituisce:** `{ count, message, suggestionIds?, applied }`

::: tip Quando usarlo
Usa prima `apply_diff` — è più veloce e preciso. Ricorri a `replace_in_source` solo quando il testo cercato attraversa confini di formattazione (grassetto, corsivo, collegamenti, ecc.) e `apply_diff` non riesce a trovarlo.
:::

### `batch_edit`

Applica più operazioni atomicamente.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `operations` | array | Sì | Array di operazioni (max 100). |
| `baseRevision` | stringa | Sì | Revisione attesa per il rilevamento dei conflitti. |
| `requestId` | stringa | No | Chiave di idempotenza. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

Ogni operazione richiede `type` (`update`, `insert`, `delete`, `format`, o `move`), `nodeId`, e opzionalmente `text`/`content`.

**Restituisce:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

Trova e sostituisci testo con controllo della politica di corrispondenza.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `original` | stringa | Sì | Testo da trovare. |
| `replacement` | stringa | Sì | Testo con cui sostituire. |
| `baseRevision` | stringa | Sì | Revisione attesa per il rilevamento dei conflitti. |
| `matchPolicy` | stringa | No | `first`, `all`, `nth`, o `error_if_multiple`. Predefinito: `first`. |
| `nth` | numero | No | Quale corrispondenza sostituire (indice 0, per politica `nth`). |
| `scopeQuery` | oggetto | No | Filtro ambito per restringere la ricerca. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

**Restituisce:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

Sostituisci testo usando l'ancoraggio del contesto per un targeting preciso.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `anchor` | oggetto | Sì | `{ text, beforeContext, afterContext }` |
| `replacement` | stringa | Sì | Testo sostitutivo. |
| `baseRevision` | stringa | Sì | Revisione attesa per il rilevamento dei conflitti. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

### `read_paragraph`

Leggi un paragrafo del documento per indice o corrispondenza di contenuto.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `target` | oggetto | Sì | `{ index: 0 }` o `{ containing: "testo" }` |
| `includeContext` | booleano | No | Includi i paragrafi circostanti. Predefinito: false. |

**Restituisce:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

Modifica un paragrafo nel documento.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento per il rilevamento dei conflitti. |
| `target` | oggetto | Sì | `{ index: 0 }` o `{ containing: "testo" }` |
| `operation` | stringa | Sì | `replace`, `append`, `prepend`, o `delete`. |
| `content` | stringa | Condizionale | Nuovo contenuto (richiesto tranne per `delete`). |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

**Restituisce:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

Inserisci contenuto in posizioni comuni del documento.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento per il rilevamento dei conflitti. |
| `destination` | varia | Sì | Dove inserire (vedi sotto). |
| `content` | stringa | Sì | Contenuto markdown da inserire. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

**Opzioni di destinazione:**
- `"end_of_document"` — Inserisci alla fine
- `"start_of_document"` — Inserisci all'inizio
- `{ after_paragraph: 2 }` — Inserisci dopo il paragrafo all'indice 2
- `{ after_paragraph_containing: "conclusione" }` — Inserisci dopo il paragrafo contenente testo
- `{ after_section: "Introduzione" }` — Inserisci dopo l'intestazione di sezione

**Restituisce:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip Quando Usarlo
- **Documenti strutturati** (con intestazioni): Usa `structure` → `get_section`, `update_section`, `insert_section`
- **Documenti piatti** (senza intestazioni): Usa `document` → `read_paragraph`, `write_paragraph`, `smart_insert`
- **Fine del documento**: Usa `document` → `smart_insert` con `"end_of_document"`
:::

---

## `structure`

Query sulla struttura del documento e operazioni sulle sezioni. 8 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `get_ast`

Ottieni l'albero sintattico astratto del documento.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `projection` | string[] | No | Campi da includere: `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | oggetto | No | Filtra per `type`, `level`, `contains`, `hasMarks`. |
| `limit` | numero | No | Risultati massimi. |
| `offset` | numero | No | Numero da saltare. |
| `afterCursor` | stringa | No | ID nodo per la paginazione con cursore. |

**Restituisce:** AST completo con tipi di nodo, posizioni e contenuto.

### `get_digest`

Ottieni un digest compatto della struttura del documento.

**Restituisce:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

Elenca tutti i blocchi nel documento con i loro ID nodo.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `query` | oggetto | No | Filtra per `type`, `level`, `contains`, `hasMarks`. |
| `projection` | string[] | No | Campi da includere. |
| `limit` | numero | No | Risultati massimi. |
| `afterCursor` | stringa | No | ID nodo per la paginazione con cursore. |

**Restituisce:** `{ revision, blocks[], hasMore, nextCursor? }`

Gli ID nodo usano prefissi: `h-0` (intestazione), `p-0` (paragrafo), `code-0` (blocco di codice), ecc.

### `resolve_targets`

Controllo pre-flight per le mutazioni — trova nodi per query.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `query` | oggetto | Sì | Criteri di query: `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | numero | No | Massimo candidati. |

**Restituisce:** Posizioni e tipi di destinazione risolti.

### `get_section`

Ottieni il contenuto di una sezione del documento (intestazione e il suo contenuto fino alla prossima intestazione dello stesso livello o superiore).

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `heading` | stringa \| oggetto | Sì | Testo dell'intestazione (stringa) o `{ level, index }`. |
| `includeNested` | booleano | No | Includi le sottosezioni. |

**Restituisce:** Contenuto della sezione con intestazione, corpo e posizioni.

### `update_section`

Aggiorna il contenuto di una sezione.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `target` | oggetto | Sì | `{ heading, byIndex, o sectionId }` |
| `newContent` | stringa | Sì | Nuovo contenuto della sezione (markdown). |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

### `insert_section`

Inserisci una nuova sezione.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `after` | oggetto | No | Destinazione di sezione dopo cui inserire. |
| `sectionHeading` | oggetto | Sì | `{ level, text }` — livello dell'intestazione (1-6) e testo. |
| `content` | stringa | No | Contenuto del corpo della sezione. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

### `move_section`

Sposta una sezione in una nuova posizione.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `section` | oggetto | Sì | Sezione da spostare: `{ heading, byIndex, o sectionId }`. |
| `after` | oggetto | No | Destinazione di sezione dopo cui spostare. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

---

## `selection`

Leggi e manipola la selezione del testo e il cursore. 5 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `get`

Ottieni la selezione di testo corrente.

**Restituisce:** `{ text, range: { from, to }, isEmpty }`

### `set`

Imposta l'intervallo di selezione.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `from` | numero | Sì | Posizione di inizio (inclusa). |
| `to` | numero | Sì | Posizione di fine (esclusiva). |

::: tip
Usa lo stesso valore per `from` e `to` per posizionare il cursore senza selezionare testo.
:::

### `replace`

Sostituisci il testo selezionato con nuovo testo.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `text` | stringa | Sì | Testo sostitutivo (markdown supportato). |

**Restituisce:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip Sistema di Suggerimenti
Per impostazione predefinita, questa azione crea un **suggerimento** che richiede l'approvazione dell'utente. Il testo originale appare con il barrato, e il nuovo testo appare come anteprima fantasma. Se **Approva automaticamente le modifiche** è abilitato in Impostazioni → Integrazioni, le modifiche vengono applicate immediatamente.
:::

### `get_context`

Ottieni il testo che circonda il cursore per la comprensione del contesto.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `linesBefore` | numero | No | Righe prima del cursore. Predefinito: 3. |
| `linesAfter` | numero | No | Righe dopo il cursore. Predefinito: 3. |

**Restituisce:** `{ before, after, currentLine, currentParagraph, block }`

L'oggetto `block` contiene:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `type` | stringa | Tipo di blocco: `paragraph`, `heading`, `codeBlock`, `blockquote`, ecc. |
| `level` | numero | Livello intestazione 1-6 (solo per le intestazioni) |
| `language` | stringa | Linguaggio del codice (solo per i blocchi di codice con linguaggio impostato) |
| `inList` | stringa | Tipo di elenco se all'interno di un elenco: `bullet`, `ordered`, o `task` |
| `inBlockquote` | booleano | `true` se all'interno di una citazione |
| `inTable` | booleano | `true` se all'interno di una tabella |
| `position` | numero | Posizione nel documento dove inizia il blocco |

### `set_cursor`

Imposta la posizione del cursore (deseleziona la selezione).

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `position` | numero | Sì | Posizione del carattere (indice 0). |

---

## `format`

Formattazione del testo, tipi di blocco, elenchi e operazioni batch sugli elenchi. 10 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `toggle`

Attiva/disattiva un segno di formattazione sulla selezione corrente.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `mark` | stringa | Sì | `bold`, `italic`, `code`, `strike`, `underline`, o `highlight` |

### `set_link`

Crea un collegamento ipertestuale sul testo selezionato.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `href` | stringa | Sì | URL del collegamento. |
| `title` | stringa | No | Titolo del collegamento (tooltip). |

### `remove_link`

Rimuovi il collegamento ipertestuale dalla selezione. Nessun parametro aggiuntivo.

### `clear`

Rimuovi tutta la formattazione dalla selezione. Nessun parametro aggiuntivo.

### `set_block_type`

Converti il blocco corrente in un tipo specifico.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `blockType` | stringa | Sì | `paragraph`, `heading`, `codeBlock`, o `blockquote` |
| `level` | numero | Condizionale | Livello intestazione 1-6 (richiesto per `heading`). |
| `language` | stringa | No | Linguaggio del codice (per `codeBlock`). |

### `insert_hr`

Inserisci una riga orizzontale (`---`) al cursore. Nessun parametro aggiuntivo.

### `toggle_list`

Attiva/disattiva il tipo di elenco sul blocco corrente.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `listType` | stringa | Sì | `bullet`, `ordered`, o `task` |

### `indent_list`

Aumenta il rientro dell'elemento di elenco corrente. Nessun parametro aggiuntivo.

### `outdent_list`

Diminuisce il rientro dell'elemento di elenco corrente. Nessun parametro aggiuntivo.

### `list_modify`

Modifica in batch la struttura e il contenuto di un elenco.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `target` | oggetto | Sì | `{ listId }`, `{ selector }`, o `{ listIndex }` |
| `operations` | array | Sì | Array di operazioni sull'elenco. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

Operazioni: `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

Operazioni sulle tabelle. 3 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `insert`

Inserisci una nuova tabella al cursore.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `rows` | numero | Sì | Numero di righe (almeno 1). |
| `cols` | numero | Sì | Numero di colonne (almeno 1). |
| `withHeaderRow` | booleano | No | Se includere una riga di intestazione. Predefinito: true. |

### `delete`

Elimina la tabella alla posizione del cursore. Nessun parametro aggiuntivo.

### `modify`

Modifica in batch la struttura e il contenuto di una tabella.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `target` | oggetto | Sì | `{ tableId }`, `{ afterHeading }`, o `{ tableIndex }` |
| `operations` | array | Sì | Array di operazioni sulla tabella. |
| `mode` | stringa | No | `dryRun` per visualizzare in anteprima senza applicare. Applica-vs-suggerisci è controllato dall'impostazione utente. |

Operazioni: `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

Operazioni sullo stato dell'editor. 3 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `undo`

Annulla l'ultima azione di modifica.

### `redo`

Ripristina l'ultima azione annullata.

### `focus`

Metti il focus sull'editor (portalo in primo piano, pronto per l'input).

---

## `workspace`

Gestisci documenti, finestre e stato del workspace. 12 azioni.

Le azioni che operano su una finestra specifica accettano un parametro opzionale `windowId`.

### `list_windows`

Elenca tutte le finestre VMark aperte.

**Restituisce:** Array di `{ label, title, filePath, isFocused, isAiExposed }`

### `get_focused`

Ottieni l'etichetta della finestra in primo piano.

### `focus_window`

Metti in primo piano una finestra specifica.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `windowId` | stringa | Sì | Etichetta della finestra da portare in primo piano. |

### `new_document`

Crea un nuovo documento vuoto.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `title` | stringa | No | Titolo opzionale del documento. |

### `open_document`

Apri un documento dal filesystem.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `path` | stringa | Sì | Percorso del file da aprire. |

### `save`

Salva il documento corrente.

### `save_as`

Salva il documento in un nuovo percorso.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `path` | stringa | Sì | Nuovo percorso del file. |

### `get_document_info`

Ottieni i metadati del documento.

**Restituisce:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

Chiudi una finestra.

### `list_recent_files`

Elenca i file aperti di recente.

**Restituisce:** Array di `{ path, name, timestamp }` (fino a 10 file, il più recente per primo).

### `get_info`

Ottieni informazioni sullo stato corrente del workspace.

**Restituisce:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

Ricarica il documento attivo dal disco.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `force` | booleano | No | Forza il ricaricamento anche se il documento ha modifiche non salvate. Predefinito: false. |

Fallisce se il documento è senza titolo o ha modifiche non salvate senza `force: true`.

---

## `tabs`

Gestisci le schede editor all'interno delle finestre. 6 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `list`

Elenca tutte le schede in una finestra.

**Restituisce:** Array di `{ id, title, filePath, isDirty, isActive }`

### `switch`

Passa a una scheda specifica.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `tabId` | stringa | Sì | ID della scheda a cui passare. |

### `close`

Chiudi una scheda.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `tabId` | stringa | No | ID della scheda da chiudere. Il valore predefinito è la scheda attiva. |

### `create`

Crea una nuova scheda vuota.

**Restituisce:** `{ tabId }`

### `get_info`

Ottieni informazioni dettagliate sulla scheda.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `tabId` | stringa | No | ID della scheda. Il valore predefinito è la scheda attiva. |

**Restituisce:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

Riapri la scheda chiusa più di recente.

**Restituisce:** `{ tabId, filePath, title }` o messaggio se nessuna è disponibile.

VMark tiene traccia delle ultime 10 schede chiuse per finestra.

---

## `media`

Inserisci matematica, diagrammi, media, wiki link e formattazione CJK. 11 azioni.

Tutte le azioni accettano un parametro opzionale `windowId`.

### `math_inline`

Inserisci matematica LaTeX inline.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `latex` | stringa | Sì | Espressione LaTeX (es. `E = mc^2`). |

### `math_block`

Inserisci un'equazione matematica a livello di blocco.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `latex` | stringa | Sì | Espressione LaTeX. |

### `mermaid`

Inserisci un diagramma Mermaid.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `code` | stringa | Sì | Codice del diagramma Mermaid. |

### `markmap`

Inserisci una mappa mentale Markmap. Usa le intestazioni Markdown standard per definire l'albero.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `code` | stringa | Sì | Markdown con intestazioni che definiscono l'albero della mappa mentale. |

### `svg`

Inserisci un grafico SVG. L'SVG viene renderizzato inline con pan, zoom ed esportazione PNG.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `code` | stringa | Sì | Markup SVG (XML valido con radice `<svg>`). |

### `wiki_link`

Inserisci un collegamento in stile wiki.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `target` | stringa | Sì | Destinazione del collegamento (nome della pagina). |
| `displayText` | stringa | No | Testo visualizzato (se diverso dalla destinazione). |

**Risultato:** `[[target]]` o `[[target|displayText]]`

### `video`

Inserisci un elemento video HTML5.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `src` | stringa | Sì | Percorso del file video o URL. |
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `title` | stringa | No | Attributo titolo. |
| `poster` | stringa | No | Percorso immagine poster o URL. |

### `audio`

Inserisci un elemento audio HTML5.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `src` | stringa | Sì | Percorso del file audio o URL. |
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `title` | stringa | No | Attributo titolo. |

### `video_embed`

Inserisci un embed video (iframe). Supporta YouTube (privacy migliorata), Vimeo e Bilibili.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `videoId` | stringa | Sì | ID video (YouTube: 11 caratteri, Vimeo: numerico, Bilibili: BV ID). |
| `baseRevision` | stringa | Sì | Revisione del documento. |
| `provider` | stringa | No | `youtube` (predefinito), `vimeo`, o `bilibili`. |

### `cjk_punctuation`

Converti la punteggiatura tra mezza larghezza e larghezza intera.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `direction` | stringa | Sì | `to-fullwidth` o `to-halfwidth`. |

### `cjk_spacing`

Aggiungi o rimuovi la spaziatura tra caratteri CJK e latini.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `spacingAction` | stringa | Sì | `add` o `remove`. |

---

## `suggestions`

Gestisci i suggerimenti di modifica generati dall'IA in attesa di approvazione dell'utente. 5 azioni.

Quando l'IA usa `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace`, o `document` → `apply_diff` / `batch_edit`, le modifiche vengono messe in staging come suggerimenti che richiedono l'approvazione dell'utente.

Tutte le azioni accettano un parametro opzionale `windowId`.

::: info Sicurezza Annulla/Ripristina
I suggerimenti non modificano il documento finché non vengono accettati. Questo preserva la piena funzionalità annulla/ripristina — gli utenti possono annullare dopo aver accettato, e il rifiuto non lascia tracce nella cronologia.
:::

::: tip Modalità Approvazione Automatica
Se **Approva automaticamente le modifiche** è abilitato in Impostazioni → Integrazioni, le modifiche vengono applicate direttamente senza creare suggerimenti. Le azioni seguenti sono necessarie solo quando l'approvazione automatica è disabilitata (l'impostazione predefinita).
:::

### `list`

Elenca tutti i suggerimenti in attesa.

**Restituisce:** `{ suggestions: [...], count, focusedId }`

Ogni suggerimento include `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent`, e `createdAt`.

### `accept`

Accetta un suggerimento specifico, applicando le sue modifiche al documento.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `suggestionId` | stringa | Sì | ID del suggerimento da accettare. |

### `reject`

Rifiuta un suggerimento specifico, scartandolo senza modifiche.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `suggestionId` | stringa | Sì | ID del suggerimento da rifiutare. |

### `accept_all`

Accetta tutti i suggerimenti in attesa nell'ordine del documento.

### `reject_all`

Rifiuta tutti i suggerimenti in attesa.

---

## Strumenti di Protocollo

Due strumenti standalone per interrogare le capacità del server e lo stato del documento. Questi non usano il pattern `action` composito.

### `get_capabilities`

Ottieni le capacità del server MCP e gli strumenti disponibili.

**Restituisce:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

Ottieni la revisione corrente del documento per il blocco ottimistico.

| Parametro | Tipo | Richiesto | Descrizione |
|-----------|------|----------|-------------|
| `windowId` | stringa | No | Identificatore della finestra. |

**Restituisce:** `{ revision, lastUpdated }`

Usa la revisione nelle azioni di mutazione per rilevare le modifiche concorrenti.

---

## Risorse MCP

Oltre agli strumenti, VMark espone queste risorse di sola lettura:

| URI Risorsa | Descrizione |
|-------------|-------------|
| `vmark://document/outline` | Gerarchia delle intestazioni del documento |
| `vmark://document/metadata` | Metadati del documento (percorso, conteggio parole, ecc.) |
| `vmark://windows/list` | Elenco delle finestre aperte |
| `vmark://windows/focused` | Etichetta della finestra attualmente in primo piano |
