# Fehlerbehebung

## Protokolldateien

VMark erstellt Protokolldateien, um bei der Diagnose von Problemen zu helfen. Die Protokolle enthalten Warnungen und Fehler sowohl vom Rust-Backend als auch vom Frontend.

### Speicherorte der Protokolldateien

| Plattform | Pfad |
|-----------|------|
| macOS | `~/Library/Logs/app.vmark/` |
| Windows | `%APPDATA%\app.vmark\logs\` |
| Linux | `~/.local/share/app.vmark/logs/` |

### Protokollstufen

| Stufe | Was protokolliert wird | Produktion | Entwicklung |
|-------|------------------------|------------|-------------|
| Error | Fehler, Abstürze | Ja | Ja |
| Warn | Behebbare Probleme, Ausweichlösungen | Ja | Ja |
| Info | Meilensteine, Statusänderungen | Ja | Ja |
| Debug | Detaillierte Nachverfolgung | Nein | Ja |

### Protokollrotation

- Maximale Dateigröße: 5 MB
- Rotation: behält eine vorherige Protokolldatei
- Alte Protokolle werden automatisch ersetzt

## Fehler melden

Beim Melden eines Fehlers gib bitte Folgendes an:

1. **VMark-Version** — angezeigt im Badge der Navigationsleiste oder im Über-Dialog
2. **Betriebssystem** — macOS-Version, Windows-Build oder Linux-Distribution
3. **Schritte zur Reproduktion** — was du getan hast, bevor das Problem auftrat
4. **Protokolldatei** — hänge die relevanten Protokolleinträge an oder füge sie ein

Protokolleinträge sind mit Zeitstempel versehen und nach Modul gekennzeichnet (z. B. `[HotExit]`, `[MCP Bridge]`, `[Export]`), sodass relevante Abschnitte leicht zu finden sind.

### Relevante Protokolle finden

1. Öffne das Protokollverzeichnis aus der obigen Tabelle
2. Öffne die neueste `.log`-Datei
3. Suche nach `ERROR`- oder `WARN`-Einträgen in der Nähe des Zeitpunkts, an dem das Problem auftrat
4. Kopiere die relevanten Zeilen und füge sie deinem Fehlerbericht bei

## Häufige Probleme

### App startet unter Windows langsam

VMark ist für macOS optimiert. Unter Windows kann der Start aufgrund der WebView2-Initialisierung langsamer sein. Stelle sicher, dass:

- WebView2 Runtime auf dem neuesten Stand ist
- Die Antivirensoftware das App-Datenverzeichnis nicht in Echtzeit scannt

### Menüleiste zeigt nach Sprachwechsel weiterhin Englisch

Wenn die Menüleiste nach dem Sprachwechsel in den Einstellungen weiterhin Englisch anzeigt, starte VMark neu. Das Menü wird beim nächsten Start mit der gespeicherten Sprache neu aufgebaut.

### Terminal akzeptiert keine CJK-Satzzeichen

Behoben ab v0.6.5+. Aktualisiere auf die neueste Version.
