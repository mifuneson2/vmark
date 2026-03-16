# VMark herunterladen

<script setup>
import DownloadButton from '../.vitepress/components/DownloadButton.vue'
</script>

<DownloadButton />

## Systemanforderungen

- macOS 10.15 (Catalina) oder neuer
- Apple Silicon (M1/M2/M3) oder Intel-Prozessor
- 200 MB Festplattenspeicher

## Installation

**Homebrew (Empfohlen)**

```bash
brew install xiaolai/tap/vmark
```

Damit wird VMark installiert und automatisch die richtige Version für Ihren Mac ausgewählt (Apple Silicon oder Intel).

**Upgrade**

```bash
brew update && brew upgrade vmark
```

**Manuelle Installation**

1. Laden Sie die `.dmg`-Datei herunter
2. Öffnen Sie die heruntergeladene Datei
3. Ziehen Sie VMark in Ihren Programmordner
4. Beim ersten Start klicken Sie mit der rechten Maustaste auf die App und wählen Sie „Öffnen", um Gatekeeper zu umgehen

## Windows & Linux

VMark ist mit Tauri entwickelt, das plattformübergreifende Kompilierung unterstützt. **Die aktive Entwicklung und das Testen konzentrieren sich jedoch derzeit auf macOS.** Die Windows- und Linux-Unterstützung ist aufgrund von Ressourcenbeschränkungen auf absehbare Zeit begrenzt.

Wenn Sie VMark unter Windows oder Linux ausführen möchten:

- **Vorgefertigte Binärdateien** sind auf [GitHub Releases](https://github.com/xiaolai/vmark/releases) verfügbar (ohne garantierten Support bereitgestellt)
- **Aus dem Quellcode bauen** gemäß den folgenden Anweisungen

## Downloads verifizieren

Alle Releases werden automatisch über GitHub Actions erstellt. Sie können die Authentizität überprüfen, indem Sie das Release auf unserer [GitHub Releases-Seite](https://github.com/xiaolai/vmark/releases) prüfen.

## Aus dem Quellcode bauen

Für Entwickler, die VMark aus dem Quellcode bauen möchten:

```bash
# Repository klonen
git clone https://github.com/xiaolai/vmark.git
cd vmark

# Abhängigkeiten installieren
pnpm install

# Für die Produktion bauen
pnpm tauri build
```

Detaillierte Build-Anweisungen und Voraussetzungen finden Sie in der [README](https://github.com/xiaolai/vmark#readme).
