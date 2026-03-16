# AI 供應商

VMark 的 [AI 精靈](/zh-TW/guide/ai-genies)需要 AI 供應商來生成建議。你可以使用本地安裝的 CLI 工具，或直接連接至 REST API。

## 快速設定

最快的入門方式：

1. 開啟**設定 > 整合**
2. 點擊**偵測**以掃描已安裝的 CLI 工具
3. 若找到 CLI（例如 Claude、Gemini），選取它即可完成設定
4. 若無可用的 CLI，選擇 REST 供應商，輸入 API 金鑰，然後選取模型

每次只能有一個活躍的供應商。

## CLI 供應商

CLI 供應商使用本地安裝的 AI 工具。VMark 以子程序方式執行它們，並將輸出串流回編輯器。

| 供應商 | CLI 指令 | 安裝 |
|--------|---------|------|
| Claude | `claude` | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) |
| Codex | `codex` | [OpenAI Codex CLI](https://github.com/openai/codex) |
| Gemini | `gemini` | [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) |

### CLI 偵測的運作原理

點擊設定 > 整合中的**偵測**。VMark 在你的 `$PATH` 中搜尋每個 CLI 指令並回報可用性。若找到 CLI，其選鈕即可選取。

### 優點

- **無需 API 金鑰** — CLI 使用你現有的登入憑證進行身份驗證
- **大幅降低費用** — CLI 工具使用你的訂閱方案（例如 Claude Max、ChatGPT Plus/Pro、Google One AI Premium），收取固定月費。REST API 供應商按 Token 計費，大量使用時費用可能是 10–30 倍
- **使用你的 CLI 設定** — 模型偏好設定、系統提示和帳單均由 CLI 本身管理

::: tip 開發者的訂閱 vs API 費用比較
若你也將這些工具用於 vibe 編程（Claude Code、Codex CLI、Gemini CLI），同一個訂閱同時涵蓋 VMark 的 AI 精靈和你的編程工作階段 — 無需額外費用。
:::

### 設定：Claude CLI

1. 安裝 Claude Code：`npm install -g @anthropic-ai/claude-code`
2. 在終端機中執行一次 `claude` 進行身份驗證
3. 在 VMark 中點擊**偵測**，然後選取 **Claude**

### 設定：Gemini CLI

1. 安裝 Gemini CLI：`npm install -g @google/gemini-cli`（或透過[官方倉庫](https://github.com/google-gemini/gemini-cli)）
2. 執行一次 `gemini` 以使用 Google 帳戶進行身份驗證
3. 在 VMark 中點擊**偵測**，然後選取 **Gemini**

## REST API 供應商

REST 供應商直接連接至雲端 API。每個供應商需要端點、API 金鑰和模型名稱。

| 供應商 | 預設端點 | 環境變數 |
|--------|---------|---------|
| Anthropic | `https://api.anthropic.com` | `ANTHROPIC_API_KEY` |
| OpenAI | `https://api.openai.com` | `OPENAI_API_KEY` |
| Google AI | _（內建）_ | `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` |
| Ollama（API） | `http://localhost:11434` | — |

### 設定欄位

選取 REST 供應商時，會出現三個欄位：

- **API 端點** — 基礎 URL（Google AI 為隱藏，使用固定端點）
- **API 金鑰** — 你的秘密金鑰（僅儲存在記憶體中 — 永不寫入磁碟）
- **模型** — 模型識別符（例如 `claude-sonnet-4-5-20250929`、`gpt-4o`、`gemini-2.0-flash`）

### 環境變數自動填入

VMark 在啟動時讀取標準環境變數。若 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 或 `GEMINI_API_KEY` 已在你的 shell 設定檔中設定，選取該供應商時 API 金鑰欄位會自動填入。

這意味著你可以在 `~/.zshrc` 或 `~/.bashrc` 中設定一次金鑰：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

然後重新啟動 VMark — 無需手動輸入金鑰。

### 設定：Anthropic（REST）

1. 從 [console.anthropic.com](https://console.anthropic.com) 取得 API 金鑰
2. 在 VMark 設定 > 整合中，選取 **Anthropic**
3. 貼上你的 API 金鑰
4. 選擇模型（預設：`claude-sonnet-4-5-20250929`）

### 設定：OpenAI（REST）

1. 從 [platform.openai.com](https://platform.openai.com) 取得 API 金鑰
2. 在 VMark 設定 > 整合中，選取 **OpenAI**
3. 貼上你的 API 金鑰
4. 選擇模型（預設：`gpt-4o`）

### 設定：Google AI（REST）

1. 從 [aistudio.google.com](https://aistudio.google.com) 取得 API 金鑰
2. 在 VMark 設定 > 整合中，選取 **Google AI**
3. 貼上你的 API 金鑰
4. 選擇模型（預設：`gemini-2.0-flash`）

### 設定：Ollama API（REST）

當你希望以 REST 方式存取本地 Ollama 實例，或 Ollama 在網路中的其他電腦上執行時，使用此方式。

1. 確認 Ollama 正在執行：`ollama serve`
2. 在 VMark 設定 > 整合中，選取 **Ollama (API)**
3. 將端點設為 `http://localhost:11434`（或你的 Ollama 主機）
4. 將 API 金鑰留空
5. 將模型設為你已下載的模型名稱（例如 `llama3.2`）

## 選擇供應商

| 情境 | 建議 |
|------|------|
| 已安裝 Claude Code | **Claude (CLI)** — 零設定，使用你的訂閱 |
| 已安裝 Codex 或 Gemini | **Codex / Gemini (CLI)** — 使用你的訂閱 |
| 需要隱私/離線使用 | 安裝 Ollama → **Ollama (CLI)** |
| 自訂或自架模型 | **Ollama (API)**，使用你的端點 |
| 想要最便宜的雲端選項 | **任何 CLI 供應商** — 訂閱比 API 便宜得多 |
| 無訂閱，僅輕度使用 | 設定 API 金鑰環境變數 → **REST 供應商**（按 Token 計費） |
| 需要最高品質輸出 | **Claude (CLI)** 或 **Anthropic (REST)**，使用 `claude-sonnet-4-5-20250929` |

## 每個精靈的模型覆蓋

個別精靈可使用 `model` 前置資料欄位覆蓋供應商的預設模型：

```markdown
---
name: quick-fix
description: Quick grammar fix
scope: selection
model: claude-haiku-4-5-20251001
---
```---
name: quick-fix
description: Quick grammar fix
scope: selection
model: claude-haiku-4-5-20251001
---
```

這適合將簡單任務路由至更快/更便宜的模型，同時保留強大的預設值。

## 安全注意事項

- **API 金鑰為暫存** — 只儲存在記憶體中，永不寫入磁碟或 `localStorage`
- **環境變數**在啟動時讀取一次並快取在記憶體中
- **CLI 供應商**使用你現有的 CLI 身份驗證 — VMark 永遠看不到你的憑證
- **所有請求直接**從你的電腦發送至供應商 — 中間沒有 VMark 伺服器

## 疑難排解

**「無可用的 AI 供應商」** — 點擊**偵測**掃描 CLI，或設定帶有 API 金鑰的 REST 供應商。

**CLI 顯示「未找到」** — CLI 不在你的 `$PATH` 中。安裝它或檢查你的 shell 設定檔。在 macOS 上，GUI 應用程式可能無法繼承終端機的 `$PATH` — 嘗試將路徑加入 `/etc/paths.d/`。

**REST 供應商返回 401** — 你的 API 金鑰無效或已過期。從供應商控制台生成新的金鑰。

**REST 供應商返回 429** — 你已達到速率上限。稍等後重試，或切換至其他供應商。

**回應緩慢** — CLI 供應商會增加子程序開銷。如需更快的回應，請使用直接連接的 REST 供應商。最快的本地選項是使用小型模型的 Ollama。

**找不到模型錯誤** — 模型識別符與供應商提供的不符。查閱供應商文件以取得有效的模型名稱。

## 延伸閱讀

- [AI 精靈](/zh-TW/guide/ai-genies) — 如何使用 AI 寫作輔助
- [MCP 設定](/zh-TW/guide/mcp-setup) — 透過模型情境協定進行外部 AI 整合
