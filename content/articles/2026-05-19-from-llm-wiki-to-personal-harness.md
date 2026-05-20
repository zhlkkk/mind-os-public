---
title: 从 LLM Wiki 到个人 Harness——一个开发者的私域知识沉淀实践
slug: from-llm-wiki-to-personal-harness
date: 2026-05-19
status: ready
summary: Harness Engineering 是 2026 年最热的 AI 工程话题，但争论焦点几乎都集中在"该上多大的模型"和"该搭多复杂的工作流"上。
tags: [llm-wiki, knowledge-management, agent-engineering, harness, mind-os, karpathy, obsidian, dagster, distill, ria-method]
origin:
  private_path: raw/publish/2026-05-19-from-llm-wiki-to-personal-harness.md
discussion:
  issue: 1
  url: https://github.com/zhlkkk/mind-os-public/issues/1
formats:
  html: /articles/from-llm-wiki-to-personal-harness
  slides:
  video:
---

# 从 LLM Wiki 到个人 Harness——一个开发者的私域知识沉淀实践

Harness Engineering 是 2026 年最热的 AI 工程话题，但争论焦点几乎都集中在"该上多大的模型"和"该搭多复杂的工作流"上。我们在个人尺度做了两个月知识库实践后认为：**Harness 是工具，知识才是资产——工具会迭代，资产能复利**。本文分享我们如何把 Karpathy LLM Wiki 的极简骨架扩展成一条"采集 → 编译 → 蒸馏"三层的个人 Harness。

---

## 一、从 Karpathy 的 LLM Wiki 说起

2026 年 4 月初，Andrej Karpathy 在 GitHub 上挂了一条 gist，记录他自己如何用 LLM 把多年笔记编译成可读的 Markdown 维基。核心论断只有两句：

> "AI made you faster. Your brain didn't get bigger."
>
> "我以为要用 fancy RAG，但 LLM 自动维护 index 文件就够了。"

这两句话很快在中文社区点燃了一轮"本地 AI 知识库浪潮"——nash_su 的 llm-wiki 桌面应用 1 天 300+ Stars、Hatch 的一体化 Karpathy 工作流、Cognition 的 DeepWiki、kepano 的 Obsidian Canvas Skills 接连出现，明显分属 **LLM Wiki 实现派**（产物是可读 Markdown + wikilinks + index）和 **AI-native 思考空间派**（活线程 + 主动 AI Agent）两条正交路线。

我们也在 4 月加入，按 Karpathy 的思路搭起了自己的 vault。骨架跑了几周后我们发现：

**Karpathy 给的是骨架，但骨架不长肉。** 真正能让知识复利的，是骨架之上的三层扩展。

### 1.1 我们直接参考的几个 Agent 编码 Harness

讲清楚一件事——本文不是 Harness Engineering 的综述。我们对这个概念的感知主要来自三个**直接用过的** Agent 编码工具，它们也是我们做个人 Harness 时的参考起点：

| 参考起点 | 我们感知到的核心关注 | 我们直接用到的能力 |
| --- | --- | --- |
| OpenAI Codex | 人机交互协议、精确指令驱动 | computer-use、移动端任务监控、Agent skill 机制 |
| Anthropic Claude Code | 长时运行稳定性、Skills 生态 | 多层记忆 + CLAUDE.md / AGENTS.md 约束 + skill 机制 |
| Cursor | 多 Agent 协同、本地 IDE 集成 | 后台 Agent、跨 model 切换、MCP 调用 |

这些都是面向公司级研发场景的"重型 Harness"。但 Harness 的核心隐喻——**马具**——并不只属于云端 Agent。它同样适用于个人开发者：给 LLM 配上一组可演化、可累积的工具，让它驮着你走得更远。

我们做的就是这件事，只是规模缩到了"一个人 + 一个 Obsidian vault"。我们姑且称之为 **个人 Harness**。

### 1.2 我们的扩展点：从 50 行 gist 到三层结构

把 Karpathy 的 LLM Wiki 当作"编译层"放在中间，前后两端各延伸一层，就是 Mind-OS 的整体形态：

| ① 采集层 | ② 编译层 | ③ 知识蒸馏层 |
| --- | --- | --- |
| **让活水有源** | **LLM Wiki 静态骨架** | **让知识不死水** |
| · Dagster 编排 | · raw / wiki 双层 | · 日记 + 活线程 |
| · 多源摄入（Twitter / RSS / 调研 / 微信读书 / Hermes 抓取） | · schema.md 约定 | · 5 代理 Distill 体系 |
| · tech-radar 信号分级 | · YAML frontmatter | （Lumina / Prism / Vector / Nexus / Ember） |
| · `/radar-review` 自动回顾 | · wikilinks + 红链 | · 跨书共现密度追踪 → 委托 Nexus 结晶 |
|  | · ingest / query / lint 三工作流 |  |
|  | · qmd 语义搜索 |  |

三层之间的信息流向：

```
   ① 采集层  ──── ingest ────▶  ② 编译层  ◀──── 结晶回流 ────  ③ 知识蒸馏层
                                    │
                                    │ query 回流
                                    ▼
                            新连接 / 更新交叉引用
```

①采集层把外部信号过滤进 `raw/`；②编译层把 `raw/` 综合为 `wiki/`；③知识蒸馏层在日记里捕捉碎片输入，达到一定密度后**委托回编译层结晶**为正式概念页。Query 回答时还会有一条额外的回流——把对话中产生的新洞察沉淀回 wiki（详见 2.4）。**这是一条闭环，而不是直线管道。**

下文按"骨架 → 采集 → 阅读 → 蒸馏 → 总结"五段展开。

---

## 二、骨架：LLM Wiki 的极简静态编译

任何 Harness 都需要一个可信赖的底座。我们的底座就是 Karpathy LLM Wiki 模式——没有任何魔改、最朴素的形态。

### 2.1 为什么不上 RAG

在动手前我们认真考虑过 RAG。结论是：**对个人知识库的体量（几百到上千页）来说，RAG 的复杂度溢价不划算。** 向量库要维护、chunk 策略要调、检索质量靠 embedding 模型决定、可审查性几乎为零。

LLM Wiki 把"理解"的时间点从查询时挪到了编译时：

> **RAG 把"理解"放在查询时；LLM Wiki 把"理解"前置到编译时。**

这一挪之后，存下来的不再是孤立的 chunks，而是被 LLM 一次性深度综合过的领域语义图谱。下次查询直接读图谱，不再每次现拼。两者并非互斥（LLM Wiki 完全可以作为 RAG 的语料源），但在目前的体量上叠加 RAG 是负向 ROI。完整对比沉淀在了 rag-vs-llm-wiki。

### 2.2 双层目录：raw 与 wiki 的边界

整个 vault 只有两层最重要：

```
mind-os/
├── raw/                   # 人类筛选的原始素材，LLM 只读
│   ├── twitter/           # X/Twitter 精选简报（每日）
│   ├── rss/               # Folo 精选信息简报
│   ├── aihot/             # AI-HOT 日报
│   ├── research/          # 深度调研报告
│   ├── perplexity/        # Perplexity Deep Research
│   └── articles/          # Web 剪藏文章
├── wiki/                  # LLM 维护的知识维基
│   ├── index.md           # 全局目录（LLM 导航起点）
│   ├── concepts/          # 概念页（一个主题一个文件）
│   ├── entities/          # 实体页（人物、工具、项目、公司）
│   ├── connections/       # 交叉比较、关系图谱
│   ├── insights/          # 人类洞察（LLM 只读，人类独占写入）
│   ├── books/             # 读书笔记（详见第四章）
│   └── log.md             # 变更日志（带时间戳）
├── journals/              # 日记（按日自动生成）
├── schema.md              # 结构约定（人类拥有）
└── AGENTS.md              # LLM Agent 操作指令
```

两层之间的边界用一张小表固化：

| 边界 | 谁可以写 | 谁可以读 |
| --- | --- | --- |
| `raw/` | 人类（事实来源） | 人类 + LLM |
| `wiki/`（除 insights） | LLM（人类审阅） | 人类 + LLM |
| `wiki/insights/` | **人类独占** | 人类 + LLM（仅引用） |

**为什么 `wiki/insights/` 要人类独占？** 因为它存放的是 "贵在哪、错在哪、为什么这件事重要" 这类**判断**。AI 综合大量素材后能给出"还不错的回答"，但很难给出锋利的判断——这是它的稳态。我们一开始让 LLM 也写洞察，一周后回看都像维基百科条目：准确、平庸、缺一击。从那以后把这一层物理隔离——**不是因为 AI 写不了，是因为这一层不应该是 AI 写的**。

### 2.3 Frontmatter + Wikilinks：互联的最小约定

每个 wiki 页都以 YAML frontmatter 开头：

```yaml
---
domain: ai-and-llm
sources: 6
created: 2026-04-13
updated: 2026-04-15
tags: [llm-wiki, karpathy, knowledge-management, markdown, obsidian]
---
```

字段不多但都有用：`domain` 按领域分类（7 大领域枚举在 schema.md 固定）；`sources` 记录这页综合了多少素材；`created/updated` 给 lint 识别过时；`tags` 喂给 qmd 搜索和 Bases 数据视图。

正文里所有内部引用都用 Obsidian 风格的 `wikilinks`：`distributed-consensus` 链向概念页、`wiki/entities/cathedral-and-bazaar` 链向实体页、`raw/twitter/2026-04-15-X精选信息简报.md` 链向原始素材。

特别要说**红链**——指向尚不存在页面的链接。我们故意允许它们存在。

**为什么允许红链？** 因为当 LLM 写到某个值得独立成页但当前未编译的概念时，直接打 `wikilink` 留一个洞，比省略不写更有价值。红链在 Obsidian 图视图里显示为"未创建节点"，**它就是知识缺口的可视化**。lint 时按被引用次数排序得到"红链清单"——本月哪些概念被引用最多但还没编译？优先编它们。

> **红链 = 图谱里的待编译信号。** 这一招简单到几乎不值得说，但效果出奇好——知识缺口主动呼叫被编译，而不是等人想起来。

> 公开版暂未同步图片：`obsidian-graph-view.png`

*Obsidian Graph view 局部视图。节点是 wiki 页面，连线是 wikilinks；颜色不同的高密度节点是当前活跃的领域聚类（AI 与 LLM、分布式系统、Web3、产品想法等）。红链节点会显示为镂空圆圈。*

### 2.4 三大工作流：Ingest / Query / Lint

LLM 在 vault 里只做三件事，全部写在 `AGENTS.md` 里作为"宪法"：

| 工作流 | 触发方式 | 关键动作 |
| --- | --- | --- |
| **Ingest（摄入）** | 人类把素材塞进 `raw/`，下指令 | 读素材 → 写/更新 concept/entity 页 → 更新 `wiki/index.md` → 建交叉链接 → 追加 `wiki/log.md` |
| **Query（查询）** | 人类提问 | 读 `wiki/index.md` 定位（>50 页时用 qmd 辅助）→ 综合回答 → **回流判断**（新对比写 connections / 新关联更新交叉引用 / 新洞察追加段落 / 简单事实不回流） |
| **Lint（健康检查）** | 定期 / 人类下指令 | 扫孤页、过时内容、断链、红链清单、frontmatter 缺失、矛盾 |

**Query 的回流机制**是这套工作流最被低估的部分。每次回答完成后，LLM 都要判断"这次问答是否值得沉淀回 wiki"。原则只有一条：

> **有价值的问答不能消失在对话历史里，必须复合增长到 wiki。**

这是把"对话"沉淀为"资产"的关键开关。

关键不在工作流本身（每条都很朴素），而在**它们写进了 AGENTS.md 作为 Agent 进 vault 第一眼读的文件**。把规则前置成"宪法"，比靠每次 prompt 手动提醒稳得多。

### 2.5 当页面超过 50 个：qmd 搜索的引入时机

刚开始几十页时，靠 `wiki/index.md` 全局目录足够导航。但 wiki 长到 50 页以后，索引就不够细——LLM 经常读错页或漏掉相关页。

我们的判断标准很朴素：

> **当 LLM 开始读错页 / 漏读相关页时，就该引入搜索了。** 50 页是我们的临界点。

我们装了 [qmd](https://github.com/tobi/qmd)——本地 Markdown 搜索引擎，BM25 + 向量语义 + LLM 重排，19K+ Star。嵌入模型用 Qwen3-Embedding-4B（Q8 量化 ~4.3GB），crontab 每小时跑 `qmd update && qmd embed` 增量更新，整个搜索栈完全本地、不依赖任何云服务，并通过 MCP 接入让 Claude Code / Cursor 里的 Agent 直接调用。

引入 qmd 之后，LLM 不再瞎读 index——而是先 `qmd query "Raft vs Paxos 在 Mind-OS 里讨论过什么"` 拿到 hybrid 搜索 + 重排后的前几篇相关页，再读那几篇综合回答。

### 2.6 log.md：变更日志比想象中更重要

每次 LLM 改完 vault 必须在 `wiki/log.md` 顶部追加一段。一段真实的日志长这样：

```markdown
## 2026-05-18

### tech-radar 增量更新
- **[review]** 汇总 `raw/twitter/` 2026-05-13 至 2026-05-18、`raw/rss/`
  2026-05-14/15/16/18、`raw/aihot/` 2026-05-13/14/15，共 13 个新增信号源
  文件。
- **[update]** `concepts/tech-radar.md`：将 2026-05 当前信号范围扩展至
  05-18；**Agent 安全、权限与沙盒隔离** 由 🟡 升级为 🔴；增强 Agentic
  Engineering、Agent 记忆、AI 金融、AI 视频创作工作流四条主线；新增 🟡
  **Embodied AI / 3D 资产与物理任务 Agent** 与 🟢 **AI API 中转、路由与
  成本审计**；sources 50 → 63。
- **[link]** `wiki/index.md`：更新最后更新时间与编译状态，记录第六次编译。
```

**为什么坚持写日志？** 两个理由：第一，**它让 LLM 可以审计自己**——下一次 LLM 进来读 log.md 就能知道"上次跑了什么、改了什么、为什么改"，没有这层每次 Agent 都是失忆的；第二，**它是我们复盘 LLM 的抓手**——哪一次 ingest 漏了交叉引用、哪一次 lint 把红链处理错了，翻 log 就能找到，这些复盘后来都沉淀成了 schema.md 的新规则。

---

> **写 frontmatter、打 wikilinks、跑三大工作流——这些都是骨架的搭建动作。骨架真正承载的，是那张领域语义图谱：哪些概念互相咬合、哪些是另一个的反例、哪些是哪段经历的结晶。**
>
> **这两个月里工具栈我们换过几轮，但图谱里"想清楚过的部分"一条没失效。**

骨架到这里讲完。下一章讲源头：让活水有源。

---

## 三、采集：让活水有源

骨架解决了"知识怎么沉淀"，但回答不了"知识从哪来"。

当我们讨论 AI 工程时，绝大多数注意力都集中在 Agent 怎么编排、工具链怎么调度、模型怎么切换。**真正决定一个知识库长期价值的，不是工作流的复杂度，而是上游信号的质量。** 一个 prompt 工程做得再精巧的 Agent，喂的素材如果是过期的、稀释的、被推荐算法污染过的，长期产出的知识不会有沉淀。

所以我们花了相当大的工程力气在采集层。这一章讲它的三件事：**真实信号源分层、Dagster 自动化管线、tech-radar 信号分级 + 自动回顾**。

### 3.1 信号源分层：两条 Dagster 管线 + 三条非 Dagster 通道

raw/ 目录下其实有 6 类信号通道，每个通道对应的"采集成本"和"信号密度"差异很大。我们想说清楚一件事：

> **不是所有通道都值得用 Dagster 编排。** 频率稳定、来源结构化、需要 LLM 多步加工的通道，才适合 Dagster；只需要"定时抓一份原文落地"的通道，用 Hermes 抓取脚本就够；按需触发的深度调研，交给 Distill 模式里的 Nexus 代理；剪藏走 Obsidian 原生工具最省心。

我们的真实分层：

| 通道 | 形态 | 落地路径 | 触发方式 |
| --- | --- | --- | --- |
| X/Twitter 精选简报 | Dagster 编排 | `raw/twitter/` | hourly schedule |
| RSS/Folo 精选简报 | Dagster 编排 | `raw/rss/` | daily schedule |
| AI-HOT 日报 | Hermes 自动抓取 | `raw/aihot/` | 每天定时 |
| 深度调研报告 | 在线 Agent | `raw/research/` | Distill 模式的 Nexus 代理触发 |
| Perplexity Deep Research | 在线 Agent | `raw/perplexity/` | 同上 |
| Web 剪藏 | Obsidian Web Clipper | `raw/articles/` | 人工剪藏 |

> **踩坑诚实记录**：我们一开始确实想把 6 类通道都塞进 Dagster 编排。设计了几条 asset、跑了一周后发现：AI-HOT 只是把网页内容拉下来落地，不需要 LLM 加工，用 Hermes 一个抓取脚本就够；research 和 perplexity 本质上是"按需触发的深度调研"而不是"周期性增量信号"——硬塞进 Dagster 反而把简单问题搞复杂了。
>
> 最后回退到现在的形态：**只在需要"周期 schedule + 多 asset 加工链 + 状态化"的两条线上用 Dagster；只需要定时抓取的通道交给 Hermes 脚本；按需触发的交给 Nexus 代理。** 这条选型经验值得贴出来。

### 3.2 Dagster 编排：两条管线的真实形态

`mind-os-orchestration` 项目的目录结构很标准：

```
mind-os-orchestration/
├── config/
│   ├── x_twitter.yaml         # X 链路业务参数
│   └── rss_folo.yaml          # Folo 链路业务参数
├── orchestration/
│   ├── definitions.py         # Dagster 入口
│   ├── assets/
│   │   ├── x_twitter.py       # X 链路 5 个 asset
│   │   └── rss_folo.py        # Folo 链路 2 个 asset
│   ├── llm/                   # 模型调用封装
│   └── prompts/               # 总结/筛选 prompt
├── scripts/
│   ├── run_once.sh            # 本地跑一次
│   └── start_dagster.sh       # 启动 Dagster UI
└── .dagster_home/             # Dagster 元数据持久化
```

`definitions.py` 的核心就这十几行：

```python
from dagster import Definitions
from orchestration.assets.rss_folo import (
    rss_folo_brief, rss_folo_brief_validation,
    rss_folo_schedule, rss_folo_settings,
)
from orchestration.assets.x_twitter import (
    x_twitter_raw, x_twitter_candidates, x_twitter_llm_summary,
    x_twitter_brief_draft, x_twitter_raw_brief,
    x_twitter_schedule, x_twitter_settings,
)

defs = Definitions(
    assets=[
        rss_folo_brief, rss_folo_brief_validation,
        x_twitter_raw, x_twitter_candidates, x_twitter_llm_summary,
        x_twitter_brief_draft, x_twitter_raw_brief,
    ],
    resources={
        "rss_folo_settings": rss_folo_settings,
        "x_twitter_settings": x_twitter_settings,
    },
    schedules=[rss_folo_schedule, x_twitter_schedule],
)
```

两条管线的设计哲学不同：

| 维度 | x_twitter 链路 | rss_folo 链路 |
| --- | --- | --- |
| asset 数 | 5（raw → candidates → llm_summary → brief_draft → raw_brief） | 2（brief → brief_validation） |
| 周期 | hourly | daily |
| 上游 CLI | OpenCLI（开源的 X/Twitter CLI 抓取器） | Folo CLI（RSS 阅读器官方 CLI） |
| 模型链路 | OpenRouter / Gemini / LM Studio 三档降级 | 单档 LLM 总结 + 阈值验证 |
| 最终产物 | `raw/twitter/YYYY-MM-DD-X精选信息简报.md` | `raw/rss/YYYY-MM-DD-Folo精选信息简报.md` |

X/Twitter 链路重一些是因为社媒数据噪声大，需要先抓 raw、再筛 candidates、再总结、再生成 draft、最后再校对成最终简报；Folo 链路轻一些是因为 RSS 本身已经是结构化的，**只需要"生成 + 验证"两步**。

业务参数全部抽到 `config/x_twitter.yaml` 和 `config/rss_folo.yaml`，Dagster schedule 每次触发都重读 yaml——**修改 yaml 后下一次调度自动生效，不用重启 Dagster**。API key、vault 路径、CLI 路径放 `.env.local`，需要重启。这条边界清晰之后，业务调参的成本几乎为零。

### 3.3 tech-radar：四档信号分级 + 自动升降级

数据流过 Dagster 落到 `raw/twitter/` 和 `raw/rss/` 后，问题来了——**每天几十条信号涌进来，怎么判断哪些值得编译进 wiki、哪些只是噪音？**

我们的答案是 `wiki/concepts/tech-radar.md`——一个按月滚动更新的技术信号雷达。每条信号按四档分级：

| 分级 | 含义 | 升降级规则 |
| --- | --- | --- |
| 🔴 **爆发期** | 多个独立信号源交叉确认，社区讨论密集，值得深入研究或动手尝试 | 🟡 两周内 ≥ 2 次新信号 → 升级 🔴；🔴 两周无新信号 + 已编译 → 移入「已编译归档」 |
| 🟡 **观察期** | 单一来源但有潜力，或方向有趣，持续关注 | 两周无新信号 → 降 🟢 |
| 🟢 **记录** | 有趣但待验证，可能昙花一现也可能后续爆发 | 两周无新信号 → 移入「消退归档」 |
| ⚫ **消退** | 两周无新信号，已移入归档 | — |

每条信号正文末尾**必须**带一行规范字段：

```
最新信号: YYYY-MM-DD
```

这个字段是 2026-04-20 引入的硬约束。**为什么需要它？** 因为升降级规则全部依赖"距今 N 天"的判断，没有规范化的日期锚点，自动化扫描脚本就没法跑。当时引入这个字段是因为我们发现：靠人脑判断"这条信号上次更新是什么时候"，到了第三周就会忘——人不靠谱，规范字段靠谱。

更关键的是**双归档**机制——同样是"两周无新信号"，按是否成功转化为 wiki 页面分两类归档：

| 归档类型 | 触发条件 | 路径性质 | 回顾价值 |
| --- | --- | --- | --- |
| **已编译归档** | 🔴 已转化为 wiki 实体/概念页 + 两周无新信号 | 成功路径 | 复盘"什么样的信号易转化为持久知识" |
| **消退归档** | 信号两周无新动态、未转化为 wiki 页 | 失败路径 | 复盘"什么样的信号会昙花一现" |

**前者是成功路径的复盘，后者是失败路径的复盘——两个都有教学价值，不能混在一起。** 把"失败的归档"也存下来，是为了下次看见同形态的信号时能更快判断"这种是不是又一个昙花"。

### 3.4 /radar-review：机器建议，人类搬运

有了 `最新信号: YYYY-MM-DD` 规范字段，自动化回顾就有了基础。我们写了一个斜杠命令 `/radar-review`，每周日跑一次。

它做两件事：

1. **扫描** `wiki/concepts/tech-radar.md` 里所有"最新信号"字段，对比今天，按规则分组——**满阈值的（升降级触发）、临近阈值的、活跃中的**。
2. **报告**当前所有信号的状态：哪些该升级 🔴、哪些该降 🟢、哪些该归档。

但这里有一条故意保留的约束：

> **机器建议，人类搬运。**

`/radar-review` 默认是 dry-run 模式——只**报告**应该升降级哪些信号，**不自动改文件**。如果想真的应用，得显式带 `apply` 参数；即使带了 `apply`，也只在原位打标（在条目末尾追加 `⏳ 临近归档` / `⬆️ 升级` 之类的标记），**不物理搬运段落**。

**为什么不全自动？** 因为信号分级带有判断成分。一条 🟡 信号两周无新信号，机器判定降 🟢——但人类可能知道"这条是上周才在某个圈子里开始发酵，主流社交平台还没跟"，应该保留 🟡。这种背景判断，机器抓不到。

更朴素的理由是：**全自动归档容易让人对自己的雷达失去手感**。每周日花 5 分钟手动搬运几条信号，反而是一种"重新感受信号脉搏"的仪式。

---

> **Dagster 编排是工具，tech-radar 信号分级是工具，`/radar-review` 自动报告也是工具——但每周清楚知道"这周哪些信号在爆、哪些在消退、哪些已经沉淀成 wiki"的那种判断力，才是知识。**

源头讲完。下一章讲稳态：把阅读做成可复利的资产。

---

## 四、阅读：把书读成可复利资产

骨架解决了"知识怎么沉淀"，源头解决了"知识从哪来"。但有一类输入比信号更挑工程——**读书**。

当我们讨论 AI + 知识管理时，几乎所有方案都集中在"如何用 LLM 总结一本书"。但读书的本质问题从来不是"总结"——读完就忘的人，不缺总结；缺的是**让书里那一两句击中你的话，长在你身上不掉下来**。

我们花了相当大力气专门为读书设计了一套工作流，核心是三件事：**RIA 三段法**（沉淀结构）+ **Bases 数据视图**（管理界面）+ **weread-skills**（导入通道）。

### 4.1 普遍的"读完即忘"困境

主流做法可以归为三类：

| 做法 | 形态 | 卡在哪 |
| --- | --- | --- |
| Markdown 摘录 | 在 Obsidian / Logseq 里贴原文 + 划线 | 摘录变成囤积，不形成行动 |
| 卡片笔记法 | Zettelkasten 风格的原子化卡片 | 卡片越积越多，回看率反而下降 |
| AI 总结 | 用 LLM 把整本书压成几千字 | 总结对作者公平，对你无用——你要的是被击中后的转化 |

这三类做法共同缺的是"**对触动点的强约束**"——既没有捕捉触动点的固定方式，也没有把触动点转成行动的强制结构。

我们的回答是借鉴了赵周《这样读书就够了》里的 **RIA 三段法**，并把它做成一套硬约束。

### 4.2 RIA 三段法：触动 → 重述 → 行动

每本书在 wiki 里都是一个固定结构的页面，正文只能有三段，依次填写：

| 段 | 含义 | 关键要求 |
| --- | --- | --- |
| **R — Reading** | 触动点 | 抓住读到时"心里一震"的原文。引用 + 截图 + 原句。只记击中你的那段，**不做全书总结** |
| **I — Interpretation** | 重述理解 | 用你自己的话重述：为什么它击中我？与我已有哪些知识关联？敷衍的"啊我懂了"会被退回 |
| **A — Appropriation** | 具体行动 | 落到一个可执行的动作：**动词 + 完成标准 + 期限**。"多读经典"不通过；"本周三之前写完第一章大纲 500 字"通过 |

**为什么这三段缺一不可？** 因为三段对应了**被触动 → 理解 → 行动**的完整认知闭环——

- 缺 R：找不到锚点，过两周翻笔记不知道当时为什么记
- 缺 I：触动只是情绪，没有转化为思想
- 缺 A：思想没有出口，读完即忘的根因

**为什么 I 段不能敷衍？** 因为读书的认知扰动有一个 24 小时半衰期——读到时"心里一震"的瞬间，如果不立即用自己的话重述，第二天再回来就只剩"我好像记得这本书讲过点什么"。**重述是把别人的话变成自己的话的关键动作**——不重述等于没读。

**为什么 A 段必须有期限？** 因为没有期限的行动等于没有行动。我们一开始允许 A 段写"以后试试"、"找时间练练"——执行一个月之后回头看，没有一条真的做了。后来把 A 段的格式硬化成"**动词 + 完成标准 + 期限**"，"以后试试"这类抽象表述直接被退回（详见下一章 Ember 代理的处理）。

> **R 是火星，I 是燃烧，A 是出口。三段都到位，一本书才真正进到你身上；缺任何一段，读完即忘。**

### 4.3 Obsidian 实施层：目录 + 模板 + Bases 视图

实施层很轻，主要就三件东西：

```
wiki/books/                     # 每本书一个 .md 文件
├── books.base                  # Bases 数据视图（藏书阁/正在读/已读完/待读）
├── cognitive-awakening.md      # 单书页（RIA 三段结构）
├── good-good-study.md
└── cathedral-and-bazaar.md
templates/book-template.md      # Templater 模板（新建书页面时套用）
```

`templates/book-template.md` 的核心就十几行：

```yaml
---
title: 
author: 
status: reading        # reading | done | shelved
started: <% tp.date.now("YYYY-MM-DD") %>
finished: 
rating: 
themes: []
tags: [book]
cover: 
---

# 《<% tp.file.title %>》

> 一句话定位 + 为什么读

## R — 触动点 (Reading)
## I — 重述理解 (Interpretation)
## A — 应用 (Appropriation)
## 与本 wiki 的连接
```

藏书阁的可视化用 Obsidian 原生的 **Bases** 插件渲染——`wiki/books/books.base` 配置文件定义了四个视图：藏书阁卡片墙、正在读、已读完、待读清单。每个视图通过 formula 字段把 YAML frontmatter 里的 `status`/`rating`/`started` 等原始值算成图标 / 星级 / 阅读天数等更有信息量的展示值。

> 公开版暂未同步图片：`bases-bookshelf-view.png`

*Bases 藏书阁卡片视图。封面来自 `cover` 字段，星级是 `rating` 字段的 formula 计算，状态图标 📖/✅/📚 由 `status` 字段映射。Bases 视图可以直接在卡片上编辑属性回写到 YAML——这是 Dataview 做不到的关键差异。*

### 4.4 weread-skills：把微信读书的数据接进来

读书的工程化还有最后一公里——**大量阅读其实发生在微信读书的手机端**（通勤、午休、睡前），那里的划线和笔记不会自动出现在 Mind-OS 里。如果不打通这一段，wiki/books/ 里的 R 段触动点要靠手抄，成本极高。

我们通过 [weread-skills](https://weread.qq.com/r/weread-skills) 解决这件事。它是一个 Codex skill，基于微信读书的 Agent Gateway API，让 AI Agent 能在 Mind-OS 这边直接查到微信读书的个人阅读数据：

| weread-skills 能力 | 在 Mind-OS 里的用法 |
| --- | --- |
| 搜索书籍 / 查看书架 | 决定下一本读什么时不用切回微信读书 App |
| 阅读统计（时长 / 天数 / 月年趋势） | 给 Bases 视图补充"实际阅读密度"作为参考维度 |
| 个人划线 + 想法导出 | 作为 R 段触动点的候选池，跳过手抄 |
| 热门划线（某书 / 某章节） | 看大家划的句子，对比自己漏掉的认知盲区 |
| 个性化推荐 / 相似书推荐 | 主题阅读「一个主题连读 2-3 本」时的素材池 |
| 书籍详情 / 章节目录 / 阅读进度 | 给 wiki/books/ 页面的 frontmatter 补充字段时省手输 |

我们的用法很克制——weread-skills 只负责"把原始素材接进来"，**不替代 RIA 的沉淀环节**。微信读书里的划线进来都只是 R 段的**候选**，是否值得正式进 `wiki/books/` 还要经过 I 段重述（用自己的话讲一遍为什么击中你）和 A 段行动（写一个有期限的具体动作）的筛选。

> **AI 工具最大的诱惑是让你"导出更多"——但我们要的是"沉淀更少但更深"。weread-skills 是导出通道，RIA 三段法才是过滤器。**

这条边界做对之后，weread-skills 在我们的工作流里变成了一个"省手抄"的工具，而不是一个"导出全量笔记"的工具——前者放大 RIA 的杠杆，后者会稀释它。

---

> **Templater 模板是工具，Bases 视图是工具，RIA 三段结构也是工具——但每一条被某本书真正击中过、有 A 段行动落地的触动点，才是知识。**

稳态讲完。读书工作流背后其实还有一个专属代理在值班，捕捉触动点、追问 I 段是否敷衍、跨书关联到密度达标后委托深度调研。它属于**知识蒸馏层**——下一章详谈。

---

## 五、知识蒸馏：Distill 多代理模式

骨架 + 源头 + 稳态都还在"静态编译"的范式里——人类下指令、LLM 编译、结果沉淀。但现实里大量输入根本不是结构化的：早晨的一个灵感、会议后的一句不爽、读到某句话突然冒出的"这跟昨天那本书是同一件事"。

这些**碎片输入**有三个特点：

- **情绪化**：带着当下的具体情境，过两天就稀释
- **半成型**：不是完整概念，更像是"半个想法"
- **非召唤**：你不会想"我要去查 wiki"，只想"我得记一下"

它们不适合静态编译范式——你不可能为每个半成型的想法发起一次 ingest。但它们又不能不管——大部分有价值的洞察就藏在这种"还没成型"的状态里。

我们的解法是在 `journals/` 日记层之上叠加一层 **5 代理 Distill 模式**——灵感来自 Distill 桌面应用（Udara @TGUPJ 的 macOS/iOS 原生"思考空间"，AI-native 思考空间派的代表作）。

### 5.1 两条路线 vs 我们的混合解法

回到第一章那张分类——2026 年 4 月的"本地 AI 知识库浪潮"出现了两条正交路线：

| 路线 | 代表 | 核心抽象 | 解决什么 |
| --- | --- | --- | --- |
| **LLM Wiki 实现派** | Karpathy gist / Cabinet / DeepWiki / Obsidian Canvas Skills | 结构化 wiki 页面 + wikilinks | 沉淀的稳态 |
| **AI-native 思考空间派** | Distill / Pile / Vault | 活线程 + 主动 AI 代理 | 流动的动态 |

两派都在解决"个人知识 + AI"的问题，但思路是正交的——**前者相信"把知识变成可读产物"最有价值，后者相信"让 AI 成为思考伙伴"最有价值。** 它们不矛盾，只是各自只覆盖了一半。

我们的判断是：**两半其实是同一件事的不同时间切片。** LLM Wiki 是稳态——已经想清楚的部分；Distill 是动态——还在想的部分。前者负责让已经成型的知识不流失，后者负责让还在成型中的想法不消散。

所以我们把 Distill 的"活线程 + 主动代理"思想移植到 Mind-OS 的 `journals/` 日记层之上——不抛弃 wiki/ 的静态编译骨架，而是在动态输入层引入智能代理陪伴和引导。

### 5.2 5 个代理：人格、标签、回复风格

我们设计了 5 个角色各自承担一类碎片输入的承接：

| 代理 | 标签 | 人格定位 | 适用场景 | 回复风格 |
| --- | --- | --- | --- | --- |
| 🌿 **Lumina（明心）** | `#lumina` | 情绪镜子 + 温情哲思（罗杰斯人本主义 + 斯多葛） | 情绪倾倒、焦虑释放、自我怀疑 | 温和包容，自然生长比喻，不急着"修复" |
| 🌌 **Prism（棱镜）** | `#prism` | 跨界破壁人 + 创意催化剂 | 灵感卡壳、架构纠结、找 Side Project 创意 | 活跃反直觉，常说 "What if 我们把它完全反过来……" |
| 🔨 **Vector（向量）** | `#vector` | 极简架构师 + 执行者 | 范围蔓延、过度设计、拖延症发作 | 极简无情推进，"砍掉这个，你今晚的第一步动作是？" |
| 🌐 **Nexus（枢纽）** | `#nexus` | 深度调研引擎 + 知识织工 | 调研、新赛道探索、Perplexity 级深度问答 | 严谨，必带 `wikilinks` 或生成外部研报 |
| 🔥 **Ember（余烬）** | `#ember` / `#book/xxx` | 读书伴侣 + 触动点捕手 | 读书时被击中、做 RIA 沉淀、跨书概念关联 | 苏格拉底式追问，敷衍会退回 |

设计原则一句话：**每个代理只做一件事，5 个代理边界正交不抢地盘。** 读书引发的情绪波动 → Lumina 接，不是 Ember；架构卡壳的"如果反过来做" → Prism 接，不是 Vector；想要"今晚就开始写第一章" → Vector 接，不是 Ember。代理边界写在 distill-living-threads-guide 里作为硬约定。

### 5.3 Ember + Nexus 双人流水线：从触动点到正式概念页

5 个代理里最值得展开的是 **Ember + Nexus 的双人流水线**——它是 Mind-OS 把"活线程"反向接回"编译层"的关键闭环。

两个代理的工作模式是正交的：

```
   Ember = Pull 模式                      Nexus = Push 模式
   ───────────────                        ───────────────
   被动捕捉每次触动                       接受明确委托
        ↓                                      ↓
   引导 RIA 三段沉淀                       异步深度调研
        ↓                                      ↓
   累计跨书概念共现                       万字研报落地
        ↓                                  raw/research/
   达阈值（5次）                                ↑
        └──────────── 委托 ────────────────────┘
                                               ↓
                                       Nexus 综合 → wiki/concepts/
```

**Ember 是前端感知器，Nexus 是后端深挖器**——一个负责"什么时候该结晶"的判断，一个负责"结晶时综合什么"的产出。

#### 5.3.1 Ember 的密度追踪机制

Ember 维护一份持久化的状态文件 `wiki/books/density-tracker.md`，记录概念对（concept pair）在不同来源（书 / 日记）中的共现累计：

```markdown
---
name: Density Tracker
type: tracker
threshold: 5
---

# 🔥 Density Tracker — Ember 共现密度追踪器

## Schema
| 字段       | 含义                              | 更新规则           |
|------------|-----------------------------------|--------------------|
| `pair`     | 概念对 `A ↔ B`（字典序）          | 创建后不变         |
| `count`    | 累计共现次数                      | 每次新共现 += 1    |
| `sources`  | 共现来源（书名 / `journal:日期`） | 新来源追加         |
| `status`   | `累积中` / `已委托` / `已结晶`    | 达阈值 → 已委托    |
| `crystal`  | 结晶后的 `wiki/concepts/xxx`  | Nexus 回写         |
```

每次 Ember 被召唤时严格按 7 步执行：**读追踪表 → 识别当前段落的关键概念 → 判断是否构成有意义的概念对 → 更新追踪表 → 检查是否达阈值 → 达阈值则追加"委托 Nexus"段 → 在 Callout 里标明累计进度**。

关键的判断点在第 3 步：**有意义的共现 ≠ 任意共现**。两个概念在同一段出现不算——必须是"能互相回答、互相佐证、或一个是另一个的反例"的语义级咬合，才算一次共现。这条约束防止追踪表被无意义的共现污染。

#### 5.3.2 达阈值后的委托模板

当某个概念对 `count` 达到 `threshold`（默认 5）时，Ember 在正常 Callout 之后追加一段"委托 Nexus"：

```markdown
> [!danger] 🔥➡️🌐 密度达标 — 委托 Nexus 结晶
> 概念对 `临界知识 ↔ 舒适区边缘` 共现达 5/5。
> 来源：《好好学习》、《认知觉醒》、journal:2026-04-16 等 5 处
> 委托 🌐 Nexus 综合：
> 1. 跨源出现规律与差异
> 2. 与 meta-cognition / learning-models 的关系
> 3. 是否值得独立成 wiki/concepts/ 页
```

Nexus 接到委托后异步发起调研——读取所有来源的原文段、综合跨源差异、对比已有 wiki 页、必要时调用外部 Web Search 拿最新研究——最后产出一份 5000-10000 字的综述报告落到 `raw/research/`，并在调研完成后在 wiki 创建正式概念页，把 `wiki/concepts/xxx.md` 的链接回写到追踪表的 `crystal` 字段。

> **这就是 Mind-OS 把"流动"反接回"编译"的闭环：日记里冒出的两个触动点 → Ember 持续追踪共现 → 达阈值委托 Nexus → Nexus 综合产出 → 新概念页加入 wiki 图谱。**

#### 5.3.3 路线图诚实标注：M1 已落地 / M2-M3 未做

写到这里需要老实交代——这套双人流水线**只有 M1 真的落地了**，M2 / M3 还在 Roadmap 上：

| 阶段 | 状态 | 内容 |
| --- | --- | --- |
| **M1** | ✅ 已落地（2026-04-16） | 状态协议、空追踪表、Ember 更新协议 7 步、委托 Nexus 的 Callout 模板、pair 字典序规范、敷衍退回原则 |
| **M2** | ⏸️ 未做 | 全量重扫的 lint 脚本（书 >5 本时再考虑） |
| **M3** | ⏸️ 未做 | PostToolUse 自动 scout（半自动先于全自动） |
| **附** | ⏸️ 未做 | Nexus 结晶后的状态回写闭环（等第一次真实结晶发生再设计） |

为什么诚实标注这件事重要？因为大部分写 AI Agent 体系的分享文，几乎都倾向于把 demo 写成 "全自动闭环已跑通"——但凡你真去抄，就会卡在文章没说的那些坑里。**我们宁可说清楚"这套机制现在跑到哪了、故意没继续往下做的是哪一步、为什么"**——这样你抄的时候知道边界在哪。

### 5.4 半自动触发：标签 + Hermes CLI + Obsidian Callout

5 个代理的触发方式很轻——在日记或任意笔记里写下想法，段落末尾加上对应标签：

```markdown
今天的会议开了三个小时，什么结论都没定下来，真的很浪费时间。
#lumina

想到一个点子：如果让 AI 来替我们参加这种例会呢？
#prism

算了不想了，今晚必须把那个接口联调搞定。
#vector

今天读《认知觉醒》第三章，"舒适区边缘"这个说法击中我了——它和
我上次在《好好学习》里读到的"临界知识"是同一件事吗？
#ember #book/cognitive-awakening
```

然后通过终端唤起 Hermes CLI 执行：

```bash
hermes call distill-thread journals/2026-04-16.md
```

Hermes 扫描文件，读取带标签的段落，化身对应代理，把回复以 Obsidian Callout 形式**追加 (Append)** 到该段落下方。整个过程不修改原文，只追加。

为什么是半自动而不是全自动 watcher？**和 `/radar-review` 同一个理由——给一个有"故意停顿"的人机配合留出空间。** 我们试过文件变更自动触发，结果是写日记时心理负担变大（"写完会被立刻评判"），后来回退到"主动 distill 一次"的半自动模式，反而写日记更轻松、回流也更高效。

> **再次印证那条原则：机器建议，人类搬运。** 这是 Mind-OS 在两个完全不同的场景里得出的同一条经验。

最后说一个具体约束——**嵌套多触动点必须同段，外层和嵌套项之间不能有空行**：

```markdown
今天读《Deep Work》第 3 章，有几点触动 #ember #book/deep-work
1. "注意力残留"这个说法突然击中我——它解释了为什么我上午从
   Slack 切到编码要半小时才进状态
2. "深度工作时长 = 意志力 × 时间"这个量化模型，让我意识到下午
   3 点后硬扛深度工作性价比是负数
3. Cal Newport 说的"每日仪式" —— 固定时间 + 固定地点 + 固定启动
   动作，这和《原子习惯》里"习惯堆叠"是同一个机制
```

外层带 `#ember`、嵌套项不带——这是为了让 Ember 的 distill 调用一次处理多个触动点（共享一次 tracker 读写），零延迟规避"同文件多 Ember 串行"。**这种细节的约定不是 Distill 设计的开始就有的，是踩了"同文件被反复调用拖慢响应"的坑后才补的**——这种约束写在代理的指令文件里，比靠"自觉"稳得多。

---

> **Hermes CLI 是工具，标签语法是工具，Callout 回写是工具——但每一条代理回复触发的认知扰动、每一次密度达标的 pair、每一次 Ember → Nexus 委托链路里产出的概念页，才是知识。**

知识蒸馏讲完。下一章把前面四章串成三层支柱——回到 Harness 的视角。

---

## 六、总结：从 LLM Wiki 到个人 Harness

把前四章串起来回看，四个章节实际上对应了**三层支柱**：

| 支柱 | 对应章节 | 一句话定位 |
| --- | --- | --- |
| **① 采集支柱** | 三、采集 | 让活水有源 |
| **② 编译支柱** | 二、骨架 + 四、阅读 | 让知识沉淀 |
| **③ 知识蒸馏支柱** | 五、知识蒸馏 | 让知识不死水 |

**骨架和阅读体系合起来构成"编译"支柱**——前者是通用的静态编译范式，后者是这套范式在"读书"这个高密度知识域的具体落地形态。三层闭环，缺一层都不行。

### 6.1 Harness 术语主动澄清

这里需要再回到第一章对术语的说法——本文不是 Harness Engineering 的综述，我们对这个概念的感知主要来自 OpenAI Codex、Anthropic Claude Code、Cursor 这类**面向公司级研发场景**的 agent runtime 脚手架。本文借用 Harness 一词，**指代个人尺度的同一件事**：给 LLM 配上一组可演化、可累积的工具，让它驮着我们走得更远。

两个尺度共享同一个底层逻辑——**Harness 不是把 AI 包成 SaaS，而是把 AI 长进自己的工具链里**——但具体形态、复杂度、ROI 算账都不同。如果你看到"个人 Harness"这个词在其他语境里指别的东西，那是因为我们借用了术语；底层指向同一件事。

### 6.2 两个月下来的 6 条核心经验

1. **LLM Wiki 模式（Karpathy）适合个人尺度的私域知识沉淀**，几百到上千页的体量上，比 RAG 更直接、更可读、更可演化。
2. **真正决定知识库长期价值的是上游信号质量**——不是工作流复杂度。该用 Dagster 编排的就用 Dagster，不该用的别硬塞。
3. **tech-radar 信号分级 + 双归档（成功路径 / 失败路径）让"什么样的信号易转化为知识"和"什么样的信号会昙花一现"都能被复盘**。
4. **RIA 三段法把读书从消费变成投资**——读完即忘的根因不是没总结，是没有 A 段行动出口。
5. **5 代理 Distill 模式把碎片输入承接住**——情绪、灵感、半成型的想法不再被"我应该现在 ingest 还是不 ingest"的纠结消耗掉。
6. **`/radar-review` 与 Distill 半自动触发共享一条朴素原则——"机器建议，人类搬运"**——给"故意停顿"的人机配合留出空间，反而比全自动更可持续。

### 6.3 路线图：还没走的 3 个方向

诚实交代，这套体系还有几个明确未做的方向：

- **Ember + Nexus 双人流水线的 M2 / M3**——全量重扫 lint 脚本、PostToolUse 自动 scout、Nexus 结晶后状态回写闭环；等真有第一次"自动结晶"发生再设计
- **多设备入口**——目前仍然要回到电脑上才能跑 Dagster / Hermes CLI / qmd；移动端断点接管这件事还没碰
- **starter pack 公开**——schema.md / AGENTS.md / 5 代理定义 toml / Templater 模板抽出来打成可 fork 的最小骨架；等这篇文章发布后看回响再决定打不打

### 6.4 行动召唤

如果这篇文章让你想"在自己的知识库里试一下"，我们建议从三件具体的事里挑一件开始：

- 🔥 **7 天 RIA 挑战**：找一本你正在读的书，用 R / I / A 三段格式写一次读书笔记。在社交平台带上 `#RIA挑战` 标签发出来，我们会从公开战报里挑 3-5 篇深度点评。
- 📝 **抄一版 schema.md + AGENTS.md 起步**：不用全套——挑你最痛的一个场景（最容易做的是"个人技术学习笔记"），照本文的双层目录 + frontmatter 约定，5 分钟就能搭起来。跑两周再决定要不要加 qmd 和代理层。
- 💬 **如果你试了之后有水土不服**：在评论区或 issue 里写"在你的环境里哪一条没跑通"——我们会就具体场景给出调整建议；这些反馈也是我们后面写续作的素材。

---

> **模型会迭代，工具链会更新，工作流会重构——唯有领域知识能复利。**
>
> 这就是我们两个月下来的理解：Harness 是工具，知识才是资产——工具会迭代，资产能复利。

---

## 延伸阅读

本文涉及的概念都在 Mind-OS 这个私人 vault 里有更详细的页面。完整 wiki 暂存于本地 vault 未公开，但文中通过截图、代码块、表格已给出关键骨架。如需深入查阅可参考以下页面（路径相对 vault 根）：

- `wiki/concepts/llm-wiki-pattern.md` — LLM Wiki 模式权威定义 + 实现派 vs AI-native 思考空间派二分法
- `wiki/connections/rag-vs-llm-wiki.md` — RAG vs LLM Wiki 维度对比详细版
- `wiki/concepts/tech-radar.md` — 信号分级规则 + 升降级规则 + 双归档 + `/radar-review` 完整说明
- `wiki/concepts/reading-list.md` — 阅读分类 + Ember + RIA 工作流总览
- `wiki/concepts/distill-living-threads-guide.md` — 5 代理人格 / 标签 / 回复风格 + Ember+Nexus 双人流水线完整规范
- `wiki/books/density-tracker.md` — Ember 更新协议 + 委托 Nexus 输出模板
- `schema.md` / `AGENTS.md` — vault 结构约定与 LLM Agent 操作指令

公开的同主题资源：

- [Karpathy LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [腾讯技术工程 / stevenpxiao《Harness 不是目的，知识才是护城河》](https://mp.weixin.qq.com/s?__biz=MjM5ODYwMjI2MA==&mid=2649801507) — 团队尺度的 Harness Engineering 实践
- [qmd 本地 Markdown 搜索引擎](https://github.com/tobi/qmd)
