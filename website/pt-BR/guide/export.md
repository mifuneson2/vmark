# Exportar e Imprimir

O VMark oferece várias formas de exportar e compartilhar seus documentos.

## Modos de Exportação

### Modo Pasta (Padrão)

Cria uma pasta autocontida com estrutura limpa:

```
MeuDocumento/
├── index.html
└── assets/
    ├── image1.png
    ├── image2.jpg
    └── ...
```

**Vantagens:**
- URLs limpos quando hospedado (`/MeuDocumento/` em vez de `/MeuDocumento.html`)
- Fácil de compartilhar como uma única pasta
- Caminhos de ativos simples (`assets/image.png`)
- Funciona bem com hosts de sites estáticos

### Modo Arquivo Único

Cria um único arquivo HTML autocontido:

```
MeuDocumento.html
```

Todas as imagens são embutidas como URIs de dados, tornando-o completamente portátil, mas com tamanho de arquivo maior.

## Como Exportar

### Exportar HTML

1. Use **Arquivo → Exportar HTML**
2. Escolha o local de exportação
3. Para modo pasta: Insira o nome da pasta (ex: `MeuDocumento`)
4. Para modo único: Insira o nome do arquivo com extensão `.html`

### Imprimir / Exportar PDF

1. Pressione `Cmd/Ctrl + P` ou use **Arquivo → Imprimir**
2. Use o diálogo de impressão do sistema para imprimir ou salvar como PDF

### Exportar para Outros Formatos

O VMark integra com o [Pandoc](https://pandoc.org/) — um conversor universal de documentos — para exportar seu markdown para formatos adicionais. Escolha um formato diretamente no menu:

**Arquivo → Exportar → Outros Formatos →**

| Item do Menu | Extensão |
|--------------|----------|
| Word (.docx) | `.docx` |
| EPUB (.epub) | `.epub` |
| LaTeX (.tex) | `.tex` |
| OpenDocument (.odt) | `.odt` |
| Rich Text (.rtf) | `.rtf` |
| Texto Simples (.txt) | `.txt` |

**Configuração:**

1. Instale o Pandoc em [pandoc.org/installing](https://pandoc.org/installing.html) ou via gerenciador de pacotes:
   - macOS: `brew install pandoc`
   - Windows: `winget install pandoc`
   - Linux: `apt install pandoc`
2. Reinicie o VMark (ou vá para **Configurações → Arquivos e Imagens → Ferramentas de Documento** e clique em **Detectar**)
3. Use **Arquivo → Exportar → Outros Formatos → [formato]** para exportar

Se o Pandoc não estiver instalado, o menu mostra um link **"Requer Pandoc — pandoc.org"** no final do submenu Outros Formatos.

Você pode verificar se o Pandoc foi detectado em **Configurações → Arquivos e Imagens → Ferramentas de Documento**.

### Copiar como HTML

Pressione `Cmd/Ctrl + Shift + C` para copiar o HTML renderizado para a área de transferência e colar em outros aplicativos.

## VMark Reader

Quando você exporta para HTML (modo estilizado), seu documento inclui o **VMark Reader** — uma experiência de leitura interativa com recursos poderosos.

### Painel de Configurações

Clique no ícone de engrenagem (canto inferior direito) ou pressione `Esc` para abrir o painel de configurações:

| Configuração | Descrição |
|-------------|-----------|
| Tamanho da Fonte | Ajustar tamanho do texto (12px – 24px) |
| Altura de Linha | Ajustar espaçamento entre linhas (1.2 – 2.0) |
| Tema Claro/Escuro | Alternar entre modo claro e escuro |
| Espaçamento CJK-Latino | Alternar espaçamento entre caracteres CJK e latinos |

### Índice

A barra lateral de índice ajuda a navegar em documentos longos:

- **Alternar**: Clique no cabeçalho do painel ou pressione `T`
- **Navegar**: Clique em qualquer título para ir até ele
- **Teclado**: Use as setas `↑`/`↓` para mover, `Enter` para ir
- **Destaque**: A seção atual é destacada enquanto você rola

### Progresso de Leitura

Uma barra de progresso sutil no topo da página mostra até onde você leu no documento.

### Voltar ao Topo

Um botão flutuante aparece quando você rola para baixo. Clique nele ou pressione `Home` para voltar ao topo.

### Lightbox de Imagens

Clique em qualquer imagem para vê-la em um lightbox em tela cheia:

- **Fechar**: Clique fora, pressione `Esc` ou clique no botão X
- **Navegar**: Use as setas `←`/`→` para múltiplas imagens
- **Zoom**: As imagens são exibidas no tamanho natural

### Blocos de Código

Cada bloco de código inclui controles interativos:

| Botão | Função |
|-------|--------|
| Alternar números de linha | Mostrar/ocultar números de linha para este bloco |
| Botão copiar | Copiar código para a área de transferência |

O botão copiar mostra uma marca de verificação quando bem-sucedido.

### Navegação de Rodapés

Os rodapés são totalmente interativos:

- Clique em uma referência de rodapé `[1]` para ir até sua definição
- Clique no `↩` de referência inversa para voltar ao ponto de leitura

### Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Esc` | Alternar painel de configurações |
| `T` | Alternar Índice |
| `↑` / `↓` | Navegar itens do índice |
| `Enter` | Ir para o item do índice selecionado |
| `←` / `→` | Navegar imagens no lightbox |
| `Home` | Rolar para o topo |

## Atalhos de Exportação

| Ação | Atalho |
|------|--------|
| Exportar HTML | _(somente no menu)_ |
| Imprimir | `Mod + P` |
| Copiar como HTML | `Mod + Shift + C` |

## Dicas

### Servindo HTML Exportado

A estrutura de exportação de pasta funciona bem com qualquer servidor de arquivos estáticos:

```bash
# Python
cd MeuDocumento && python -m http.server 8000

# Node.js (npx)
npx serve MeuDocumento

# Abrir diretamente
open MeuDocumento/index.html
```

### Visualização Offline

Ambos os modos de exportação funcionam completamente offline:

- **Modo pasta**: Abra `index.html` em qualquer navegador
- **Modo único**: Abra o arquivo `.html` diretamente

Equações matemáticas (KaTeX) requerem conexão com a internet para a folha de estilos, mas todo o outro conteúdo funciona offline.

### Melhores Práticas

1. **Use o modo pasta** para documentos que você vai compartilhar ou hospedar
2. **Use o modo único** para compartilhamento rápido por e-mail ou chat
3. **Inclua texto alternativo descritivo nas imagens** para acessibilidade
4. **Teste o HTML exportado** em diferentes navegadores
