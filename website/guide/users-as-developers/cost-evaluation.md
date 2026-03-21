# What Would VMark Cost to Build?

::: info TL;DR
VMark has ~109,000 lines of production code and 206,000 lines of test code across TypeScript, Rust, CSS, and Vue. A human team would need **4,239 developer-days** (~17 person-years) to build it from scratch. At US market rates, that's **$3.4M–$4.2M**. It was built in **85 calendar days** by one person with AI assistance, at a cost of roughly **$2,000** — a ~50x productivity multiplier and ~99.9% cost reduction.
:::

## Why This Page Exists

One question keeps coming up: *"How much effort did VMark actually take?"*

This isn't a marketing page. It's a transparent, data-driven analysis using real code metrics — not vibes. Every number here comes from `tokei` (line counting), `git log` (history), and `vitest` (test counts). You can reproduce these numbers yourself by cloning the repo.

## Raw Metrics

| Metric | Value |
|--------|-------|
| Production code (frontend TS/TSX) | 85,306 LOC |
| Production code (Rust backend) | 10,328 LOC |
| Production code (MCP server) | 4,627 LOC |
| Production CSS | 8,779 LOC |
| i18n locale data | 10,130 LOC |
| Website (Vue + TS + docs) | 4,421 LOC + 75,930 lines docs |
| **Test code** | **206,077 LOC** (656 files) |
| Test count | 17,255 tests |
| Documentation | 75,930 lines (320 pages, 10 locales) |
| Commits | 1,993 over 84 active days |
| Calendar time | 85 days (Dec 27, 2025 — Mar 21, 2026) |
| Contributors | 2 (1 human + AI) |
| Churn ratio | 3.7x (1.23M insertions / 330K final lines) |
| Test-to-production ratio | **2.06:1** |

### What These Numbers Mean

- **Test-to-production ratio of 2.06:1** is exceptional. Most open-source projects hover around 0.3:1. VMark has more test code than production code — by a factor of two.
- **Churn ratio of 3.7x** means for every line in the final codebase, 3.7 lines were written total (including rewrites, refactors, and deleted code). This indicates significant iteration — not "write once and ship."
- **1,993 commits in 84 active days** averages ~24 commits per day. AI-assisted development produces many small, focused commits.

## Complexity Breakdown

Not all code is created equal. A line of config parsing is not the same as a line of ProseMirror plugin code. We classify the codebase into four complexity tiers:

| Tier | What It Includes | LOC | Rate (LOC/day) |
|------|------------------|-----|----------------|
| **Routine** (1.0x) | i18n JSON, CSS tokens, page layouts, settings UI | 23,000 | 150 |
| **Standard** (1.5x) | Stores, hooks, components, MCP bridge, export, Rust commands, website | 52,000 | 100 |
| **Complex** (2.5x) | ProseMirror/Tiptap plugins (multi-cursor, focus mode, code preview, table UI, IME guard), CodeMirror integration, Rust AI provider, MCP server | 30,000 | 50 |
| **Research** (4.0x) | CJK formatting engine, composition guard system, auto-pair with IME awareness | 4,000 | 25 |

The "LOC/day" rates assume a senior developer writing tested, reviewed code — not raw unreviewed output.

### Why Editor Plugins Are Expensive

The single most expensive part of VMark is the **ProseMirror/Tiptap plugin layer** — 34,859 lines of code that manages text selections, document transactions, node views, and IME composition. This is widely considered the hardest category of web development:

- You're working with a document model, not a component tree
- Every edit is a transaction that must preserve document integrity
- IME composition (for CJK input) adds an entire parallel state machine
- Multi-cursor requires tracking N independent selections simultaneously
- Undo/redo must work correctly across all of the above

This is why the plugin layer is classified as "Complex" (2.5x multiplier) and the CJK/IME code as "Research" (4.0x).

## Effort Estimate

| Component | LOC | Dev-Days |
|-----------|-----|----------|
| Tier 1 production (routine) | 23,000 | 153 |
| Tier 2 production (standard) | 52,000 | 520 |
| Tier 3 production (complex) | 30,000 | 600 |
| Tier 4 production (research) | 4,000 | 160 |
| Test code | 206,077 | 1,374 |
| Documentation (10 locales) | 75,930 | 380 |
| **Subtotal** | | **3,187** |
| Overhead (design 5% + CI 3% + review 10%) | | 574 |
| Churn tax (3.7x → +15%) | | 478 |
| **Total** | | **4,239 dev-days** |

That's approximately **17 person-years** of full-time senior engineering work.

::: warning Note on Test Effort
The test suite (206K LOC, 17,255 tests) accounts for **1,374 dev-days** — more than one-third of the total effort. This is the cost of the project's test-first discipline. Without it, the project would be ~40% cheaper to build but significantly harder to maintain.
:::

## Cost Estimate

Using US market rates (fully loaded — salary + benefits + overhead):

| Scenario | Team | Duration | Cost |
|----------|------|----------|------|
| Solo senior ($800/day) | 1 person | 17.7 years | **$3.39M** |
| Small team ($900/day avg) | 3 people | 2.3 years | **$3.82M** |
| Full team ($1,000/day avg) | 5 people | 10.6 months | **$4.24M** |

Teams don't scale linearly. A 5-person team is ~4x as productive as one person (not 5x) due to communication overhead — this is Brooks's Law in action.

## The AI Reality

| Metric | Value |
|--------|-------|
| Actual calendar time | **85 days** (12 weeks) |
| Human equivalent | 4,239 dev-days (~17 person-years) |
| **Productivity multiplier** | **~50x** |
| Estimated actual cost | ~$2,000 (Claude Max subscription) |
| Human equivalent cost (solo) | $3.39M |
| **Cost reduction** | **~99.9%** |

### What the 50x Multiplier Means

It does **not** mean "AI is 50 times smarter than a human." It means:

1. **AI doesn't context-switch.** It can hold the entire codebase in memory and make changes across 10 files simultaneously.
2. **AI writes tests at production speed.** For a human, writing 17,255 tests is a soul-crushing slog. For AI, it's just more code.
3. **AI handles boilerplate instantly.** The 10-locale translation layer (10,130 LOC of JSON + 320 pages of docs) would take a human team weeks. AI does it in minutes.
4. **AI doesn't get bored.** The 656 test files covering edge cases, IME composition, and CJK formatting are exactly the kind of work humans skip.

The human's role was judgment — *what* to build, *when* to stop, *which* approach to take. The AI's role was labor — writing, testing, debugging, translating.

## Market Comparison

| Dimension | VMark | Typora | Zettlr | Mark Text |
|-----------|-------|--------|--------|-----------|
| Core function | Markdown WYSIWYG + Source | Markdown WYSIWYG | Academic Markdown | Markdown WYSIWYG |
| LOC (est.) | ~109K prod | ~200K (closed source) | ~80K | ~120K |
| Contributors | 2 (1 human + AI) | 1–2 (closed) | ~50 | ~100 |
| Age | **3 months** | 8+ years | 6+ years | 6+ years |
| Price | Free (beta) | $15 license | Free / OSS | Free / OSS |
| Key differentiator | Tauri native, MCP AI, CJK-native, multi-cursor | Polish, PDF export | Zettelkasten, citations | Electron, mature |

### What This Comparison Shows

VMark reached a comparable codebase size and feature set in **85 days** that took other projects **6–8 years** with teams of 50–100 contributors. The test discipline (17K tests, 2:1 ratio) exceeds every open-source markdown editor in this comparison.

This isn't because VMark is "better" — it's younger and less battle-tested. But it demonstrates what AI-assisted development makes possible: a single person can produce output that previously required a funded team.

## What Makes VMark Expensive to Build

Three factors drive the cost:

1. **Editor plugin complexity** — 34,859 LOC of ProseMirror plugins touching selection, transactions, node views, and IME composition. This is Tier 3/4 code that a senior editor-framework specialist would write at ~50 LOC/day.

2. **Extreme test discipline** — A 2.06:1 test-to-production ratio means the test code alone (206K LOC) takes more effort than the production code. This is a deliberate investment — it's what makes AI-assisted development sustainable.

3. **Full i18n at 10 locales** — 320 documentation pages, 80 locale JSON files, and a complete localized website. This is operational scale normally seen in funded commercial products, not solo projects.

## Reproduce These Numbers

All metrics are reproducible from the public repo:

```bash
# Clone and install
git clone https://github.com/xiaolai/vmark.git
cd vmark && pnpm install

# LOC metrics (requires tokei: brew install tokei)
tokei --exclude node_modules --exclude dist .

# Git history
git log --oneline | wc -l
git log --format='%ai' | awk '{print $1}' | sort -u | wc -l

# Test count
pnpm vitest run src/ 2>&1 | tail -5
```

::: tip Methodology
The productivity baselines (LOC/day rates) used in this analysis are industry-standard estimates for senior developers writing tested, reviewed code. They come from software estimation literature (McConnell, Capers Jones) and are calibrated for production-quality output — not prototype or proof-of-concept code.
:::
