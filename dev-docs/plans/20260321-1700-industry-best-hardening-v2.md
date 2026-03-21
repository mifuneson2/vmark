# Industry-Best Quality Hardening Plan — v2

---
title: "Industry-Best Quality Hardening (Codex-reviewed)"
created_at: "2026-03-21 17:00 CST"
mode: "full-plan"
branch: "quality/industry-best-hardening"
supersedes: "20260321-1600-industry-best-hardening.md"
review: "Codex o3 thread 019d0f2c-0712-74a0-a702-4bf119915ca8"
---

## What changed from v1

Codex flagged 6 critical problems with v1:
1. **Priorities wrong**: polish before security — secrets in localStorage, unauthenticated MCP bridge, broad capabilities
2. **Stale inventory**: WI-003 (HTML lang) already done, 5 ADRs exist (not 2), automated-tests.ts exists
3. **Manual E2E is theater**: documented scenarios rot; need executable harness
4. **jsdom memory tests lie**: don't measure real WebView memory
5. **Some WIs are waste**: WI-003, WI-009, WI-013 (paperwork before tests), WI-016, WI-020 (ADR quota)
6. **Desktop-specific gaps missed**: OS keychain, MCP auth, per-window capabilities, updater rollback, workspace trust

v2 reorders around: **security → reliability → accessibility → quality infrastructure**

## Outcomes

- Secrets stored in OS-backed secure storage, not localStorage
- MCP bridge requires authentication token for connections
- Tauri capabilities segmented per window type
- CSP `unsafe-inline` removed for scripts
- Executable E2E smoke harness runs against real app builds
- Hardcoded English strings eliminated (i18n compliance)
- ARIA landmarks + axe-core regression testing
- Performance benchmarks for critical paths
- Fault injection tests (ENOSPC, EACCES, corrupted configs)
- Security scanning in CI

## Constraints & Dependencies

- Runtime: Rust stable, Node 22, pnpm 10
- Tauri plugins needed: `tauri-plugin-store` (secure storage)
- External tools: `cargo-audit`, `cargo-mutants`
- No breaking changes to MCP protocol without deprecation

## Work Items

### Phase 1: Desktop Security (CRITICAL — do first)

#### WI-001: Migrate API keys from localStorage to secure storage

- **Goal:** API keys and provider credentials stored encrypted, not in clear text
- **Acceptance:** (1) `tauri-plugin-store` added to Cargo.toml + capabilities. (2) `safeStorage.ts` uses Tauri store API instead of localStorage. (3) `aiProviderStore.ts` hydrates from secure store. (4) Old localStorage data migrated on first launch. (5) localStorage entries cleared after migration.
- **Tests (first):**
  - `safeStorage.test.ts` — mock Tauri store, verify read/write/migration
  - `aiProviderStore.test.ts` — verify hydration from secure store
- **Touched areas:**
  - `src-tauri/Cargo.toml` (add tauri-plugin-store)
  - `src-tauri/src/lib.rs` (register plugin)
  - `src-tauri/capabilities/default.json` (add store permission)
  - `src/utils/safeStorage.ts` (replace localStorage with Tauri store)
  - `src/stores/aiProviderStore.ts` (storage adapter)
- **Risks:** Migration from localStorage could fail if format changed
  - Mitigation: Wrap in try/catch, fall back to fresh state, log warning
- **Estimate:** M

#### WI-002: MCP bridge authentication

- **Goal:** Only authorized clients can connect to the MCP WebSocket bridge
- **Acceptance:** (1) Bridge generates a random auth token on start. (2) Token written to port file alongside port number. (3) WebSocket handshake requires token in first message. (4) Connections without valid token are rejected. (5) MCP sidecar reads token from port file.
- **Tests (first):**
  - `mcp_bridge/server.rs` — test: connection without token rejected, with valid token accepted
  - `vmark-mcp-server` — test: WebSocket handshake sends token
- **Touched areas:**
  - `src-tauri/src/mcp_bridge/server.rs` (auth handshake)
  - `src-tauri/src/mcp_bridge/state.rs` (store token)
  - `vmark-mcp-server/src/bridge/websocket.ts` (send token on connect)
- **Risks:** Breaking existing MCP clients
  - Mitigation: Accept unauthenticated connections for 1 release with deprecation warning
- **Estimate:** M

#### WI-003: Per-window capability segmentation

- **Goal:** Settings window doesn't get shell/PTY/filesystem access
- **Acceptance:** (1) `default.json` split into `main.json` (full access) and `settings.json` (minimal). (2) Settings window created with restricted capability set. (3) PDF export window uses restricted set.
- **Tests (first):**
  - Verify settings window can't invoke shell commands (E2E test)
- **Touched areas:**
  - `src-tauri/capabilities/default.json` → split into multiple files
  - `src-tauri/src/window_manager.rs` (assign capabilities per window type)
- **Risks:** Capabilities API may not support per-window assignment in Tauri v2
  - Mitigation: Research Tauri v2 capability scoping before implementation
- **Estimate:** M

#### WI-004: Remove CSP `unsafe-inline` for scripts

- **Goal:** Prevent inline script injection
- **Acceptance:** (1) CSP in tauri.conf.json uses nonce-based or strict script-src. (2) App functions correctly without `unsafe-inline`. (3) All inline scripts moved to external files or use nonces.
- **Tests (first):**
  - E2E: app loads correctly with strict CSP
- **Touched areas:**
  - `src-tauri/tauri.conf.json` (CSP change)
  - Any inline `<script>` tags in HTML
- **Risks:** React/Vite may inject inline scripts that break without `unsafe-inline`
  - Mitigation: Test thoroughly; may need Vite CSP plugin for nonce injection
- **Estimate:** M

### Phase 2: Reliability & Data Integrity

#### WI-005: Executable E2E smoke harness

- **Goal:** Critical user paths verified automatically against running app
- **Acceptance:** (1) `src/test/automated-tests.ts` expanded into executable Tauri MCP scenarios. (2) `pnpm e2e` script runs all scenarios. (3) 15+ scenarios covering: new file, edit, save, open, export, mode switch, MCP tool call, quit, undo/redo, dark theme, toolbar, tab operations.
- **Tests:** The harness IS the test
- **Touched areas:**
  - `src/test/automated-tests.ts` (expand existing)
  - `package.json` (add e2e script)
- **Dependencies:** Running app + Tauri MCP tools
- **Estimate:** L

#### WI-006: Fault injection test suite

- **Goal:** Recovery paths tested for real failure modes, not just ENOSPC
- **Acceptance:** Tests cover: (1) ENOSPC on save/auto-save/hot-exit. (2) EACCES (permission denied). (3) File locked by another process. (4) Symlink traversal in file paths. (5) Corrupted JSON config files. (6) Corrupted hot-exit session.json with fallback to backup. (7) Watcher startup failure. (8) Network share paths (long paths on Windows).
- **Tests (first):**
  - `src/hooks/useAutoSave.fault.test.ts` — mock fs errors
  - `src/utils/crashRecovery.fault.test.ts` — corrupted snapshot
  - `src/stores/settingsStore.fault.test.ts` — corrupted config
  - `src-tauri/src/hot_exit/storage.rs` — backup fallback test
- **Touched areas:** New test files, potentially storage.rs for backup fallback
- **Dependencies:** None
- **Estimate:** L

#### WI-007: Concurrent modification protection

- **Goal:** Two windows editing same file can't silently lose data
- **Acceptance:** (1) Test simulating Window A save → Window B watcher → race window. (2) Pending save token matching prevents false-positive change detection. (3) Conflict dialog shown when both windows have dirty state.
- **Tests (first):**
  - Integration test with mocked file events + pending save store
- **Touched areas:** `useExternalFileChanges.ts` tests, `pendingSaves.ts` tests
- **Estimate:** M

#### WI-008: Updater hardening

- **Goal:** Auto-updater verified for rollback and signature validation
- **Acceptance:** (1) Update signature verification tested. (2) Rollback mechanism documented. (3) Update failure doesn't corrupt running app.
- **Tests:** E2E scenario in smoke harness
- **Touched areas:** `src-tauri/tauri.conf.json` (updater config), documentation
- **Estimate:** S

### Phase 3: i18n & Accessibility

#### WI-009: Hardcoded English string audit + fix

- **Goal:** Zero hardcoded English strings in UI code (project rule violation)
- **Acceptance:** (1) CI lint script finds 0 hardcoded English strings. (2) Known violations fixed: `TitleBar.tsx:36` ("Untitled"), `useExternalFileChanges.ts:96` ("Save As..."), any others.
- **Tests (first):**
  - Lint script that detects hardcoded English in components
- **Touched areas:** All files with hardcoded strings + corresponding locale files
- **Estimate:** M

#### WI-010: ARIA landmarks

- **Goal:** Screen readers can navigate by landmarks
- **Acceptance:** (1) Editor container: `role="main"`. (2) Sidebar: `role="navigation"` + `aria-label`. (3) StatusBar: `role="contentinfo"`. (4) Terminal: `role="region"` + `aria-label`.
- **Tests (first):**
  - Render App, assert landmarks exist
- **Touched areas:** `src/App.tsx`, StatusBar, Terminal components
- **Estimate:** S

#### WI-011: vitest-axe + component a11y tests

- **Goal:** Automated a11y regression testing
- **Acceptance:** (1) `vitest-axe` installed. (2) Helper `expectNoA11yViolations()`. (3) 10+ component tests include axe assertions.
- **Tests:** axe assertions in: Tabs, StatusBar, Toolbar, ContextMenu, HeadingPicker, QuickOpen, GeniePicker, FindBar, Settings
- **Touched areas:** `package.json`, `src/test/a11yHelpers.ts`, component test files
- **Dependencies:** WI-010 (landmarks must exist for axe to validate)
- **Estimate:** L

#### WI-012: Reduced-motion support (targeted, not blanket)

- **Goal:** Meaningful animations respect `prefers-reduced-motion`
- **Acceptance:** All `@keyframes` animations and `transition` properties >200ms have reduced-motion counterparts. Short `transition: color 0.15s` exempted (not meaningful motion).
- **Tests:** Lint script: find @keyframes without prefers-reduced-motion media query
- **Touched areas:** CSS files with @keyframes (popups, toolbar, genie, quick-open — ~15 files, not 54)
- **Estimate:** S

### Phase 4: Quality Infrastructure

#### WI-013: Security scanning in CI

- **Goal:** Known dependency vulnerabilities caught before merge
- **Acceptance:** (1) `pnpm audit --audit-level=high` (not moderate — avoid noise). (2) `cargo audit` with deny.toml allowlist. (3) Fails on HIGH+ only to avoid PR churn.
- **Tests:** CI gate
- **Touched areas:** `.github/workflows/ci.yml`, new `deny.toml`
- **Estimate:** S

#### WI-014: Cross-platform CI (macOS + Ubuntu + Windows)

- **Goal:** Tests pass on all 3 platforms
- **Acceptance:** CI matrix runs `pnpm test` + `cargo test` on all 3 OS
- **Tests:** CI itself
- **Touched areas:** `.github/workflows/ci.yml`
- **Risks:** Flaky tests on Windows; Tauri system deps differ
  - Mitigation: Mark known platform-specific tests with `#[cfg(target_os)]`; add retry for flaky tests
- **Estimate:** M

#### WI-015: Performance benchmarks (real, not synthetic)

- **Goal:** Measurable baselines for critical paths
- **Acceptance:** (1) `pnpm bench` runs Vitest bench mode. (2) Benchmarks: markdown parse (1K/10K/50K), serialize, Tiptap plugin init. (3) Baselines stored as JSON. (4) Existing `performance.test.ts` integrated into bench suite.
- **Tests:** Benchmarks are the tests
- **Touched areas:** `vitest.config.ts`, new `src/bench/` directory, `package.json`
- **Estimate:** M

#### WI-016: Rust mutation testing

- **Goal:** Validate Rust tests catch real bugs
- **Acceptance:** (1) `cargo mutants` runs on critical modules. (2) Surviving mutants in quit, hot_exit, pandoc killed with new tests.
- **Tests:** New tests for surviving mutants
- **Touched areas:** Rust test modules
- **Estimate:** L

#### WI-017: Fuzz testing for parsers

- **Goal:** Markdown parser and MCP payload handler don't crash on malformed input
- **Acceptance:** (1) Property tests for markdown round-trip (parse → serialize → parse = same AST). (2) MCP request handler fuzz: random payloads don't crash or hang.
- **Tests:** Property tests with fast-check or similar
- **Touched areas:** New test files in `src/utils/markdownPipeline/__tests__/`, `vmark-mcp-server/__tests__/`
- **Estimate:** M

### Phase 5: Documentation (only what's missing)

#### WI-018: Error recovery documentation

- **Goal:** Every failure mode mapped to its recovery path
- **Acceptance:** `dev-docs/error-recovery.md` with 20+ entries, each linking to the test that verifies it
- **Tests:** Document references test files (WI-006 must complete first)
- **Dependencies:** WI-006
- **Estimate:** S

#### WI-019: CONTRIBUTING.md

- **Goal:** New contributors can set up and submit PRs
- **Acceptance:** Prerequisites, `pnpm tauri dev`, test commands, PR checklist. References AGENTS.md for code style.
- **Touched areas:** New `CONTRIBUTING.md`
- **Estimate:** S

## Removed from v1 (waste or already done)

| Removed | Reason |
|---------|--------|
| WI-003 (HTML lang) | Already implemented: `index.html:2` + `i18n.ts:68` |
| WI-009 (jsdom memory tests) | jsdom heap doesn't reflect real WebView memory; tests will lie |
| WI-013 v1 (recovery docs before tests) | Paperwork before executable evidence is backwards |
| WI-016 v1 (MCP changelog) | Premature; no external client breakage pressure yet |
| WI-018 v1 (documented E2E) | Wrong artifact; executable harness (WI-005 v2) replaces docs |
| WI-020 (8+ ADRs) | 5 ADRs already exist; write ADRs when decisions happen, not as quota |

## Execution Order

```
Phase 1 — Desktop Security (CRITICAL)
  WI-001 (secret storage)
  WI-002 (MCP bridge auth)
  WI-003 (per-window capabilities)
  WI-004 (CSP unsafe-inline removal)
    ↓
Phase 2 — Reliability
  WI-005 (executable E2E harness)
  WI-006 (fault injection suite)
  WI-007 (concurrent modification)
  WI-008 (updater hardening)
    ↓
Phase 3 — i18n & Accessibility
  WI-009 (hardcoded English audit)
  WI-010 (ARIA landmarks)
  WI-011 (vitest-axe + component tests)
  WI-012 (reduced-motion, targeted)
    ↓
Phase 4 — Quality Infrastructure
  WI-013 (security scanning CI)
  WI-014 (cross-platform CI)
  WI-015 (performance benchmarks)
  WI-016 (Rust mutation testing)
  WI-017 (fuzz testing for parsers)
    ↓
Phase 5 — Documentation
  WI-018 (error recovery docs) — after WI-006
  WI-019 (CONTRIBUTING.md)
```

## Key differences from v1

| Dimension | v1 | v2 |
|-----------|----|----|
| Priority #1 | Cross-platform CI | Secret storage + MCP auth |
| E2E approach | Documented scenarios (will rot) | Executable harness (catches bugs) |
| Memory testing | jsdom heap baseline (lies) | Removed — real memory needs real WebView |
| Reduced-motion | Blanket 54 files (cargo cult) | Targeted 15 files with @keyframes (meaningful) |
| ADR target | 8+ new (quota) | Write when decisions happen (organic) |
| Security scanning | CI gate on moderate+ (noisy) | CI gate on high+ only (actionable) |
| Fault injection | ENOSPC only | ENOSPC + EACCES + locks + symlinks + corruption |
| New additions | — | MCP auth, per-window capabilities, CSP hardening, fuzz testing, updater hardening, i18n audit |

## Testing Procedures

- **Fast:** `pnpm test` + `cargo test`
- **Full gate:** `pnpm check:all` + `cargo test`
- **E2E:** `pnpm e2e` against running app (after WI-005)
- **Benchmarks:** `pnpm bench` (after WI-015)
- **Security:** CI runs `pnpm audit --audit-level=high` + `cargo audit` (after WI-013)
- **Mutation:** `cargo mutants` quarterly (after WI-016)
- **Fuzz:** Property tests in `pnpm test` (after WI-017)

## Manual Test Checklist

- [ ] App launches, API keys NOT visible in DevTools localStorage
- [ ] MCP bridge rejects connection without auth token
- [ ] Settings window can't access shell/PTY
- [ ] App loads without `unsafe-inline` CSP
- [ ] E2E harness: 15+ scenarios pass
- [ ] Forced disk-full: auto-save shows error, retries, no crash
- [ ] Corrupted session.json: app falls back to backup, then fresh start
- [ ] VoiceOver: navigate by landmarks (banner, main, navigation, contentinfo)
- [ ] `pnpm audit --audit-level=high` → 0 vulnerabilities
- [ ] `cargo audit` → 0 vulnerabilities
- [ ] Two windows edit same file → conflict detected, not silently overwritten
