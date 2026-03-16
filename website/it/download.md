# Scarica VMark

<script setup>
import DownloadButton from '../.vitepress/components/DownloadButton.vue'
</script>

<DownloadButton />

## Requisiti di Sistema

- macOS 10.15 (Catalina) o versioni successive
- Processore Apple Silicon (M1/M2/M3) o Intel
- 200 MB di spazio su disco

## Installazione

**Homebrew (Consigliato)**

```bash
brew install xiaolai/tap/vmark
```

Questo installa VMark e seleziona automaticamente la versione corretta per il tuo Mac (Apple Silicon o Intel).

**Aggiornamento**

```bash
brew update && brew upgrade vmark
```

**Installazione Manuale**

1. Scarica il file `.dmg`
2. Apri il file scaricato
3. Trascina VMark nella cartella Applicazioni
4. Al primo avvio, fai clic destro sull'app e seleziona "Apri" per ignorare Gatekeeper

## Windows e Linux

VMark è costruito con Tauri, che supporta la compilazione multipiattaforma. Tuttavia, **lo sviluppo e i test attivi sono attualmente concentrati su macOS**. Il supporto per Windows e Linux è limitato nel prevedibile futuro a causa di vincoli di risorse.

Se desideri eseguire VMark su Windows o Linux:

- **Binari precompilati** sono disponibili su [GitHub Releases](https://github.com/xiaolai/vmark/releases) (forniti così come sono, senza supporto garantito)
- **Compila dal sorgente** seguendo le istruzioni qui sotto

## Verifica dei Download

Tutte le versioni vengono compilate automaticamente tramite GitHub Actions. Puoi verificare l'autenticità controllando la release sulla nostra [pagina GitHub Releases](https://github.com/xiaolai/vmark/releases).

## Compilazione dal Sorgente

Per gli sviluppatori che desiderano compilare VMark dal sorgente:

```bash
# Clona il repository
git clone https://github.com/xiaolai/vmark.git
cd vmark

# Installa le dipendenze
pnpm install

# Compila per la produzione
pnpm tauri build
```

Consulta il [README](https://github.com/xiaolai/vmark#readme) per istruzioni di compilazione dettagliate e prerequisiti.
