# Medienunterstützung

VMark unterstützt Video-, Audio- und YouTube-Einbettungen in Ihren Markdown-Dokumenten mit Standard-HTML5-Tags.

## Unterstützte Formate

### Video

| Format | Erweiterung |
|--------|-------------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### Audio

| Format | Erweiterung |
|--------|-------------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## Syntax

### Video

Standard-HTML5-Video-Tags verwenden:

```html
<video src="path/to/video.mp4" controls></video>
```

Mit optionalen Attributen:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### Audio

Standard-HTML5-Audio-Tags verwenden:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### YouTube-Einbettungen

Datenschutzverbesserte YouTube-iFrames verwenden:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Bildsyntax-Fallback

Sie können auch Bildsyntax mit Mediendateiendungen verwenden — VMark befördert diese automatisch zum korrekten Medientyp:

```markdown
![](video.mp4)
![](audio.mp3)
```

## Medien einfügen

### Symbolleiste

Das Einfügen-Menü in der Symbolleiste verwenden:

- **Video** — öffnet eine Dateiauswahl für Videodateien, kopiert in `.assets/`, fügt einen `<video>`-Tag ein
- **Audio** — öffnet eine Dateiauswahl für Audiodateien, kopiert in `.assets/`, fügt einen `<audio>`-Tag ein
- **YouTube** — liest eine YouTube-URL aus der Zwischenablage und fügt eine datenschutzverbesserte Einbettung ein

### Drag & Drop

Video- oder Audiodateien aus Ihrem Dateisystem direkt in den Editor ziehen. VMark wird:

1. Die Datei in den `.assets/`-Ordner des Dokuments kopieren
2. Den entsprechenden Medienknoten mit einem relativen Pfad einfügen

### Quellmodus

Im Quellmodus HTML-Tags direkt eingeben. Medien-Tags werden mit farbigen linken Rändern hervorgehoben:

- **Video** — Blaugrüner Rand
- **Audio** — Indigoblauer Rand
- **YouTube** — Roter Rand

## Medien bearbeiten

Doppelklicken Sie auf ein beliebiges Medienelement im WYSIWYG-Modus, um das Medien-Popup zu öffnen:

- **Quellpfad** — den Dateipfad oder die URL bearbeiten
- **Titel** — optionales Titelattribut
- **Poster** (nur Video) — Pfad zum Vorschaubild
- **Entfernen** — das Medienelement löschen

`Escape` drücken, um das Popup zu schließen und zum Editor zurückzukehren.

## Pfadauflösung

VMark unterstützt drei Arten von Medienpfaden:

| Pfadtyp | Beispiel | Verhalten |
|---------|---------|-----------|
| Relativ | `./assets/video.mp4` | Relativ zum Verzeichnis des Dokuments aufgelöst |
| Absolut | `/Users/ich/video.mp4` | Direkt über das Tauri-Asset-Protokoll verwendet |
| Externe URL | `https://example.com/video.mp4` | Direkt aus dem Web geladen |

Relative Pfade werden empfohlen — sie halten Ihre Dokumente über Rechner hinweg portabel.

## Sicherheit

- Relative Pfade werden gegen Directory-Traversal-Angriffe validiert
- YouTube-iFrames sind auf die Domains `youtube.com` und `youtube-nocookie.com` beschränkt
- Andere iFrame-Quellen werden vom Bereiniger entfernt
