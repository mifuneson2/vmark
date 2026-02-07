# AI Providers

VMark's [AI Genies](/guide/ai-genies) need an AI provider to generate suggestions. You can use a locally installed CLI tool or connect to a REST API.

## Setup

Open **Settings > Integrations** to configure your AI provider.

Only one provider can be active at a time. Select the one you want to use — CLI or REST — and VMark will route all genie requests through it.

## CLI Providers

CLI providers use locally installed AI tools. Click **Detect** to scan your system for available CLIs.

| Provider | CLI Command | Notes |
|----------|-------------|-------|
| Claude | `claude` | [Anthropic Claude Code](https://docs.anthropic.com/en/docs/claude-code) |
| Codex | `codex` | [OpenAI Codex CLI](https://github.com/openai/codex) |
| Gemini | `gemini` | [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) |
| Ollama | `ollama` | [Ollama](https://ollama.com) local models |

**Advantages:**

- No API key needed (CLI handles authentication)
- Uses your existing CLI configuration
- Works offline with Ollama

**Selecting a CLI provider:** Click its radio button. The provider must show "Available" status — install the CLI first if it shows "Not found."

## REST API Providers

REST providers connect directly to cloud APIs. Each requires an endpoint, API key, and model name.

| Provider | Default Endpoint | Env Variable |
|----------|-----------------|--------------|
| Anthropic | `https://api.anthropic.com/v1/messages` | `ANTHROPIC_API_KEY` |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `OPENAI_API_KEY` |
| Google AI | *(built-in)* | `GOOGLE_API_KEY` or `GEMINI_API_KEY` |
| Ollama (API) | `http://localhost:11434/v1/chat/completions` | — |

### Configuration Fields

When you select a REST provider, three input fields appear:

- **API Endpoint** — The API URL (hidden for Google AI which uses a fixed endpoint)
- **API Key** — Your secret key (stored locally, never sent anywhere except the provider)
- **Model** — The model identifier (e.g., `claude-sonnet-4-5-20250929`, `gpt-4o`, `gemini-2.0-flash`)

### Environment Variable Auto-Fill

VMark reads standard environment variables on first use. If `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` is set in your shell, the API key field auto-populates when you select that provider.

## Choosing a Provider

| Use Case | Recommendation |
|----------|---------------|
| Already have Claude Code installed | Select **Claude (CLI)** |
| Want the simplest setup | Set an env var, select the REST provider |
| Need offline/private mode | Install Ollama, use **Ollama (CLI)** or **Ollama (API)** |
| Custom or self-hosted model | Use **Ollama (API)** with your endpoint |

## See Also

- [AI Genies](/guide/ai-genies) — How to use AI-powered writing assistance
- [MCP Setup](/guide/mcp-setup) — External AI integration via Model Context Protocol
