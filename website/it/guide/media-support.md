# Supporto Media

VMark supporta video, audio ed embed YouTube nei tuoi documenti Markdown usando i tag HTML5 standard.

## Formati Supportati

### Video

| Formato | Estensione |
|---------|-----------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### Audio

| Formato | Estensione |
|---------|-----------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## Sintassi

### Video

Usa i tag video HTML5 standard:

```html
<video src="path/to/video.mp4" controls></video>
```

Con attributi opzionali:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### Audio

Usa i tag audio HTML5 standard:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### Embed YouTube

Usa iframe YouTube con privacy migliorata:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Fallback Sintassi Immagine

Puoi anche usare la sintassi delle immagini con estensioni di file multimediali — VMark le promuove automaticamente al tipo di media corretto:

```markdown
![](video.mp4)
![](audio.mp3)
```

## Inserimento di Media

### Barra degli Strumenti

Usa il menu Inserisci nella barra degli strumenti:

- **Video** — apre un selettore di file per i file video, copia in `.assets/`, inserisce un tag `<video>`
- **Audio** — apre un selettore di file per i file audio, copia in `.assets/`, inserisce un tag `<audio>`
- **YouTube** — legge un URL YouTube dagli appunti e inserisce un embed con privacy migliorata

### Trascina e Rilascia

Trascina file video o audio dal tuo filesystem direttamente nell'editor. VMark:

1. Copierà il file nella cartella `.assets/` del documento
2. Inserirà il nodo media appropriato con un percorso relativo

### Modalità Sorgente

In modalità Sorgente, digita i tag HTML direttamente. I tag media sono evidenziati con bordi colorati a sinistra:

- **Video** — bordo verde acqua
- **Audio** — bordo indaco
- **YouTube** — bordo rosso

## Modifica dei Media

Fai doppio clic su qualsiasi elemento media in modalità WYSIWYG per aprire il popup media:

- **Percorso sorgente** — modifica il percorso del file o l'URL
- **Titolo** — attributo titolo opzionale
- **Poster** (solo video) — percorso dell'immagine miniatura
- **Rimuovi** — elimina l'elemento media

Premi `Escape` per chiudere il popup e tornare all'editor.

## Risoluzione dei Percorsi

VMark supporta tre tipi di percorsi media:

| Tipo di Percorso | Esempio | Comportamento |
|-----------------|---------|--------------|
| Relativo | `./assets/video.mp4` | Risolto rispetto alla directory del documento |
| Assoluto | `/Users/me/video.mp4` | Usato direttamente tramite il protocollo asset Tauri |
| URL Esterno | `https://example.com/video.mp4` | Caricato direttamente dal web |

I percorsi relativi sono consigliati — mantengono i tuoi documenti portabili tra le macchine.

## Sicurezza

- I percorsi relativi vengono validati contro gli attacchi di path traversal
- Gli iframe YouTube sono limitati ai domini `youtube.com` e `youtube-nocookie.com`
- Le altre sorgenti di iframe vengono rimosse dal sanitizer
