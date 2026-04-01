# Perché i prompt in inglese producono codice migliore

Gli strumenti di coding AI funzionano meglio quando si forniscono prompt in inglese — anche se l'inglese non è la propria lingua madre. Il plugin [claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) corregge automaticamente, traduce e perfeziona i prompt.

## Perché l'inglese è importante per il coding AI

### I LLM ragionano in inglese

I modelli linguistici di grandi dimensioni elaborano internamente tutte le lingue attraverso uno spazio di rappresentazione fortemente allineato con l'inglese.[^1] Pre-tradurre i prompt non inglesi in inglese prima di inviarli al modello migliora in modo misurabile la qualità dell'output.[^2]

In pratica, un prompt in cinese come "把这个函数改成异步的" funziona — ma l'equivalente inglese "Convert this function to async" produce codice più preciso con meno iterazioni.

### L'uso degli strumenti eredita la lingua del prompt

Quando uno strumento di coding AI cerca sul web, legge documentazione o consulta riferimenti API, utilizza la lingua del prompt per quelle ricerche. Le query in inglese trovano risultati migliori perché:

- La documentazione ufficiale, Stack Overflow e le issue su GitHub sono prevalentemente in inglese
- I termini tecnici di ricerca sono più precisi in inglese
- Gli esempi di codice e i messaggi di errore sono quasi sempre in inglese

Un prompt in cinese che chiede di "状态管理" potrebbe cercare risorse in cinese, perdendo la documentazione canonica in inglese. I benchmark multilingue mostrano costantemente divari di prestazioni fino al 24% tra l'inglese e altre lingue — anche quelle ben rappresentate come il francese o il tedesco.[^3]

## Il plugin `claude-english-buddy`

`claude-english-buddy` è un plugin per Claude Code che intercetta ogni prompt e lo elabora attraverso una delle quattro modalità:

| Modalità | Attivazione | Cosa succede |
|------|---------|--------------|
| **Correct** | Prompt in inglese con errori | Corregge ortografia/grammatica, mostra le modifiche |
| **Translate** | Rilevata lingua non inglese (CJK, cirillico, ecc.) | Traduce in inglese, mostra la traduzione |
| **Refine** | Prefisso `::` | Riscrive un input vago in un prompt preciso e strutturato |
| **Skip** | Testo breve, comandi, URL, codice | Passa senza modifiche |

Il plugin utilizza Claude Haiku per le correzioni — veloce ed economico, senza alcuna interruzione del flusso di lavoro.

### Auto-correzione (predefinita)

Basta digitare normalmente. Il plugin rileva la lingua automaticamente:

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

Quando il prompt è corretto — silenzio. Nessun rumore. Silenzio significa corretto.

### Traduzione

I prompt non in inglese vengono tradotti automaticamente:

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### Perfezionamento del prompt con `::`

Prefissare il prompt con `::` per perfezionare un'idea grezza in un prompt preciso:

```
:: make the search faster it's really slow with big files
```

Diventa:

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

Il prefisso `::` funziona per qualsiasi lingua — traduce e ristruttura in un solo passaggio.[^4]

::: tip Quando il plugin resta silenzioso
I comandi brevi (`yes`, `continue`, `option 2`), i comandi slash, gli URL e i frammenti di codice vengono passati senza modifiche. Nessun round-trip non necessario.
:::

## Monitorare i propri progressi

Il plugin registra ogni correzione. Nel corso delle settimane, si può osservare il miglioramento del proprio inglese:

| Comando | Cosa mostra |
|---------|---------------|
| `/claude-english-buddy:today` | Correzioni di oggi, errori ricorrenti, lezioni, tendenza |
| `/claude-english-buddy:stats` | Tasso di errore a lungo termine e traiettoria di miglioramento |
| `/claude-english-buddy:mistakes` | Pattern ricorrenti storici — i propri punti deboli |

## Installazione

Installare il plugin in Claude Code:

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

Nessuna configurazione aggiuntiva necessaria — l'auto-correzione si attiva immediatamente.

### Configurazione opzionale

Creare `.claude-english-buddy.json` nella root del progetto per personalizzare:

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| Impostazione | Opzioni | Predefinito |
|---------|---------|---------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`, `standard`, `strict` | `standard` |
| `summary_language` | Qualsiasi nome di lingua, oppure `null` per disattivare | `null` |
| `domain_terms` | Array di termini da preservare invariati | `[]` |

Quando `summary_language` è impostato, Claude aggiunge un breve riepilogo in quella lingua alla fine di ogni risposta — utile quando si desiderano le decisioni chiave nella propria lingua madre.[^5]

[^1]: I LLM multilingue prendono le decisioni chiave in uno spazio di rappresentazione più vicino all'inglese, indipendentemente dalla lingua di input/output. Utilizzando un logit lens per sondare le rappresentazioni interne, i ricercatori hanno scoperto che le parole semanticamente cariche (come "water" o "sun") vengono selezionate in inglese prima di essere tradotte nella lingua di destinazione. Anche l'activation steering è più efficace quando calcolato in inglese. Vedi: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: La pre-traduzione sistematica dei prompt non inglesi in inglese prima dell'inferenza migliora la qualità dell'output dei LLM su molteplici compiti e lingue. I ricercatori scompongono i prompt in quattro parti funzionali (istruzione, contesto, esempi, output) e dimostrano che la traduzione selettiva di componenti specifici può essere più efficace della traduzione integrale. Vedi: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: Il benchmark MMLU-ProX — 11.829 domande identiche in 29 lingue — ha rilevato divari di prestazioni fino al 24,3% tra l'inglese e le lingue a basse risorse. Anche lingue ben rappresentate come il francese e il tedesco mostrano un degrado misurabile. Il divario è fortemente correlato alla proporzione di ciascuna lingua nel corpus di pre-addestramento del modello, e il semplice aumento delle dimensioni del modello non lo elimina. Vedi: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Il few-shot prompting — fornire esempi input/output all'interno del prompt — migliora drasticamente le prestazioni dei LLM nei compiti. Il fondamentale articolo su GPT-3 ha dimostrato che mentre le prestazioni zero-shot migliorano costantemente con le dimensioni del modello, le prestazioni few-shot aumentano *più rapidamente*, raggiungendo talvolta competitività con i modelli fine-tuned. I modelli più grandi sono più abili nell'apprendere dagli esempi in-context. Vedi: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: I prompt strutturati e ben ingegnerizzati superano costantemente le istruzioni vaghe nei compiti di generazione del codice. Tecniche come il chain-of-thought reasoning, l'assegnazione di ruoli e i vincoli espliciti di ambito migliorano tutti la precisione al primo tentativo. Vedi: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
