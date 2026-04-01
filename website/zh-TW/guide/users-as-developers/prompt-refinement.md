# 為什麼英文提示詞能產生更好的程式碼

AI 程式碼工具在接收英文提示詞時表現更佳——即使英文不是你的母語。[claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) 外掛會自動校正、翻譯並優化你的提示詞。

## 為什麼英文對 AI 程式開發很重要

### LLM 用英文思考

大型語言模型在內部處理所有語言時，都會經過一個高度對齊英文的表徵空間。[^1] 在將非英文提示詞送入模型之前先翻譯成英文，可以顯著提升輸出品質。[^2]

實際上，中文提示詞如「把這個函數改成異步的」可以運作——但英文的等效表達「Convert this function to async」能產生更精確的程式碼，且需要更少的反覆修改。

### 工具使用會繼承提示詞語言

當 AI 程式碼工具搜尋網頁、閱讀文件或查詢 API 參考時，它會使用你提示詞的語言來進行這些查詢。英文查詢能找到更好的結果，原因如下：

- 官方文件、Stack Overflow 和 GitHub issues 以英文為主
- 技術搜尋詞在英文中更為精確
- 程式碼範例和錯誤訊息幾乎都是英文

中文提示詞搜尋「狀態管理」可能會找到中文資源，而錯過權威的英文文件。多語言基準測試一致顯示，英文與其他語言之間的效能差距最高可達 24%——即使是法語或德語等資源豐富的語言也不例外。[^3]

## `claude-english-buddy` 外掛

`claude-english-buddy` 是一個 Claude Code 外掛，它會攔截每一條提示詞，並透過以下四種模式之一進行處理：

| 模式 | 觸發條件 | 處理方式 |
|------|---------|----------|
| **校正** | 含有錯誤的英文提示詞 | 修正拼寫／文法，顯示修改內容 |
| **翻譯** | 偵測到非英文（CJK、西里爾字母等） | 翻譯為英文，顯示翻譯結果 |
| **精煉** | `::` 前綴 | 將模糊的輸入改寫為精確、結構化的提示詞 |
| **跳過** | 簡短文字、指令、URL、程式碼 | 直接傳遞，不做任何修改 |

該外掛使用 Claude Haiku 進行校正——快速且便宜，對你的工作流程零干擾。

### 自動校正（預設）

正常輸入即可。外掛會自動偵測語言：

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

當你的提示詞沒有錯誤時——靜默。沒有干擾。靜默代表正確。

### 翻譯

非英文提示詞會自動翻譯：

```
You type:    這個組件渲染太慢了，每次父組件更新都會重新渲染，幫我優化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### 使用 `::` 精煉提示詞

在提示詞前加上 `::` 前綴，可以將粗略的想法精煉為精確的提示詞：

```
:: make the search faster it's really slow with big files
```

會變成：

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

`::` 前綴適用於任何語言——它會在一個步驟中完成翻譯和重組。[^4]

::: tip 外掛何時保持靜默
簡短指令（`yes`、`continue`、`option 2`）、斜線指令、URL 和程式碼片段會直接傳遞，不做任何處理。沒有不必要的來回。
:::

## 追蹤你的進步

外掛會記錄每一次校正。幾週之後，你可以看到自己的英文正在進步：

| 指令 | 顯示內容 |
|------|----------|
| `/claude-english-buddy:today` | 今天的校正、重複錯誤、學習要點、趨勢 |
| `/claude-english-buddy:stats` | 長期錯誤率和進步軌跡 |
| `/claude-english-buddy:mistakes` | 所有時間的重複模式——你的盲點 |

## 安裝設定

在 Claude Code 中安裝外掛：

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

無需額外設定——自動校正立即啟動。

### 選用設定

在專案根目錄建立 `.claude-english-buddy.json` 來自訂設定：

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| 設定項 | 選項 | 預設值 |
|--------|------|--------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`、`standard`、`strict` | `standard` |
| `summary_language` | 任何語言名稱，或 `null` 停用 | `null` |
| `domain_terms` | 保持不變的專有名詞陣列 | `[]` |

當設定了 `summary_language` 時，Claude 會在每次回覆的結尾附加一段該語言的簡短摘要——當你希望以母語了解關鍵決策時非常實用。[^5]

[^1]: 多語言 LLM 在最接近英文的表徵空間中做出關鍵決策，與輸入／輸出語言無關。研究者使用 logit lens 探測內部表徵後發現，具有語義負載的詞彙（如「water」或「sun」）會先以英文被選取，然後才翻譯為目標語言。以英文計算的 activation steering 也更為有效。參見：Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 系統性地在推理前將非英文提示詞翻譯為英文，可以在多項任務和語言中提升 LLM 的輸出品質。研究者將提示詞分解為四個功能部分（指令、上下文、範例、輸出），並證明選擇性翻譯特定組成部分可能比全部翻譯更有效。參見：Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX 基準測試——29 種語言的 11,829 道相同題目——發現英文與低資源語言之間的效能差距最高可達 24.3%。即使是法語和德語等資源充足的語言也呈現可測量的退化。這一差距與各語言在模型預訓練語料庫中的佔比高度相關，而單純擴大模型規模並不能消除它。參見：[MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024)；Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Few-shot prompting——在提示詞中提供輸入／輸出範例——能大幅提升 LLM 的任務表現。GPT-3 的里程碑論文顯示，雖然 zero-shot 效能隨模型規模穩定提升，但 few-shot 效能提升*更為迅速*，有時甚至能與微調模型一較高下。更大的模型更善於從上下文範例中學習。參見：Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 結構化、精心設計的提示詞在程式碼生成任務中一致優於模糊的指令。鏈式思考推理、角色指派和明確的範圍約束等技巧都能提升首次通過準確率。參見：Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
