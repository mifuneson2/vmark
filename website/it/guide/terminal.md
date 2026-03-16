# Terminale Integrato

VMark include un pannello terminale integrato per eseguire comandi senza lasciare l'editor.

Premi `` Ctrl + ` `` per attivare/disattivare il pannello terminale.

## Sessioni

Il terminale supporta fino a 5 sessioni concorrenti, ognuna con il proprio processo shell. Una barra delle schede verticale sul lato destro mostra le schede delle sessioni numerate.

| Azione | Come |
|--------|------|
| Nuova sessione | Fai clic sul pulsante **+** |
| Cambia sessione | Fai clic su un numero di scheda |
| Chiudi sessione | Fai clic sull'icona cestino |
| Riavvia shell | Fai clic sull'icona riavvia |

Quando chiudi l'ultima sessione, il pannello si nasconde ma la sessione rimane attiva — riapri con `` Ctrl + ` `` e sei dove hai lasciato. Se un processo shell termina, premi qualsiasi tasto per riavviarlo.

## Scorciatoie da Tastiera

Queste scorciatoie funzionano quando il pannello terminale è in focus:

| Azione | Scorciatoia |
|--------|-------------|
| Copia | `Mod + C` (con selezione) |
| Incolla | `Mod + V` |
| Cancella | `Mod + K` |
| Cerca | `Mod + F` |
| Attiva/disattiva Terminale | `` Ctrl + ` `` |

::: tip
`Mod + C` senza una selezione di testo invia SIGINT al processo in esecuzione — uguale a premere Ctrl+C in un terminale normale.
:::

## Ricerca

Premi `Mod + F` per aprire la barra di ricerca. Digita per cercare in modo incrementale nel buffer del terminale.

| Azione | Scorciatoia |
|--------|-------------|
| Corrispondenza successiva | `Invio` |
| Corrispondenza precedente | `Shift + Invio` |
| Chiudi ricerca | `Escape` |

## Menu Contestuale

Clic destro all'interno del terminale per accedere a:

- **Copia** — copia il testo selezionato (disabilitato quando niente è selezionato)
- **Incolla** — incolla dagli appunti nella shell
- **Seleziona Tutto** — seleziona l'intero buffer del terminale
- **Cancella** — cancella l'output visibile

## Collegamenti Cliccabili

Il terminale rileva due tipi di collegamenti nell'output dei comandi:

- **URL web** — fai clic per aprire nel tuo browser predefinito
- **Percorsi file** — fai clic per aprire il file nell'editor (supporta suffissi `:riga:colonna` e percorsi relativi risolti rispetto alla radice del workspace)

## Ambiente Shell

VMark imposta queste variabili d'ambiente in ogni sessione del terminale:

| Variabile | Valore |
|-----------|--------|
| `TERM_PROGRAM` | `vmark` |
| `EDITOR` | `vmark` |
| `VMARK_WORKSPACE` | Percorso radice del workspace (quando una cartella è aperta) |
| `PATH` | PATH completo della shell di login (uguale al terminale di sistema) |

Il terminale integrato eredita il `PATH` della shell di login, quindi gli strumenti CLI come `node`, `claude` e altri binari installati dall'utente sono accessibili — proprio come in una finestra terminale normale.

La shell viene letta da `$SHELL` (ricade su `/bin/sh`). La directory di lavoro inizia alla radice del workspace, o alla directory padre del file attivo, o `$HOME`.

Le scorciatoie shell standard come `Ctrl+R` (ricerca cronologia inversa in zsh/bash) funzionano quando il terminale è in focus — non vengono intercettate dall'editor.

Quando apri un workspace o un file dopo che il terminale è già in esecuzione, tutte le sessioni eseguono automaticamente `cd` alla nuova radice del workspace.

## Impostazioni

Apri **Impostazioni → Terminale** per configurare:

| Impostazione | Intervallo | Predefinito |
|-------------|-----------|-------------|
| Dimensione Font | 10 – 24 px | 13 px |
| Interlinea | 1.0 – 2.0 | 1.2 |
| Copia alla Selezione | Attivo / Off | Off |

Le modifiche si applicano immediatamente a tutte le sessioni aperte.

## Persistenza

La visibilità e l'altezza del pannello terminale vengono salvate e ripristinate tra i riavvii hot-exit. I processi shell stessi non possono essere preservati — una shell nuova viene avviata per ogni sessione al riavvio.
