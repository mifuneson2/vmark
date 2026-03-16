# 订阅制与按量计费的对比

AI 编程工具提供两种认证方式：**订阅计划**和 **API 密钥**。对于持续的编程会话（氛围编码），订阅通常便宜得多——相同工作量往往只需按量计费的 1/10 到 1/30。[^1]

## 成本差异

一个典型的活跃编程会话每小时消耗数十万个 token。以下是成本对比：

### Claude Code

| 方式 | 费用 | 你得到的 |
|--------|------|-------------|
| **Claude Max**（订阅） | $100–200/月 | 编程会话中不限量使用 |
| **API 密钥**（`ANTHROPIC_API_KEY`） | $600–2,000+/月 | 按 token 计费；重度使用很快累积 |

**认证命令：**
```bash
claude          # 使用 Claude Max 订阅自动登录（推荐）
```

### Codex CLI（OpenAI）

| 方式 | 费用 | 你得到的 |
|--------|------|-------------|
| **ChatGPT Plus**（订阅） | $20/月 | 适度使用 |
| **ChatGPT Pro**（订阅） | $200/月 | 重度使用 |
| **API 密钥**（`OPENAI_API_KEY`） | $200–1,000+/月 | 按 token 计费 |

**认证命令：**
```bash
codex login     # 使用 ChatGPT 订阅登录（推荐）
```

### Gemini CLI（Google）

| 方式 | 费用 | 你得到的 |
|--------|------|-------------|
| **免费套餐** | $0 | 慷慨的免费额度 |
| **Google One AI Premium** | ~$20/月 | 更高限额 |
| **API 密钥**（`GEMINI_API_KEY`） | 按量计费 | 按 token 付费 |

**认证命令：**
```bash
gemini          # 使用 Google 账号登录（推荐）
```

## 经验法则

> **订阅制 = 持续编程会话中便宜 10–30 倍。**

算法很简单：订阅给你一个固定的月费，而 API 计费按 token 收费。AI 编程工具极度消耗 token——它们读取完整文件、生成长段代码块，并经历多轮编辑迭代。一个复杂的功能可能消耗数百万个 token。[^2]

## API 密钥仍然适用的场景

API 密钥是以下场景的正确选择：

| 使用场景 | 原因 |
|----------|-----|
| **CI/CD 流水线** | 运行短暂且不频繁的自动化任务 |
| **轻量或偶尔使用** | 每周只有几次查询 |
| **程序化访问** | 直接调用 API 的脚本和集成 |
| **团队/组织计费** | 通过 API 使用控制台集中计费 |

对于交互式编程会话——你与 AI 来回交流数小时的场景——订阅在成本上每次都会胜出。[^3]

## 在 VMark 中的设置

VMark 的 `AGENTS.md` 将订阅优先认证作为项目约定强制执行。当你克隆仓库并打开 AI 编程工具时，它会提醒你使用订阅认证：

```
Prefer subscription auth over API keys for all AI coding tools.
```

所有三个工具认证后都能开箱即用：

```bash
# 推荐：订阅认证
claude              # Claude Code 配合 Claude Max
codex login         # Codex CLI 配合 ChatGPT Plus/Pro
gemini              # Gemini CLI 配合 Google 账号

# 备选：API 密钥
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip macOS GUI 应用的 PATH 问题
macOS GUI 应用（如从 Spotlight 启动的终端）的 PATH 很简短。如果某工具在你的终端中能用，但 Claude Code 找不到它，请确保该工具的二进制文件位置已添加到你的 shell 配置文件（`~/.zshrc` 或 `~/.bashrc`）中。
:::

[^1]: 一个典型的密集型 AI 编程会话每次交互消耗 50,000–100,000+ 个 token。以当前 API 费率（例如 Claude Sonnet 每百万输入/输出 token $3/$15），重度用户报告每月 API 成本 $200–$2,000+——而订阅计划每月封顶 $100–$200，不限量使用。差距随使用强度增加：轻量用户两种方式成本可能相近，但持续的氛围编码会话使订阅成为明显的赢家。参见：[AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: AI 编程 Agent 消耗的 token 远多于简单聊天交互，因为它们将完整文件读入上下文、生成多文件编辑、运行迭代修复-测试循环，并在长会话中维护对话历史。单个复杂功能实现可能涉及数十次工具调用，每次消耗数千个 token。上下文窗口本身成为成本驱动因素——更大的窗口能获得更好的结果，但会成倍增加 token 使用量。参见：[The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: 更广泛的 SaaS 行业一直在向将固定订阅与按量计费相结合的混合定价模式转变。截至 2023 年，46% 的 SaaS 企业采用了按量计费，使用它的公司报告净美元留存率达到 137%。然而，对于每次查询都消耗明显算力的 AI 驱动工具，纯按量计费会使用户面临不可预测的成本——这就是为什么固定费率订阅对重度个人用户仍然有吸引力。参见：[The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025); [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
