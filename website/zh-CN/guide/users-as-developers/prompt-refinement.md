# 为什么英文提示词能产生更好的代码

AI 编程工具在你给出英文提示词时表现更好——即使英语不是你的母语。[claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) 插件可以自动纠正、翻译和优化你的提示词。

## 为什么英语对 AI 编程很重要

### 大语言模型用英语思考

大语言模型在内部通过一个与英语高度对齐的表示空间来处理所有语言。[^1] 在发送给模型之前将非英语提示词预翻译成英语，可以明显提升输出质量。[^2]

在实践中，像"把这个函数改成异步的"这样的中文提示词是能用的——但英文等效表达 "Convert this function to async" 能产生更精准的代码，迭代次数更少。

### 工具调用继承提示词语言

当 AI 编程工具搜索网络、阅读文档或查阅 API 参考时，它会使用你提示词的语言进行这些查询。英文查询能找到更好的结果，因为：

- 官方文档、Stack Overflow 和 GitHub Issues 主要是英文的
- 技术搜索术语在英文中更精准
- 代码示例和错误信息几乎总是英文的

用中文提示词询问"状态管理"可能会搜索中文资源，错过权威的英文文档。多语言基准测试一致显示，英语与其他语言之间的性能差距高达 24%——即使是法语或德语这样有充分代表性的语言也不例外。[^3]

## `claude-english-buddy` 插件

`claude-english-buddy` 是一个 Claude Code 插件，它会拦截每一条提示词，并通过以下四种模式之一进行处理：

| 模式 | 触发条件 | 处理方式 |
|------|---------|---------|
| **纠正** | 包含错误的英文提示词 | 修正拼写/语法，显示改动内容 |
| **翻译** | 检测到非英语（中日韩、西里尔字母等） | 翻译为英语，显示翻译结果 |
| **优化** | `::` 前缀 | 将模糊输入重写为精确、结构化的提示词 |
| **跳过** | 短文本、命令、URL、代码 | 原样通过，不做处理 |

该插件使用 Claude Haiku 进行纠正——速度快、成本低，对你的工作流程零干扰。

### 自动纠正（默认模式）

正常输入即可，插件会自动检测语言：

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

当你的提示词没有错误时——一片安静。没有噪音。安静意味着正确。

### 翻译

非英语提示词会被自动翻译：

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### 使用 `::` 优化提示词

在提示词前加 `::` 前缀，可以将粗糙的想法优化为精确的提示词：

```
:: make the search faster it's really slow with big files
```

变成：

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

`::` 前缀适用于任何语言——一步完成翻译和结构重组。[^4]

::: tip 插件何时保持安静
短命令（`yes`、`continue`、`option 2`）、斜杠命令、URL 和代码片段会原样通过，不做处理。没有不必要的往返开销。
:::

## 追踪你的进步

插件会记录每一次纠正。几周之后，你可以看到自己英语水平的提升：

| 命令 | 显示内容 |
|------|---------|
| `/claude-english-buddy:today` | 今天的纠正、反复出现的错误、经验总结、趋势 |
| `/claude-english-buddy:stats` | 长期错误率和改进轨迹 |
| `/claude-english-buddy:mistakes` | 历史上所有反复出现的模式——你的盲点所在 |

## 安装设置

在 Claude Code 中安装插件：

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

无需额外配置——自动纠正立即生效。

### 可选配置

在项目根目录创建 `.claude-english-buddy.json` 进行自定义：

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| 设置项 | 可选值 | 默认值 |
|-------|-------|-------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`、`standard`、`strict` | `standard` |
| `summary_language` | 任意语言名称，或 `null` 禁用 | `null` |
| `domain_terms` | 需要保持不变的术语数组 | `[]` |

当 `summary_language` 被设置后，Claude 会在每次回复末尾附加一段该语言的简要摘要——当你希望用母语了解关键决策时非常有用。[^5]

[^1]: 多语言 LLM 在一个最接近英语的表示空间中做出关键决策，无论输入/输出语言如何。研究人员使用 logit lens 探测内部表示，发现语义负载词（如 "water" 或 "sun"）在被翻译为目标语言之前，会先在英语中被选定。激活引导在以英语计算时也更有效。参见：Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 在推理之前系统性地将非英语提示词预翻译成英语，可以在多个任务和语言中提升 LLM 输出质量。研究人员将提示词分解为四个功能部分（指令、上下文、示例、输出），并表明选择性翻译特定组件有时比翻译所有内容更有效。参见：Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX 基准测试——29 种语言中的 11,829 道相同问题——发现英语与低资源语言之间的性能差距高达 24.3%。即使是法语和德语等有充分代表性的语言也显示出可测量的退化。差距与每种语言在模型预训练语料库中的比例强相关，仅靠扩大模型规模无法消除这一差距。参见：[MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: 少样本提示——在提示词中提供输入/输出示例——可以显著提升 LLM 的任务性能。标志性的 GPT-3 论文表明，虽然零样本性能随模型规模稳定提升，但少样本性能提升得*更快*，有时能与微调模型竞争。更大的模型更擅长从上下文示例中学习。参见：Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 在代码生成任务中，结构化、精心设计的提示词持续优于模糊的指令。思维链推理、角色指定和明确的范围约束等技术均能提升首次通过的准确率。参见：Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
