# Troubleshooting

## Log Files

VMark writes log files to help diagnose issues. Logs include warnings and errors from both the Rust backend and the frontend.

### Log File Locations

| Platform | Path |
|----------|------|
| macOS | `~/Library/Logs/app.vmark/` |
| Windows | `%APPDATA%\app.vmark\logs\` |
| Linux | `~/.local/share/app.vmark/logs/` |

### Log Levels

| Level | What's Logged | Production | Development |
|-------|--------------|------------|-------------|
| Error | Failures, crashes | Yes | Yes |
| Warn | Recoverable issues, fallbacks | Yes | Yes |
| Info | Milestones, state changes | Yes | Yes |
| Debug | Detailed tracing | No | Yes |

### Log Rotation

- Maximum file size: 5 MB
- Rotation: keeps one previous log file
- Old logs are automatically replaced

## Reporting Bugs

When reporting a bug, include:

1. **VMark version** — shown in the navbar badge or About dialog
2. **Operating system** — macOS version, Windows build, or Linux distro
3. **Steps to reproduce** — what you did before the issue occurred
4. **Log file** — attach or paste the relevant log entries

Log entries are timestamped and tagged by module (e.g., `[HotExit]`, `[MCP Bridge]`, `[Export]`), making it easy to find relevant sections.

### Finding Relevant Logs

1. Open the log directory from the table above
2. Open the most recent `.log` file
3. Search for `ERROR` or `WARN` entries near the time the issue occurred
4. Copy the relevant lines and include them in your bug report

## Common Issues

### App Launches Slowly on Windows

VMark is optimized for macOS. On Windows, startup may be slower due to WebView2 initialization. Make sure:

- WebView2 Runtime is up to date
- Antivirus software is not scanning the app data directory in real-time

### Menu Bar Shows English After Language Change

If the menu bar stays in English after switching language in Settings, restart VMark. The menu rebuilds on next launch with the saved language.

### Terminal Doesn't Accept CJK Punctuation

Fixed in v0.6.5+. Update to the latest version.
