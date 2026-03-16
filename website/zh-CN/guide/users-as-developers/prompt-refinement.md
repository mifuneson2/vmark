# 英文提示词效果更好

AI 编程工具在你给出英文提示词时表现更好——即使英语不是你的母语。VMark 自带一个钩子，可以自动翻译和优化你的提示词。

## 为什么英语对 AI 编程很重要

### 大语言模型在英语中思考

大语言模型在内部通过一个与英语高度对齐的表示空间处理所有语言。[^1] 在发送给模型之前将非英语提示词预翻译成英语，可以明显提升输出质量。[^2]

在实践中，像"把这个函数改成异步的"这样的中文提示词是能用的——但英文等效"Convert this function to async"能产生更精准的代码，迭代次数更少。

### 工具调用继承提示词语言

当 AI 编程工具搜索网络、阅读文档或查阅 API 参考时，它使用你提示词的语言进行这些查询。英文查询能找到更好的结果，因为：

- 官方文档、Stack Overflow 和 GitHub Issues 主要是英文的
- 技术术语在英文中更精准
- 代码示例和错误信息几乎总是英文的

用中文提示词询问"状态管理"可能会搜索中文资源，错过权威的英文文档。多语言基准测试一致显示，英语与其他语言之间的性能差距高达 24%——即使是法语或德语这样有充分代表性的语言也不例外。[^3]

## `::` 提示词优化钩子

VMark 的 `.claude/hooks/refine_prompt.mjs` 是一个 [UserPromptSubmit 钩子](https://docs.anthropic.com/en/docs/claude-code/hooks)，它在你的提示词到达 Claude 之前拦截它、将其翻译成英语，并将其优化为一个更优质的编程提示词。

### 使用方法

在提示词前加 `::` 或 `>>` 前缀：

```
:: 把这个函数改成异步的
```

钩子会：
1. 将你的文本发送给 Claude Haiku（快速、低成本）进行翻译和优化
2. 阻止原始提示词被发送
3. 将优化后的英文提示词复制到剪贴板
4. 向你显示结果

然后你粘贴（`Cmd+V`）优化后的提示词并按回车发送。

### 示例

**输入：**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**优化后的输出（已复制到剪贴板）：**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### 它做了什么

钩子使用一个精心设计的系统提示词，给 Haiku 提供：

- **Claude Code 感知** — 了解目标工具的能力（文件编辑、Bash、Glob/Grep、MCP 工具、计划模式、子 Agent）
- **项目上下文** — 从 `.claude/hooks/project-context.txt` 加载，让 Haiku 了解技术栈、约定和关键文件路径
- **优先排序的规则** — 首先保留意图，然后翻译，然后明确范围，最后去除冗余
- **混合语言处理** — 翻译散文，但保留技术术语不翻译（`useEffect`、文件路径、CLI 命令）
- **少样本示例**[^4] — 七组输入/输出对，涵盖中文、模糊英语、混合语言和多步骤请求
- **输出长度指导** — 简单请求 1–2 句，复杂请求 3–5 句

如果你的输入已经是清晰的英文提示词，它会以最少的改动返回。

### 设置

该钩子已在 VMark 的 `.claude/settings.json` 中预配置。它需要 [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)，该 SDK 随 Claude Code 自动可用。

无需额外设置——直接使用 `::` 或 `>>` 前缀即可。

::: tip 何时跳过它
对于简短的命令（`go ahead`、`yes`、`continue`、`option 2`），无需前缀直接发送。钩子会忽略这些内容，以避免不必要的往返。
:::

## 英语母语者同样适用

即使你用英语写作，`>>` 前缀对于提示词优化也很有用：

```
>> make the thing work better with the new API
```

变成：
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

这种优化增加了特异性和结构，有助于 AI 在第一次尝试时就产生更好的代码。[^5]

[^1]: 多语言 LLM 在一个最接近英语的表示空间中做出关键决策，无论输入/输出语言如何。研究人员使用逻辑透镜探测内部表示，发现语义负载的词（如"water"或"sun"）在被翻译为目标语言之前，会先在英语中被选定。激活引导在以英语计算时也更有效。参见：Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 在推理之前系统性地将非英语提示词预翻译成英语，可以在多个任务和语言中提升 LLM 输出质量。研究人员将提示词分解为四个功能部分（指令、上下文、示例、输出），并表明选择性翻译特定组件有时比翻译所有内容更有效。参见：Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX 基准测试——29 种语言中的 11,829 道相同问题——发现英语与低资源语言之间的性能差距高达 24.3%。即使是法语和德语等有充分代表性的语言也显示出可测量的退化。差距与每种语言在模型预训练语料库中的比例强相关，仅靠扩大模型规模无法消除这一差距。参见：[MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: 少样本提示——在提示词中提供输入/输出示例——可以显著提升 LLM 的任务性能。标志性的 GPT-3 论文表明，虽然零样本性能随模型规模稳定提升，但少样本性能提升得*更快*，有时能与微调模型竞争。更大的模型更擅长从上下文示例中学习。参见：Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 在代码生成任务中，结构化、精心设计的提示词持续优于模糊的指令。思维链推理、角色指定和明确的范围约束等技术均能提升首次通过的准确率。参见：Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
