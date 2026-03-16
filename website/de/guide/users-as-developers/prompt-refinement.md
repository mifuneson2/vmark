# Warum englische Prompts besseren Code erzeugen

KI-Coding-Tools funktionieren besser, wenn Sie englische Prompts eingeben — auch wenn Englisch nicht Ihre Muttersprache ist. VMark enthält einen Hook, der Ihre Prompts automatisch übersetzt und verfeinert.

## Warum Englisch für KI-Coding wichtig ist

### LLMs denken auf Englisch

Große Sprachmodelle verarbeiten alle Sprachen intern über einen Repräsentationsraum, der stark auf Englisch ausgerichtet ist.[^1] Das systematische Vorübersetzen nicht-englischer Prompts ins Englische vor dem Senden an das Modell verbessert die Ausgabequalität messbar.[^2]

In der Praxis funktioniert ein chinesischer Prompt wie „把这个函数改成异步的" — aber das englische Äquivalent „Convert this function to async" produziert präziseren Code mit weniger Iterationen.

### Tool-Nutzung erbt die Prompt-Sprache

Wenn ein KI-Coding-Tool das Web durchsucht, Dokumentation liest oder API-Referenzen nachschlägt, verwendet es die Sprache Ihres Prompts für diese Abfragen. Englische Abfragen finden bessere Ergebnisse, weil:

- Offizielle Dokumentationen, Stack Overflow und GitHub Issues überwiegend auf Englisch sind
- Technische Suchbegriffe auf Englisch präziser sind
- Code-Beispiele und Fehlermeldungen fast immer auf Englisch sind

Ein chinesischer Prompt, der nach „状态管理" fragt, sucht möglicherweise nach chinesischen Ressourcen und übersieht dabei die kanonische englische Dokumentation. Mehrsprachige Benchmarks zeigen konsistent Leistungslücken von bis zu 24 % zwischen Englisch und anderen Sprachen — selbst bei gut repräsentierten Sprachen wie Französisch oder Deutsch.[^3]

## Der `::` Prompt-Verfeinerung-Hook

VMarcks `.claude/hooks/refine_prompt.mjs` ist ein [UserPromptSubmit-Hook](https://docs.anthropic.com/en/docs/claude-code/hooks), der Ihren Prompt abfängt, bevor er Claude erreicht, ihn ins Englische übersetzt und zu einem optimierten Coding-Prompt verfeinert.

### So verwenden Sie ihn

Stellen Sie Ihrem Prompt `::` oder `>>` voran:

```
:: 把这个函数改成异步的
```

Der Hook:
1. Sendet Ihren Text zur Übersetzung und Verfeinerung an Claude Haiku (schnell, günstig)
2. Blockiert den ursprünglichen Prompt vor dem Senden
3. Kopiert den verfeinerten englischen Prompt in Ihre Zwischenablage
4. Zeigt Ihnen das Ergebnis

Sie fügen dann den verfeinerten Prompt mit `Cmd+V` ein und drücken die Eingabetaste zum Senden.

### Beispiel

**Eingabe:**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**Verfeinertes Ergebnis (in Zwischenablage kopiert):**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### Was er tut

Der Hook verwendet einen sorgfältig strukturierten System-Prompt, der Haiku folgendes gibt:

- **Claude Code-Bewusstsein** — kennt die Fähigkeiten des Ziel-Tools (Dateibearbeitung, Bash, Glob/Grep, MCP-Tools, Plan-Modus, Unteragenten)
- **Projektkontext** — wird aus `.claude/hooks/project-context.txt` geladen, damit Haiku den Tech-Stack, Konventionen und wichtige Dateipfade kennt
- **Prioritätsgeordnete Regeln** — zuerst Intent bewahren, dann übersetzen, dann Umfang klären, dann Füllwörter entfernen
- **Gemischtsprachige Handhabung** — übersetzt Prosa, behält aber technische Begriffe unübersetzt (`useEffect`, Dateipfade, CLI-Befehle)
- **Wenige-Schuss-Beispiele**[^4] — sieben Eingabe/Ausgabe-Paare mit chinesischen, vagen englischen, gemischtsprachigen und mehrstufigen Anfragen
- **Ausgabelängen-Leitfaden** — 1–2 Sätze für einfache Anfragen, 3–5 für komplexe

Wenn Ihre Eingabe bereits ein klarer englischer Prompt ist, wird er mit minimalen Änderungen zurückgegeben.

### Einrichtung

Der Hook ist in VMarcks `.claude/settings.json` vorkonfiguriert. Er erfordert das [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk), das automatisch mit Claude Code verfügbar ist.

Keine zusätzliche Einrichtung erforderlich — verwenden Sie einfach das `::` oder `>>`-Präfix.

::: tip Wann Sie ihn überspringen sollten
Bei kurzen Befehlen (`go ahead`, `yes`, `continue`, `option 2`) senden Sie diese ohne Präfix. Der Hook ignoriert diese, um unnötige Roundtrips zu vermeiden.
:::

## Funktioniert auch für englische Muttersprachler

Auch wenn Sie auf Englisch schreiben, ist das `>>`-Präfix zur Prompt-Optimierung nützlich:

```
>> make the thing work better with the new API
```

Wird zu:
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

Die Verfeinerung fügt Spezifität und Struktur hinzu, die der KI helfen, beim ersten Versuch besseren Code zu produzieren.[^5]

[^1]: Mehrsprachige LLMs treffen Schlüsselentscheidungen in einem Repräsentationsraum, der am nächsten zu Englisch liegt, unabhängig von Ein- und Ausgabesprache. Mithilfe einer Logit-Linse zur Untersuchung interner Repräsentationen fanden Forscher heraus, dass semantisch bedeutende Wörter (wie „water" oder „sun") auf Englisch ausgewählt werden, bevor sie in die Zielsprache übersetzt werden. Aktivierungssteuerung ist auch effektiver, wenn sie auf Englisch berechnet wird. Siehe: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Das systematische Vorübersetzen nicht-englischer Prompts ins Englische vor der Inferenz verbessert die LLM-Ausgabequalität über mehrere Aufgaben und Sprachen hinweg. Die Forscher zerlegen Prompts in vier funktionale Teile (Anweisung, Kontext, Beispiele, Ausgabe) und zeigen, dass die selektive Übersetzung bestimmter Komponenten effektiver sein kann als die Übersetzung von allem. Siehe: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: Der MMLU-ProX-Benchmark — 11.829 identische Fragen in 29 Sprachen — fand Leistungslücken von bis zu 24,3 % zwischen Englisch und ressourcenarmen Sprachen. Selbst gut repräsentierte Sprachen wie Französisch und Deutsch zeigen messbare Leistungseinbußen. Die Lücke korreliert stark mit dem Anteil jeder Sprache im Vortrainings-Corpus des Modells, und einfaches Skalieren der Modellgröße eliminiert sie nicht. Siehe: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Wenige-Schuss-Prompting — das Bereitstellen von Eingabe/Ausgabe-Beispielen im Prompt — verbessert die LLM-Aufgabenleistung dramatisch. Das bahnbrechende GPT-3-Paper zeigte, dass die Zero-Shot-Leistung zwar stetig mit der Modellgröße zunimmt, die Wenige-Schuss-Leistung jedoch *schneller* steigt und manchmal die Wettbewerbsfähigkeit mit feinabgestimmten Modellen erreicht. Größere Modelle sind besser darin, aus kontextbezogenen Beispielen zu lernen. Siehe: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Strukturierte, gut konstruierte Prompts übertreffen konsequent vage Anweisungen bei Code-Generierungsaufgaben. Techniken wie Chain-of-Thought-Reasoning, Rollenzuweisung und explizite Umfangsbeschränkungen verbessern alle die First-Pass-Genauigkeit. Siehe: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
