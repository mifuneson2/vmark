# Warum englische Prompts besseren Code erzeugen

KI-Coding-Tools funktionieren besser, wenn man ihnen englische Prompts gibt — auch wenn Englisch nicht die Muttersprache ist. Das [claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude)-Plugin korrigiert, übersetzt und verfeinert Prompts automatisch.

## Warum Englisch für KI-Coding wichtig ist

### LLMs denken auf Englisch

Große Sprachmodelle verarbeiten alle Sprachen intern über einen Repräsentationsraum, der stark auf Englisch ausgerichtet ist.[^1] Das Vorübersetzen nicht-englischer Prompts ins Englische vor dem Senden an das Modell verbessert die Ausgabequalität messbar.[^2]

In der Praxis funktioniert ein chinesischer Prompt wie „把这个函数改成异步的" — aber das englische Äquivalent „Convert this function to async" erzeugt präziseren Code mit weniger Iterationen.

### Werkzeugnutzung erbt die Prompt-Sprache

Wenn ein KI-Coding-Tool das Web durchsucht, Dokumentation liest oder API-Referenzen nachschlägt, verwendet es die Sprache des Prompts für diese Abfragen. Englische Abfragen liefern bessere Ergebnisse, weil:

- Offizielle Dokumentationen, Stack Overflow und GitHub Issues überwiegend auf Englisch sind
- Technische Suchbegriffe auf Englisch präziser sind
- Code-Beispiele und Fehlermeldungen fast immer auf Englisch sind

Ein chinesischer Prompt, der nach „状态管理" fragt, sucht möglicherweise nach chinesischen Ressourcen und übersieht dabei die kanonische englische Dokumentation. Mehrsprachige Benchmarks zeigen durchgehend Leistungsunterschiede von bis zu 24 % zwischen Englisch und anderen Sprachen — selbst bei gut repräsentierten Sprachen wie Französisch oder Deutsch.[^3]

## Das `claude-english-buddy`-Plugin

`claude-english-buddy` ist ein Claude Code-Plugin, das jeden Prompt abfängt und über einen von vier Modi verarbeitet:

| Modus | Auslöser | Was passiert |
|-------|----------|--------------|
| **Correct** | Englischer Prompt mit Fehlern | Korrigiert Rechtschreibung/Grammatik, zeigt Änderungen |
| **Translate** | Nicht-Englisch erkannt (CJK, Kyrillisch usw.) | Übersetzt ins Englische, zeigt Übersetzung |
| **Refine** | `::` als Präfix | Schreibt vage Eingaben in einen präzisen, strukturierten Prompt um |
| **Skip** | Kurztext, Befehle, URLs, Code | Wird unverändert durchgereicht |

Das Plugin verwendet Claude Haiku für Korrekturen — schnell und günstig, ohne jede Unterbrechung des Arbeitsablaufs.

### Automatische Korrektur (Standard)

Einfach normal tippen. Das Plugin erkennt die Sprache automatisch:

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

Wenn der Prompt fehlerfrei ist — Stille. Kein Rauschen. Stille bedeutet korrekt.

### Übersetzung

Nicht-englische Prompts werden automatisch übersetzt:

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### Prompt-Verfeinerung mit `::`

Ein `::` voranstellen, um eine grobe Idee in einen präzisen Prompt zu verwandeln:

```
:: make the search faster it's really slow with big files
```

Wird zu:

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

Das `::`-Präfix funktioniert in jeder Sprache — es übersetzt und strukturiert in einem Schritt.[^4]

::: tip Wann das Plugin schweigt
Kurze Befehle (`yes`, `continue`, `option 2`), Slash-Befehle, URLs und Code-Snippets werden unverändert durchgereicht. Keine unnötigen Roundtrips.
:::

## Den eigenen Fortschritt verfolgen

Das Plugin protokolliert jede Korrektur. Über Wochen hinweg lässt sich die Verbesserung des eigenen Englisch beobachten:

| Befehl | Was angezeigt wird |
|--------|---------------------|
| `/claude-english-buddy:today` | Heutige Korrekturen, wiederkehrende Fehler, Lektionen, Trend |
| `/claude-english-buddy:stats` | Langzeit-Fehlerquote und Verbesserungsverlauf |
| `/claude-english-buddy:mistakes` | Alle wiederkehrenden Muster — die eigenen blinden Flecken |

## Einrichtung

Das Plugin in Claude Code installieren:

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

Keine weitere Konfiguration nötig — die automatische Korrektur startet sofort.

### Optionale Konfiguration

Eine `.claude-english-buddy.json` im Projektstammverzeichnis erstellen, um das Verhalten anzupassen:

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| Einstellung | Optionen | Standard |
|-------------|----------|----------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`, `standard`, `strict` | `standard` |
| `summary_language` | Beliebiger Sprachname oder `null` zum Deaktivieren | `null` |
| `domain_terms` | Array von Begriffen, die unverändert beibehalten werden | `[]` |

Wenn `summary_language` gesetzt ist, fügt Claude am Ende jeder Antwort eine kurze Zusammenfassung in dieser Sprache an — nützlich, wenn man wichtige Entscheidungen in der Muttersprache erhalten möchte.[^5]

[^1]: Mehrsprachige LLMs treffen zentrale Entscheidungen in einem Repräsentationsraum, der dem Englischen am nächsten ist, unabhängig von Ein-/Ausgabesprache. Mithilfe einer Logit-Linse zur Untersuchung interner Repräsentationen stellten Forscher fest, dass semantisch bedeutsame Wörter (wie „water" oder „sun") auf Englisch ausgewählt werden, bevor sie in die Zielsprache übersetzt werden. Aktivierungssteuerung ist ebenfalls effektiver, wenn sie auf Englisch berechnet wird. Siehe: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Das systematische Vorübersetzen nicht-englischer Prompts ins Englische vor der Inferenz verbessert die LLM-Ausgabequalität über mehrere Aufgaben und Sprachen hinweg. Die Forscher zerlegen Prompts in vier funktionale Teile (Anweisung, Kontext, Beispiele, Ausgabe) und zeigen, dass die selektive Übersetzung bestimmter Komponenten effektiver sein kann als alles zu übersetzen. Siehe: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: Der MMLU-ProX-Benchmark — 11.829 identische Fragen in 29 Sprachen — ergab Leistungsunterschiede von bis zu 24,3 % zwischen Englisch und ressourcenarmen Sprachen. Selbst gut repräsentierte Sprachen wie Französisch und Deutsch zeigen messbare Verschlechterungen. Der Abstand korreliert stark mit dem Anteil der jeweiligen Sprache im Vortrainingsdatensatz des Modells, und eine bloße Vergrößerung des Modells beseitigt ihn nicht. Siehe: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Few-shot Prompting — das Bereitstellen von Ein-/Ausgabebeispielen innerhalb des Prompts — verbessert die Aufgabenleistung von LLMs drastisch. Das wegweisende GPT-3-Paper zeigte, dass die Zero-shot-Leistung zwar stetig mit der Modellgröße zunimmt, die Few-shot-Leistung jedoch *schneller* steigt und manchmal mit feinjustierten Modellen konkurrieren kann. Größere Modelle sind besser darin, aus In-context-Beispielen zu lernen. Siehe: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Strukturierte, gut ausgearbeitete Prompts übertreffen vage Anweisungen durchgehend bei Code-Generierungsaufgaben. Techniken wie Chain-of-Thought-Reasoning, Rollenzuweisung und explizite Bereichseinschränkungen verbessern alle die Trefferquote beim ersten Versuch. Siehe: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
