# AI Coding with VMark

## Users as Developers

In the age of AI coding tools, the line between "user" and "developer" is disappearing. If you can describe a bug, you can fix it. If you can imagine a feature, you can build it — with an AI assistant that already understands the codebase.

VMark embraces this philosophy. The repo ships with project rules, architecture docs, and conventions pre-loaded for AI coding tools. Clone the repo, open your AI assistant, and start contributing — the AI already knows how VMark works.

## Ready Out of the Box

If you use AI coding tools like [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex CLI](https://github.com/openai/codex), or [Gemini CLI](https://github.com/google-gemini/gemini-cli), VMark's repo is ready for them out of the box.

## One File, Every Tool

AI coding tools each read their own config file:

| Tool | Config file |
|------|------------|
| Claude Code | `CLAUDE.md` |
| Codex CLI | `AGENTS.md` |
| Gemini CLI | `GEMINI.md` |

Maintaining the same instructions in three places is error-prone. VMark solves this with a single source of truth:

- **`AGENTS.md`** — Contains all project rules, conventions, and architecture notes.
- **`CLAUDE.md`** — Just one line: `@AGENTS.md` (a Claude Code directive that inlines the file).
- **Codex CLI** — Reads `AGENTS.md` directly.
- **Gemini CLI** — Would use `@AGENTS.md` in `GEMINI.md` the same way.

Update `AGENTS.md` once, every tool picks up the change.

::: tip What is `@AGENTS.md`?
The `@` prefix is a Claude Code directive that inlines another file's content. It's similar to `#include` in C — the contents of `AGENTS.md` are inserted into `CLAUDE.md` at that position. Learn more at [agents.md](https://agents.md/).
:::

## What the AI Knows

When an AI coding tool opens the VMark repo, it automatically receives:

### Project Rules (`.claude/rules/`)

These files are auto-loaded into every Claude Code session. They cover:

| Rule | What it enforces |
|------|-----------------|
| TDD Workflow | Test-first is mandatory; coverage thresholds block the build |
| Design Tokens | Never hardcode colors — full CSS token reference included |
| Component Patterns | Popup, toolbar, context menu patterns with code examples |
| Focus Indicators | Accessibility: keyboard focus must always be visible |
| Dark Theme | `.dark-theme` selector rules, token parity requirements |
| Keyboard Shortcuts | Three-file sync procedure (Rust, TypeScript, docs) |
| Version Bumps | Five-file update procedure |
| Codebase Conventions | Store, hook, plugin, test, and import patterns |

### Custom Skills

Slash commands give the AI specialized capabilities:

| Command | What it does |
|---------|-------------|
| `/fix` | Fix issues properly — root cause analysis, TDD, no patches |
| `/codex-audit` | Full 9-dimension code audit (security, correctness, compliance, ...) |
| `/codex-audit-mini` | Fast 5-dimension check for small changes |
| `/codex-verify` | Verify fixes from a previous audit |
| `/codex-commit` | Smart commit messages from change analysis |
| `/feature-workflow` | End-to-end gated workflow with specialized agents |
| `/release-gate` | Run full quality gates and produce a report |

### Specialized Agents

For complex tasks, Claude Code can delegate to focused subagents:

| Agent | Role |
|-------|------|
| Planner | Researches best practices, brainstorms edge cases, produces modular plans |
| Implementer | TDD-driven implementation with preflight investigation |
| Auditor | Reviews diffs for correctness and rule violations |
| Test Runner | Runs gates, coordinates E2E testing via Tauri MCP |
| Verifier | Final checklist before release |

## Using Codex as a Second Opinion

VMark's `.mcp.json` registers a Codex MCP server. This lets Claude Code consult Codex — a different AI model — for independent analysis.

**Setup:**

```bash
npm install -g @openai/codex
```

**Structured commands:**

```
/codex-audit              # Full audit of uncommitted changes
/codex-audit commit -3    # Audit last 3 commits
/codex-verify             # Verify fixes from a previous audit
```

**Ad-hoc help** — if Claude is stuck, just say:

```
Summarize your trouble, and ask Codex for help.
```

Claude will formulate a question, send it to Codex via the MCP bridge, and incorporate the response.

## Private Overrides

Not everything belongs in the shared config. For personal preferences:

| File | Shared? | Purpose |
|------|---------|---------|
| `AGENTS.md` | Yes | Project rules for all AI tools |
| `CLAUDE.md` | Yes | Claude Code entry point |
| `.claude/settings.json` | Yes | Team-shared permissions |
| `CLAUDE.local.md` | **No** | Your personal instructions (gitignored) |
| `.claude/settings.local.json` | **No** | Your personal settings (gitignored) |

Create `CLAUDE.local.md` in the project root for instructions that only apply to you — preferred language, workflow habits, tool preferences.

## Getting Started

1. **Clone the repo** — AI config is already in place.
2. **Install your AI tool** — Claude Code, Codex CLI, or Gemini CLI.
3. **Open a session** — The tool reads `AGENTS.md` and the rules automatically.
4. **Start coding** — The AI knows the project conventions, testing requirements, and architecture patterns.

No extra setup needed. Just start asking your AI to help.

## Next Steps

- [MCP Setup](/guide/mcp-setup) — Connect AI assistants to VMark's editor
- [Claude Code Skill](/guide/claude-code-skill) — Enhanced AI writing assistance
- [MCP Tools Reference](/guide/mcp-tools) — All 76 editor tools
