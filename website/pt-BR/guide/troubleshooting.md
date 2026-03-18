# Solução de problemas

## Arquivos de log

O VMark grava arquivos de log para ajudar a diagnosticar problemas. Os logs incluem avisos e erros tanto do backend Rust quanto do frontend.

### Localização dos arquivos de log

| Plataforma | Caminho |
|------------|---------|
| macOS | `~/Library/Logs/app.vmark/` |
| Windows | `%APPDATA%\app.vmark\logs\` |
| Linux | `~/.local/share/app.vmark/logs/` |

### Níveis de log

| Nível | O que é registrado | Produção | Desenvolvimento |
|-------|-------------------|----------|-----------------|
| Error | Falhas, travamentos | Sim | Sim |
| Warn | Problemas recuperáveis, alternativas | Sim | Sim |
| Info | Marcos, mudanças de estado | Sim | Sim |
| Debug | Rastreamento detalhado | Não | Sim |

### Rotação de logs

- Tamanho máximo do arquivo: 5 MB
- Rotação: mantém um arquivo de log anterior
- Logs antigos são substituídos automaticamente

## Reportar bugs

Ao reportar um bug, inclua:

1. **Versão do VMark** — exibida no badge da barra de navegação ou no diálogo Sobre
2. **Sistema operacional** — versão do macOS, build do Windows ou distribuição Linux
3. **Passos para reproduzir** — o que você fez antes do problema ocorrer
4. **Arquivo de log** — anexe ou cole as entradas de log relevantes

As entradas de log possuem carimbo de data/hora e são marcadas por módulo (por exemplo, `[HotExit]`, `[MCP Bridge]`, `[Export]`), facilitando a localização das seções relevantes.

### Encontrar logs relevantes

1. Abra o diretório de logs indicado na tabela acima
2. Abra o arquivo `.log` mais recente
3. Procure por entradas `ERROR` ou `WARN` próximas ao horário em que o problema ocorreu
4. Copie as linhas relevantes e inclua no seu relatório de bug

## Problemas comuns

### O aplicativo inicia lentamente no Windows

O VMark é otimizado para macOS. No Windows, a inicialização pode ser mais lenta devido à inicialização do WebView2. Certifique-se de que:

- O WebView2 Runtime esteja atualizado
- O software antivírus não esteja verificando o diretório de dados do aplicativo em tempo real

### A barra de menus mostra inglês após a troca de idioma

Se a barra de menus permanecer em inglês após trocar o idioma nas Configurações, reinicie o VMark. O menu é reconstruído na próxima inicialização com o idioma salvo.

### O terminal não aceita pontuação CJK

Corrigido na versão v0.6.5+. Atualize para a versão mais recente.
