# Suporte a Mídia

O VMark suporta embeds de vídeo, áudio e YouTube em seus documentos Markdown usando tags HTML5 padrão.

## Formatos Suportados

### Vídeo

| Formato | Extensão |
|---------|----------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### Áudio

| Formato | Extensão |
|---------|----------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## Sintaxe

### Vídeo

Use tags de vídeo HTML5 padrão:

```html
<video src="path/to/video.mp4" controls></video>
```

Com atributos opcionais:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### Áudio

Use tags de áudio HTML5 padrão:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### Embeds do YouTube

Use iframes do YouTube com privacidade aprimorada:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Fallback de Sintaxe de Imagem

Você também pode usar a sintaxe de imagem com extensões de arquivo de mídia — o VMark as promove automaticamente para o tipo de mídia correto:

```markdown
![](video.mp4)
![](audio.mp3)
```

## Inserindo Mídia

### Barra de Ferramentas

Use o menu Inserir na barra de ferramentas:

- **Vídeo** — abre um seletor de arquivo para arquivos de vídeo, copia para `.assets/`, insere uma tag `<video>`
- **Áudio** — abre um seletor de arquivo para arquivos de áudio, copia para `.assets/`, insere uma tag `<audio>`
- **YouTube** — lê uma URL do YouTube da área de transferência e insere um embed com privacidade aprimorada

### Arrastar e Soltar

Arraste arquivos de vídeo ou áudio do seu sistema de arquivos diretamente para o editor. O VMark irá:

1. Copiar o arquivo para a pasta `.assets/` do documento
2. Inserir o nó de mídia apropriado com um caminho relativo

### Modo Fonte

No modo Fonte, digite as tags HTML diretamente. As tags de mídia são destacadas com bordas coloridas à esquerda:

- **Vídeo** — borda verde-azulada
- **Áudio** — borda índigo
- **YouTube** — borda vermelha

## Editando Mídia

Dê um duplo clique em qualquer elemento de mídia no modo WYSIWYG para abrir o popup de mídia:

- **Caminho da fonte** — editar o caminho do arquivo ou URL
- **Título** — atributo de título opcional
- **Pôster** (somente vídeo) — caminho da imagem em miniatura
- **Remover** — excluir o elemento de mídia

Pressione `Escape` para fechar o popup e voltar ao editor.

## Resolução de Caminho

O VMark suporta três tipos de caminhos de mídia:

| Tipo de Caminho | Exemplo | Comportamento |
|----------------|---------|---------------|
| Relativo | `./assets/video.mp4` | Resolvido em relação ao diretório do documento |
| Absoluto | `/Users/me/video.mp4` | Usado diretamente via protocolo de ativos Tauri |
| URL externa | `https://example.com/video.mp4` | Carregado diretamente da web |

Caminhos relativos são recomendados — eles mantêm seus documentos portáteis entre máquinas.

## Segurança

- Caminhos relativos são validados contra ataques de travessia de diretório
- Iframes do YouTube são restritos aos domínios `youtube.com` e `youtube-nocookie.com`
- Outras fontes de iframe são removidas pelo sanitizador
