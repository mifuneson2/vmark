# vmark Security Hardening Instructions

Source repo: [https\://github.com/xiaolai/vmark](https://github.com/xiaolai/vmark)  
Fork this repo, apply the changes below, then build with `pnpm tauri build`.

## Prerequisites

- Rust toolchain (`rustup`)
- Node.js + pnpm
- Tauri CLI prerequisites: [https\://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

---

## Change 1: Remove machine fingerprint from auto-updater

**File**: `src-tauri/src/lib.rs`

### Step 1a — Replace the updater plugin initialization

Find this block (around line 532):

```rust
.plugin({
    let mid = machine_id_hash();
    tauri_plugin_updater::Builder::new()
        .header("X-Machine-Id", mid)
        .expect("valid ASCII hex header")
        .build()
})
```

Replace with:

```rust
.plugin(tauri_plugin_updater::Builder::new().build())
```

### Step 1b — Delete the `machine_id_hash` function

Find and delete this entire function (around lines 480–496):

```rust
fn machine_id_hash() -> String {
    let hostname = gethostname::gethostname()
        .to_string_lossy()
        .into_owned();
    let input = format!(
        "vmark-machine-id-v1:{}:{}:{}",
        hostname,
        std::env::consts::OS,
        std::env::consts::ARCH,
    );
    format!("{:x}", Sha256::digest(input.as_bytes()))
}
```

### Step 1c — Remove unused imports

In `src-tauri/src/lib.rs`, remove any import lines referencing `gethostname` and `Sha256` if they are no longer used elsewhere in the file. Search for:

- `use gethostname`
- `use sha2` / `Sha256`

### Step 1d — Remove unused Cargo dependency

In `src-tauri/Cargo.toml`, remove the `gethostname` dependency line if it exists. Run `cargo check` to confirm no other code uses it.

---

## Change 2: Remove delete permission on home directory

**File**: `src-tauri/capabilities/default.json`

Find and **delete** this entire block:

```json
{
  "identifier": "fs:allow-remove",
  "allow": [
    { "path": "$HOME/**" },
    { "path": "/Volumes/**" },
    { "path": "/mnt/**" },
    { "path": "/media/**" }
  ]
}
```

**Why it's safe**: A markdown editor has no legitimate need to delete arbitrary files in `$HOME`. App-internal temp files live in `$APPDATA`, which is covered by a separate capability. After removing this, test the "move to trash" / file deletion features if any exist in the UI.

---

## Change 3 (Optional): Restrict filesystem scope to document directories

**File**: `src-tauri/capabilities/default.json`

**Trade-off**: Files outside the listed directories (e.g. `~/Projects/`, `~/Dropbox/`) cannot be opened. If you store notes only in `~/Documents`, this is a worthwhile restriction.

In every `fs:allow-*` permission block, replace:

```json
{ "path": "$HOME/**" },
{ "path": "/Volumes/**" },
{ "path": "/mnt/**" },
{ "path": "/media/**" }
```

With:

```json
{ "path": "$HOME/Documents/**" },
{ "path": "$HOME/Desktop/**" },
{ "path": "$HOME/Downloads/**" },
{ "path": "$APPDATA/**" },
{ "path": "$APPLOCALDATA/**" }
```

This applies to all of these permission identifiers:

- `fs:allow-read-text-file`
- `fs:allow-write-text-file`
- `fs:allow-write-file`
- `fs:allow-exists`
- `fs:allow-mkdir`
- `fs:allow-read-dir`
- `fs:allow-copy-file`
- `fs:allow-read-file`
- `fs:allow-rename`

After making this change, test: open a file, save a file, and any export features to confirm nothing breaks.

---

## Build & Test

```bash
# Install dependencies
pnpm install

# Dev mode (test before building)
pnpm tauri dev

# Production build
pnpm tauri build
```

---

## Security Context

These changes were identified during a security audit of `xiaolai/vmark` on 2026-04-17.

| Finding                                                             | Severity   | Fixed by            |
| ------------------------------------------------------------------- | ---------- | ------------------- |
| `X-Machine-Id` fingerprint sent to `log.vmark.app` on every launch  | MEDIUM     | Change 1            |
| `fs:allow-remove` grants webview delete access to all of `$HOME/**` | MEDIUM     | Change 2            |
| Broad `$HOME/**` read/write scope                                   | LOW–MEDIUM | Change 3 (optional) |

The MCP server, Tauri backend logic, and `.claude/` configuration were reviewed and found clean — no malicious code, no data exfiltration, no hardcoded credentials.
