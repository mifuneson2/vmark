# 为什么贵的模型反而更便宜

::: info TL;DR
最强大的 AI 模型**每任务成本低 60%**，尽管每 token 价格高出 67%——因为它使用的 token 更少、迭代次数更少、产生的错误少 50–75%。对于无法阅读代码的氛围编码者而言，模型质量不是效率问题，而是整个流程中唯一的安全网。
:::

::: details 最后验证：2026 年 2 月
本文中的基准分数、模型名称和定价反映截至 2026 年 2 月的行业状态。核心论点——每任务成本比每 token 价格更重要——即使具体数字变化，依然成立。
:::

最贵的 AI 编程模型几乎总是最便宜的选择——当你衡量真正重要的指标时。每 token 的价格只是一个干扰项。决定你实际成本的是**完成工作需要多少 token**、你要经历多少轮迭代，以及你有多少时间花在审查和修复输出上。

## 定价幻觉

以下是 Claude 各模型的 API 价格：

| 模型 | 输入（每 100 万 token） | 输出（每 100 万 token） |
|-------|----------------------|------------------------|
| Claude Opus 4.5 | $5 | $25 |
| Claude Sonnet 4.5 | $3 | $15 |

Opus 看起来贵了 67%。大多数人到这里就做出了选择——选 Sonnet。这是错误的算法。

### 实际发生了什么

Anthropic 的基准数据讲述了另一个故事。在中等努力程度下，Opus 4.5 **匹配** Sonnet 4.5 的最佳 SWE-bench 分数，同时使用的输出 token **少了 76%**。在最高努力程度下，Opus **超越** Sonnet 4.3 个百分点，同时使用的 token **少了 48%**。[^1]

让我们算真实的账：

| | Sonnet 4.5 | Opus 4.5 |
|--|-----------|----------|
| 每任务输出 token | ~500 | ~120 |
| 每 100 万输出 token 价格 | $15 | $25 |
| **每任务成本** | **$0.0075** | **$0.0030** |

Opus **每任务便宜 60%**——尽管每 token 贵了 67%。[^2]

这不是精心挑选的例子。在长周期编程任务上，Opus 以**高达 65% 更少的 token** 和 **50% 更少的工具调用**实现了更高的通过率。[^1]

## 迭代税

token 成本只是故事的一部分。更大的成本是**迭代**——需要经历多少轮"生成—审查—修复"才能得到正确的代码。

Opus 4.5 在 **4 次迭代**内达到峰值性能。竞争模型需要**多达 10 次尝试**才能达到类似质量。[^1] 每次失败的迭代都消耗：

- **Token** — 模型重新读取上下文并再次生成
- **时间** — 你审查输出、找到问题、重新提示
- **注意力** — 在"这对吗？"和"哪里不对？"之间反复切换

以开发者 75 美元/小时的工资计算，每次需要 15 分钟来审查和修正的失败迭代，在人力成本上花费了 **18.75 美元**。六次额外的迭代（4 次和 10 次之间的差距）在开发者时间上的成本是 **112.50 美元**——每个复杂任务。token 成本差异？大约半美分。[^3]

**开发者节省的时间是 token 成本差异的 22,500 倍。**

## 错误乘数

更便宜的模型不只是需要更多迭代——它们产生更多存活到生产环境的错误。

Opus 4.5 在工具调用错误和构建/lint 错误两方面都比其他模型**减少了 50–75%**。[^1] 这很关键，因为从编程会话中逃逸的错误在下游会变得极其昂贵：

- 编程期间发现的 bug，修复只需几分钟
- 代码审查中发现的 bug，需要一小时（你的 + 审查者的）
- 生产环境中发现的 bug，需要数天（调试、热修复、沟通、事后复盘）

Faros AI 的研究——覆盖 1,255 个团队和 10,000+ 名开发者——发现高度 AI 采用与**每位开发者 bug 增加 9%** 和 **PR 审查时间增加 91%** 相关。[^4] 当 AI 以更低的准确率生成更多代码时，审查瓶颈会完全吸收"生产力"提升。

第一次就做对的模型可以避免这个级联效应。

## SWE-bench 证据

SWE-bench Verified 是评估 AI 在真实软件工程任务上编程能力的行业标准。2026 年 2 月的排行榜：[^5]

| 模型 | SWE-bench Verified |
|-------|-------------------|
| Claude Opus 4.5 | **80.9%** |
| Claude Opus 4.6 | 80.8% |
| GPT-5.2 | 80.0% |
| Gemini 3 Flash | 78.0% |
| Claude Sonnet 4.5 | 77.2% |
| Gemini 3 Pro | 76.2% |

Opus 4.5 和 Sonnet 4.5 之间 3.7 分的差距意味着，Opus 能解决的任务中，**大约每 27 个就有 1 个** Sonnet 无法解决。当每次失败都触发一次手动调试会话时，成本会迅速累积。

更关键的是——当研究人员按**每已解决任务成本**而非每 token 成本衡量时，Opus 比 Sonnet 更便宜：

| 模型 | 每任务成本 | SWE-bench 分数 |
|-------|--------------|-----------------|
| Claude Opus 4.5 | ~$0.44 | 80.9% |
| Claude Sonnet 4.5 | ~$0.50 | 77.2% |

Sonnet **每任务成本更高**，同时**解决的任务更少**。[^6]

## Codex CLI：同样的规律，不同的厂商

OpenAI 的 Codex CLI 在推理努力程度上也呈现相同的规律：

- **中等推理**：平衡速度和智能——默认设置
- **超高（xhigh）推理**：思考时间更长，答案更好——推荐用于复杂任务

采用中等努力程度的 GPT-5.1-Codex-Max 在相同努力程度下优于标准 GPT-5.1-Codex，同时使用的思考 token **少了 30%**。[^7] 高端模型天生更节省 token，因为它推理得更好——不需要生成那么多中间步骤就能得到正确答案。

这个规律在厂商间是普遍的：**更聪明的模型浪费更少的算力。**

## METR 警示

METR 的随机对照试验提供了一个至关重要的警示案例。16 名有经验的开发者（150 美元/小时）在 246 个任务中使用了 AI 工具。结果：开发者在 AI 辅助下**慢了 19%**。更令人震惊的是——开发者*认为*自己快了 20%，感知差距接近 39 个百分点。[^8]

该研究使用的是 **Sonnet 级别的模型**（通过 Cursor Pro 使用 Claude 3.5/3.7 Sonnet），而非 Opus。AI 生成的代码中，不到 44% 被接受。

这表明质量阈值至关重要。一个你接受其代码 44% 的模型会让你变慢——你花在审查和拒绝上的时间比节省的更多。一个错误减少 50–75%、首次通过准确率大幅提升的模型，可能会完全翻转这个等式。

**METR 研究并不表明 AI 编程工具很慢。它表明平庸的 AI 编程工具很慢。**

## 技术债：你没有算入的 75%

编写代码的前期成本仅占软件生命周期总成本的 **15–25%**。剩余的 **75–85%** 用于维护、运营和修复 bug。[^9]

GitClear 对 2020–2024 年生成的代码的分析发现，重复代码块**增加了 8 倍**，代码流失（churn）**增加了 2 倍**，与 AI 工具采用相关。SonarSource 发现，与前代模型相比，Claude Sonnet 4 的输出中 BLOCKER 级别的 bug **增加了 93%**。[^10]

如果更便宜的模型生成的代码严重 bug 率接近翻倍，而维护消耗了 75–85% 的生命周期成本，那么在代码生成上的"节省"就被下游成本淹没了。最便宜的代码是第一次就正确的代码。

## 订阅账单

对于重度用户，订阅与 API 的选择进一步放大了模型质量的论点。

| 方案 | 月费 | 你得到的 |
|------|-------------|--------------|
| Claude Max（$100） | $100 | 高频 Opus 使用 |
| Claude Max（$200） | $200 | 无限 Opus |
| 等效 API 用量 | $3,650+ | 相同的 Opus token |

订阅比 API 计费用于相同工作**便宜约 18 倍**。[^11] 在订阅价格下，使用最佳模型的边际成本为零——"昂贵"的模型每次额外查询实际上是免费的。

订阅模式下的平均 Claude Code 成本：**每位开发者每天 6 美元**，90% 的用户每天低于 12 美元。[^12] 以 75 美元/小时的开发者工资计算，**每天节省 5 分钟**就能覆盖订阅费用。超出这个额度的一切都是纯回报。

## 复合论点

随着时间推移，这个账单会变得更加悬殊：

### 1. 更少的迭代 = 更少的上下文污染

每次失败的尝试都会增加到对话历史中。长对话会降低模型性能——信噪比下降。4 次迭代就成功的模型拥有比挣扎了 10 次的模型更干净的上下文，这意味着它后续的回应也更好。

### 2. 更少的错误 = 更少的审查疲劳

GitHub Copilot 生产力研究发现，收益随任务难度增加。[^13] 复杂任务是廉价模型失败最多的地方——也是昂贵模型大放异彩的地方。ZoomInfo 案例研究显示，AI 带来 **40–50% 的生产力提升**，差距随复杂度增加而扩大。

### 3. 更好的代码 = 更好的学习

如果你是一名正在成长的开发者（每个开发者都应该如此），你阅读的代码塑造了你的直觉。持续阅读正确、结构良好的 AI 输出，能培养好习惯。阅读充满 bug、冗长的输出则会养成坏习惯。

### 4. 正确的代码发布更快

每一次不需要的迭代，就是一个更早上线的功能。在竞争激烈的市场中，开发速度——以交付的功能而非生成的 token 衡量——才是关键。

## 对氛围编码者而言，这不是成本问题，而是生存问题

以上内容适用于能够阅读 diff、发现 bug、修复破损代码的专业开发者。但有一个快速增长的群体，对他们来说，模型质量的论点不是关于效率——而是关于软件能否正常运行。这就是**百分之百的氛围编码者**：非程序员，完全通过自然语言提示词构建真实应用，无法阅读、审计或理解生成代码中的任何一行。

### 隐形风险

对于专业开发者，产生 bug 代码的廉价模型是**恼人的**——他们在审查中发现 bug，修复，然后继续。对于非程序员，同样的 bug 是**隐形的**。它会直接进入生产环境，无人察觉。

这个问题的规模令人震惊：

- **Veracode** 测试了 100 多个 LLM，发现 AI 生成的代码在 **45% 的任务**中引入了安全漏洞。Java 最糟糕，超过 70%。关键是，更新、更大的模型在安全性上没有显著改善——这个问题是结构性的，而非代际性的。[^14]
- **CodeRabbit** 分析了 470 个开源 PR，发现 AI 编写的代码比人类代码有 **1.7 倍的主要问题**和 **1.4 倍的严重问题**。逻辑错误高出 75%。性能问题（过度 I/O）**高出 8 倍**。安全漏洞高出 **1.5–2 倍**。[^15]
- **BaxBench** 和 NYU 研究确认，**40–62% 的 AI 生成代码**含有安全漏洞——跨站脚本、SQL 注入、缺少输入验证——这类漏洞不会使应用崩溃，但会悄悄暴露每个用户的数据。[^16]

专业开发者能识别这些模式。氛围编码者不知道它们的存在。

### 现实世界的灾难

这不是理论上的。2025 年，安全研究员 Matt Palmer 发现，用 Lovable——一个流行的氛围编码平台——构建的 **1,645 个应用中有 170 个**数据库安全配置严重错误。互联网上的任何人都可以读写他们的数据库。泄露的数据包括全名、电子邮件地址、电话号码、家庭住址、个人债务金额和 API 密钥。[^17]

Escape.tech 更进一步，扫描了跨 Lovable、Base44、Create.xyz 和 Bolt.new 等平台**公开部署的 5,600+ 个氛围编码应用**。他们发现了超过 **2,000 个漏洞**、**400+ 个泄露的密钥**，以及 **175 个泄露的个人身份信息（PII）**实例，包括医疗记录、IBAN 和电话号码。[^18]

这些不是开发者的错误。开发者——如果我们可以这样称呼他们的话——根本不知道漏洞的存在。他们让 AI 构建了一个应用，应用看起来能用，然后他们就部署了。安全漏洞对任何不会阅读代码的人来说是隐形的。

### 供应链陷阱

非程序员面临的一个威胁，即使是有经验的开发者也难以察觉：**依赖包幻觉（slopsquatting）**。AI 模型会幻觉包名——大约 20% 的代码样本引用了不存在的包。攻击者注册这些虚构的包名并注入恶意软件。当氛围编码者的 AI 建议安装该包时，恶意软件自动进入他们的应用。[^19]

开发者可能会注意到一个不熟悉的包名并核实它。氛围编码者会安装 AI 告诉他们安装的任何东西。他们没有什么框架来判断什么是合法的，什么是幻觉出来的。

### 为什么模型质量是唯一的安全网

Palo Alto Networks 的 Unit 42 研究团队直白地说：公民开发者——没有开发背景的人——"缺乏如何编写安全代码的培训，可能没有充分理解应用程序生命周期中所需的安全要求"。他们的调查发现了真实世界的**数据泄露、身份验证绕过和任意代码执行**，直接追溯到氛围编码的应用。[^20]

对于专业开发者，代码审查、测试和安全审计是安全网。它们捕获模型遗漏的东西。氛围编码者**没有任何这些安全网**。他们无法审查无法阅读的代码。他们无法为自己不理解的行为编写测试。他们无法审计从未听说过的安全属性。

这意味着 AI 模型本身是整个流程中**唯一**的质量控制。模型引入的每一个缺陷都直接发布给用户。没有第二次机会，没有人工检查点，没有安全网。

这正是模型质量最重要的地方：

- **Opus 比廉价模型少产生 50–75% 的错误**。[^1] 对于无法捕获任何错误的氛围编码者，这是能用的应用和悄悄泄露用户数据的应用之间的区别。
- **Opus 在 4 次迭代内达到峰值性能**，而非 10 次。[^1] 每次额外的迭代意味着氛围编码者必须用自然语言描述问题（他们无法指向错误的那一行），希望 AI 理解，并希望修复不会引入他们同样看不见的新 bug。
- **Opus 在前沿模型中对提示词注入的抵抗力最强**——当氛围编码者构建处理无法自行清理的用户输入的应用时，这至关重要。
- **Opus 每任务使用更少的 token**，意味着它用更少的代码完成相同的目标——更少的代码意味着更小的攻击面，更少的地方供 bug 藏身于没人会读的代码中。

对于开发者，廉价模型是生产力税。对于氛围编码者，廉价模型是**负债**。模型不是他们的助手——而是他们的**整个工程团队**。当你完全无法检查工作质量时，雇用最便宜的"工程师"不是节俭，而是鲁莽。

### 非程序员的真实决策

如果你无法阅读代码，你选择的不是廉价工具和昂贵工具之间的区别。你在选择：

1. **一个 55% 的时间能做对安全的模型**（另外 45% 你永远不会知道）
2. **一个 80%+ 的时间能做对安全的模型**（产生的无声、隐形 bug 大幅减少，这类 bug 会毁掉业务）

每 token 67% 的价格溢价，与你不知道可能发生、内置于你无法阅读的代码中、在你部署给真实用户的应用里的数据泄露代价相比，毫无意义。

**对于氛围编码者，昂贵的模型不是更便宜的选择。它是唯一负责任的选择。**

## 决策框架

| 如果你…… | 使用…… | 原因 |
|-----------|--------|-----|
| 每天编程数小时 | Opus + 订阅 | 零边际成本，最高质量 |
| 处理复杂任务 | 超高 / Opus | 更少迭代，更少 bug |
| 维护长期代码 | 最佳可用模型 | 技术债才是真实成本 |
| 氛围编码但不读代码 | **Opus——不可妥协** | 模型是你唯一的安全网 |
| 预算有限 | 仍然选 Opus，通过订阅 | $200/月 < 调试廉价输出的成本 |
| 运行快速的一次性查询 | Sonnet / 中等努力 | 对简单任务，质量阈值影响不大 |

廉价模型胜出的唯一场景是**任何模型都能一次成功的琐碎任务**。对于其他一切——也就是真实软件工程的大部分——昂贵的模型才是便宜的选择。

## 结论

每 token 定价是虚荣指标。每任务成本才是真实指标。而每任务，最强大的模型持续胜出——不是小幅领先，而是数倍差距：

- 每任务**便宜 60%**（token 更少）
- 达到峰值性能的迭代**少 60%**
- 错误**少 50–75%**
- 节省的开发者时间价值是 token 成本差异的 **22,500 倍**

最昂贵的模型不是奢侈品。它是任何珍视自己时间的人的最低可行选择。

[^1]: Anthropic (2025). [Introducing Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5). 关键发现：在中等努力程度下，Opus 4.5 使用少 76% 的输出 token 匹配 Sonnet 4.5 的最佳 SWE-bench 分数；在最高努力程度下，Opus 使用少 48% 的 token 超越 Sonnet 4.3 个百分点；工具调用和构建/lint 错误减少 50–75%；4 次迭代内达到峰值性能，而竞争对手最多需要 10 次。

[^2]: claudefa.st (2025). [Claude Opus 4.5: 67% Cheaper, 76% Fewer Tokens](https://claudefa.st/blog/models/claude-opus-4-5). 分析表明，每 token 的价格溢价被每任务显著更低的 token 消耗所超过，使 Opus 成为大多数工作负载更具成本效益的选择。

[^3]: 开发者薪资数据来自 Glassdoor (2025)：美国软件开发者平均薪资 $121,264–$172,049/年。以 $75/小时计算，每次失败迭代 15 分钟的审查/修正 = $18.75 人力成本。六次额外迭代（4 次和 10 次之间的差距）= 每个复杂任务 $112.50。参见：[Glassdoor Software Developer Salary](https://www.glassdoor.com/Salaries/software-developer-salary-SRCH_KO0,18.htm).

[^4]: Faros AI (2025). [The AI Productivity Paradox](https://www.faros.ai/blog/ai-software-engineering). 对 1,255 个团队和 10,000+ 名开发者的研究发现：高 AI 团队的个人开发者完成 21% 更多任务并合并 98% 更多 PR，但 PR 审查时间增加 91%，每位开发者 bug 增加 9%，PR 大小增长 154%。AI 采用与公司级性能提升无显著相关性。

[^5]: SWE-bench Verified 排行榜，2026 年 2 月。汇总自 [marc0.dev](https://www.marc0.dev/en/leaderboard)、[llm-stats.com](https://llm-stats.com/benchmarks/swe-bench-verified) 和 [The Unwind AI](https://www.theunwindai.com/p/claude-opus-4-5-scores-80-9-on-swe-bench)。Claude Opus 4.5 是第一个在 SWE-bench Verified 上突破 80% 的模型。

[^6]: JetBrains AI Blog (2026). [The Best AI Models for Coding: Accuracy, Integration, and Developer Fit](https://blog.jetbrains.com/ai/2026/02/the-best-ai-models-for-coding-accuracy-integration-and-developer-fit/). 结合 token 消耗和成功率的多模型每任务成本分析。另见：[AI Coding Benchmarks](https://failingfast.io/ai-coding-guide/benchmarks/) at Failing Fast.

[^7]: OpenAI (2025). [GPT-5.1-Codex-Max](https://openai.com/index/gpt-5-1-codex-max/); [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/). 采用中等推理努力的 Codex-Max 在相同努力程度下优于标准 Codex，同时使用少 30% 的思考 token——高端模型天生更节省 token。

[^8]: METR (2025). [Measuring the Impact of Early 2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). 随机对照试验：16 名有经验的开发者，246 个任务，$150/小时报酬。AI 辅助开发者慢了 19%。开发者预期加速 24%，事后认为快了 20%——感知差距约 39 个百分点。不到 44% 的 AI 生成代码被接受。另见：[arXiv:2507.09089](https://arxiv.org/abs/2507.09089).

[^9]: 关于软件生命周期成本的行业数据一致将维护置于总成本的 60–80%。参见：Sommerville, I. (2015). *Software Engineering*, 第 10 版，第 9 章："发布后更改软件的成本通常远超初始开发成本。"另见：[MIT Sloan: The Hidden Costs of Coding with Generative AI](https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/).

[^10]: GitClear (2024). [AI Code Quality Analysis](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt)：重复代码块增加 8 倍，代码流失增加 2 倍（2020–2024 年）。SonarSource (2025)：对 AI 生成代码的分析发现，所有测试模型在安全意识上普遍不足，Claude Sonnet 4 产生的 BLOCKER 级别 bug 比例接近翻倍——严重 bug 引入率增加 93%。参见：[DevOps.com: AI in Software Development](https://devops.com/ai-in-software-development-productivity-at-the-cost-of-code-quality-2/).

[^11]: Level Up Coding (2025). [Claude API vs Subscription Cost Analysis](https://levelup.gitconnected.com/why-i-stopped-paying-api-bills-and-saved-36x-on-claude-the-math-will-shock-you-46454323346c). 订阅与 API 计费的对比显示，对于持续编程会话，订阅约便宜 18 倍。

[^12]: The CAIO (2025). [Claude Code Pricing Guide](https://www.thecaio.ai/blog/claude-code-pricing-guide). 订阅计划下的平均 Claude Code 成本：每位开发者每天 6 美元，90% 的用户每天低于 12 美元。

[^13]: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity: Evidence from GitHub Copilot](https://arxiv.org/abs/2302.06590). 实验室研究：开发者使用 Copilot 完成任务的速度快了 55.8%。另见：ZoomInfo 案例研究显示 AI 带来 40–50% 的生产力提升，差距随任务难度增加而扩大（[arXiv:2501.13282](https://arxiv.org/html/2501.13282v1)）。

[^14]: Veracode (2025). [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/). 对 80 个编程任务、100+ 个 LLM 的分析：AI 生成的代码在 45% 的情况下引入了安全漏洞。Java 最差，超过 70%，Python/C#/JavaScript 在 38–45%。更新、更大的模型在安全性上没有显著改善。另见：[BusinessWire announcement](https://www.businesswire.com/news/home/20250730694951/en/).

[^15]: CodeRabbit (2025). [State of AI vs Human Code Generation Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report). 对 470 个开源 GitHub PR 的分析（320 个 AI 共同创作，150 个纯人类）：AI 代码有 1.7 倍的主要问题、1.4 倍的严重问题、75% 更多的逻辑错误、1.5–2 倍的安全漏洞、3 倍的可读性问题和近 8 倍的性能问题（过度 I/O）。另见：[The Register coverage](https://www.theregister.com/2025/12/17/ai_code_bugs/).

[^16]: BaxBench 和 NYU 关于 AI 代码安全的研究。参见：Tihanyi, N. et al. (2025). [Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code in Real-World Tasks](https://arxiv.org/abs/2512.03262). BaxBench 结合后端编程场景与专家设计的安全利用，发现 40–62% 的 AI 生成代码包含安全漏洞，包括 XSS、SQL 注入和缺少输入验证。

[^17]: Palmer, M. (2025). [Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/). 对 1,645 个 Lovable 构建应用的分析：170 个存在行级安全配置严重错误，允许未认证访问读写用户数据库。泄露的个人信息包括姓名、邮件、电话、家庭住址、个人债务金额和 API 密钥。另见：[Superblocks: Lovable Vulnerability Explained](https://www.superblocks.com/blog/lovable-vulnerabilities).

[^18]: Escape.tech (2025). [The State of Security of Vibe Coded Apps](https://escape.tech/state-of-security-of-vibe-coded-apps). 对 Lovable、Base44、Create.xyz、Bolt.new 等平台 5,600+ 个公开部署氛围编码应用的扫描。发现 2,000+ 个漏洞、400+ 个泄露的密钥，以及 175 个泄露的个人身份信息实例，包括医疗记录、IBAN 和电话号码。另见：[Methodology detail](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/).

[^19]: Lanyado, B. et al. (2025). [AI-hallucinated code dependencies become new supply chain risk](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/). 对 16 个代码生成 AI 模型的研究：约 20% 的 756,000 个代码样本推荐了不存在的包。43% 的幻觉包在查询中持续重复出现，使其可被利用。开源模型幻觉率 21.7%；商业模型 5.2%。另见：[HackerOne: Slopsquatting](https://www.hackerone.com/blog/ai-slopsquatting-supply-chain-security).

[^20]: Palo Alto Networks Unit 42 (2025). [Securing Vibe Coding Tools: Scaling Productivity Without Scaling Risk](https://unit42.paloaltonetworks.com/securing-vibe-coding-tools/). 对真实世界氛围编码安全事件的调查：数据泄露、身份验证绕过和任意代码执行。指出公民开发者"缺乏如何编写安全代码的培训，可能没有充分理解应用程序生命周期中所需的安全要求"。引入了 SHIELD 治理框架。另见：[Infosecurity Magazine coverage](https://www.infosecurity-magazine.com/news/palo-alto-networks-vibe-coding).
