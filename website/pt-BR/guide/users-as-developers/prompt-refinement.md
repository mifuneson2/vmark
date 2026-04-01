# Por Que Prompts em Inglês Produzem Código Melhor

Ferramentas de programação com IA funcionam melhor quando você usa prompts em inglês — mesmo que o inglês não seja seu idioma nativo. O plugin [claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) corrige, traduz e refina seus prompts automaticamente.

## Por Que o Inglês Importa para Programação com IA

### LLMs Pensam em Inglês

Grandes modelos de linguagem processam internamente todas as línguas por meio de um espaço de representação fortemente alinhado ao inglês.[^1] Pré-traduzir prompts em outros idiomas para o inglês antes de enviá-los ao modelo melhora a qualidade da saída de forma mensurável.[^2]

Na prática, um prompt em chinês como "把这个函数改成异步的" funciona — mas o equivalente em inglês "Convert this function to async" produz código mais preciso com menos iterações.

### O Uso de Ferramentas Herda o Idioma do Prompt

Quando uma ferramenta de programação com IA pesquisa na web, lê documentação ou consulta referências de API, ela usa o idioma do seu prompt para essas consultas. Consultas em inglês encontram resultados melhores porque:

- Documentações oficiais, Stack Overflow e issues do GitHub são predominantemente em inglês
- Termos técnicos de busca são mais precisos em inglês
- Exemplos de código e mensagens de erro estão quase sempre em inglês

Um prompt em chinês perguntando sobre "状态管理" pode buscar recursos em chinês, perdendo a documentação canônica em inglês. Benchmarks multilíngues mostram consistentemente lacunas de desempenho de até 24% entre o inglês e outros idiomas — mesmo os bem representados, como francês ou alemão.[^3]

## O Plugin `claude-english-buddy`

`claude-english-buddy` é um plugin do Claude Code que intercepta cada prompt e o processa por meio de um dos quatro modos:

| Modo | Gatilho | O Que Acontece |
|------|---------|----------------|
| **Corrigir** | Prompt em inglês com erros | Corrige ortografia/gramática, mostra o que mudou |
| **Traduzir** | Idioma não-inglês detectado (CJK, cirílico, etc.) | Traduz para inglês, mostra a tradução |
| **Refinar** | Prefixo `::` | Reescreve entrada vaga em um prompt preciso e estruturado |
| **Ignorar** | Texto curto, comandos, URLs, código | Passa adiante sem alterações |

O plugin usa Claude Haiku para correções — rápido e barato, com zero interrupção no seu fluxo de trabalho.

### Correção Automática (Padrão)

Basta digitar normalmente. O plugin detecta o idioma automaticamente:

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

Quando seu prompt está correto — silêncio. Sem ruído. Silêncio significa correto.

### Tradução

Prompts em outros idiomas são traduzidos automaticamente:

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### Refinamento de Prompt com `::`

Prefixe seu prompt com `::` para refinar uma ideia vaga em um prompt preciso:

```
:: make the search faster it's really slow with big files
```

Se torna:

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

O prefixo `::` funciona para qualquer idioma — ele traduz e reestrutura em uma única etapa.[^4]

::: tip Quando o Plugin Fica em Silêncio
Comandos curtos (`yes`, `continue`, `option 2`), slash commands, URLs e trechos de código passam sem alterações. Sem viagens de ida e volta desnecessárias.
:::

## Acompanhando Seu Progresso

O plugin registra cada correção. Ao longo das semanas, você pode ver seu inglês melhorando:

| Comando | O Que Mostra |
|---------|--------------|
| `/claude-english-buddy:today` | Correções de hoje, erros recorrentes, lições, tendência |
| `/claude-english-buddy:stats` | Taxa de erro a longo prazo e trajetória de melhoria |
| `/claude-english-buddy:mistakes` | Padrões recorrentes de todos os tempos — seus pontos cegos |

## Configuração

Instale o plugin no Claude Code:

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

Nenhuma configuração adicional necessária — a correção automática começa imediatamente.

### Configuração Opcional

Crie `.claude-english-buddy.json` na raiz do seu projeto para personalizar:

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| Configuração | Opções | Padrão |
|--------------|--------|--------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`, `standard`, `strict` | `standard` |
| `summary_language` | Qualquer nome de idioma, ou `null` para desabilitar | `null` |
| `domain_terms` | Array de termos para preservar sem alteração | `[]` |

Quando `summary_language` está definido, o Claude adiciona um breve resumo nesse idioma ao final de cada resposta — útil quando você deseja decisões-chave no seu idioma nativo.[^5]

[^1]: LLMs multilíngues tomam decisões-chave em um espaço de representação mais próximo do inglês, independentemente do idioma de entrada/saída. Usando uma logit lens para sondar representações internas, pesquisadores descobriram que palavras semanticamente carregadas (como "water" ou "sun") são selecionadas em inglês antes de serem traduzidas para o idioma de destino. O direcionamento de ativação também é mais eficaz quando calculado em inglês. Veja: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Pré-traduzir sistematicamente prompts em outros idiomas para o inglês antes da inferência melhora a qualidade da saída de LLMs em múltiplas tarefas e idiomas. Os pesquisadores decompõem prompts em quatro partes funcionais (instrução, contexto, exemplos, saída) e mostram que a tradução seletiva de componentes específicos pode ser mais eficaz do que traduzir tudo. Veja: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: O benchmark MMLU-ProX — 11.829 perguntas idênticas em 29 idiomas — encontrou lacunas de desempenho de até 24,3% entre o inglês e idiomas com poucos recursos. Mesmo idiomas bem representados como francês e alemão mostram degradação mensurável. A lacuna se correlaciona fortemente com a proporção de cada idioma no corpus de pré-treinamento do modelo, e simplesmente aumentar o tamanho do modelo não a elimina. Veja: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Few-shot prompting — fornecer exemplos de entrada/saída dentro do prompt — melhora drasticamente o desempenho de LLMs em tarefas. O artigo pioneiro do GPT-3 mostrou que, enquanto o desempenho zero-shot melhora de forma constante com o tamanho do modelo, o desempenho few-shot aumenta *mais rapidamente*, às vezes alcançando competitividade com modelos ajustados por fine-tuning. Modelos maiores são mais proficientes em aprender com exemplos em contexto. Veja: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Prompts estruturados e bem elaborados superam consistentemente instruções vagas em tarefas de geração de código. Técnicas como raciocínio em cadeia de pensamento, atribuição de papéis e restrições explícitas de escopo melhoram a precisão na primeira tentativa. Veja: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
