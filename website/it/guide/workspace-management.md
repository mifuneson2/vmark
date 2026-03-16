# Gestione del Workspace

Un workspace in VMark è una cartella aperta come radice del tuo progetto. Quando apri un workspace, la barra laterale mostra un albero dei file, Apertura Rapida indicizza ogni file markdown, il terminale si avvia nella radice del progetto e le schede aperte vengono ricordate per la prossima volta.

Senza un workspace puoi ancora aprire singoli file, ma perdi l'esplora file, la ricerca nel progetto e il ripristino della sessione.

## Apertura di un Workspace

| Metodo | Come |
|--------|------|
| Menu | **File > Apri Workspace** |
| Apertura Rapida | `Mod + O`, poi seleziona **Sfoglia...** in fondo |
| Trascina e rilascia | Trascina un file markdown da Finder nella finestra — VMark rileva la radice del progetto e apre il workspace automaticamente |
| Workspace Recenti | **File > Workspace Recenti** e scegli un progetto precedente |

Quando apri un workspace, VMark mostra la barra laterale con l'esplora file. Se il workspace è stato aperto in precedenza, le schede aperte in precedenza vengono ripristinate.

::: tip
Se la finestra corrente ha modifiche non salvate, VMark offre di aprire il workspace in una nuova finestra invece di sostituire il tuo lavoro.
:::

## Esplora File

L'esplora file appare nella barra laterale ogni volta che un workspace è aperto. Mostra un albero di file markdown con radice nella cartella del workspace.

### Navigazione

- **Clic singolo** su una cartella per espanderla o comprimerla
- **Doppio clic** o **Invio** su un file per aprirlo in una scheda
- I file non-markdown si aprono con l'applicazione predefinita del sistema

### Operazioni sui File

Clic destro su qualsiasi file o cartella per accedere al menu contestuale:

| Azione | Descrizione |
|--------|-------------|
| Apri | Apri il file in una nuova scheda |
| Rinomina | Modifica il nome del file o della cartella inline (anche `F2`) |
| Duplica | Crea una copia del file |
| Sposta in... | Sposta il file in una cartella diversa tramite una finestra di dialogo |
| Elimina | Sposta il file o la cartella nel cestino di sistema |
| Copia Percorso | Copia il percorso assoluto del file negli appunti |
| Mostra in Finder | Mostra il file in Finder (macOS) |
| Nuovo File | Crea un nuovo file markdown in questa posizione |
| Nuova Cartella | Crea una nuova cartella in questa posizione |

Puoi anche **trascinare e rilasciare** i file tra le cartelle direttamente nell'albero.

### Toggle di Visibilità

Per impostazione predefinita l'esplora mostra solo i file markdown e nasconde i dotfile. Due toggle cambiano questo:

| Toggle | Scorciatoia | Cosa fa |
|--------|-------------|---------|
| Mostra File Nascosti | `Mod + Shift + .` (macOS) / `Ctrl + H` (Win/Linux) | Mostra i dotfile e le cartelle nascoste |
| Mostra Tutti i File | *(Impostazioni o menu contestuale)* | Mostra i file non-markdown insieme ai tuoi documenti |

Entrambe le impostazioni vengono salvate per workspace e persistono tra le sessioni.

### Cartelle Escluse

Alcune cartelle sono escluse dall'albero per impostazione predefinita:

- `.git`
- `node_modules`

Queste impostazioni predefinite vengono applicate quando un workspace viene aperto per la prima volta.

## Apertura Rapida

Premi `Mod + O` per aprire l'overlay di Apertura Rapida. Fornisce una ricerca fuzzy su tre sorgenti:

1. **File recenti** che hai aperto in precedenza
2. **Schede aperte** nella finestra corrente (contrassegnate con un indicatore a punto)
3. **Tutti i file markdown** nel workspace

Digita alcuni caratteri per filtrare — la corrispondenza è fuzzy, quindi `rdm` trova `README.md`. Usa i tasti freccia per navigare e **Invio** per aprire. Una riga **Sfoglia...** bloccata in fondo apre una finestra di dialogo file.

| Azione | Scorciatoia |
|--------|-------------|
| Apri Apertura Rapida | `Mod + O` |
| Naviga i risultati | `Su / Giù` |
| Apri il file selezionato | `Invio` |
| Chiudi | `Escape` |

::: tip
Senza un workspace, Apertura Rapida funziona ancora — mostra i file recenti e le schede aperte ma non può cercare nell'albero dei file.
:::

## Workspace Recenti

VMark ricorda fino a 10 workspace aperti di recente. Accedili da **File > Workspace Recenti** nella barra dei menu.

- I workspace sono ordinati per ora dell'ultima apertura (il più recente per primo)
- L'elenco si sincronizza con il menu nativo ad ogni modifica
- Scegli **Cancella Workspace Recenti** per azzerare l'elenco

## Impostazioni del Workspace

Ogni workspace ha la propria configurazione che persiste tra le sessioni. Le impostazioni vengono memorizzate nella directory dei dati dell'applicazione VMark — non all'interno della cartella del progetto — in modo che il tuo workspace rimanga pulito.

Le seguenti impostazioni vengono salvate per workspace:

| Impostazione | Descrizione |
|-------------|-------------|
| Cartelle escluse | Cartelle nascoste dall'esplora file |
| Mostra file nascosti | Se i dotfile sono visibili |
| Mostra tutti i file | Se i file non-markdown sono visibili |
| Ultime schede aperte | Percorsi dei file per il ripristino della sessione alla prossima apertura |

::: tip
La configurazione del workspace è legata al percorso della cartella. Aprire la stessa cartella sulla stessa macchina ripristina sempre le tue impostazioni, anche da una finestra diversa.
:::

## Ripristino della Sessione

Quando chiudi una finestra che ha un workspace aperto, VMark salva l'elenco delle schede aperte nella configurazione del workspace. La prossima volta che apri lo stesso workspace, quelle schede vengono ripristinate automaticamente.

- Vengono ripristinate solo le schede con un percorso file salvato (le schede senza titolo non vengono persistite)
- Se un file è stato spostato o eliminato dall'ultima sessione, viene saltato silenziosamente
- I dati della sessione vengono salvati alla chiusura della finestra e alla chiusura del workspace (**File > Chiudi Workspace**)

## Multi-Finestra

Ogni finestra VMark può avere il proprio workspace indipendente. Questo ti consente di lavorare su più progetti contemporaneamente.

- **File > Nuova Finestra** apre una finestra nuova
- L'apertura di un workspace in una nuova finestra non influisce sulle altre finestre
- Le dimensioni e la posizione della finestra vengono ricordate per finestra

Quando trascini un file markdown da Finder e la finestra corrente ha già lavoro non salvato, VMark apre il progetto del file in una nuova finestra automaticamente.

## Integrazione con il Terminale

Il terminale integrato usa automaticamente la radice del workspace come directory di lavoro. Quando apri o cambi workspace, tutte le sessioni del terminale eseguono `cd` alla nuova radice.

La variabile d'ambiente `VMARK_WORKSPACE` è impostata sul percorso del workspace in ogni sessione del terminale, in modo che i tuoi script possano fare riferimento alla radice del progetto.

[Scopri di più sul terminale →](/it/guide/terminal)
