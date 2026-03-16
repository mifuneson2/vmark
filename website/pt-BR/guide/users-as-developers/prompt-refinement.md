# Prompts em Inglês Funcionam Melhor

Ferramentas de codificação com IA funcionam melhor quando você as fornece prompts em inglês — mesmo que o inglês não seja sua primeira língua. O VMark inclui um hook que traduz e refina seus prompts automaticamente.

## Por que o Inglês Importa para Codificação com IA

### LLMs Pensam em Inglês

Grandes modelos de linguagem processam internamente todas as línguas através de um espaço de representação que está fortemente alinhado ao inglês.[^1] Pré-traduzir prompts em idiomas diferentes do inglês para o inglês antes de enviá-los ao modelo melhora visivelmente a qualidade da saída.[^2]

Na prática, um prompt em chinês como "把这个函数改成异步的" funciona — mas o equivalente em inglês "Convert this function to async" produz código mais preciso com menos iterações.

### O Uso de Ferramentas Herda o Idioma do Prompt

Quando uma ferramenta de codificação com IA pesquisa na web, lê documentação ou consulta referências de API, ela usa o idioma do seu prompt para essas consultas. Consultas em inglês encontram resultados melhores porque:

- Docs oficiais, Stack Overflow e issues do GitHub são predominantemente em inglês
- Termos técnicos de pesquisa são mais precisos em inglês
- Exemplos de código e mensagens de erro estão quase sempre em inglês

Um prompt em chinês perguntando sobre "状态管理" pode pesquisar recursos em chinês, perdendo a documentação oficial em inglês. Benchmarks multilíngues mostram consistentemente lacunas de desempenho de até 24% entre o inglês e outros idiomas — mesmo os bem representados como francês ou alemão.[^3]

## O Hook de Refinamento de Prompt `::`

O `.claude/hooks/refine_prompt.mjs` do VMark é um [hook UserPromptSubmit](https://docs.anthropic.com/en/docs/claude-code/hooks) que intercepta seu prompt antes de chegar ao Claude, traduz-o para o inglês e o refina em um prompt de codificação otimizado.

### Como Usar

Prefixe seu prompt com `::` ou `>>`:

```
:: 把这个函数改成异步的
```

O hook:
1. Envia seu texto ao Claude Haiku (rápido, barato) para tradução e refinamento
2. Bloqueia o envio do prompt original
3. Copia o prompt refinado em inglês para a área de transferência
4. Mostra o resultado para você

Você então cola (`Cmd+V`) o prompt refinado e pressiona Enter para enviá-lo.

### Exemplo

**Entrada:**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**Saída refinada (copiada para a área de transferência):**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### O que Ele Faz

O hook usa um system prompt cuidadosamente estruturado que fornece ao Haiku:

- **Consciência do Claude Code** — conhece as capacidades da ferramenta alvo (edição de arquivos, Bash, Glob/Grep, ferramentas MCP, modo de planejamento, subagentes)
- **Contexto do projeto** — carregado de `.claude/hooks/project-context.txt` para que o Haiku conheça a stack tecnológica, convenções e caminhos de arquivo principais
- **Regras ordenadas por prioridade** — preservar a intenção primeiro, depois traduzir, depois clarificar o escopo, depois remover enchimento
- **Tratamento de linguagem mista** — traduz prosa mas mantém termos técnicos não traduzidos (`useEffect`, caminhos de arquivo, comandos CLI)
- **Exemplos few-shot**[^4] — sete pares de entrada/saída cobrindo chinês, inglês vago, linguagem mista e solicitações multi-etapas
- **Orientação de comprimento de saída** — 1–2 frases para solicitações simples, 3–5 para complexas

Se a sua entrada já for um prompt claro em inglês, ele é retornado com mínimas alterações.

### Configuração

O hook é pré-configurado no `.claude/settings.json` do VMark. Ele requer o [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) que está automaticamente disponível com o Claude Code.

Nenhuma configuração adicional é necessária — basta usar o prefixo `::` ou `>>`.

::: tip Quando Pular
Para comandos curtos (`go ahead`, `yes`, `continue`, `option 2`), envie-os sem o prefixo. O hook ignora esses para evitar viagens desnecessárias.
:::

## Também Funciona para Falantes de Inglês

Mesmo que você escreva em inglês, o prefixo `>>` é útil para otimização de prompt:

```
>> make the thing work better with the new API
```

Torna-se:
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

O refinamento adiciona especificidade e estrutura que ajuda a IA a produzir código melhor na primeira tentativa.[^5]

[^1]: LLMs multilíngues tomam decisões-chave em um espaço de representação mais próximo do inglês, independentemente do idioma de entrada/saída. Usando uma lente logit para sondar as representações internas, os pesquisadores descobriram que palavras semanticamente carregadas (como "água" ou "sol") são selecionadas em inglês antes de serem traduzidas para o idioma alvo. O steering de ativação também é mais eficaz quando calculado em inglês. Veja: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Pré-traduzir sistematicamente prompts em idiomas diferentes do inglês para o inglês antes da inferência melhora a qualidade da saída dos LLMs em múltiplas tarefas e idiomas. Os pesquisadores decompõem os prompts em quatro partes funcionais (instrução, contexto, exemplos, saída) e mostram que a tradução seletiva de componentes específicos pode ser mais eficaz do que traduzir tudo. Veja: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: O benchmark MMLU-ProX — 11.829 perguntas idênticas em 29 idiomas — encontrou lacunas de desempenho de até 24,3% entre o inglês e idiomas de baixos recursos. Mesmo idiomas bem representados como francês e alemão mostram degradação mensurável. A lacuna se correlaciona fortemente com a proporção de cada idioma no corpus de pré-treinamento do modelo, e simplesmente escalar o tamanho do modelo não a elimina. Veja: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Prompting few-shot — fornecer exemplos de entrada/saída dentro do prompt — melhora dramaticamente o desempenho das tarefas dos LLMs. O artigo seminal do GPT-3 mostrou que, enquanto o desempenho zero-shot melhora constantemente com o tamanho do modelo, o desempenho few-shot aumenta *mais rapidamente*, às vezes chegando à competitividade com modelos ajustados. Modelos maiores são mais proficientes em aprender com exemplos em contexto. Veja: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Prompts estruturados e bem elaborados superam consistentemente as instruções vagas em tarefas de geração de código. Técnicas como raciocínio em cadeia de pensamento, atribuição de papéis e restrições explícitas de escopo todas melhoram a precisão na primeira passagem. Veja: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
