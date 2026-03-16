# Abonnement vs. API-Preisgestaltung

KI-Coding-Tools bieten zwei Authentifizierungsmethoden: **Abonnementpläne** und **API-Schlüssel**. Für anhaltende Coding-Sitzungen (Vibe-Coding) sind Abonnements dramatisch günstiger — oft 10–30-mal weniger als API-Abrechnung für dieselbe Arbeit.[^1]

## Der Kostenunterschied

Eine typische aktive Coding-Sitzung verbraucht Hunderttausende von Token pro Stunde. So fallen die Kosten im Vergleich aus:

### Claude Code

| Methode | Kosten | Was Sie bekommen |
|---------|--------|-----------------|
| **Claude Max** (Abonnement) | 100–200 $/Monat | Unbegrenzte Nutzung während Coding-Sitzungen |
| **API-Schlüssel** (`ANTHROPIC_API_KEY`) | 600–2.000 $/Monat+ | Pro Token bezahlen; bei starker Nutzung summiert es sich schnell |

**Auth-Befehl:**
```bash
claude          # Automatische Anmeldung mit Claude Max-Abonnement (empfohlen)
```

### Codex CLI (OpenAI)

| Methode | Kosten | Was Sie bekommen |
|---------|--------|-----------------|
| **ChatGPT Plus** (Abonnement) | 20 $/Monat | Moderate Nutzung |
| **ChatGPT Pro** (Abonnement) | 200 $/Monat | Intensive Nutzung |
| **API-Schlüssel** (`OPENAI_API_KEY`) | 200–1.000 $/Monat+ | Pro Token bezahlen |

**Auth-Befehl:**
```bash
codex login     # Mit ChatGPT-Abonnement anmelden (empfohlen)
```

### Gemini CLI (Google)

| Methode | Kosten | Was Sie bekommen |
|---------|--------|-----------------|
| **Kostenloser Tarif** | 0 $ | Großzügiges kostenloses Kontingent |
| **Google One AI Premium** | ca. 20 $/Monat | Höhere Limits |
| **API-Schlüssel** (`GEMINI_API_KEY`) | Variabel | Pro Token bezahlen |

**Auth-Befehl:**
```bash
gemini          # Mit Google-Konto anmelden (empfohlen)
```

## Faustregel

> **Abonnement = 10–30-mal günstiger** für anhaltende Coding-Sitzungen.

Die Rechnung ist einfach: Ein Abonnement bietet einen festen Monatsbetrag, während die API-Abrechnung pro Token abrechnet. KI-Coding-Tools sind extrem tokenhungrig — sie lesen ganze Dateien, generieren lange Code-Blöcke und iterieren durch mehrere Runden von Bearbeitungen. Ein einzelnes komplexes Feature kann Millionen von Token verbrauchen.[^2]

## Wann API-Schlüssel sinnvoll sind

API-Schlüssel sind die richtige Wahl für:

| Anwendungsfall | Warum |
|----------------|-------|
| **CI/CD-Pipelines** | Automatisierte Jobs, die kurz und selten laufen |
| **Leichte oder gelegentliche Nutzung** | Ein paar Anfragen pro Woche |
| **Programmatischer Zugriff** | Skripte und Integrationen, die die API direkt aufrufen |
| **Team-/Organisationsabrechnung** | Zentrale Abrechnung über API-Nutzungs-Dashboards |

Bei interaktiven Coding-Sitzungen — wo Sie stundenlang mit der KI hin und her arbeiten — gewinnen Abonnements bei den Kosten jedes Mal.[^3]

## Einrichtung in VMark

VMarcks `AGENTS.md` erzwingt Abonnement-first-Auth als Projektkonvention. Wenn Sie das Repository klonen und ein KI-Coding-Tool öffnen, wird Sie daran erinnert, die Abonnement-Auth zu verwenden:

```
Prefer subscription auth over API keys for all AI coding tools.
```

Alle drei Tools funktionieren nach der Authentifizierung sofort:

```bash
# Empfohlen: Abonnement-Auth
claude              # Claude Code mit Claude Max
codex login         # Codex CLI mit ChatGPT Plus/Pro
gemini              # Gemini CLI mit Google-Konto

# Fallback: API-Schlüssel
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip PATH für macOS-GUI-Apps
macOS-GUI-Apps (wie von Spotlight gestartete Terminals) haben einen minimalen PATH. Wenn ein Tool in Ihrem Terminal funktioniert, Claude Code es aber nicht findet, stellen Sie sicher, dass der Binärpfad in Ihrem Shell-Profil (`~/.zshrc` oder `~/.bashrc`) enthalten ist.
:::

[^1]: Eine typische intensive KI-Coding-Sitzung verbraucht 50.000–100.000+ Token pro Interaktion. Zu aktuellen API-Preisen (z. B. Claude Sonnet bei 3$/15$ pro Million Eingabe-/Ausgabe-Token) berichten intensive Nutzer von monatlichen API-Kosten von 200–2.000 $+ — während Abonnementpläne bei 100–200 $/Monat für unbegrenzte Nutzung gedeckelt sind. Das Missverhältnis wächst mit der Nutzungsintensität: Leichte Nutzer sehen möglicherweise ähnliche Kosten in beide Richtungen, aber anhaltende Vibe-Coding-Sitzungen machen Abonnements zum klaren Sieger. Siehe: [AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: KI-Coding-Agenten verbrauchen weit mehr Token als einfache Chat-Interaktionen, weil sie ganze Dateien in den Kontext lesen, Multi-Datei-Bearbeitungen generieren, iterative Fix-Test-Schleifen durchlaufen und den Gesprächsverlauf über lange Sitzungen aufrechterhalten. Eine einzelne komplexe Feature-Implementierung kann Dutzende von Tool-Aufrufen umfassen, von denen jeder Tausende von Token verbraucht. Das Kontextfenster selbst wird zum Kostentreiber — größere Fenster ermöglichen bessere Ergebnisse, multiplizieren aber die Token-Nutzung. Siehe: [The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: Die breitere SaaS-Industrie bewegt sich hin zu hybriden Preismodellen, die flache Abonnements mit nutzungsbasierten Komponenten kombinieren. Bis 2023 hatten 46 % der SaaS-Unternehmen nutzungsbasierte Preisgestaltung eingeführt, und Unternehmen, die diese verwenden, berichten von 137 % netto-Dollar-Retention. Für KI-gestützte Tools, bei denen jede Anfrage nennenswerte Rechenleistung verbraucht, setzt rein nutzungsbasierte Preisgestaltung die Nutzer jedoch unvorhersehbaren Kosten aus — weshalb Pauschalabonnements für intensive Einzelnutzer attraktiv bleiben. Siehe: [The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025); [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
