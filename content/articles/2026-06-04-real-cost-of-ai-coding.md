---
title: AI 编程真正贵的，不是 Token
slug: real-cost-of-ai-coding
date: 2026-06-04
status: ready
summary: AI 编程最早让人上头的地方，是它看起来太便宜了。
cover: ../assets/articles/real-cost-of-ai-coding/cover.png
tags: [ai-coding, coding-agent, software-engineering, token-cost, agent-engineering]
origin:
  private_path: raw/publish/2026-06-04-real-cost-of-ai-coding.md
discussion:
  issue: 10
  url: https://github.com/zhlkkk/mind-os-public/issues/10
formats:
  html: /articles/real-cost-of-ai-coding
  slides:
  video:
---

# AI 编程真正贵的，不是 Token

AI 编程最早让人上头的地方，是它看起来太便宜了。

一个月二三十美元，像买了一个不会累的工程师。让它读代码、改文件、写测试、跑命令、修 bug，前台看到的都还是同一个聊天框。

但这个错觉正在消失。

GitHub Copilot 在 2026 年 6 月 1 日更新计费，用量开始按 GitHub AI Credits 计量。官方文档写明：不同模型、input tokens、output tokens、cached tokens，都会进入账单。

这不是某个产品单纯涨价。

这是 AI 编程开始进入成本可见阶段：过去藏在包月里的推理、上下文和审查成本，现在都被单独拎了出来。

![cover.png](../assets/articles/real-cost-of-ai-coding/cover.png)

*图 1：AI 编程的账单不只是 token。代码生成之后，还有审查、测试、权限、回滚和成本归因。*

## 一、月费时代结束了

一次短问答和一次多文件 Agent 任务，根本不是同一种成本。

问一句“这个错误是什么意思”，像查字典。让 Agent “迁移认证模块，顺手补测试、改文档、修 CI”，就像开了一条小型工程流水线：读仓库、查依赖、规划、改文件、跑测试、根据报错再改。

包月时代，这些消耗不容易被看见。usage-based billing 之后，它们会直接变成账单。

token 变贵只是第一层。更重要的是，粗糙用法开始有价格：上下文塞太多，小问题上大模型，历史对话不清，简单任务也开深度 agent。

## 二、最贵的是“差不多对”

Sonar 2026 State of Code Developer Survey 里有个更近的说法：96% 的开发者并不完全相信 AI 生成代码在功能上正确，但只有 48% 总是在提交前检查。

完全错的代码很好处理。删掉，重来。

差不多对的代码最麻烦。它能编译，能跑过一部分测试，命名也像那么回事。问题可能藏在权限边界、旧业务约定、或者一个被顺手改掉的配置里。它不会立刻报警，只会进入 review，进入测试，进入某个 reviewer 的脑子里。

同一份报告还提到，38% 的开发者认为 review AI 生成代码，比 review 人类同事写的代码更费劲。

2026 年 3 月还有一篇更直接的研究，分析了 30 多万条被验证为 AI 编写的 GitHub commits。研究发现，AI 生成代码会引入长期维护成本：超过 15% 的 AI commits 至少引入一个问题，其中一部分问题会一直留到仓库最新版本。

这不是说 AI 不能用。

它说明一件事：在真实代码库里，生成速度不等于交付速度。

## 三、贵的是让代码留下

成熟团队不会只问“AI 能不能写代码”。

他们会问：需求有没有写清楚？任务有没有隔离？测试怎么验收？review 谁负责？失败怎么回滚？

这些就是 AI 编程的流程税。

你省下了敲代码的时间，但要补上规格、测试、权限和变更记录。

Plan Mode、Ultraplan、Superpowers + Compound Engineering、Claude Code 团队讲的 AI-native engineering org，本质上都在做同一件事：给 AI 编程补刹车。

![engineering-pipeline.png](../assets/articles/real-cost-of-ai-coding/engineering-pipeline.png)

*图 2：AI 生成代码只是入口。真正的工程成本发生在 review、test、permission、rollback 和 cost dashboard 这些环节。*

权限也是硬成本。

AI 编程工具一旦能执行 shell、改文件、连浏览器、读密钥、调 MCP、发 PR，它就不再只是编辑器插件，而是一个拥有行动能力的工程账户。

所以你需要沙箱、最小权限、只读默认、专用服务账号、人工审批、审计日志。要能回答：谁发起了任务，读了哪些文件，执行了什么命令，谁批准上线。

AI 写代码便宜，给它权限很贵。

## 四、真正该建的是成本仪表盘

如果只看 token，团队会得出很偏的结论。

PR 被打回一次，不会显示在 AI Credits 里。Reviewer 多花 40 分钟读一段“差不多对”的代码，也不会显示在模型账单里。

但这些都是成本。

所以 AI 编程需要的不是一个“本月花了多少 token”的小面板，而是一套工程成本仪表盘：

- 单任务 token 成本
- PR 返工率
- review 时间
- 测试失败率
- 回滚率
- 人工审批次数
- 事故归因
- 小模型 / 强模型分流比例

这些指标不是为了限制 AI，而是为了让 AI 能进入更大的工作半径。

AI 编程不会因为变贵而退潮。成本开始可见，说明它正在进入真实生产。

玩具阶段才会假装无限免费。工程阶段一定会出现预算、权限、监控、审查、回滚和责任归属。

所以这篇不是说“别用 AI 编程”。而是别再只把 AI 编程当成一个会写代码的聊天框。

AI 编程真正便宜的，是让代码出现。

真正贵的，是让代码留下。

## 参考资料

- [GitHub Changelog: Updates to GitHub Copilot billing and plans](https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans)
- [GitHub Docs: GitHub Copilot billing](https://docs.github.com/en/billing/concepts/product-billing/github-copilot-billing)
- [GitHub Docs: Models and pricing for GitHub Copilot](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
- [GitHub Docs: Budgets for usage-based billing](https://docs.github.com/en/copilot/concepts/billing/budgets-for-usage-based-billing)
- [OpenAI: Codex is becoming a productivity tool for everyone](https://openai.com/index/codex-for-knowledge-work/)
- [DORA: State of AI-assisted Software Development 2025](https://dora.dev/dora-report-2025/)
- [Sonar: State of Code Developer Survey report, 2026](https://www.sonarsource.com/blog/state-of-code-developer-survey-report-the-current-reality-of-ai-coding)
- [Debt Behind the AI Boom: A Large-Scale Empirical Study of AI-Generated Code in the Wild](https://arxiv.org/abs/2603.28592)
- [Claude: Running an AI-native engineering org](https://claude.com/blog/running-an-ai-native-engineering-org)
- 本地 wiki：`wiki/concepts/tech-radar.md`、`wiki/connections/x-april-2026-signal-map.md`
- 本地素材：`raw/rss/2026-05-24-Folo精选信息简报.md`、`raw/rss/2026-06-02-Folo精选信息简报.md`、`raw/rss/2026-06-03-Folo精选信息简报.md`、`raw/articles/claude-code-ultraplan.md`、`raw/articles/combined-workflow.md`
