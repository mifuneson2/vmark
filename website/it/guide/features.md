# Funzionalità

VMark è un editor Markdown ricco di funzionalità progettato per i flussi di lavoro di scrittura moderni. Ecco cosa è incluso.

## Modalità di Editor

### Modalità Rich Text (WYSIWYG)

La modalità di modifica predefinita offre una vera esperienza "quello che vedi è quello che ottieni":

- Anteprima della formattazione in tempo reale durante la digitazione
- Visualizzazione della sintassi inline al passaggio del cursore
- Barra degli strumenti intuitiva e menu contestuali
- Input della sintassi Markdown senza interruzioni

### Modalità Sorgente

Passa alla modifica Markdown grezzo con evidenziazione completa della sintassi:

- Editor basato su CodeMirror 6
- Evidenziazione completa della sintassi
- Esperienza familiare da editor di testo
- Perfetta per gli utenti avanzati

Passa da una modalità all'altra con `F6`.

### Anteprima Sorgente

Modifica il Markdown grezzo di un singolo blocco senza uscire dalla modalità WYSIWYG. Premi `F5` per aprire l'Anteprima Sorgente per il blocco alla posizione del cursore.

**Layout:**
- Barra dell'intestazione con etichetta del tipo di blocco e pulsanti di azione
- Editor CodeMirror che mostra il sorgente Markdown del blocco
- Blocco originale mostrato come anteprima attenuata (quando l'anteprima live è ATTIVA)

**Controlli:**
| Azione | Scorciatoia |
|--------|-------------|
| Salva modifiche | `Cmd/Ctrl + Enter` |
| Annulla (ripristina) | `Escape` |
| Attiva/disattiva anteprima live | Fai clic sull'icona occhio |

**Anteprima Live:**
- **DISATTIVA (predefinita):** Modifica liberamente, le modifiche vengono applicate solo al salvataggio
- **ATTIVA:** Le modifiche vengono applicate immediatamente durante la digitazione, l'anteprima viene mostrata sotto

**Blocchi esclusi:**
Alcuni blocchi hanno i propri meccanismi di modifica e saltano l'Anteprima Sorgente:
- Blocchi di codice (inclusi Mermaid, LaTeX) — usa il doppio clic per modificare
- Immagini a blocco — usa il popup immagine
- Frontmatter, blocchi HTML, regole orizzontali

L'Anteprima Sorgente è utile per la modifica precisa del Markdown (correzione della sintassi delle tabelle, regolazione dell'indentazione degli elenchi) rimanendo nell'editor visuale.

## Modifica Multi-Cursore

Modifica più posizioni contemporaneamente — VMark supporta il multi-cursore completo sia in modalità WYSIWYG che Sorgente.

| Azione | Scorciatoia |
|--------|-------------|
| Aggiungi cursore alla corrispondenza successiva | `Mod + D` |
| Salta corrispondenza, vai alla successiva | `Mod + Shift + D` |
| Seleziona tutte le occorrenze | `Mod + Shift + L` |
| Aggiungi cursore sopra/sotto | `Mod + Alt + Su/Giù` |
| Aggiungi cursore al clic | `Alt + Clic` |
| Annulla ultimo cursore | `Alt + Mod + Z` |
| Comprimi a singolo cursore | `Escape` |

Tutte le modifiche standard (digitazione, eliminazione, appunti, navigazione) funzionano su ogni cursore in modo indipendente. Delimitato per blocchi per impostazione predefinita per evitare modifiche involontarie tra sezioni.

[Scopri di più →](/it/guide/multi-cursor)

## Coppia Automatica e Tab Escape

Quando digiti una parentesi aperta, una virgoletta o un apice inverso, VMark inserisce automaticamente la coppia di chiusura. Premi **Tab** per saltare oltre il carattere di chiusura invece di raggiungere il tasto freccia.

- Parentesi: `()` `[]` `{}`
- Virgolette: `""` `''` `` ` ` ``
- CJK: `「」` `『』` `（）` `【】` `《》` `〈〉`
- Virgolette curve: `""` `''`
- Indicatori di formattazione in WYSIWYG: **grassetto**, *corsivo*, `codice`, ~~barrato~~, collegamenti

Backspace elimina entrambi i caratteri quando la coppia è vuota. La coppia automatica e il salto con Tab alle parentesi sono entrambi **disabilitati all'interno di blocchi di codice e codice inline** — le parentesi nel codice rimangono letterali. Configurabile in **Impostazioni → Editor**.

[Scopri di più →](/it/guide/tab-navigation)

## Formattazione del Testo

### Stili di Base

- **Grassetto**, *Corsivo*, <u>Sottolineato</u>, ~~Barrato~~
- `Codice inline`, ==Evidenziato==
- Pedice e Apice
- Collegamenti, Wiki Link e Segnalibri con popup di anteprima
- Note a piè di pagina con modifica inline
- Attivazione/disattivazione commento HTML (`Mod + /`)
- Comando per cancellare la formattazione

### Trasformazioni del Testo

Cambia rapidamente le maiuscole/minuscole tramite Formato → Trasforma:

| Trasformazione | Scorciatoia |
|----------------|-------------|
| MAIUSCOLO | `Ctrl + Shift + U` (macOS) / `Alt + Shift + U` (Win/Linux) |
| minuscolo | `Ctrl + Shift + L` (macOS) / `Alt + Shift + L` (Win/Linux) |
| Prima Lettera Maiuscola | `Ctrl + Shift + T` (macOS) / `Alt + Shift + T` (Win/Linux) |
| Inverti Maiuscole | — |

### Elementi a Blocco

- Intestazioni da 1 a 6 con scorciatoie facili (aumenta/diminuisci il livello con `Mod + Alt + ]`/`[`)
- Citazioni (nidificazione supportata)
- Blocchi di codice con evidenziazione della sintassi
- Elenchi ordinati, non ordinati e di attività
- Regole orizzontali
- Tabelle con supporto completo alla modifica

### Interruzioni di Riga Forzate

Premi `Shift + Enter` per inserire un'interruzione di riga forzata all'interno di un paragrafo.
VMark usa lo stile a due spazi per impostazione predefinita per la massima compatibilità.
Configurabile in **Impostazioni > Editor > Spazi bianchi**.

### Operazioni sulle Righe

Potente manipolazione delle righe tramite Modifica → Righe:

| Azione | Scorciatoia |
|--------|-------------|
| Sposta riga su | `Alt + Su` |
| Sposta riga giù | `Alt + Giù` |
| Duplica riga | `Shift + Alt + Giù` |
| Elimina riga | `Mod + Shift + K` |
| Unisci righe | `Mod + J` |
| Rimuovi righe vuote | — |
| Ordina righe in modo crescente | `F4` |
| Ordina righe in modo decrescente | `Shift + F4` |

## Tabelle

Modifica completa delle tabelle:

- Inserisci tabelle tramite menu o scorciatoia
- Aggiungi/elimina righe e colonne
- Allineamento delle celle (sinistra, centro, destra)
- Ridimensiona le colonne trascinando
- Barra degli strumenti contestuale per azioni rapide
- Navigazione da tastiera (Tab, frecce, Enter)

## Immagini

Supporto completo per le immagini:

- Inserisci tramite finestra di dialogo file
- Trascina e rilascia dal file system
- Incolla dagli appunti
- Copia automatica nella cartella delle risorse del progetto
- Ridimensiona tramite menu contestuale
- Doppio clic per modificare il percorso sorgente, il testo alternativo e le dimensioni
- Alterna tra visualizzazione inline e a blocco

## Video e Audio

Supporto completo per i media con tag HTML5:

- Inserisci video e audio tramite il selettore file della barra degli strumenti
- Trascina e rilascia i file multimediali nell'editor
- Copia automatica nella cartella `.assets/` del progetto
- Fai clic per modificare il percorso sorgente, il titolo e il poster (video)
- Supporto per embed YouTube con iframe rispettosi della privacy
- Fallback per la sintassi delle immagini: `![](file.mp4)` viene promosso automaticamente a video
- Decorazione in modalità sorgente con bordi colorati specifici per tipo
- [Scopri di più →](/it/guide/media-support)

## Contenuto Speciale

### Riquadri Informativi

Avvisi in stile GitHub Flavored Markdown:

- NOTE - Informazioni generali
- TIP - Suggerimenti utili
- IMPORTANT - Informazioni chiave
- WARNING - Problemi potenziali
- CAUTION - Azioni pericolose

### Sezioni Comprimibili

Crea blocchi di contenuto espandibili usando l'elemento HTML `<details>`.

### Equazioni Matematiche

Rendering LaTeX basato su KaTeX:

- Matematica inline: `$E = mc^2$`
- Matematica a display: blocchi `$$...$$`
- Supporto completo della sintassi LaTeX
- Messaggi di errore utili con suggerimenti sulla sintassi

### Diagrammi

Supporto per diagrammi Mermaid con anteprima live:

- Diagrammi di flusso, diagrammi di sequenza, diagrammi di Gantt
- Diagrammi di classi, diagrammi di stato, diagrammi ER
- Pannello di anteprima live in modalità Sorgente (trascina, ridimensiona, zoom)
- [Scopri di più →](/it/guide/mermaid)

### Grafica SVG

Renderizza SVG grezzo inline tramite blocchi di codice ` ```svg `:

- Rendering istantaneo con panoramica, zoom ed esportazione PNG
- Anteprima live sia in modalità WYSIWYG che Sorgente
- Ideale per grafici generati dall'IA e illustrazioni personalizzate
- [Scopri di più →](/it/guide/svg)

## Genies IA

Assistenza alla scrittura IA integrata basata sul provider di tua scelta:

- 13 genies in quattro categorie — modifica, creativo, struttura e strumenti
- Selettore in stile Spotlight con ricerca e prompt liberi (`Mod + Y`)
- Rendering inline dei suggerimenti — accetta o rifiuta con scorciatoie da tastiera
- Supporta provider CLI (Claude, Codex, Gemini, Ollama) e API REST

[Scopri di più →](/it/guide/ai-genies) | [Configura i provider →](/it/guide/ai-providers)

## Cerca e Sostituisci

Apri la barra di ricerca con `Mod + F`. Appare inline nella parte superiore dell'area dell'editor e funziona sia in modalità WYSIWYG che Sorgente.

**Navigazione:**

| Azione | Scorciatoia |
|--------|-------------|
| Trova corrispondenza successiva | `Enter` o `Mod + G` |
| Trova corrispondenza precedente | `Shift + Enter` o `Mod + Shift + G` |
| Usa la selezione per la ricerca | `Mod + E` |
| Chiudi la barra di ricerca | `Escape` |

**Opzioni di ricerca** — attiva/disattiva tramite pulsanti nella barra di ricerca:

- **Distingui maiuscole/minuscole** — corrispondenza esatta delle lettere
- **Parola intera** — corrispondenza solo con parole complete, non sottosequenze
- **Espressione regolare** — usa pattern regex (abilita prima nelle Impostazioni)

**Sostituisci:**

Fai clic sulla freccia di espansione nella barra di ricerca per rivelare la riga di sostituzione. Digita il testo sostitutivo, poi usa **Sostituisci** (singola corrispondenza) o **Sostituisci tutto** (ogni corrispondenza in una volta). Il contatore di corrispondenze mostra la posizione corrente e il totale (es. "3 di 12") così sai sempre dove ti trovi.

## Opzioni di Esportazione

VMark offre opzioni di esportazione flessibili per condividere i tuoi documenti.

### Esportazione HTML

Esporta in HTML standalone con due modalità di confezionamento:

- **Modalità cartella** (predefinita): Crea `Documento/index.html` con le risorse in una sottocartella
- **Modalità file singolo**: Crea un file `.html` autonomo con immagini incorporate

L'HTML esportato include il [**VMark Reader**](/it/guide/export#vmark-reader) — controlli interattivi per impostazioni, sommario, lightbox delle immagini e altro.

[Scopri di più sull'esportazione →](/it/guide/export)

### Esportazione PDF

Stampa su PDF con la finestra di dialogo di sistema nativa (`Cmd/Ctrl + P`).

### Copia come HTML

Copia il contenuto formattato per incollarlo in altre app (`Cmd/Ctrl + Shift + C`).

### Formato di Copia

Per impostazione predefinita, la copia da WYSIWYG inserisce testo normale (senza formattazione) negli appunti. Abilita il formato di copia **Markdown** in **Impostazioni > Markdown > Incolla e Input** per inserire la sintassi Markdown in `text/plain` — le intestazioni mantengono i loro `#`, i collegamenti mantengono i loro URL, ecc. Utile quando si incolla in terminali, editor di codice o app di chat.

## Formattazione CJK

Strumenti integrati per la formattazione di testo cinese/giapponese/coreano:

- Oltre 20 regole di formattazione configurabili
- Spaziatura CJK-inglese
- Conversione dei caratteri a larghezza piena
- Normalizzazione della punteggiatura
- Abbinamento intelligente delle virgolette con rilevamento di apostrofi/apici
- Protezione dei costrutti tecnici (URL, versioni, orari, decimali)
- Conversione contestuale delle virgolette (curve per CJK, diritte per Latino)
- Alterna lo stile delle virgolette al cursore (`Shift + Mod + '`)
- [Scopri di più →](/it/guide/cjk-formatting)

## Cronologia Documenti

- Salvataggio automatico con intervallo configurabile
- Visualizza e ripristina versioni precedenti
- Formato di archiviazione JSONL
- Cronologia per singolo documento

## Visualizzazione e Focus

### Modalità Focus (`F8`)

La Modalità Focus attenua tutti i blocchi tranne quello che stai attualmente modificando, riducendo il rumore visivo così puoi concentrarti su un singolo paragrafo. Il blocco attivo è evidenziato a piena opacità mentre il contenuto circostante sfuma in un colore attenuato. Attivala con `F8` — funziona sia in modalità WYSIWYG che Sorgente e persiste finché non la disattivi.

### Modalità Macchina da Scrivere (`F9`)

La Modalità Macchina da Scrivere mantiene la riga attiva verticalmente centrata nel viewport, così i tuoi occhi rimangono in una posizione fissa mentre il documento scorre sotto — proprio come scrivere su una macchina da scrivere fisica. Attivala con `F9`. Funziona in entrambe le modalità di modifica e usa scorrimento fluido con una piccola soglia per evitare regolazioni instabili ai piccoli movimenti del cursore.

### Combinare Focus + Macchina da Scrivere

La Modalità Focus e la Modalità Macchina da Scrivere possono essere abilitate contemporaneamente. Insieme forniscono un ambiente di scrittura completamente privo di distrazioni: i blocchi circostanti sono attenuati *e* la riga corrente rimane centrata sullo schermo.

### Testo a Capo (`Alt + Z`)

Attiva/disattiva il ritorno a capo automatico con `Alt + Z`. Quando abilitato, le righe lunghe vanno a capo alla larghezza dell'editor invece di scorrere orizzontalmente. L'impostazione persiste tra le sessioni.

## Utilità di Testo

VMark include utilità per la pulizia e la formattazione del testo, disponibili nel menu Formato:

### Pulizia del Testo (Formato → Pulizia Testo)

- **Rimuovi spazi finali**: Elimina gli spazi bianchi alla fine delle righe
- **Comprimi righe vuote**: Riduci le righe vuote multiple a una singola

### Formattazione CJK (Formato → CJK)

Strumenti integrati per la formattazione del testo cinese/giapponese/coreano. [Scopri di più →](/it/guide/cjk-formatting)

### Pulizia Immagini (File → Pulisci immagini non utilizzate)

Trova e rimuovi le immagini orfane dalla tua cartella delle risorse.

## Terminale Integrato

Pannello terminale integrato con sessioni multiple, copia/incolla, ricerca, percorsi file e URL cliccabili, menu contestuale, sincronizzazione del tema e impostazioni font configurabili. Attiva/disattiva con `` Ctrl + ` ``. [Scopri di più →](/it/guide/terminal)

## Aggiornamento Automatico

VMark controlla automaticamente gli aggiornamenti e può scaricarli e installarli nell'app:

- Controllo automatico degli aggiornamenti all'avvio
- Installazione degli aggiornamenti con un clic
- Anteprima delle note di rilascio prima dell'aggiornamento

## Supporto Workspace

- Apri cartelle come workspace
- Navigazione ad albero dei file nella barra laterale
- Cambio rapido dei file
- Tracciamento dei file recenti
- Dimensione e posizione della finestra memorizzate tra le sessioni

[Scopri di più →](/it/guide/workspace-management)

## Personalizzazione

### Temi

Cinque temi di colore integrati:

- White (pulito, minimalista)
- Paper (bianco caldo)
- Mint (tinta verde morbida)
- Sepia (stile vintage)
- Night (modalità scura)

### Font

Configura font separati per:

- Testo Latino
- Testo CJK (cinese/giapponese/coreano)
- Monospace (codice)

### Layout

Regola:

- Dimensione del font
- Interlinea
- Spaziatura dei blocchi (spazio tra paragrafi e blocchi)
- Spaziatura delle lettere CJK (spaziatura sottile per la leggibilità CJK)
- Larghezza dell'editor
- Dimensione del font degli elementi a blocco (elenchi, citazioni, tabelle, avvisi)
- Allineamento delle intestazioni (sinistra o centro)
- Allineamento immagini e tabelle (sinistra o centro)

### Scorciatoie da Tastiera

Tutte le scorciatoie sono personalizzabili in Impostazioni → Scorciatoie.

## Dettagli Tecnici

VMark è costruito con tecnologia moderna:

| Componente | Tecnologia |
|-----------|------------|
| Framework Desktop | Tauri v2 (Rust) |
| Frontend | React 19, TypeScript |
| Gestione dello Stato | Zustand v5 |
| Editor Rich Text | Tiptap (ProseMirror) |
| Editor Sorgente | CodeMirror 6 |
| Stili | Tailwind CSS v4 |

Tutta l'elaborazione avviene localmente sul tuo computer — nessun servizio cloud, nessun account richiesto.
