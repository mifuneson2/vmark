# Privacy

VMark respects your privacy. Here's exactly what happens — and what doesn't.

## What VMark Sends

VMark includes an **auto-update checker** that periodically contacts our server to see if a new version is available. This is the **only** network request VMark makes.

Each check sends exactly these fields — nothing more:

| Data | Example | Purpose |
|------|---------|---------|
| IP address | `203.0.113.42` | Inherent in any HTTP request — we can't not receive it |
| OS | `darwin`, `windows`, `linux` | To serve the correct update package |
| Architecture | `aarch64`, `x86_64` | To serve the correct update package |
| App version | `0.5.10` | To determine if an update is available |

The full URL looks like:

```
https://log.vmark.app/update/latest.json?target=darwin&arch=aarch64&version=0.5.10
```

You can verify this yourself — it's defined in [`tauri.conf.json`](https://github.com/xiaolai/vmark/blob/main/src-tauri/tauri.conf.json). Search for `"endpoints"`.

## What VMark Does NOT Send

- Your documents or their contents
- File names or paths
- Usage patterns or feature analytics
- Personal information of any kind
- Crash reports
- Keystroke or editing data
- Hardware identifiers or fingerprints
- Any unique install ID or tracking token

## How We Use the Data

We aggregate the update check logs to produce the live statistics shown on our [homepage](/):

| Metric | How it's calculated |
|--------|-------------------|
| **Unique IPs** | Count of distinct IP addresses per day/week/month |
| **Pings** | Total number of update check requests |
| **Platforms** | Count of pings per OS + architecture combination |
| **Versions** | Count of pings per app version |

These numbers are published openly at [`log.vmark.app/api/stats`](https://log.vmark.app/api/stats). Nothing is hidden.

**Important caveats:**
- Unique IPs undercount real users — multiple people behind the same router/VPN/corporate network count as one
- Pings overcount real users — one person may check multiple times per day
- The real number of active users is somewhere between these two numbers

## Data Retention

- Logs are stored on our server in standard access log format
- Log files rotate at 1 MB and only the 3 most recent files are kept
- Logs are not shared with anyone
- There is no account system — VMark doesn't know who you are
- We do not use tracking cookies, fingerprinting, or any analytics SDK

## Open Source Transparency

VMark is fully open source. You can verify everything described here:

- Update endpoint configuration: [`src-tauri/tauri.conf.json`](https://github.com/xiaolai/vmark/blob/main/src-tauri/tauri.conf.json)
- No other network calls exist in the codebase — search for `fetch`, `http`, or `reqwest` yourself

## Disabling Update Checks

If you prefer to disable automatic update checks entirely, you can block `log.vmark.app` at the network level (firewall, `/etc/hosts`, or DNS). VMark will continue to work normally without it — you just won't receive update notifications.
