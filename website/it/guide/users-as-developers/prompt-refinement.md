# I Prompt in Inglese Producono Codice Migliore

Gli strumenti di codifica AI funzionano meglio quando dai loro prompt in inglese — anche se l'inglese non è la tua prima lingua. VMark include un hook che traduce e raffina automaticamente i tuoi prompt.

## Perché l'Inglese È Importante per la Codifica AI

### Gli LLM Pensano in Inglese

I modelli linguistici di grandi dimensioni elaborano internamente tutte le lingue attraverso uno spazio di rappresentazione fortemente allineato con l'inglese.[^1] Pre-tradurre i prompt non in inglese all'inglese prima di inviarli al modello migliora misurabilmente la qualità dell'output.[^2]

In pratica, un prompt cinese come "把这个函数改成异步的" funziona — ma l'equivalente in inglese "Convert this function to async" produce codice più preciso con meno iterazioni.

### L'Uso degli Strumenti Eredita la Lingua del Prompt

Quando uno strumento di codifica AI cerca sul web, legge documentazione o cerca riferimenti API, usa la lingua del tuo prompt per quelle query. Le query in inglese trovano risultati migliori perché:

- La documentazione ufficiale, Stack Overflow e le issue GitHub sono prevalentemente in inglese
- I termini tecnici sono più precisi in inglese
- Gli esempi di codice e i messaggi di errore sono quasi sempre in inglese

Un prompt cinese che chiede di "状态管理" potrebbe cercare risorse cinesi, mancando la documentazione ufficiale in inglese. I benchmark multilingue mostrano costantemente gap di prestazioni fino al 24% tra l'inglese e altre lingue — persino quelle ben rappresentate come il francese o il tedesco.[^3]

## Il Gancio di Raffinamento del Prompt `::`

Il file `.claude/hooks/refine_prompt.mjs` di VMark è un [hook UserPromptSubmit](https://docs.anthropic.com/en/docs/claude-code/hooks) che intercetta il tuo prompt prima che raggiunga Claude, lo traduce in inglese e lo raffina in un prompt di codifica ottimizzato.

### Come Usarlo

Aggiungi il prefisso `::` o `>>` al tuo prompt:

```
:: 把这个函数改成异步的
```

L'hook:
1. Invia il tuo testo a Claude Haiku (veloce, economico) per la traduzione e il raffinamento
2. Blocca l'invio del prompt originale
3. Copia il prompt in inglese raffinato negli appunti
4. Ti mostra il risultato

Poi incolla (`Cmd+V`) il prompt raffinato e premi Invio per inviarlo.

### Esempio

**Input:**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**Output raffinato (copiato negli appunti):**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### Cosa Fa

L'hook usa un prompt di sistema attentamente strutturato che dà a Haiku:

- **Consapevolezza di Claude Code** — conosce le capacità dello strumento di destinazione (modifica di file, Bash, Glob/Grep, strumenti MCP, modalità piano, subagenti)
- **Contesto del progetto** — caricato da `.claude/hooks/project-context.txt` così Haiku conosce lo stack tecnologico, le convenzioni e i percorsi chiave dei file
- **Regole ordinate per priorità** — preserva prima l'intento, poi traduce, poi chiarisce la portata, poi elimina i riempitivi
- **Gestione delle lingue miste** — traduce la prosa ma mantiene i termini tecnici non tradotti (`useEffect`, percorsi di file, comandi CLI)
- **Esempi few-shot**[^4] — sette coppie input/output che coprono cinese, inglese vago, misto-linguistico e richieste a più passaggi
- **Guida alla lunghezza dell'output** — 1–2 frasi per richieste semplici, 3–5 per quelle complesse

Se il tuo input è già un prompt in inglese chiaro, viene restituito con modifiche minime.

### Configurazione

L'hook è pre-configurato nel file `.claude/settings.json` di VMark. Richiede il [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) che è automaticamente disponibile con Claude Code.

Non è necessaria alcuna configurazione aggiuntiva — usa semplicemente il prefisso `::` o `>>`.

::: tip Quando Saltarlo
Per comandi brevi (`go ahead`, `yes`, `continue`, `option 2`), inviali senza il prefisso. L'hook li ignora per evitare round-trip inutili.
:::

## Funziona Anche per i Parlanti di Madrelingua Inglese

Anche se scrivi in inglese, il prefisso `>>` è utile per l'ottimizzazione del prompt:

```
>> make the thing work better with the new API
```

Diventa:
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

Il raffinamento aggiunge specificità e struttura che aiuta l'IA a produrre codice migliore al primo tentativo.[^5]

[^1]: Gli LLM multilingue prendono decisioni chiave in uno spazio di rappresentazione più vicino all'inglese, indipendentemente dalla lingua di input/output. Usando una lente logit per sondare le rappresentazioni interne, i ricercatori hanno scoperto che le parole semanticamente cariche (come "acqua" o "sole") vengono selezionate in inglese prima di essere tradotte nella lingua di destinazione. Lo steering dell'attivazione è anche più efficace se calcolato in inglese. Vedere: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Pre-tradurre sistematicamente i prompt non in inglese all'inglese prima dell'inferenza migliora la qualità dell'output LLM su molteplici attività e lingue. I ricercatori decompongono i prompt in quattro parti funzionali (istruzione, contesto, esempi, output) e mostrano che la traduzione selettiva di componenti specifici può essere più efficace della traduzione di tutto. Vedere: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: Il benchmark MMLU-ProX — 11.829 domande identiche in 29 lingue — ha trovato gap di prestazioni fino al 24,3% tra l'inglese e le lingue a basse risorse. Persino le lingue ben rappresentate come il francese e il tedesco mostrano un degrado misurabile. Il gap correla fortemente con la proporzione di ogni lingua nel corpus di pre-addestramento del modello, e aumentare semplicemente la dimensione del modello non lo elimina. Vedere: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Il prompting few-shot — fornire esempi input/output all'interno del prompt — migliora drammaticamente le prestazioni dell'attività LLM. Il fondamentale articolo su GPT-3 ha mostrato che mentre le prestazioni zero-shot migliorano costantemente con la dimensione del modello, le prestazioni few-shot aumentano *più rapidamente*, raggiungendo a volte la competitività con i modelli fine-tuned. I modelli più grandi sono più capaci di imparare dagli esempi nel contesto. Vedere: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: I prompt strutturati e ben progettati superano costantemente le istruzioni vaghe nelle attività di generazione di codice. Tecniche come il ragionamento chain-of-thought, l'assegnazione di ruoli e i vincoli di portata espliciti migliorano tutte la precisione al primo tentativo. Vedere: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
