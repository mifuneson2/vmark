# Risoluzione dei problemi

## File di log

VMark scrive file di log per aiutare a diagnosticare i problemi. I log includono avvisi ed errori sia dal backend Rust che dal frontend.

### Posizione dei file di log

| Piattaforma | Percorso |
|-------------|----------|
| macOS | `~/Library/Logs/app.vmark/` |
| Windows | `%APPDATA%\app.vmark\logs\` |
| Linux | `~/.local/share/app.vmark/logs/` |

### Livelli di log

| Livello | Cosa viene registrato | Produzione | Sviluppo |
|---------|----------------------|------------|----------|
| Error | Guasti, arresti anomali | Sì | Sì |
| Warn | Problemi recuperabili, soluzioni alternative | Sì | Sì |
| Info | Traguardi, cambiamenti di stato | Sì | Sì |
| Debug | Tracciamento dettagliato | No | Sì |

### Rotazione dei log

- Dimensione massima del file: 5 MB
- Rotazione: mantiene un file di log precedente
- I log più vecchi vengono sostituiti automaticamente

## Segnalare bug

Quando segnali un bug, includi:

1. **Versione di VMark** — mostrata nel badge della barra di navigazione o nella finestra Informazioni
2. **Sistema operativo** — versione di macOS, build di Windows o distribuzione Linux
3. **Passaggi per riprodurre** — cosa hai fatto prima che si verificasse il problema
4. **File di log** — allega o incolla le voci di log pertinenti

Le voci di log sono contrassegnate con data e ora e taggate per modulo (ad esempio `[HotExit]`, `[MCP Bridge]`, `[Export]`), facilitando l'individuazione delle sezioni pertinenti.

### Trovare i log pertinenti

1. Apri la directory dei log indicata nella tabella sopra
2. Apri il file `.log` più recente
3. Cerca le voci `ERROR` o `WARN` vicine al momento in cui si è verificato il problema
4. Copia le righe pertinenti e includile nella tua segnalazione di bug

## Problemi comuni

### L'applicazione si avvia lentamente su Windows

VMark è ottimizzato per macOS. Su Windows, l'avvio potrebbe essere più lento a causa dell'inizializzazione di WebView2. Assicurati che:

- WebView2 Runtime sia aggiornato
- Il software antivirus non stia scansionando la directory dei dati dell'applicazione in tempo reale

### La barra dei menu mostra l'inglese dopo il cambio di lingua

Se la barra dei menu rimane in inglese dopo aver cambiato la lingua nelle Impostazioni, riavvia VMark. Il menu viene ricostruito al prossimo avvio con la lingua salvata.

### Il terminale non accetta la punteggiatura CJK

Corretto nella versione v0.6.5+. Aggiorna all'ultima versione.
