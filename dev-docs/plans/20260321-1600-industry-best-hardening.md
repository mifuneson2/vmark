# Industry-Best Quality Hardening Plan

---
title: "Industry-Best Quality Hardening"
created_at: "2026-03-21 16:00 CST"
mode: "full-plan"
branch: "quality/industry-best-hardening"
---

## Outcomes

- **Desired behavior:**
  - VMark achieves provable quality guarantees across all engineering dimensions
  - Every critical user path has E2E test coverage via Tauri MCP
  - Automated accessibility testing catches WCAG 2.1 AA regressions
  - Performance benchmarks detect latency/memory regressions before release
  - Security scanning runs in CI; no known vulnerabilities ship
  - Every failure mode has a documented and tested recovery path
  - MCP API has versioning, deprecation markers, and backward compatibility guarantees
  - CI tests on macOS, Ubuntu, and Windows
  - Mutation testing validates test suite quality
  - New contributors can onboard via CONTRIBUTING.md + ADRs

- **Constraints:**
  - macOS is primary platform — never break macOS to fix others
  - No resource limits (time, money, effort)
  - TDD mandatory — tests before implementation
  - `pnpm check:all` + `cargo test` must pass at every commit
  - No breaking changes to MCP protocol without deprecation cycle

- **Non-goals:**
  - Rewriting existing features
  - Changing the plugin architecture
  - Adding new user-facing features

## Constraints & Dependencies

- Runtime: Rust stable, Node 22, pnpm 10
- OS: macOS (primary), Ubuntu (CI), Windows (CI)
- External tools needed: `cargo-audit`, `cargo-mutants`, `@stryker-mutator/core` (optional), `vitest-axe`
- CI: GitHub Actions (existing)

## Current Behavior Inventory

### What exists (strong)
- 17k+ unit tests, 233 Rust tests, 626 test files
- 10 custom lint gates in `pnpm check:all`
- dependency-cruiser with 4 enforced rules
- Hot exit + crash recovery + auto-save (3-layer persistence)
- DOMPurify sanitization, atomic writes, path validation
- 12 MCP tools with 77 actions, protocol version 1.0.0
- perfLog.ts (opt-in) + markdown pipeline benchmarks (local only)

### What's missing (gaps by dimension)
1. **E2E**: Zero committed test files; Tauri MCP skills exist but unused
2. **A11y**: No axe-core, no landmarks, no reduced-motion (6/60 files), no automated a11y tests
3. **Performance**: No CI benchmarks, no keystroke latency measurement, no memory tracking
4. **Security**: No `cargo audit` / `pnpm audit` in CI, CSP has `unsafe-inline`, API keys in localStorage
5. **Error recovery**: 15 failure modes untested (disk full, corrupted config, concurrent modification)
6. **MCP versioning**: No per-tool version, no deprecation markers, no field aliasing
7. **Cross-platform**: CI only runs on ubuntu-latest (frontend) + ubuntu-latest (Rust)
8. **Mutation testing**: None
9. **Contributor docs**: No CONTRIBUTING.md, only 2 ADRs

## Target Rules

### R1: E2E regression suite
- Trigger: Before every release
- Behavior: 20+ scenarios pass via Tauri MCP against running app
- Scope: Critical user paths (edit, save, export, mode switch, MCP bridge)
- Exclusion: Not run in CI (requires running app); manual pre-release gate

### R2: Automated a11y
- Trigger: Every test run
- Behavior: axe-core violations = 0 for rendered components
- Scope: All components with interactive elements
- Exclusion: ProseMirror internal DOM (managed by Tiptap)

### R3: Performance benchmarks
- Trigger: `pnpm bench` (manual) + optional CI gate
- Behavior: Alert if p95 latency degrades >20% from baseline
- Scope: Markdown pipeline, MCP response time, editor operations

### R4: Security scanning
- Trigger: Every CI run
- Behavior: `pnpm audit` + `cargo audit` fail on known vulnerabilities
- Scope: All dependencies

### R5: Error recovery tests
- Trigger: Every test run
- Behavior: Each failure mode has a test proving recovery works
- Scope: Disk full, corrupted config, concurrent modification, watcher failure

### R6: MCP API versioning
- Trigger: Any MCP tool change
- Behavior: Deprecated actions log warnings; capabilities expose tool versions
- Scope: All 12 tools, 77 actions

### R7: Cross-platform CI
- Trigger: Every PR
- Behavior: Tests pass on macOS, Ubuntu, Windows
- Scope: `pnpm test` + `cargo test` on all 3

### R8: Mutation testing
- Trigger: Quarterly (manual)
- Behavior: >80% mutation score on stores, hooks, utils
- Scope: Non-CSS, non-test source files

## Decision Log

- **D1: E2E test framework**
  - Options: (a) Committed test scripts run by Tauri MCP, (b) Playwright + Tauri, (c) WebDriver
  - Decision: (a) — Tauri MCP scripts as documented test scenarios
  - Rationale: Already have the infrastructure (skills, MCP tools); no new dependencies
  - Rejected: (b) Playwright can't control Tauri windows; (c) WebDriver is overkill

- **D2: A11y testing library**
  - Options: (a) vitest-axe, (b) @axe-core/react, (c) jest-axe with vitest adapter
  - Decision: (a) vitest-axe — native Vitest integration
  - Rationale: Direct Vitest compatibility, maintained, lightweight

- **D3: Performance benchmark tool**
  - Options: (a) Vitest bench mode, (b) tinybench standalone, (c) Custom with Performance API
  - Decision: (a) Vitest bench — already available, no new dependency
  - Rationale: `vitest bench` is built-in to Vitest v4, consistent with existing test infrastructure

- **D4: Mutation testing tool**
  - Options: (a) Stryker, (b) Manual mutation analysis, (c) cargo-mutants for Rust
  - Decision: (c) cargo-mutants for Rust (highest value — Rust is least tested)
  - Rationale: Rust backend has lowest coverage; cargo-mutants is lightweight and focused

- **D5: API key storage**
  - Options: (a) System keychain, (b) Encrypted file in ~/.vmark, (c) Keep localStorage
  - Decision: (b) Encrypted file via Tauri's safe storage plugin
  - Rationale: Cross-platform, no external dependency; tauri-plugin-store already available

## Open Questions

- **Q1: Should E2E tests block CI or be manual?**
  - Why: E2E requires a running app; CI headless Tauri is complex
  - Default: Manual pre-release gate; document as checklist

- **Q2: Should mutation testing be a CI gate or advisory?**
  - Why: Mutation testing is slow (hours); blocking CI is impractical
  - Default: Advisory with quarterly reports

## Work Items

### Phase 1: CI & Security Foundation

#### WI-001: Cross-platform CI matrix

- **Goal:** Tests run on macOS, Ubuntu, and Windows in CI
- **Acceptance:** CI workflow has 3x3 matrix (frontend + rust × 3 platforms); all pass
- **Tests:** CI itself is the test
- **Touched areas:** `.github/workflows/ci.yml`
- **Dependencies:** None
- **Risks:** Windows Tauri deps may need different packages
  - Mitigation: Use `tauri-apps/tauri-action` patterns for platform deps
- **Rollback:** Revert CI changes
- **Estimate:** M

#### WI-002: Security scanning in CI

- **Goal:** Known dependency vulnerabilities caught before merge
- **Acceptance:** (1) `pnpm audit --audit-level=moderate` runs in CI. (2) `cargo audit` runs in CI. (3) CI fails on known vulnerabilities (with allowlist for false positives).
- **Tests:** CI gate
- **Touched areas:** `.github/workflows/ci.yml`, new `deny.toml` for cargo-audit config
- **Dependencies:** Install `cargo-audit` via `cargo install cargo-audit`
- **Risks:** False positives from transitive deps
  - Mitigation: Use `--ignore` flags for known false positives; document in deny.toml
- **Rollback:** Remove CI steps
- **Estimate:** S

#### WI-003: HTML lang attribute

- **Goal:** Screen readers detect page language
- **Acceptance:** `index.html` has `lang="en"` (dynamically updated by i18n.ts)
- **Tests:** Unit test: verify i18n.ts sets `document.documentElement.lang`
- **Touched areas:** `index.html`, `src/i18n.ts`
- **Dependencies:** None
- **Estimate:** S

### Phase 2: Accessibility

#### WI-004: Install vitest-axe and create a11y test helpers

- **Goal:** Automated a11y regression testing infrastructure
- **Acceptance:** (1) `vitest-axe` installed. (2) `src/test/a11yHelpers.ts` exports `expectNoA11yViolations(container)`. (3) Helper configured with VMark-specific rules.
- **Tests:** Self-testing: helper catches a known violation
- **Touched areas:** `package.json`, `src/test/a11yHelpers.ts`
- **Dependencies:** None
- **Estimate:** S

#### WI-005: Add ARIA landmarks to App layout

- **Goal:** Screen readers can navigate by landmarks
- **Acceptance:** (1) TitleBar has `role="banner"`. (2) Editor container has `role="main"`. (3) Sidebar has `role="navigation"` + `aria-label`. (4) StatusBar has `role="contentinfo"`. (5) Terminal has `role="region"` + `aria-label`.
- **Tests:** Render App, assert landmarks exist via axe-core
- **Touched areas:** `src/App.tsx`, `src/components/TitleBar/TitleBar.tsx`, `src/components/StatusBar/StatusBar.tsx`, `src/components/Terminal/TerminalPanel.tsx`
- **Dependencies:** WI-004
- **Estimate:** S

#### WI-006: Expand reduced-motion support

- **Goal:** All animations respect `prefers-reduced-motion`
- **Acceptance:** Every CSS file with `animation` or `transition` has a `prefers-reduced-motion` media query
- **Tests:** Lint script that finds animations without reduced-motion counterparts
- **Touched areas:** ~54 CSS files (sidebar, focus-mode, terminal, find-bar, popups)
- **Dependencies:** None
- **Estimate:** M

#### WI-007: Add a11y tests to key components

- **Goal:** Critical components pass axe-core automatically
- **Acceptance:** 10+ component test files include `expectNoA11yViolations()` assertions
- **Tests:** axe-core assertions in: App.tsx, Tabs, StatusBar, Toolbar, ContextMenu, HeadingPicker, QuickOpen, GeniePicker, FindBar, Settings
- **Touched areas:** Test files for each component
- **Dependencies:** WI-004, WI-005
- **Estimate:** L

### Phase 3: Performance

#### WI-008: Performance benchmark suite

- **Goal:** Measurable performance baselines for critical paths
- **Acceptance:** (1) `pnpm bench` runs Vitest bench mode. (2) Benchmarks for: markdown parse (1K/10K/50K lines), serialize, MCP handler dispatch latency. (3) Baselines documented.
- **Tests:** Benchmarks themselves are the tests
- **Touched areas:** `vitest.config.ts` (bench config), new `src/bench/` directory, `package.json` (script)
- **Dependencies:** None
- **Estimate:** M

#### WI-009: Memory leak detection tests

- **Goal:** Long-running operations don't leak memory
- **Acceptance:** Tests that create/destroy 100 documents verify memory returns to baseline (±10%)
- **Tests:** `src/bench/memory.bench.ts` — document lifecycle, editor mount/unmount, MCP session
- **Touched areas:** New bench files
- **Dependencies:** WI-008
- **Estimate:** M

### Phase 4: Error Recovery

#### WI-010: Disk-full error handling tests

- **Goal:** Auto-save and hot exit handle ENOSPC gracefully
- **Acceptance:** (1) Mock filesystem that returns ENOSPC on write. (2) Auto-save shows error toast, retries next cycle. (3) Hot exit logs error, doesn't crash. (4) Crash recovery snapshot failure logged, retried.
- **Tests:** Unit tests with mocked fs errors
- **Touched areas:** Test files for useAutoSave, useHotExitCapture, crashRecovery
- **Dependencies:** None
- **Estimate:** M

#### WI-011: Corrupted config recovery tests

- **Goal:** App starts correctly even with corrupted workspace/settings config
- **Acceptance:** (1) Corrupted JSON config → falls back to defaults with warning. (2) Missing config file → creates fresh. (3) Config with unknown fields → ignores them. (4) Tests cover all 3 cases.
- **Tests:** `workspaceConfig.test.ts` extensions, `settingsStore.test.ts` extensions
- **Touched areas:** Test files + potentially store validation code
- **Dependencies:** None
- **Estimate:** S

#### WI-012: Concurrent modification protection

- **Goal:** Two windows editing same file don't silently lose data
- **Acceptance:** (1) Document with pending save from Window A is detected by Window B's watcher. (2) Conflict dialog shown when both windows have dirty state for same file. (3) Tests prove the race condition is handled.
- **Tests:** Integration test simulating concurrent save + external change detection
- **Touched areas:** `useExternalFileChanges.ts` tests, potentially `pendingSaves.ts`
- **Dependencies:** None
- **Estimate:** M

#### WI-013: Error recovery documentation

- **Goal:** Every failure mode mapped to its recovery path
- **Acceptance:** `dev-docs/error-recovery.md` documents 20+ failure modes with: trigger, recovery path, tested (Y/N), user impact
- **Tests:** Document references test files for each tested path
- **Touched areas:** New doc file
- **Dependencies:** WI-010, WI-011, WI-012
- **Estimate:** S

### Phase 5: MCP API Versioning

#### WI-014: Add per-tool version to capabilities

- **Goal:** MCP clients can discover tool versions and deprecated features
- **Acceptance:** (1) `get_capabilities` response includes `tools` map with version per tool. (2) PROTOCOL_VERSION bumped to 1.1.0. (3) Tests verify capabilities response structure.
- **Tests:** Update `protocol.test.ts` to assert tool versions in capabilities
- **Touched areas:** `vmark-mcp-server/src/tools/protocol.ts`, `bridge/protocol-types.ts`
- **Dependencies:** None
- **Estimate:** S

#### WI-015: Action deprecation infrastructure

- **Goal:** Deprecated MCP actions log warnings and suggest replacements
- **Acceptance:** (1) `ACTION_MIGRATIONS` map supports old→new action aliasing. (2) Deprecated actions emit warning in response metadata. (3) Tests verify aliasing works.
- **Tests:** Unit test: call deprecated action name → succeeds with warning
- **Touched areas:** `vmark-mcp-server/src/server.ts`, tool handler files
- **Dependencies:** WI-014
- **Estimate:** S

#### WI-016: MCP API changelog

- **Goal:** Clients can discover what changed between versions
- **Acceptance:** (1) `vmark-mcp-server/CHANGELOG.md` documents all tool changes by version. (2) `get_capabilities` includes `changelogUrl` field.
- **Tests:** None (documentation)
- **Touched areas:** New CHANGELOG.md, protocol.ts
- **Dependencies:** WI-014
- **Estimate:** S

### Phase 6: Testing Quality

#### WI-017: Rust mutation testing

- **Goal:** Validate Rust test suite catches real bugs
- **Acceptance:** (1) `cargo mutants` runs against src-tauri/src. (2) Report shows mutation score. (3) Surviving mutants in critical modules (quit, hot_exit, pandoc) are killed with new tests.
- **Tests:** New tests for surviving mutants
- **Touched areas:** Rust test modules, `Cargo.toml` (dev-dependency if needed)
- **Dependencies:** None
- **Estimate:** L

#### WI-018: E2E test scenarios (documented)

- **Goal:** Committed, reproducible E2E test scenarios
- **Acceptance:** (1) `dev-docs/e2e-scenarios.md` documents 20+ test scenarios with steps. (2) Each scenario specifies: preconditions, Tauri MCP commands to run, expected results. (3) Organized by feature area.
- **Tests:** Scenarios are manual but structured and reproducible
- **Touched areas:** New doc file
- **Dependencies:** None
- **Estimate:** M

### Phase 7: Documentation

#### WI-019: CONTRIBUTING.md

- **Goal:** New contributors can set up, build, test, and submit PRs
- **Acceptance:** (1) Setup instructions (prerequisites, clone, install, dev server). (2) Architecture overview (link to dev-docs/architecture.md). (3) Testing instructions. (4) PR checklist. (5) Code style guide (link to AGENTS.md).
- **Tests:** None (documentation)
- **Touched areas:** New `CONTRIBUTING.md` at repo root
- **Dependencies:** None
- **Estimate:** S

#### WI-020: Architecture Decision Records

- **Goal:** Key decisions documented with rationale
- **Acceptance:** 8+ ADRs covering: (1) Markdown as source of truth, (2) MCP sidecar architecture, (3) Zustand over Redux, (4) Tiptap/ProseMirror choice, (5) Hot exit design, (6) Plugin isolation strategy, (7) CJK formatting approach, (8) Atomic write pattern
- **Tests:** None (documentation)
- **Touched areas:** `dev-docs/decisions/ADR-*.md`
- **Dependencies:** None
- **Estimate:** M

## Testing Procedures

- **Fast checks:** `pnpm test` (frontend), `cargo test` (Rust)
- **Full gate:** `pnpm check:all` + `cargo test`
- **Benchmarks:** `pnpm bench` (new, after WI-008)
- **A11y audit:** `pnpm test` (includes axe assertions after WI-004+WI-007)
- **Security scan:** CI runs `pnpm audit` + `cargo audit` (after WI-002)
- **Mutation testing:** `cargo mutants` (manual, after WI-017)
- **E2E:** Manual via Tauri MCP using documented scenarios (after WI-018)

## Execution Order

```
Phase 1 — CI & Security Foundation
  WI-001 (cross-platform CI)
  WI-002 (security scanning)
  WI-003 (HTML lang)
    ↓
Phase 2 — Accessibility
  WI-004 (vitest-axe setup) → WI-005 (landmarks) → WI-007 (component a11y tests)
  WI-006 (reduced-motion) — independent
    ↓
Phase 3 — Performance
  WI-008 (bench suite) → WI-009 (memory leak tests)
    ↓
Phase 4 — Error Recovery
  WI-010 (disk full) ─┐
  WI-011 (corrupted config) ─┤→ WI-013 (documentation)
  WI-012 (concurrent modification) ─┘
    ↓
Phase 5 — MCP Versioning
  WI-014 (tool versions) → WI-015 (deprecation) → WI-016 (changelog)
    ↓
Phase 6 — Testing Quality
  WI-017 (mutation testing)
  WI-018 (E2E scenarios)
    ↓
Phase 7 — Documentation
  WI-019 (CONTRIBUTING.md)
  WI-020 (ADRs)
```

## Observability

- **Performance metrics:** Parse latency (p50/p95/p99), serialize latency, MCP response time
- **Memory metrics:** Heap size after N document cycles, growth rate
- **Benchmark baselines:** Stored in `dev-docs/benchmarks/` as JSON (updated per release)
- **Security scan results:** CI artifacts, reviewed per PR

## Manual Test Checklist

- [ ] E2E: Open file, edit, save, verify content persists
- [ ] E2E: Export to PDF, verify file created
- [ ] E2E: Toggle source mode, verify content round-trips
- [ ] E2E: Open HeadingPicker, Tab through, Escape restores focus
- [ ] E2E: Dark theme toggle, verify all colors use tokens
- [ ] E2E: MCP tool call, verify response
- [ ] A11y: VoiceOver navigate by landmarks (banner, main, navigation, contentinfo)
- [ ] A11y: Tab through all interactive elements, verify focus visible
- [ ] A11y: Enable reduced motion, verify no animations
- [ ] Security: `pnpm audit` shows 0 moderate+ vulnerabilities
- [ ] Security: `cargo audit` shows 0 vulnerabilities
- [ ] Performance: `pnpm bench` shows no regression from baseline

## Plan → Verify Handoff

| WI | Evidence |
|----|----------|
| WI-001 | CI green on all 3 platforms |
| WI-002 | CI step output showing audit results |
| WI-003 | `document.documentElement.lang` test passes |
| WI-004 | `vitest-axe` in package.json, helper test passes |
| WI-005 | axe-core landmark assertions pass |
| WI-006 | Lint script finds 0 animations without reduced-motion |
| WI-007 | 10+ component tests with axe assertions pass |
| WI-008 | `pnpm bench` outputs baseline numbers |
| WI-009 | Memory leak test passes (heap returns to baseline) |
| WI-010 | Disk-full mock tests pass |
| WI-011 | Corrupted config tests pass |
| WI-012 | Concurrent modification test passes |
| WI-013 | `dev-docs/error-recovery.md` exists with 20+ entries |
| WI-014 | Capabilities response includes tool versions |
| WI-015 | Deprecated action aliasing test passes |
| WI-016 | CHANGELOG.md committed |
| WI-017 | cargo-mutants report, surviving mutants killed |
| WI-018 | `dev-docs/e2e-scenarios.md` committed with 20+ scenarios |
| WI-019 | CONTRIBUTING.md committed |
| WI-020 | 8+ ADR files committed |
