# 英語プロンプトがより良いコードを生み出す理由

AI コーディングツールは英語でプロンプトを与えた方がうまく機能します — 英語が母国語でない場合でも。VMark には自動的にプロンプトを翻訳して洗練するフックが付属しています。

## AI コーディングでなぜ英語が重要なのか

### LLM は英語で考える

大規模言語モデルは内部的にすべての言語を英語に強く整合した表現空間を通じて処理します。[^1] 非英語のプロンプトをモデルに送信する前に英語に事前翻訳すると、出力品質が測定可能に改善されます。[^2]

実際には、「把这个函数改成异步的」のような中国語のプロンプトも動作します — しかし英語の同等「Convert this function to async」はより少ない反復でより正確なコードを生み出します。

### ツールの使用はプロンプト言語を継承する

AI コーディングツールがウェブを検索し、ドキュメントを読み、API リファレンスを調べるとき、それらのクエリにあなたのプロンプトの言語を使用します。英語クエリは以下の理由でより良い結果を見つけます:

- 公式ドキュメント、Stack Overflow、GitHub の Issue は主に英語
- 技術用語は英語でより正確
- コードの例とエラーメッセージはほぼ常に英語

「状态管理」についての中国語のプロンプトは英語の公式ドキュメントを見落として中国語のリソースを検索するかもしれません。多言語ベンチマークでは、英語とフランス語やドイツ語のような十分に表現された言語の間でも最大 24% のパフォーマンスギャップが一貫して示されています。[^3]

## `::` プロンプト洗練フック

VMark の`.claude/hooks/refine_prompt.mjs`は[UserPromptSubmit フック](https://docs.anthropic.com/en/docs/claude-code/hooks)で、プロンプトが Claude に届く前にインターセプトし、英語に翻訳して、最適化されたコーディングプロンプトに洗練します。

### 使い方

プロンプトの前に`::` または`>>`を付けます:

```
:: 把这个函数改成异步的
```

フックが行うこと:
1. テキストを翻訳と洗練のために Claude Haiku（速く、安い）に送信
2. 元のプロンプトが送信されないようにブロック
3. 洗練された英語プロンプトをクリップボードにコピー
4. 結果を表示

その後、洗練されたプロンプトを貼り付けて（`Cmd+V`）Enter を押して送信します。

### 例

**入力:**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**洗練された出力（クリップボードにコピー）:**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### 何をするか

フックは Haiku に慎重に構造化されたシステムプロンプトを使用します:

- **Claude Code 認識** — ターゲットツールの機能を知っている（ファイル編集、Bash、Glob/Grep、MCP ツール、プランモード、サブエージェント）
- **プロジェクトコンテキスト** — `.claude/hooks/project-context.txt`から読み込まれるため、Haiku はテックスタック、規約、キーファイルパスを知っている
- **優先順位付けされたルール** — まず意図を保持し、次に翻訳し、次にスコープを明確にし、次にフィラーを除去
- **混合言語の処理** — 散文を翻訳するが技術用語は翻訳しない（`useEffect`、ファイルパス、CLI コマンド）
- **Few-shot の例**[^4] — 中国語、曖昧な英語、混合言語、マルチステップのリクエストをカバーする 7 つの入力/出力ペア
- **出力長のガイダンス** — 単純なリクエストには 1〜2 文、複雑なものには 3〜5 文

入力がすでに明確な英語プロンプトであれば、最小限の変更で返されます。

### セットアップ

フックは VMark の`.claude/settings.json`に事前設定されています。[Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)が必要ですが、Claude Code で自動的に利用可能です。

追加のセットアップは不要 — `::` または`>>`プレフィックスを使うだけです。

::: tip スキップする場合
短いコマンド（`go ahead`、`yes`、`continue`、`option 2`）はプレフィックスなしで送信してください。フックは不必要なラウンドトリップを避けるためにこれらを無視します。
:::

## 英語話者にも使えます

英語を書く場合でも、`>>`プレフィックスはプロンプト最適化に役立ちます:

```
>> make the thing work better with the new API
```

これが次のようになります:
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

洗練により、AI が最初の試行でより良いコードを生み出すのに役立つ特定性と構造が追加されます。[^5]

[^1]: 多言語 LLM は、入力/出力言語に関係なく、英語に最も近い表現空間で重要な決定を行います。logit lens を使用して内部表現を調べた研究者は、「water」や「sun」のような意味的に重要な単語が、ターゲット言語に翻訳される前に英語で選択されることを発見しました。活性化ステアリングも英語で計算するとより効果的です。参照: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 推論前に非英語のプロンプトを体系的に英語に事前翻訳することで、複数のタスクと言語で LLM の出力品質が改善されます。研究者はプロンプトを 4 つの機能部分（指示、コンテキスト、例、出力）に分解し、特定のコンポーネントの選択的翻訳がすべてを翻訳するより効果的である場合があることを示しました。参照: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX ベンチマーク — 29 言語の 11,829 の同一質問 — では英語と低リソース言語の間で最大 24.3% のパフォーマンスギャップが判明しました。フランス語やドイツ語のような十分に表現された言語でさえ測定可能な低下を示します。ギャップはモデルの事前学習コーパスにおける各言語の割合と強く相関しており、単にモデルサイズを拡大しても排除されません。参照: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Few-shot プロンプティング — プロンプト内に入力/出力の例を提供する — は LLM のタスクパフォーマンスを劇的に改善します。GPT-3 の画期的な論文では、ゼロショットパフォーマンスはモデルサイズとともに着実に改善するが、few-shot パフォーマンスはより急速に増加し、時にファインチューニングされたモデルと競合する水準に達することが示されました。より大きなモデルはコンテキスト内の例から学ぶのが得意です。参照: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 構造化されたよく設計されたプロンプトは、コード生成タスクで曖昧な指示を一貫して上回ります。思考の連鎖推論、役割の割り当て、明示的なスコープの制約などの技術はすべて初回パスの精度を改善します。参照: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
