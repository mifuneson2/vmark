# Popup Inline

VMark fornisce popup contestuali per la modifica di collegamenti, immagini, media, matematica, note a piè di pagina e altro. Questi popup funzionano sia in modalità WYSIWYG che Sorgente con una navigazione da tastiera coerente.

## Scorciatoie da Tastiera Comuni

Tutti i popup condividono questi comportamenti da tastiera:

| Azione | Scorciatoia |
|--------|-------------|
| Chiudi/Annulla | `Escape` |
| Conferma/Salva | `Invio` |
| Naviga tra i campi | `Tab` / `Shift + Tab` |

## Tooltip e Popup dei Collegamenti

VMark usa un sistema a due livelli per i collegamenti: un tooltip di sola lettura al passaggio del mouse e un popup di modifica tramite scorciatoia da tastiera.

### Tooltip al Passaggio del Mouse (Sola Lettura)

**Attivazione:** Passa il mouse sul collegamento (ritardo di 300ms)

**Mostra:**
- **Anteprima URL** — URL troncato con URL completo al passaggio
- **Pulsante Apri** — Apre il collegamento nel browser (o salta all'intestazione per i `#segnalibri`)

**Comportamento:** Solo visualizzazione. Allontana il mouse per chiuderlo.

### Modifica Collegamento Esistente

**Attivazione:** Posiziona il cursore nel collegamento + `Mod + K`

**Campi:**
- **URL** — Modifica la destinazione del collegamento
- **Apri** — Apri il collegamento nel browser
- **Copia** — Copia l'URL negli appunti
- **Elimina** — Rimuovi il collegamento, mantieni il testo

### Crea Nuovo Collegamento

**Attivazione:** Seleziona testo + `Mod + K`

**Appunti intelligenti:** Se gli appunti contengono un URL, viene compilato automaticamente.

**Campi:**
- **Input URL** — Inserisci la destinazione
- **Conferma** — Premi Invio o fai clic su ✓
- **Annulla** — Premi Escape o fai clic su ✗

### Modalità Sorgente

- **`Cmd + Clic`** su collegamento → apre nel browser
- **Clic** sulla sintassi `[testo](url)` → mostra il popup di modifica
- **`Mod + K`** all'interno del collegamento → mostra il popup di modifica

::: tip Collegamento Segnalibro
I collegamenti che iniziano con `#` vengono trattati come segnalibri (collegamenti interni all'intestazione). L'apertura salta all'intestazione invece di aprire un browser.
:::

## Popup Media (Immagini, Video, Audio)

Un popup unificato per la modifica di tutti i tipi di media — immagini, video e audio.

### Popup di Modifica

**Attivazione:** Doppio clic su qualsiasi elemento media (immagine, video o audio)

**Campi comuni (tutti i tipi di media):**
- **Sorgente** — Percorso del file o URL

**Campi specifici per tipo:**

| Campo | Immagine | Video | Audio |
|-------|----------|-------|-------|
| Testo alt | Sì | — | — |
| Titolo | — | Sì | Sì |
| Poster | — | Sì | — |
| Dimensioni | Sola lettura | — | — |
| Attiva/disattiva Inline/Blocco | Sì | — | — |

**Pulsanti:**
- **Sfoglia** — Scegli il file dal filesystem
- **Copia** — Copia il percorso sorgente negli appunti
- **Elimina** — Rimuovi l'elemento media

**Scorciatoie:**
- `Mod + Shift + I` — Inserisci nuova immagine
- `Invio` — Salva le modifiche
- `Escape` — Chiudi il popup

### Modalità Sorgente

In modalità Sorgente, facendo clic sulla sintassi dell'immagine `![alt](path)` si apre lo stesso popup media. I file multimediali (estensioni video/audio) mostrano un'anteprima fluttuante con controlli di riproduzione nativi al passaggio del mouse.

## Popup Matematica

Modifica le espressioni matematiche LaTeX con anteprima in tempo reale.

**Attivazione:**
- **WYSIWYG:** Fai clic sulla matematica inline `$...$`

**Campi:**
- **Input LaTeX** — Modifica l'espressione matematica
- **Anteprima** — Anteprima renderizzata in tempo reale
- **Visualizzazione Errori** — Mostra gli errori LaTeX con suggerimenti utili sulla sintassi

**Scorciatoie:**
- `Mod + Invio` — Salva e chiudi
- `Escape` — Annulla e chiudi
- `Shift + Backspace` — Elimina matematica inline (funziona anche quando non è vuota)
- `Alt + Mod + M` — Inserisci nuova matematica inline

::: tip Suggerimenti sugli Errori
Quando hai un errore di sintassi LaTeX, il popup mostra suggerimenti utili come parentesi graffe mancanti, comandi sconosciuti o delimitatori non bilanciati.
:::

::: info Modalità Sorgente
In modalità Sorgente, modifica la matematica direttamente nel testo. L'anteprima appare nel pannello di anteprima Mermaid/Matematica.
:::

## Popup Note a Piè di Pagina

Modifica il contenuto delle note a piè di pagina inline.

**Attivazione:**
- **WYSIWYG:** Passa il mouse sul riferimento della nota `[^1]`

**Campi:**
- **Contenuto** — Testo della nota su più righe (con ridimensionamento automatico)
- **Vai alla Definizione** — Salta alla definizione della nota
- **Elimina** — Rimuovi la nota

**Comportamento:**
- Le nuove note mettono automaticamente il focus sul campo contenuto
- L'area di testo si espande mentre digiti

## Popup Wiki Link

Modifica i collegamenti in stile wiki per le connessioni interne ai documenti.

**Attivazione:**
- **WYSIWYG:** Passa il mouse su `[[destinazione]]` (ritardo di 300ms)
- **Sorgente:** Fai clic sulla sintassi del wiki link

**Campi:**
- **Destinazione** — Percorso relativo al workspace (l'estensione `.md` viene gestita automaticamente)
- **Sfoglia** — Scegli il file dal workspace
- **Apri** — Apri il documento collegato
- **Copia** — Copia il percorso della destinazione
- **Elimina** — Rimuovi il wiki link

## Menu Contestuale Tabella

Azioni rapide per la modifica delle tabelle.

**Attivazione:**
- **WYSIWYG:** Usa la barra degli strumenti o le scorciatoie da tastiera
- **Sorgente:** Clic destro sulla cella della tabella

**Azioni:**
| Azione | Descrizione |
|--------|-------------|
| Inserisci Riga Sopra/Sotto | Aggiungi riga al cursore |
| Inserisci Colonna Sinistra/Destra | Aggiungi colonna al cursore |
| Elimina Riga | Rimuovi la riga corrente |
| Elimina Colonna | Rimuovi la colonna corrente |
| Elimina Tabella | Rimuovi l'intera tabella |
| Allinea Colonna Sinistra/Centro/Destra | Imposta l'allineamento per la colonna corrente |
| Allinea Tutto Sinistra/Centro/Destra | Imposta l'allineamento per tutte le colonne |
| Formatta Tabella | Allinea automaticamente le colonne della tabella (abbellisci markdown) |

## Popup Controllo Ortografico

Correggi gli errori di ortografia con suggerimenti.

**Attivazione:**
- Clic destro sulla parola con errore ortografico (sottolineatura rossa)

**Azioni:**
- **Suggerimenti** — Fai clic per sostituire con il suggerimento
- **Aggiungi al Dizionario** — Smetti di contrassegnare come errore ortografico

## Confronto tra Modalità

| Elemento | Modifica WYSIWYG | Sorgente |
|----------|-----------------|---------|
| Collegamento | Tooltip al passaggio / `Mod+K` | Clic / `Mod+K` / `Cmd+Clic` per aprire |
| Immagine | Doppio clic | Clic su `![](path)` |
| Video | Doppio clic | — |
| Audio | Doppio clic | — |
| Matematica | Clic | Modifica diretta |
| Nota a piè di pagina | Passaggio del mouse | Modifica diretta |
| Wiki Link | Passaggio del mouse | Clic |
| Tabella | Barra degli strumenti | Menu clic destro |
| Controllo Ortografico | Clic destro | Clic destro |

## Suggerimenti per la Navigazione nei Popup

### Flusso del Focus
1. Il popup si apre con il primo input in focus
2. `Tab` si sposta in avanti attraverso i campi e i pulsanti
3. `Shift + Tab` si sposta all'indietro
4. Il focus si avvolge all'interno del popup

### Modifica Rapida
- Per semplici modifiche URL: modifica e premi `Invio`
- Per annullare: premi `Escape` da qualsiasi campo
- Per contenuto su più righe (note, matematica): usa `Mod + Invio` per salvare

### Comportamento del Mouse
- Fai clic fuori dal popup per chiudere (le modifiche vengono scartate)
- I popup al passaggio del mouse (collegamento, nota, wiki) hanno un ritardo di 300ms prima di essere mostrati
- Spostare il mouse di nuovo sul popup lo mantiene aperto

<!-- Styles in style.css -->
