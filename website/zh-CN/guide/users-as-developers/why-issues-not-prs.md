# 为什么我们接受 Issue 而非 Pull Request

VMark 不接受 Pull Request。我们欢迎 Issue——越详细越好。本页解释原因。

## 简版说明

VMark 是氛围编码的产物。整个代码库由 AI 在一位维护者的监督下编写。当有人提交 Pull Request 时，有一个根本性的问题：**一个人无法有意义地审查另一个人的 AI 生成代码**。审查者无法理解贡献者的代码，因为两人都没有以传统意义编写它——是他们的 AI 写的。

Issue 没有这个问题。一个写得好的 Issue 描述了*应该发生什么*。维护者的 AI 随后基于对项目约定、测试套件和架构的完整了解来修复代码库。结果是一致的、经过测试的、可维护的。

## "氛围编码"实际意味着什么

"氛围编码"一词由 Andrej Karpathy 于 2025 年初创造，用于描述一种编程风格：你用自然语言描述你想要什么，让 AI 编写代码。你引导方向，但不是在写——甚至通常不在读——每一行。[^1]

VMark 比大多数项目走得更远。仓库包含：

- **`AGENTS.md`** — 每个 AI 工具启动时读取的项目规则
- **`.claude/rules/`** — 15+ 个规则文件，涵盖 TDD、设计 token、组件模式、无障碍性等
- **斜杠命令** — 用于审计、修复和验证代码的预构建工作流
- **跨模型验证** — Claude 编写，Codex 审计（参见[跨模型验证](/zh-CN/guide/users-as-developers/cross-model-verification)）

AI 不只是生成随机代码。它在密集的约束网络中运作——约定、测试和自动化检查——保持代码库的一致性。但这只有在**一个 AI 会话拥有所有这些约束的完整上下文**时才有效。

## 理解鸿沟

AI 生成的 Pull Request 有一个核心问题：没有人完全读它。

ACM 软件工程基础会议的研究发现，开发者——尤其是那些没有亲自编写代码的人——很难理解 LLM 生成的代码。这项题为《"如果是我写的，我会写得不一样"：初学者难以理解 LLM 生成的代码》的研究记录了即使是技术能力强的开发者，在 AI 编写代码时也难以理解他们没有参与编写的代码。[^2]

这不只是初学者的问题。CodeRabbit 2025 年对 500,000 多个 Pull Request 的分析发现，AI 生成的 PR 比人类编写的 PR 包含 **1.7 倍的问题**——包括多 75% 的逻辑和正确性错误。最大的担忧？这些恰恰是在审查中看起来合理、除非逐步走查代码否则难以发现的错误。[^3]

当双方都使用 AI 时，情况更糟：

| 场景 | 审查者理解代码吗？ |
|----------|---------------------------|
| 人类写，人类审查 | 是——审查者能推理出意图 |
| AI 写，原作者审查 | 部分——作者引导了 AI，有上下文 |
| AI 写，不同的人审查 | 差——审查者既没有作者上下文，也没有 AI 会话上下文 |
| AI 为 A 写，AI 为 B 审查 | 两个人类都不能深入理解代码 |

VMark 处于最后一行。当贡献者用他们的 AI 创建 PR，维护者的 AI 审查它时，循环中的两个人类对代码的理解是所有场景中最少的。这不是产出高质量软件的配方。

## 为什么 AI 生成的 PR 与人类 PR 不同

传统代码审查之所以有效，是因为有一个共同的基础：作者和审查者都理解编程语言、模式和惯用法。审查者可以在脑中模拟代码的执行，发现不一致。

有了 AI 生成的代码，这个共同基础被侵蚀了。研究显示了几种具体的失效模式：

**约定漂移。** AI 有"一种压倒性的倾向，不去理解仓库内现有的约定"，生成自己对如何解决问题的稍微不同的版本。[^4] 每个贡献者的 AI 会话产生孤立地有效但与项目模式冲突的代码。在 VMark 中，我们强制执行特定的 Zustand store 模式、CSS token 使用和插件结构，约定漂移将是毁灭性的。

**上下文隔离。** 氛围编码的功能通常"孤立地生成，AI 为每个提示词创建合理的实现，但对来自之前会话的架构决策没有记忆"。[^5] 贡献者的 AI 不了解 VMark 的 15 个规则文件、跨模型审计流水线，或特定的 ProseMirror 插件约定——除非贡献者煞费苦心地配置了所有这些。

**审查瓶颈。** 使用 AI 的开发者完成 21% 更多任务并合并 98% 更多 Pull Request，但 PR 审查时间增加了 91%。[^6] AI 代码生成的速度制造了一股淹没人类审查能力的代码洪流。对于一个独立维护者，这是难以为继的。

## SQLite 先例

VMark 不是第一个限制贡献的项目。SQLite——世界上部署最广泛的软件库之一——在其整个历史中一直是"开源但不开放贡献"。该项目不接受来自互联网上随机人员的补丁。贡献者可以建议变更并包含概念验证代码，但核心开发者通常会从头重写补丁。[^7]

SQLite 的理由不同（他们需要维护公共领域状态），但结果是一样的：**质量通过让一个拥有完整上下文的单一团队编写所有代码来维护**。外部贡献通过 bug 报告和功能建议而非直接代码变更来引导。

其他著名项目采取了类似立场。仁慈独裁者（BDFL）模式——历史上由 Python（Guido van Rossum）、Linux（Linus Torvalds）和许多其他人使用——将最终权威集中在一个人身上，确保架构一致性。[^8] VMark 只是让这一点明确：这个"独裁者"是由维护者监督的 AI。

## 为什么 Issue 效果更好

Issue 是一个**规格说明**，而不是实现。它描述了什么是错的或需要什么，而不提交到特定的解决方案。这是贡献者与 AI 维护代码库之间更好的接口：

| 贡献类型 | 它提供什么 | 风险 |
|-------------------|------------------|------|
| Pull Request | 你必须理解、审查、测试和维护的代码 | 约定漂移、上下文丢失、审查负担 |
| Issue | 对预期行为的描述 | 无——维护者决定是否以及如何行动 |

### 什么让 Issue 出色

最好的 Issue 读起来像需求文档：

1. **当前行为** — 现在发生了什么（对于 bug，附带复现步骤）
2. **预期行为** — 应该发生什么
3. **上下文** — 为什么这很重要，你在尝试做什么
4. **环境** — 操作系统、VMark 版本、相关设置
5. **截图或录屏** — 涉及视觉行为时

欢迎使用 AI 来编写 Issue。事实上，我们鼓励这样做。AI 助手可以帮助你在几分钟内构建一个详细、组织良好的 Issue。讽刺意味是故意的：**AI 非常擅长清晰地描述问题，AI 也非常擅长修复清晰描述的问题。** 瓶颈是模糊的中间地带——理解别人的 AI 生成解决方案——Issue 巧妙地绕开了这一点。

### 提交 Issue 之后会发生什么

1. 维护者阅读并分流 Issue
2. AI 以 Issue 为上下文，加上对代码库的完整了解
3. AI 按照 TDD（先写测试，再写实现）编写修复
4. 第二个 AI 模型（Codex）独立审计修复
5. 运行自动化门控（`pnpm check:all`——lint、测试、覆盖率、构建）
6. 维护者在上下文中审查变更并合并

这个流水线产出的代码：
- **符合约定** — AI 在每次会话时读取规则文件
- **经过测试** — TDD 是强制要求；覆盖率阈值被强制执行
- **经过交叉验证** — 第二个模型审计逻辑错误、安全性和死代码
- **架构一致** — 一个有完整上下文的 AI 会话，而非来自许多碎片

## 更大的图景

AI 时代正在迫使我们重新思考开源贡献的运作方式。传统模式——fork、分支、编码、PR、审查、合并——假设人类编写代码，其他人类可以阅读它。当 AI 生成代码时，这两个假设都被削弱了。

2025 年对专业开发者的调查发现，他们"不进行氛围编码；相反，他们通过规划和监督来仔细控制 Agent"。[^9] 重点在于**控制和上下文**——这正是当 PR 来自外部贡献者不相关的 AI 会话时所失去的东西。

我们相信 AI 时代的开源看起来是不同的：

- **Issue 成为主要贡献** — 描述问题是一项普遍技能
- **维护者控制 AI** — 一个拥有完整上下文的团队产出一致的代码
- **跨模型验证取代人类审查** — 对抗性 AI 审计捕捉人类遗漏的东西
- **测试取代信任** — 自动化门控，而非审查者判断，决定代码是否正确

VMark 正在公开地实验这个模式。这可能不是每个项目的正确方法。但对于由一个人使用 AI 工具维护的氛围编码代码库，这是产出最佳软件的方法。

## 如何贡献

**提交一个 Issue。** 就这些。你提供的细节越多，修复就越好。

- **[Bug 报告](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[功能请求](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

你的 Issue 成为 AI 的规格说明。清晰的 Issue 带来正确的修复。模糊的 Issue 带来来回往复。投入到描述中——它直接决定结果的质量。

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). 最初在一篇社交媒体帖子中描述，该术语迅速进入主流开发者词汇。Wikipedia 指出，氛围编码"依赖 AI 工具从自然语言提示词生成代码，减少或消除开发者手动编写代码的需要"。

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*，第 33 届 ACM 软件工程基础国际会议。研究发现，没有参与 AI 提示词编写的开发者在理解和推理生成的代码时有显著困难。

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). 对 500,000+ 个 Pull Request 的分析发现，AI 生成的 PR 每个包含 10.83 个问题，而人类 PR 为 6.45 个（多 1.7 倍），逻辑和正确性错误多 75%，严重问题多 1.4 倍。

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). 分析了 AI 生成代码与现有代码库的交互方式，指出 AI 倾向于创建偏离既定项目约定的不一致模式。

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). 记录了孤立 AI 会话中生成的氛围编码功能组合在一起时如何产生架构冲突，因为每个会话都不了解其他会话中做出的决策。

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). 报告称，虽然 AI 辅助开发者完成 21% 更多任务并合并 98% 更多 PR，但 PR 审查时间增加了 91%——揭示 AI 将瓶颈从编写转移到了审查。

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). SQLite 自成立以来一直是"开源但不开放贡献"。该项目不接受外部贡献者的补丁，以维护公共领域状态和代码质量。贡献者可以建议变更，但核心团队会从头重写实现。

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). BDFL 治理模式，由 Python、Linux 和许多其他项目使用，将架构权威集中在一人身上以维护一致性。著名的 BDFL 包括 Guido van Rossum（Python）、Linus Torvalds（Linux）和 Larry Wall（Perl）。

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). 对专业开发者的调查发现，他们通过规划和监督对 AI Agent 保持严格控制，而非采用不干涉的"氛围编码"方式。
