# AI Genies

AI Genies are built-in prompt templates that transform your text using AI. Select text, invoke a genie, and review the suggested changes — all without leaving the editor.

## Quick Start

1. Select text (or place cursor in a paragraph)
2. Press `Mod + Y` to open the genie picker
3. Choose a genie or type a freeform prompt
4. Review the suggestion — accept or reject

## Genie Picker

Press `Mod + Y` (or menu **Tools > AI Genies**) to open a spotlight-style overlay. You can:

- **Search** — Type to filter genies by name or description
- **Browse** — Scroll through categories
- **Freeform** — Type any instruction and press Enter to use it as a one-off prompt

The picker closes after selecting a genie, and the AI begins generating a suggestion.

## Built-in Genies

VMark ships with 13 genies across four categories:

### Editing

| Genie | Description | Scope |
|-------|-------------|-------|
| Polish | Improve clarity and flow | Selection |
| Condense | Make text more concise | Selection |
| Fix Grammar | Fix grammar and spelling | Selection |
| Simplify | Use simpler language | Selection |

### Creative

| Genie | Description | Scope |
|-------|-------------|-------|
| Expand | Develop idea into fuller prose | Selection |
| Rephrase | Say the same thing differently | Selection |
| Vivid | Add sensory details and imagery | Selection |
| Continue Writing | Continue writing from here | Block |

### Structure

| Genie | Description | Scope |
|-------|-------------|-------|
| Summarize | Summarize the document | Document |
| Outline | Generate an outline | Document |
| Headline | Suggest title options | Document |

### Tools

| Genie | Description | Scope |
|-------|-------------|-------|
| Translate | Translate to English | Selection |
| Rewrite in English | Rewrite text in English | Selection |

## Scope

Each genie operates on one of three scopes:

- **Selection** — Uses the selected text. If nothing is selected, falls back to the current block.
- **Block** — Uses the current paragraph or block element at the cursor.
- **Document** — Uses the entire document content.

## Reviewing Suggestions

After a genie runs, the suggestion appears inline as ghost text:

- **Insert** — New text shown in green ghost text
- **Replace** — Original text with strikethrough, new text in green ghost text
- **Delete** — Original text with strikethrough

Each suggestion has accept (checkmark) and reject (X) buttons.

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | `Enter` |
| Reject suggestion | `Escape` |
| Next suggestion | `Tab` |
| Previous suggestion | `Shift + Tab` |
| Accept all | `Mod + Shift + Enter` |
| Reject all | `Mod + Shift + Escape` |

## Running Indicator

While AI is generating, a bouncing sparkle icon appears in the status bar. The status bar briefly shows even if it is hidden, so you always know when AI is working.

## Requirements

AI Genies require a configured AI provider. See [AI Providers](/guide/ai-providers) for setup instructions.

## See Also

- [AI Providers](/guide/ai-providers) — Configure CLI or REST API providers
- [Keyboard Shortcuts](/guide/shortcuts) — Full shortcut reference
- [MCP Tools](/guide/mcp-tools) — External AI integration via MCP
