# Internationalization (i18n) Design Spec

**Date**: 2026-03-16
**Status**: Draft
**Scope**: App (React + Rust) and Website (VitePress) — 10 languages

## 1. Overview

VMark currently has zero i18n infrastructure — ~700 hardcoded English strings in React, ~150 in Rust menus, and 30 English-only website pages. This spec covers adding full internationalization to both the app and website.

### Languages

| # | Language | Code | Fallback Chain |
|---|----------|------|---------------|
| 1 | English | en | — (source) |
| 2 | Simplified Chinese | zh-CN | en |
| 3 | Traditional Chinese | zh-TW | zh-CN → en |
| 4 | Japanese | ja | en |
| 5 | Korean | ko | en |
| 6 | Spanish | es | en |
| 7 | French | fr | en |
| 8 | German | de | en |
| 9 | Italian | it | en |
| 10 | Portuguese (Brazilian) | pt-BR | en |

### Design Decisions

- **Language selection**: Default English, user picks in Settings (no auto-detect)
- **Menu translation**: Fully translated native menus, rebuilt at runtime (no restart)
- **Translation source**: AI-generated initial pass (Claude), community corrections via Weblate (Phase 2)
- **Website URLs**: Subdirectory pattern (`/zh-CN/guide/features`)

## 2. Sub-Projects

This decomposes into two independent sub-projects sharing no code:

1. **App i18n** — React frontend + Rust backend
2. **Website i18n** — VitePress multi-language docs

They can be built in any order. App i18n is recommended first (core product experience).

---

## 3. App i18n

### 3.1 Technology Stack

| Layer | Tool | Version | Rationale |
|-------|------|---------|-----------|
| React frontend | `react-i18next` + `i18next` | latest | Industry standard, massive ecosystem |
| Translation loading | `i18next-resources-to-backend` | latest | Dynamic `import()` for namespace code-splitting |
| Key extraction | `@i18next/cli` | 4.x | Official CLI (SWC-powered), generates TypeScript types |
| Rust backend | `rust-i18n` | 3.x | Compile-time macro `t!()`, YAML files, automatic fallback |
| AI translation | Custom script using Claude API | — | See section 3.9 for details |

**Note on extraction tooling:** `@i18next/cli` (v4.x) is the official i18next CLI tool. `i18next-parser` (v9.x) is also available as an alternative. Both can scan source files and generate/update translation keys.

### 3.2 Translation File Structure

```
src/locales/
  en/
    common.json        # Save, Cancel, OK, generic labels (~50 keys)
    menu.json          # Menu labels — mirrors Rust keys for reference (~150 keys)
    editor.json        # Toolbar, popups, formatting (~150 keys)
    settings.json      # Settings panel labels (~120 keys)
    dialog.json        # Modals, confirmations, toasts (~80 keys)
    sidebar.json       # File explorer, outline, history (~40 keys)
    statusbar.json     # Status bar labels, mode indicators (~30 keys)
    ai.json            # Genie picker, AI provider, MCP (~80 keys)
  zh-CN/
    common.json
    menu.json
    ... (same 8 files)
  ... (8 more language directories)

src-tauri/locales/
  en.yml               # Menu items, dialog text (~150 keys)
  zh-CN.yml
  ... (same 10 languages)
```

**Namespace loading strategy:**
- **Startup**: `common`, `menu`, `statusbar` (essential UI)
- **Lazy**: `editor`, `settings`, `dialog`, `sidebar`, `ai` (loaded when feature mounts)

### 3.3 Key Naming Convention

Flat, dot-separated, camelCase, 2-3 levels deep:

```json
{
  "sidebar.files": "FILES",
  "sidebar.outline": "OUTLINE",
  "sidebar.newFile": "New File",
  "sidebar.tooltip.open": "Open Sidebar",
  "dialog.save.title": "Save Changes",
  "dialog.save.discard": "Don't Save",
  "dialog.save.message": "Do you want to save changes to {{filename}}?",
  "toast.saveFailed": "Failed to save: {{error}}",
  "editor.placeholder": "Start writing...",
  "settings.appearance.theme": "Theme",
  "statusbar.words_one": "{{count}} word",
  "statusbar.words_other": "{{count}} words"
}
```

**Rules:**
- Never use natural language as keys (typo fix breaks all translations)
- Never reuse keys across different UI locations (same English word may need different translations in context)
- Use `{{variable}}` for interpolation with descriptive variable names (`{{documentName}}` not `{{v1}}`)
- Underscore suffixes `_one`, `_other`, `_zero`, `_few`, `_many` are reserved for i18next plural forms and are the only exception to the camelCase rule
- Keys grouped by UI area: `sidebar.*`, `dialog.*`, `toast.*`, `editor.*`, `settings.*`, `statusbar.*`, `menu.*`, `ai.*`

### 3.4 i18next Initialization

```typescript
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { useSettingsStore } from '@/stores/settingsStore';

// Build a lookup table from Vite's import.meta.glob (supports two variable segments)
const localeModules = import.meta.glob('./locales/*/*.json');

i18n
  .use(initReactI18next)
  .use(resourcesToBackend(
    (lng: string, ns: string) => {
      const key = `./locales/${lng}/${ns}.json`;
      return localeModules[key]?.() ?? Promise.reject(new Error(`Missing: ${key}`));
    }
  ))
  .init({
    lng: useSettingsStore.getState().general.language,
    fallbackLng: {
      'zh-TW': ['zh-CN', 'en'],
      'pt-BR': ['en'],
      default: ['en'],
    },
    load: 'currentOnly',       // Only load 'zh-CN', never try bare 'zh'
    ns: ['common', 'menu', 'statusbar'],  // Preload at startup
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,      // React already escapes
    },
  });

export default i18n;
```

On language change, update `document.documentElement.lang` for accessibility:

```typescript
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});
```

### 3.5 Component Usage Patterns

**Standard — `t()` function (95%+ of cases):**

```tsx
const { t } = useTranslation('sidebar');
<span>{t('files')}</span>
<button title={t('tooltip.open')}>{t('newFile')}</button>
```

With namespace prefix when using multiple namespaces:

```tsx
const { t } = useTranslation(['sidebar', 'common']);
<span>{t('sidebar:files')}</span>
<button>{t('common:cancel')}</button>
```

**Embedded JSX — `<Trans>` component (rare):**

```tsx
<Trans i18nKey="editor:help.bold" t={t}>
  Press <kbd>Mod+B</kbd> for bold
</Trans>
```

Only when HTML/React elements must appear mid-sentence. Never split a sentence across multiple `t()` calls.

**Date/number formatting — i18next Intl integration:**

```json
{ "statusbar.lastSaved": "Saved {{date, datetime(dateStyle: short; timeStyle: short)}}" }
{ "statusbar.fileSize": "{{size, number}} bytes" }
```

Delegates to `Intl.DateTimeFormat` / `Intl.NumberFormat` — locale-aware automatically.

### 3.6 Settings Integration

Add `language` field to `GeneralSettings` in `src/stores/settingsTypes.ts`:

```typescript
export interface GeneralSettings {
  language: string;            // Default: "en"
  // ... existing fields
}
```

Default value in `src/stores/settingsStore.ts`:

```typescript
general: {
  language: 'en',
  // ... existing defaults
}
```

For existing users, Zustand's `persist` middleware merges with defaults — absent `language` field automatically gets `'en'`. No explicit migration needed.

Language dropdown in Settings with 10 options. On change:

1. `useSettingsStore.getState().setLanguage(lang)` — persist to settings
2. `i18n.changeLanguage(lang)` — React re-renders automatically
3. `invoke("set_locale", { locale: lang })` — notify Rust
4. Rust: `rust_i18n::set_locale(&lang)` + rebuild menu
5. Frontend: after Rust returns, re-trigger `rebuild_menu` with current custom shortcuts to repopulate recent files, workspaces, and genies (same flow as current shortcut customization)

**Important coordination**: Shortcuts are owned by the frontend (`shortcutsStore.ts`), not Rust. The `set_locale` command changes the locale and rebuilds the menu skeleton, but the frontend must then call `rebuild_menu` (existing command) to push the current shortcuts and repopulate dynamic submenus (recent files, workspaces, genies). This is the same pattern already used when shortcuts are customized.

No restart required — Tauri v2 supports `app.set_menu()` at runtime.

### 3.7 Rust Menu i18n

#### Prerequisites: Migrate macOS Menu to ID-Based Lookup

**CRITICAL**: Before menu translation can work, `src-tauri/src/macos_menu.rs` must be migrated from title-based lookup to ID-based lookup.

Currently, `fix_help_menu()` finds the Help submenu by matching the English title `"Help"`. `fix_window_menu()` similarly matches `"Window"`. The `MENU_ICONS` array maps SF Symbol icons by matching English menu item titles (e.g., `"About VMark"`, `"Save"`). The `submenu_title_to_id()` function maps English submenu titles like `"Open Recent"` to IDs.

All of these break when menus use translated titles.

**Required migration:**
- `MENU_ICONS`: Map from menu item **ID** (e.g., `"about"`, `"save-file"`) to SF Symbol, not from title
- `fix_help_menu()` / `fix_window_menu()`: These walk native `NSMenu` objects where Tauri submenu IDs are not directly exposed. Two approaches: (a) assign Tauri submenu IDs (e.g., `"help-menu"`, `"window-menu"`) and use muda's submenu-by-ID API on the Rust side to find them before the AppKit call, or (b) use muda's special Help/Window submenu registration APIs if available in the shipped muda version. Verify against the exact muda version in `Cargo.lock`.
- `submenu_title_to_id()`: Remove — no longer needed when submenus have IDs
- `find_edit_submenu()` in `dynamic.rs`: Currently matches by English title `"Edit"` (line 156). Must also migrate to ID-based lookup. **All runtime submenu lookups across the codebase** — not just `macos_menu.rs` — must use stable IDs. Audit: `grep -rn 'text().ok().as_deref()' src-tauri/src/menu/` to find all title-based lookups.

This migration must happen before any menu translation.

#### PredefinedMenuItem Policy

macOS system menu items (`PredefinedMenuItem::hide()`, `PredefinedMenuItem::services()`, `PredefinedMenuItem::quit()`, etc.) should pass `None` as the title parameter instead of hardcoded English. This lets macOS provide the correct localized text automatically:

```rust
// Before (hardcoded English)
&PredefinedMenuItem::services(app, Some("Services"))?,
&PredefinedMenuItem::hide(app, Some("Hide VMark"))?,

// After (OS-localized)
&PredefinedMenuItem::services(app, None)?,
&PredefinedMenuItem::hide(app, None)?,
```

#### Menu Refactoring

The two existing menu functions in `src-tauri/src/menu/default_menu.rs` (`create_menu`) and `src-tauri/src/menu/custom_menu.rs` (`create_menu_with_shortcuts`) are replaced by a single `create_localized_menu()` in a new `src-tauri/src/menu/localized.rs`. This function accepts an optional shortcuts map to handle both default and custom shortcuts:

```rust
// src-tauri/Cargo.toml
[dependencies]
rust-i18n = "3"

// src-tauri/src/lib.rs
rust_i18n::i18n!("locales", fallback = "en");

// src-tauri/src/menu/localized.rs
use rust_i18n::t;
use std::collections::HashMap;

/// Build the application menu with localized labels and optional custom shortcuts.
///
/// When `custom_shortcuts` is None, uses default accelerators.
/// When provided, overrides accelerators per menu-item ID.
pub fn create_localized_menu(
    app: &AppHandle,
    custom_shortcuts: Option<&HashMap<String, String>>,
) -> Result<Menu<Wry>, Box<dyn Error>> {
    let accel = |id: &str, default: &str| -> Option<String> {
        custom_shortcuts
            .and_then(|map| map.get(id).cloned())
            .or_else(|| Some(default.to_string()))
    };

    let file_menu = Submenu::with_id_and_items(app, "file-menu", &t!("menu.file"), true, &[
        &MenuItem::with_id(app, "new-tab", &t!("menu.file.new"), true, accel("new-tab", "CmdOrCtrl+N"))?,
        &MenuItem::with_id(app, "open-file", &t!("menu.file.open"), true, accel("open-file", "CmdOrCtrl+O"))?,
        &MenuItem::with_id(app, "save-file", &t!("menu.file.save"), true, accel("save-file", "CmdOrCtrl+S"))?,
        // ...
    ])?;

    // ... build remaining menus
    Menu::with_items(app, &[&file_menu, /* ... */])
}

// New Tauri command
#[tauri::command]
pub fn set_locale(app: AppHandle, locale: String) -> Result<(), String> {
    rust_i18n::set_locale(&locale);
    // Rebuild menu with current custom shortcuts (if any)
    let shortcuts = load_custom_shortcuts(&app);
    let menu = create_localized_menu(&app, shortcuts.as_ref()).map_err(|e| e.to_string())?;
    app.set_menu(menu).map_err(|e| e.to_string())?;
    // Re-apply macOS menu fixes (now using ID-based lookup)
    #[cfg(target_os = "macos")]
    crate::macos_menu::fix_help_menu();
    #[cfg(target_os = "macos")]
    crate::macos_menu::apply_menu_icons();
    Ok(())
}
```

After this refactor, `default_menu.rs` and `custom_menu.rs` are deleted.

#### Dynamic Menu Items

Dynamic submenus (Recent Files, Recent Workspaces, Genies) are populated at runtime by `src-tauri/src/menu/dynamic.rs`. Their structural labels need translation keys:

```yaml
# In en.yml
menu:
  file.recentFiles.empty: "No Recent Files"
  file.recentFiles.clear: "Clear Recent Files"
  file.recentWorkspaces.empty: "No Recent Workspaces"
  file.recentWorkspaces.clear: "Clear Recent Workspaces"
  view.genies.search: "Search Genies..."
  view.genies.empty: "No Genies Found"
```

`dynamic.rs` functions use `t!()` for these labels. File names and genie names remain untranslated (they are user content).

### 3.8 Rust Locale File Example

```yaml
# src-tauri/locales/en.yml
menu:
  file: "File"
  file.new: "New"
  file.open: "Open..."
  file.openRecent: "Open Recent"
  file.save: "Save"
  file.saveAs: "Save As..."
  file.export: "Export"
  file.print: "Print..."
  file.recentFiles.empty: "No Recent Files"
  file.recentFiles.clear: "Clear Recent Files"
  edit: "Edit"
  edit.undo: "Undo"
  edit.redo: "Redo"
  edit.cut: "Cut"
  edit.copy: "Copy"
  edit.paste: "Paste"
  # ... (~150 total keys)
dialog:
  quit.title: "Quit VMark"
  quit.message: "You have unsaved changes. Save before quitting?"
  quit.save: "Save"
  quit.discard: "Don't Save"
  quit.cancel: "Cancel"
```

### 3.9 Translation Workflow

1. **Initial extraction**: `npx @i18next/cli` scans all `.tsx`/`.ts` files, generates `en/*.json` skeleton with keys
2. **Manual review**: Verify extracted keys, add context comments where needed
3. **AI translate**: Custom script that sends each English JSON file to Claude API with domain context (VMark is a Markdown editor), target language, and instructions to preserve `{{variables}}` and key structure. Script is diff-aware — only re-translates keys that changed since last run.
4. **Ongoing**: Run `@i18next/cli` in CI to detect new untranslated keys

The AI translation script lives at `scripts/translate.ts` and supports:
- `--source src/locales/en/ --target src/locales/zh-CN/ --lang zh-CN`
- Diff mode: compares target file timestamps/hashes, skips unchanged keys
- Dry run mode: shows what would be translated without writing files

### 3.10 CI Integration

- **Missing keys (React)**: Script compares each language's JSON keys against `en/*.json` — missing key = build warning, extra key = warning
- **Type safety (React)**: `@i18next/cli` generates TypeScript types for `t()` — compile-time key validation
- **Missing keys (Rust)**: Separate script compares each language's YAML keys against `en.yml`. **Note:** `cargo check` does NOT validate `t!()` keys at compile time — `rust-i18n` resolves keys at runtime. The explicit completeness check script is the only protection against typos in Rust translation keys.
- **Website build**: Add `cd website && pnpm build` to the CI gate (current `pnpm check:all` only covers the app, not the website). Without this, broken translations in 270 pages would ship unnoticed.

### 3.11 Migration Strategy

Extraction happens file-by-file, not big-bang. Priority order:

1. **Settings pages** (~11 files in `src/pages/settings/`, ~120 keys) — highest string density
2. **Sidebar + StatusBar** (~8 files, ~70 keys) — always visible
3. **Dialogs + toasts** (~15 files, ~80 keys) — scattered but systematic
4. **Editor toolbar + popups** (~15 files, ~150 keys) — complex components
5. **Remaining components** (~8 files, ~50 keys)
6. **Rust menus** (~150 keys) — done after macOS menu ID migration

Each batch: extract → verify English → AI translate 9 languages → commit.

---

## 4. Website i18n

### 4.1 Technology

VitePress built-in `locales` config — no plugins needed. Per-locale config files to keep the config manageable at 10 languages.

The existing `appearance: false` setting (VMark uses its own theme switcher) does not affect the VitePress locale switcher — the language dropdown renders independently in the nav bar.

### 4.2 Directory Structure

```
website/
  .vitepress/
    config/
      index.ts           # Merges all locale configs
      shared.ts          # Common config (head, markdown, plugins)
      en.ts              # English nav/sidebar/labels
      zh-CN.ts           # Chinese nav/sidebar/labels
      zh-TW.ts
      ja.ts
      ko.ts
      es.ts
      fr.ts
      de.ts
      it.ts
      pt-BR.ts
    config.ts            # Entry point — imports from config/

  # English content (root locale — no prefix)
  index.md
  download.md
  guide/
    index.md
    features.md
    shortcuts.md
    settings.md
    export.md
    tab-navigation.md
    multi-cursor.md
    popups.md
    mermaid.md
    markmap.md
    svg.md
    media-support.md
    terminal.md
    cjk-formatting.md
    workspace-management.md
    ai-genies.md
    ai-providers.md
    mcp-setup.md
    mcp-tools.md
    privacy.md
    license.md
    users-as-developers/
      index.md
      why-i-built-vmark.md
      what-are-indispensable.md
      why-expensive-models-are-cheaper.md
      subscription-vs-api.md
      prompt-refinement.md
      cross-model-verification.md
      why-issues-not-prs.md

  # Each language mirrors the full structure
  zh-CN/
    index.md
    download.md
    guide/
      index.md
      features.md
      ... (same 21 guide pages)
      users-as-developers/
        ... (same 7 essay pages)

  zh-TW/
    ... (same structure)
  ja/
    ... (same structure)
  ... (6 more languages)
```

### 4.3 VitePress Config Structure

```typescript
// website/.vitepress/config/shared.ts
export const shared = {
  title: 'VMark',
  lastUpdated: true,
  markdown: { config: (md) => { md.use(footnote) } },
  head: [ /* ... */ ],
};

// website/.vitepress/config/en.ts
export const en = {
  label: 'English',
  lang: 'en',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Download', link: '/download' },
      { text: 'Guide', link: '/guide/' },
    ],
    sidebar: { '/guide/': [ /* ... existing sidebar */ ] },
  },
};

// website/.vitepress/config/zh-CN.ts
export const zhCN = {
  label: '简体中文',
  lang: 'zh-CN',
  link: '/zh-CN/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/zh-CN/' },
      { text: '下载', link: '/zh-CN/download' },
      { text: '指南', link: '/zh-CN/guide/' },
    ],
    sidebar: { '/zh-CN/guide/': [ /* translated sidebar */ ] },
    lastUpdated: { text: '最后更新' },
    outline: { label: '目录' },
  },
};

// website/.vitepress/config/index.ts
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { shared } from './shared';
import { en } from './en';
import { zhCN } from './zh-CN';
// ... import all locale configs

export default withMermaid(defineConfig({
  ...shared,
  locales: {
    root: en,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'ja': ja,
    'ko': ko,
    'es': es,
    'fr': fr,
    'de': de,
    'it': it,
    'pt-BR': ptBR,
  },
}));
```

### 4.4 Page Inventory

| Category | Pages | Per Language |
|----------|------:|------------:|
| Top-level (index, download) | 2 | 2 |
| Guide pages | 21 | 21 |
| Users as Developers essays | 7 | 7 |
| **Total** | **30** | **30** |

**30 pages x 9 translated languages = 270 translated pages**

Page count reflects the current file system as of 2026-03-16. New pages added before implementation should be included in the translation scope.

### 4.5 Cross-Locale Link Rewriting

**CRITICAL**: English pages contain absolute root links (e.g., `/guide/features`, `/guide/export#vmark-reader`). When these pages are copied into `/{lang}/` directories, the links still point to the English root, leaking users back to English.

**Solution**: The AI translation script must rewrite internal links during translation:
- `/guide/features` → `/{lang}/guide/features`
- `/guide/export#vmark-reader` → `/{lang}/guide/export#vmark-reader`
- `/download` → `/{lang}/download`
- External URLs (https://...) remain unchanged

Alternatively, use VitePress relative links (`./features.md`, `../download.md`) which resolve correctly regardless of locale directory. Convert existing absolute links to relative during the translation pass.

### 4.6 Translation Workflow

1. AI-translate all 30 English pages per language using Claude API
2. Each page is ~500-3,000 words — ~35,000 words total English
3. Total translation volume: ~315,000 words across 9 languages
4. Technical pages maintain English code snippets/shortcuts (only prose is translated)
5. Screenshots referenced by path stay the same (English screenshots initially — localized screenshots later if needed)
6. Internal links are rewritten to locale-prefixed paths (see 4.5)

### 4.7 VitePress UI Labels

Each locale config translates VitePress's built-in UI labels:

```typescript
// Example for Japanese
export const ja = {
  label: '日本語',
  lang: 'ja',
  link: '/ja/',
  themeConfig: {
    nav: [ /* ... */ ],
    sidebar: { /* ... */ },
    lastUpdated: { text: '最終更新' },
    outline: { label: '目次' },
    docFooter: { prev: '前のページ', next: '次のページ' },
    darkModeSwitchLabel: 'テーマ',
    sidebarMenuLabel: 'メニュー',
    returnToTopLabel: 'トップに戻る',
    search: {
      options: {
        locales: {
          ja: {
            translations: {
              button: { buttonText: '検索', buttonAriaLabel: '検索' },
              modal: {
                displayDetails: '詳細を表示',
                resetButtonTitle: 'リセット',
                noResultsText: '結果が見つかりません',
                footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' },
              },
            },
          },
        },
      },
    },
  },
};
```

### 4.8 Language Switcher

VitePress automatically renders a language switcher dropdown in the nav bar when `locales` is configured with multiple entries. No custom component needed.

---

## 5. Testing

### 5.1 App Tests

| Category | What to Test |
|----------|-------------|
| Settings store | `language` field persists, defaults to `'en'`, migration from no-field state |
| i18n init | Correct language loaded from settings, fallback chain works (`zh-TW` → `zh-CN` → `en`) |
| `set_locale` command | Rust locale changes, menu rebuilds without error |
| Key completeness | Script verifying all language files have same keys as `en/*.json` |
| Component rendering | Spot-check that `t()` calls render translated text (integration test with `renderHook`) |

### 5.2 Website Tests

| Category | What to Test |
|----------|-------------|
| Build | `pnpm build` succeeds with all locale directories |
| Link integrity | No broken cross-locale links (VitePress reports these at build time) |
| Config | Each locale has complete nav/sidebar/labels |

---

## 6. Documentation Updates

After implementation, update these project files:

- **AGENTS.md**: Add i18n rules — "All user-facing strings must use `t()` / `t!()`, never hardcoded. Three files for keyboard shortcuts sync rule updated to reflect `localized.rs`."
- **`.claude/rules/41-keyboard-shortcuts.md`**: Update menu file references from `default_menu.rs` + `custom_menu.rs` to `localized.rs`
- **`website/guide/settings.md`**: Add Language setting documentation

---

## 7. Estimated Scope

### App i18n

| Work Item | Keys/Files | Effort |
|-----------|-----------|--------|
| Add `i18next`, `react-i18next`, `i18next-resources-to-backend` | 3 packages | Small |
| Create `src/i18n.ts` initialization | 1 file | Small |
| Add `language` to `GeneralSettings` + Settings UI dropdown | 2 files | Small |
| Add `rust-i18n` to Cargo.toml + `set_locale` command | 3 files | Small |
| Migrate `macos_menu.rs` to ID-based lookup | 1 file | Medium |
| Migrate `PredefinedMenuItem` to `None` titles | 2 files | Small |
| Extract English strings from React components | ~57 files, ~700 keys | Large |
| Author `src-tauri/locales/en.yml` (Rust menu keys) | 1 file, ~150 keys | Medium |
| Merge `default_menu.rs` + `custom_menu.rs` → `localized.rs` | 3 files | Medium |
| Update `dynamic.rs` with `t!()` for structural labels | 1 file | Small |
| Write `scripts/translate.ts` (AI translation script) | 1 file | Medium |
| AI-translate 9 languages (React) | 9 x 8 = 72 JSON files | Automated |
| AI-translate 9 languages (Rust) | 9 YAML files | Automated |
| CI script for missing keys | 1 script | Small |
| Tests (settings, i18n init, key completeness) | ~4 test files | Medium |

### Website i18n

| Work Item | Pages/Files | Effort |
|-----------|------------|--------|
| Split VitePress config into per-locale files | 12 files | Medium |
| Create 9 locale config files (nav/sidebar/labels) | 9 files | Medium |
| AI-translate 30 pages x 9 languages | 270 markdown files | Automated |
| Verify translated pages build correctly | — | Medium |

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| macOS menu icon/Help integration breaks | Critical | Migrate to ID-based lookup before any translation (section 3.7) |
| AI translation quality for technical terms | Medium | Use glossary/context hints in translation script; community corrections later |
| Rust menu rebuild performance | Low | Menu has ~60 items — rebuild is <10ms |
| Namespace loading flash (content before translations) | Medium | Preload `common`, `menu`, `statusbar` at startup; use Suspense for lazy namespaces |
| zh-TW vs zh-CN divergence | Low | zh-TW falls back to zh-CN; only override terms that differ |
| Website build time with 300 pages | Low | VitePress handles 1000+ pages; 300 is well within limits |
| Translation file merge conflicts | Low | Flat JSON structure minimizes conflicts |

---

## 9. Non-Goals

- **RTL support** — No Arabic/Hebrew in initial 10 languages. CSS logical properties can be adopted incrementally for future-proofing.
- **Locale-specific date/number formats** — i18next's built-in `Intl` integration covers this; no custom formatting library needed.
- **Localized screenshots** — English screenshots initially for all languages.
- **Weblate setup** — Community translation platform integration is deferred to Phase 2 after initial translations ship.
- **ICU MessageFormat** — i18next's native format covers VMark's needs. ICU can be added via plugin later if complex grammar rules are needed.
