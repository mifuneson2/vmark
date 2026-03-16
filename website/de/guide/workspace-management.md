# Arbeitsbereichsverwaltung

Ein Arbeitsbereich in VMark ist ein Ordner, der als Stammverzeichnis Ihres Projekts geöffnet wird. Wenn Sie einen Arbeitsbereich öffnen, zeigt die Seitenleiste eine Dateistruktur, Quick Open indiziert jede Markdown-Datei, das Terminal startet im Projektstammverzeichnis und Ihre geöffneten Tabs werden für das nächste Mal gespeichert.

Ohne einen Arbeitsbereich können Sie weiterhin einzelne Dateien öffnen, verlieren aber den Datei-Explorer, die projekteigene Suche und die Sitzungswiederherstellung.

## Arbeitsbereich öffnen

| Methode | Wie |
|---------|-----|
| Menü | **Datei > Arbeitsbereich öffnen** |
| Quick Open | `Mod + O`, dann unten **Durchsuchen...** auswählen |
| Drag-and-Drop | Eine Markdown-Datei aus dem Finder in das Fenster ziehen — VMark erkennt das Projektstammverzeichnis und öffnet den Arbeitsbereich automatisch |
| Zuletzt geöffnete Arbeitsbereiche | **Datei > Zuletzt geöffnete Arbeitsbereiche** und ein früheres Projekt auswählen |

Wenn Sie einen Arbeitsbereich öffnen, zeigt VMark die Seitenleiste mit dem Datei-Explorer. Wenn der Arbeitsbereich zuvor geöffnet war, werden die vorherigen Tabs wiederhergestellt.

::: tip
Wenn das aktuelle Fenster nicht gespeicherte Änderungen hat, bietet VMark an, den Arbeitsbereich in einem neuen Fenster zu öffnen, anstatt Ihre Arbeit zu ersetzen.
:::

## Datei-Explorer

Der Datei-Explorer erscheint in der Seitenleiste, wenn ein Arbeitsbereich geöffnet ist. Er zeigt eine Baumstruktur von Markdown-Dateien, die im Arbeitsbereichsordner verwurzelt ist.

### Navigation

- **Einfacher Klick** auf einen Ordner zum Auf- oder Zuklappen
- **Doppelklick** oder **Eingabe** auf eine Datei, um sie in einem Tab zu öffnen
- Nicht-Markdown-Dateien werden mit der Standardanwendung des Systems geöffnet

### Dateioperationen

Rechtsklick auf eine Datei oder einen Ordner für das Kontextmenü:

| Aktion | Beschreibung |
|--------|--------------|
| Öffnen | Datei in einem neuen Tab öffnen |
| Umbenennen | Datei- oder Ordnernamen inline bearbeiten (auch `F2`) |
| Duplizieren | Eine Kopie der Datei erstellen |
| Verschieben nach... | Datei über einen Dialog in einen anderen Ordner verschieben |
| Löschen | Datei oder Ordner in den Systempapierkopf verschieben |
| Pfad kopieren | Den absoluten Dateipfad in die Zwischenablage kopieren |
| Im Finder anzeigen | Die Datei im Finder anzeigen (macOS) |
| Neue Datei | Eine neue Markdown-Datei an dieser Stelle erstellen |
| Neuer Ordner | Einen neuen Ordner an dieser Stelle erstellen |

Sie können Dateien auch **per Drag-and-Drop** direkt in der Baumstruktur zwischen Ordnern verschieben.

### Sichtbarkeitsschalter

Standardmäßig zeigt der Explorer nur Markdown-Dateien und blendet Dotfiles aus. Zwei Schalter ändern dies:

| Schalter | Kürzel | Was er bewirkt |
|----------|--------|----------------|
| Versteckte Dateien anzeigen | `Mod + Umschalt + .` (macOS) / `Strg + H` (Win/Linux) | Zeigt Dotfiles und versteckte Ordner |
| Alle Dateien anzeigen | *(Einstellungen oder Kontextmenü)* | Zeigt Nicht-Markdown-Dateien neben Dokumenten |

Beide Einstellungen werden pro Arbeitsbereich gespeichert und bleiben über Sitzungen hinweg erhalten.

### Ausgeschlossene Ordner

Bestimmte Ordner sind standardmäßig aus der Baumstruktur ausgeschlossen:

- `.git`
- `node_modules`

Diese Standardwerte werden beim ersten Öffnen eines Arbeitsbereichs angewendet.

## Quick Open

`Mod + O` drücken, um das Quick Open-Overlay zu öffnen. Es bietet Fuzzy-Suche über drei Quellen:

1. **Zuletzt verwendete Dateien**, die Sie zuvor geöffnet haben
2. **Geöffnete Tabs** im aktuellen Fenster (mit einem Punktindikator markiert)
3. **Alle Markdown-Dateien** im Arbeitsbereich

Einige Zeichen eingeben, um zu filtern — die Übereinstimmung ist fuzzy, daher findet `rme` `README.md`. Pfeiltasten zur Navigation und **Eingabe** zum Öffnen verwenden. Eine angeheftete **Durchsuchen...**-Zeile am unteren Rand öffnet einen Dateidialog.

| Aktion | Kürzel |
|--------|--------|
| Quick Open öffnen | `Mod + O` |
| Ergebnisse navigieren | `Auf / Ab` |
| Ausgewählte Datei öffnen | `Eingabe` |
| Schließen | `Escape` |

::: tip
Ohne einen Arbeitsbereich funktioniert Quick Open weiterhin — es zeigt zuletzt geöffnete Dateien und geöffnete Tabs, kann aber nicht die Dateistruktur durchsuchen.
:::

## Zuletzt geöffnete Arbeitsbereiche

VMark merkt sich bis zu 10 zuletzt geöffnete Arbeitsbereiche. Diese sind über **Datei > Zuletzt geöffnete Arbeitsbereiche** in der Menüleiste zugänglich.

- Arbeitsbereiche werden nach zuletzt geöffneter Zeit sortiert (neueste zuerst)
- Die Liste wird bei jeder Änderung mit dem nativen Menü synchronisiert
- **Zuletzt geöffnete Arbeitsbereiche löschen** auswählen, um die Liste zurückzusetzen

## Arbeitsbereichseinstellungen

Jeder Arbeitsbereich hat seine eigene Konfiguration, die zwischen Sitzungen erhalten bleibt. Einstellungen werden im VMark-Anwendungsdatenverzeichnis gespeichert — nicht im Projektordner — damit Ihr Arbeitsbereich sauber bleibt.

Die folgenden Einstellungen werden pro Arbeitsbereich gespeichert:

| Einstellung | Beschreibung |
|-------------|--------------|
| Ausgeschlossene Ordner | Im Datei-Explorer ausgeblendete Ordner |
| Versteckte Dateien anzeigen | Ob Dotfiles sichtbar sind |
| Alle Dateien anzeigen | Ob Nicht-Markdown-Dateien sichtbar sind |
| Zuletzt geöffnete Tabs | Dateipfade für die Sitzungswiederherstellung beim nächsten Öffnen |

::: tip
Die Arbeitsbereichskonfiguration ist an den Ordnerpfad gebunden. Das Öffnen desselben Ordners auf demselben Rechner stellt immer Ihre Einstellungen wieder her, auch aus einem anderen Fenster.
:::

## Sitzungswiederherstellung

Wenn Sie ein Fenster schließen, das einen geöffneten Arbeitsbereich hat, speichert VMark die Liste der geöffneten Tabs in der Arbeitsbereichskonfiguration. Wenn Sie denselben Arbeitsbereich das nächste Mal öffnen, werden diese Tabs automatisch wiederhergestellt.

- Nur Tabs mit einem gespeicherten Dateipfad werden wiederhergestellt (unbenannte Tabs werden nicht gespeichert)
- Wenn eine Datei seit der letzten Sitzung verschoben oder gelöscht wurde, wird sie lautlos übersprungen
- Sitzungsdaten werden beim Schließen des Fensters und beim Schließen des Arbeitsbereichs gespeichert (`Datei > Arbeitsbereich schließen`)

## Mehrfachfenster

Jedes VMark-Fenster kann seinen eigenen unabhängigen Arbeitsbereich haben. So können Sie gleichzeitig an mehreren Projekten arbeiten.

- **Datei > Neues Fenster** öffnet ein frisches Fenster
- Das Öffnen eines Arbeitsbereichs in einem neuen Fenster beeinflusst andere Fenster nicht
- Fenstergröße und -position werden pro Fenster gespeichert

Wenn Sie eine Markdown-Datei aus dem Finder ziehen und das aktuelle Fenster nicht gespeicherte Arbeit hat, öffnet VMark das Projekt der Datei automatisch in einem neuen Fenster.

## Terminal-Integration

Das integrierte Terminal verwendet automatisch das Arbeitsbereichsstammverzeichnis als Arbeitsverzeichnis. Wenn Sie Arbeitsbereiche öffnen oder wechseln, wechseln alle Terminal-Sitzungen per `cd` zum neuen Stammverzeichnis.

Die Umgebungsvariable `VMARK_WORKSPACE` wird in jeder Terminal-Sitzung auf den Arbeitsbereichspfad gesetzt, damit Ihre Skripte das Projektstammverzeichnis referenzieren können.

[Mehr über das Terminal erfahren →](/de/guide/terminal)
