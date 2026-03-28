# CLAUDE.md

@AGENTS.md

## Claude-specific notes
- **No project memory**: Do not use `~/.claude/projects/*/memory/` for this project. All project knowledge belongs in `AGENTS.md`, `CLAUDE.md`, or `.claude/rules/`.
- **Cost reports**: Daily cost reports use a single rolling issue (close previous, open new) with data archived to `.github/cost-reports/ledger.json`. Do not keep old cost-report issues open — the workflow handles the lifecycle automatically.
