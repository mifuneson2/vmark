# Abbonamento vs Prezzi API

Gli strumenti di codifica AI offrono due metodi di autenticazione: **piani di abbonamento** e **chiavi API**. Per le sessioni di codifica prolungate (vibe-coding), gli abbonamenti sono drammaticamente più economici — spesso da 10 a 30 volte meno rispetto alla fatturazione API per lo stesso lavoro.[^1]

## La Differenza di Costo

Una tipica sessione di codifica attiva utilizza centinaia di migliaia di token all'ora. Ecco come si confrontano i costi:

### Claude Code

| Metodo | Costo | Cosa Ottieni |
|--------|-------|-------------|
| **Claude Max** (abbonamento) | $100–200/mese | Uso illimitato durante le sessioni di codifica |
| **Chiave API** (`ANTHROPIC_API_KEY`) | $600–2.000+/mese | Pagamento per token; l'uso intensivo si accumula rapidamente |

**Comando di autenticazione:**
```bash
claude          # Auto-login con abbonamento Claude Max (raccomandato)
```

### Codex CLI (OpenAI)

| Metodo | Costo | Cosa Ottieni |
|--------|-------|-------------|
| **ChatGPT Plus** (abbonamento) | $20/mese | Uso moderato |
| **ChatGPT Pro** (abbonamento) | $200/mese | Uso intensivo |
| **Chiave API** (`OPENAI_API_KEY`) | $200–1.000+/mese | Pagamento per token |

**Comando di autenticazione:**
```bash
codex login     # Accedi con abbonamento ChatGPT (raccomandato)
```

### Gemini CLI (Google)

| Metodo | Costo | Cosa Ottieni |
|--------|-------|-------------|
| **Livello gratuito** | $0 | Quota gratuita generosa |
| **Google One AI Premium** | ~$20/mese | Limiti più alti |
| **Chiave API** (`GEMINI_API_KEY`) | Variabile | Pagamento per token |

**Comando di autenticazione:**
```bash
gemini          # Accedi con account Google (raccomandato)
```

## Regola Pratica

> **Abbonamento = 10–30 volte più economico** per le sessioni di codifica prolungate.

La matematica è semplice: un abbonamento ti dà una tariffa mensile fissa, mentre la fatturazione API addebita per token. Gli strumenti di codifica AI sono estremamente famelici di token — leggono interi file, generano lunghi blocchi di codice e iterano attraverso molteplici round di modifiche. Una singola funzionalità complessa può consumare milioni di token.[^2]

## Quando le Chiavi API Sono Ancora Adatte

Le chiavi API sono la scelta giusta per:

| Caso d'Uso | Perché |
|------------|--------|
| **Pipeline CI/CD** | Lavori automatizzati che girano brevemente e raramente |
| **Uso leggero o occasionale** | Qualche query a settimana |
| **Accesso programmatico** | Script e integrazioni che chiamano direttamente l'API |
| **Fatturazione team/org** | Fatturazione centralizzata tramite dashboard di utilizzo API |

Per le sessioni di codifica interattive — dove vai avanti e indietro con l'IA per ore — gli abbonamenti vincono sempre sul costo.[^3]

## Configurazione in VMark

Il file `AGENTS.md` di VMark applica l'autenticazione con abbonamento come convenzione del progetto. Quando cloni il repository e apri uno strumento di codifica AI, ti ricorda di usare l'autenticazione con abbonamento:

```
Preferisci l'autenticazione con abbonamento rispetto alle chiavi API per tutti gli strumenti di codifica AI.
```

Tutti e tre gli strumenti funzionano immediatamente una volta autenticati:

```bash
# Raccomandato: autenticazione con abbonamento
claude              # Claude Code con Claude Max
codex login         # Codex CLI con ChatGPT Plus/Pro
gemini              # Gemini CLI con account Google

# Fallback: chiavi API
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip PATH per le App GUI macOS
Le app GUI macOS (come i terminali avviati da Spotlight) hanno un PATH minimo. Se uno strumento funziona nel tuo terminale ma Claude Code non riesce a trovarlo, assicurati che la posizione del binario sia nel tuo profilo shell (`~/.zshrc` o `~/.bashrc`).
:::

[^1]: Una tipica sessione intensiva di codifica AI consuma 50.000–100.000+ token per interazione. Ai tassi API attuali (ad esempio, Claude Sonnet a $3/$15 per milione di token di input/output), gli utenti intensivi riportano costi API mensili di $200–$2.000+ — mentre i piani di abbonamento hanno un tetto a $100–$200/mese per uso illimitato. La disparità cresce con l'intensità dell'utilizzo: gli utenti leggeri potrebbero vedere costi simili in entrambi i casi, ma le sessioni di vibe-coding prolungate rendono gli abbonamenti il chiaro vincitore. Vedere: [AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: Gli agenti di codifica AI consumano molti più token rispetto alle semplici interazioni di chat perché leggono interi file nel contesto, generano modifiche su più file, eseguono cicli iterativi di correzione-test e mantengono la cronologia della conversazione durante sessioni lunghe. Una singola implementazione di funzionalità complessa può coinvolgere dozzine di chiamate agli strumenti, ognuna che consuma migliaia di token. La finestra di contesto stessa diventa un fattore di costo — finestre più grandi abilitano risultati migliori ma moltiplicano l'utilizzo dei token. Vedere: [The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: Il settore SaaS più ampio si sta spostando verso modelli di prezzo ibridi che combinano abbonamenti fissi con componenti basati sull'utilizzo. Entro il 2023, il 46% delle aziende SaaS aveva adottato prezzi basati sull'utilizzo, e le aziende che lo usano riportano una retention netta del 137%. Tuttavia, per gli strumenti alimentati dall'AI dove ogni query consuma computazione notevole, il prezzo puramente basato sull'utilizzo espone gli utenti a costi imprevedibili — motivo per cui gli abbonamenti a tariffa fissa rimangono attraenti per gli utenti individuali intensivi. Vedere: [The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025); [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
