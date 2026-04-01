# 英語プロンプトがより良いコードを生み出す理由

AI コーディングツールは、英語でプロンプトを与えた方がうまく動作します——英語が母語でなくても同様です。[claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) プラグインが、プロンプトの自動修正、翻訳、洗練を自動的に行います。

## AI コーディングにおいて英語が重要な理由

### LLM は英語で思考する

大規模言語モデルは、すべての言語を英語に強く整合した表現空間を通じて内部処理しています。[^1] 英語以外のプロンプトをモデルに送る前に英語に事前翻訳すると、出力品質が測定可能なレベルで向上します。[^2]

実際には、中国語のプロンプト「把这个函数改成异步的」でも動作しますが、英語で「Convert this function to async」と書いた方が、より正確なコードが少ないイテレーションで得られます。

### ツール使用はプロンプトの言語を引き継ぐ

AI コーディングツールが Web 検索、ドキュメント参照、API リファレンスの検索を行う際、クエリにはプロンプトの言語が使用されます。英語のクエリがより良い結果を返す理由は以下の通りです：

- 公式ドキュメント、Stack Overflow、GitHub Issues は大部分が英語で書かれている
- 技術的な検索用語は英語の方がより正確
- コード例やエラーメッセージはほぼ常に英語

中国語で「状态管理」と質問すると、中国語のリソースが検索され、正規の英語ドキュメントが見逃される可能性があります。多言語ベンチマークでは、英語と他の言語の間で最大 24% のパフォーマンスギャップが一貫して示されています——フランス語やドイツ語のような十分にサポートされた言語でさえも。[^3]

## `claude-english-buddy` プラグイン

`claude-english-buddy` は、すべてのプロンプトをインターセプトし、4 つのモードのいずれかで処理する Claude Code プラグインです：

| モード | トリガー | 動作内容 |
|------|---------|--------------|
| **Correct** | エラーを含む英語プロンプト | スペル・文法を修正し、変更箇所を表示 |
| **Translate** | 英語以外を検出（CJK、キリル文字など） | 英語に翻訳し、翻訳内容を表示 |
| **Refine** | `::` プレフィックス | 曖昧な入力を正確で構造化されたプロンプトに書き換え |
| **Skip** | 短いテキスト、コマンド、URL、コード | そのまま通過 |

このプラグインは修正に Claude Haiku を使用します——高速かつ低コストで、ワークフローへの中断はゼロです。

### 自動修正（デフォルト）

普通に入力するだけです。プラグインが言語を自動検出します：

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

プロンプトが正しい場合は——沈黙。ノイズなし。沈黙は正しいことを意味します。

### 翻訳

英語以外のプロンプトは自動的に翻訳されます：

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### `::` によるプロンプト洗練

プロンプトの先頭に `::` を付けると、粗いアイデアを正確なプロンプトに洗練できます：

```
:: make the search faster it's really slow with big files
```

以下のように変換されます：

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

`::` プレフィックスはどの言語でも使えます——翻訳と構造化を一度に行います。[^4]

::: tip プラグインが沈黙するとき
短いコマンド（`yes`、`continue`、`option 2`）、スラッシュコマンド、URL、コードスニペットはそのまま通過します。不要なラウンドトリップは発生しません。
:::

## 上達の追跡

プラグインはすべての修正をログに記録します。数週間にわたって、英語の上達を確認できます：

| コマンド | 表示内容 |
|---------|---------------|
| `/claude-english-buddy:today` | 今日の修正、繰り返しのミス、学習内容、トレンド |
| `/claude-english-buddy:stats` | 長期的なエラー率と上達の軌跡 |
| `/claude-english-buddy:mistakes` | 全期間の繰り返しパターン——あなたの弱点 |

## セットアップ

Claude Code にプラグインをインストールします：

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

追加の設定は不要です——自動修正はすぐに開始されます。

### オプション設定

プロジェクトルートに `.claude-english-buddy.json` を作成してカスタマイズできます：

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| 設定項目 | 選択肢 | デフォルト |
|---------|---------|---------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`、`standard`、`strict` | `standard` |
| `summary_language` | 任意の言語名、または無効化する場合は `null` | `null` |
| `domain_terms` | 変更せず保持する用語の配列 | `[]` |

`summary_language` を設定すると、Claude はすべてのレスポンスの末尾にその言語で簡潔な要約を追加します——重要な判断を母語で確認したい場合に便利です。[^5]

[^1]: 多言語 LLM は、入力・出力の言語に関係なく、英語に最も近い表現空間で重要な判断を行います。内部表現をロジットレンズで調査した結果、意味的に重要な単語（「water」や「sun」など）は、対象言語に翻訳される前に英語で選択されることが分かりました。活性化ステアリングも英語で計算した方が効果的です。参照：Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 英語以外のプロンプトを推論前に体系的に英語へ事前翻訳すると、複数のタスクと言語にわたって LLM の出力品質が向上します。研究者らはプロンプトを 4 つの機能部分（指示、コンテキスト、例、出力）に分解し、特定のコンポーネントの選択的翻訳がすべてを翻訳するよりも効果的である場合があることを示しました。参照：Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX ベンチマーク—— 29 言語で同一の 11,829 問——では、英語と低リソース言語の間で最大 24.3% のパフォーマンスギャップが見つかりました。フランス語やドイツ語のような十分にサポートされた言語でも測定可能な劣化が見られます。このギャップはモデルの事前学習コーパスにおける各言語の割合と強く相関しており、モデルサイズを拡大するだけでは解消されません。参照：[MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Few-shot プロンプティング——プロンプト内に入出力の例を提示すること——は、LLM のタスクパフォーマンスを劇的に向上させます。画期的な GPT-3 論文では、zero-shot パフォーマンスがモデルサイズに比例して着実に向上する一方、few-shot パフォーマンスは*より急速に*向上し、ファインチューニング済みモデルと競合するレベルに達することもあると示されました。大規模モデルほど、コンテキスト内の例からの学習に優れています。参照：Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 構造化された、よく設計されたプロンプトは、コード生成タスクにおいて曖昧な指示を一貫して上回ります。思考の連鎖推論、役割の割り当て、明示的なスコープ制約などのテクニックはすべて、初回の正答率を向上させます。参照：Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
