# Inline-Popups

VMark bietet kontextbezogene Popups zum Bearbeiten von Links, Bildern, Medien, Mathematik, Fußnoten und mehr. Diese Popups funktionieren sowohl im WYSIWYG- als auch im Quellmodus mit einheitlicher Tastaturnavigation.

## Gemeinsame Tastaturkürzel

Alle Popups teilen dieses Tastaturverhalten:

| Aktion | Kürzel |
|--------|--------|
| Schließen/Abbrechen | `Escape` |
| Bestätigen/Speichern | `Eingabe` |
| Felder navigieren | `Tab` / `Umschalt + Tab` |

## Link-Tooltip & Popup

VMark verwendet ein zweistufiges System für Links: ein Nur-Lese-Tooltip beim Hovern und ein Bearbeitungs-Popup über Tastaturkürzel.

### Hover-Tooltip (Nur-Lese)

**Auslöser:** Über Link hovern (300ms Verzögerung)

**Zeigt:**
- **URL-Vorschau** — Gekürzte URL mit vollständiger URL beim Hovern
- **Öffnen-Schaltfläche** — Öffnet Link im Browser (oder springt zur Überschrift bei `#Lesezeichen`)

**Verhalten:** Nur anzeigen. Maus wegbewegen zum Schließen.

### Bestehenden Link bearbeiten

**Auslöser:** Cursor im Link platzieren + `Mod + K`

**Felder:**
- **URL** — Link-Ziel bearbeiten
- **Öffnen** — Link im Browser öffnen
- **Kopieren** — URL in die Zwischenablage kopieren
- **Löschen** — Link entfernen, Text behalten

### Neuen Link erstellen

**Auslöser:** Text auswählen + `Mod + K`

**Intelligente Zwischenablage:** Wenn Ihre Zwischenablage eine URL enthält, wird sie automatisch eingetragen.

**Felder:**
- **URL-Eingabe** — Ziel eingeben
- **Bestätigen** — Eingabe drücken oder ✓ klicken
- **Abbrechen** — Escape drücken oder ✗ klicken

### Quellmodus

- **`Cmd + Klick`** auf Link → im Browser öffnen
- **Klick** auf `[Text](url)`-Syntax → Bearbeitungs-Popup anzeigen
- **`Mod + K`** innerhalb Link → Bearbeitungs-Popup anzeigen

::: tip Lesezeichen-Links
Links, die mit `#` beginnen, werden als Lesezeichen (interne Überschriften-Links) behandelt. Öffnen springt zur Überschrift anstatt einen Browser zu öffnen.
:::

## Medien-Popup (Bilder, Video, Audio)

Ein einheitliches Popup zum Bearbeiten aller Medientypen — Bilder, Video und Audio.

### Bearbeitungs-Popup

**Auslöser:** Doppelklick auf ein beliebiges Medienelement (Bild, Video oder Audio)

**Gemeinsame Felder (alle Medientypen):**
- **Quelle** — Dateipfad oder URL

**Typspezifische Felder:**

| Feld | Bild | Video | Audio |
|------|------|-------|-------|
| Alternativtext | Ja | — | — |
| Titel | — | Ja | Ja |
| Poster | — | Ja | — |
| Abmessungen | Nur-Lese | — | — |
| Inline/Block-Umschalter | Ja | — | — |

**Schaltflächen:**
- **Durchsuchen** — Datei aus dem Dateisystem auswählen
- **Kopieren** — Quellpfad in die Zwischenablage kopieren
- **Löschen** — Das Medienelement entfernen

**Kürzel:**
- `Mod + Umschalt + I` — Neues Bild einfügen
- `Eingabe` — Änderungen speichern
- `Escape` — Popup schließen

### Quellmodus

Im Quellmodus öffnet das Klicken auf Bildsyntax `![alt](pfad)` dasselbe Medien-Popup. Mediendateien (Video-/Audioendungen) zeigen eine schwebende Vorschau mit nativen Wiedergabe-Steuerelementen beim Hovern.

## Bild-Kontextmenü

Rechtsklick auf ein Bild im WYSIWYG-Modus öffnet ein Kontextmenü mit Schnellaktionen (getrennt vom Doppelklick-Bearbeitungs-Popup).

**Auslöser:** Rechtsklick auf ein beliebiges Bild

**Aktionen:**
| Aktion | Beschreibung |
|--------|--------------|
| Bild ändern | Dateiauswahl öffnen, um das Bild zu ersetzen |
| Bild löschen | Das Bild aus dem Dokument entfernen |
| Pfad kopieren | Den Quellpfad des Bildes in die Zwischenablage kopieren |
| Im Finder anzeigen | Den Speicherort der Bilddatei im Dateimanager öffnen (Beschriftung passt sich je nach Plattform an) |

`Escape` drücken, um das Kontextmenü ohne Aktion zu schließen.

## Mathematik-Popup

LaTeX-Mathematikausdrücke mit Live-Vorschau bearbeiten.

**Auslöser:**
- **WYSIWYG:** Auf Inline-Mathematik `$...$` klicken
- **Quelle:** Cursor innerhalb von `$...$`, `$$...$$` oder ` ```latex `-Blöcken platzieren

**Felder:**
- **LaTeX-Eingabe** — Den Mathematikausdruck bearbeiten
- **Vorschau** — Echtzeit-gerenderte Vorschau
- **Fehleranzeige** — Zeigt LaTeX-Fehler mit hilfreichen Syntaxhinweisen

**Kürzel:**
- `Mod + Eingabe` — Speichern und schließen
- `Escape` — Abbrechen und schließen
- `Umschalt + Rücktaste` — Inline-Mathematik löschen (funktioniert auch bei nicht-leerem Inhalt, nur WYSIWYG)
- `Alt + Mod + M` — Neue Inline-Mathematik einfügen

::: tip Fehlerhinweise
Bei einem LaTeX-Syntaxfehler zeigt das Popup hilfreiche Vorschläge wie fehlende Klammern, unbekannte Befehle oder unausgeglichene Begrenzer.
:::

::: info Quellmodus
Der Quellmodus bietet dasselbe bearbeitbare Mathematik-Popup wie der WYSIWYG-Modus — ein Textfeld für die LaTeX-Eingabe mit einer Live-KaTeX-Vorschau darunter. Das Popup öffnet sich automatisch, wenn der Cursor in eine Mathematik-Syntax eintritt (`$...$`, `$$...$$` oder ` ```latex `). Drücken Sie `Mod + Eingabe` zum Speichern oder `Escape` zum Abbrechen.
:::

## Fußnoten-Popup

Fußnoteninhalt inline bearbeiten.

**Auslöser:**
- **WYSIWYG:** Über Fußnotenreferenz `[^1]` hovern

**Felder:**
- **Inhalt** — Mehrzeiliger Fußnotentext (automatische Größenanpassung)
- **Zur Definition springen** — Zur Fußnotendefinition springen
- **Löschen** — Fußnote entfernen

**Verhalten:**
- Neue Fußnoten fokussieren automatisch das Inhaltsfeld
- Textarea erweitert sich beim Tippen

## Wiki-Link-Popup

Wiki-Stil-Links für interne Dokumentverbindungen bearbeiten.

**Auslöser:**
- **WYSIWYG:** Über `[[ziel]]` hovern (300ms Verzögerung)
- **Quelle:** Auf Wiki-Link-Syntax klicken

**Felder:**
- **Ziel** — Arbeitsbereich-relativer Pfad (`.md`-Erweiterung automatisch behandelt)
- **Durchsuchen** — Datei aus dem Arbeitsbereich auswählen
- **Öffnen** — Verlinktes Dokument öffnen
- **Kopieren** — Zielpfad kopieren
- **Löschen** — Wiki-Link entfernen

## Tabellen-Kontextmenü

Schnelle Tabellen-Bearbeitungsaktionen.

**Auslöser:**
- **WYSIWYG:** Symbolleiste oder Tastaturkürzel verwenden
- **Quelle:** Rechtsklick auf Tabellenzelle

**Aktionen:**
| Aktion | Beschreibung |
|--------|--------------|
| Zeile darüber/darunter einfügen | Zeile am Cursor hinzufügen |
| Spalte links/rechts einfügen | Spalte am Cursor hinzufügen |
| Zeile löschen | Aktuelle Zeile entfernen |
| Spalte löschen | Aktuelle Spalte entfernen |
| Tabelle löschen | Gesamte Tabelle entfernen |
| Spalte links/zentriert/rechts ausrichten | Ausrichtung für aktuelle Spalte festlegen |
| Alle links/zentriert/rechts ausrichten | Ausrichtung für alle Spalten festlegen |
| Tabelle formatieren | Tabellenspalten automatisch ausrichten (Markdown verschönern) |

## Rechtschreibprüfungs-Popup

Rechtschreibfehler mit Vorschlägen korrigieren.

**Auslöser:**
- Rechtsklick auf falsch geschriebenes Wort (rote Unterstreichung)

**Aktionen:**
- **Vorschläge** — Klicken, um durch Vorschlag zu ersetzen
- **Zum Wörterbuch hinzufügen** — Aufhören, als falsch geschrieben zu markieren

## Modusvergleich

| Element | WYSIWYG-Bearbeitung | Quelle |
|---------|---------------------|--------|
| Link | Hover-Tooltip / `Mod+K` | Klick / `Mod+K` / `Cmd+Klick` zum Öffnen |
| Bild | Doppelklick | Klick auf `![](pfad)` |
| Video | Doppelklick | — |
| Audio | Doppelklick | — |
| Mathematik | Klick | Cursor in Mathematik → Popup |
| Fußnote | Hover | Direkte Bearbeitung |
| Wiki-Link | Hover | Klick |
| Tabelle | Symbolleiste | Rechtsklick-Menü |
| Rechtschreibprüfung | Rechtsklick | Rechtsklick |

## Popup-Navigationstipps

### Fokusfluss
1. Popup öffnet sich mit fokussiertem ersten Eingabefeld
2. `Tab` bewegt vorwärts durch Felder und Schaltflächen
3. `Umschalt + Tab` bewegt rückwärts
4. Fokus bleibt innerhalb des Popups

### Schnelle Bearbeitung
- Für einfache URL-Änderungen: bearbeiten und `Eingabe` drücken
- Zum Abbrechen: `Escape` aus einem beliebigen Feld drücken
- Für mehrzeiligen Inhalt (Fußnoten, Mathematik): `Mod + Eingabe` zum Speichern verwenden

### Mausverhalten
- Außerhalb des Popups klicken zum Schließen (Änderungen werden verworfen)
- Hover-Popups (Link, Fußnote, Wiki) haben 300ms Verzögerung vor dem Anzeigen
- Maus zurück zum Popup bewegen hält es offen

<!-- Styles in style.css -->
