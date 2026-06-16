---
title: Agent 改完代码，Git 谁来收拾？
slug: gitbutler-agent-safe-git
date: 2026-06-16
status: ready
summary: 让 Cursor 改完认证模块，diff 里混着三个文件的 bugfix、两个测试文件、一行误改的 …。
cover: ../assets/articles/gitbutler-agent-safe-git/cover.png
carousel: [../assets/articles/gitbutler-agent-safe-git/carousel/01-cover.png, ../assets/articles/gitbutler-agent-safe-git/carousel/02-git-compare.png, ../assets/articles/gitbutler-agent-safe-git/carousel/03-lane-demo.png, ../assets/articles/gitbutler-agent-safe-git/carousel/04-concepts.png, ../assets/articles/gitbutler-agent-safe-git/carousel/05-cli-flow.png, ../assets/articles/gitbutler-agent-safe-git/carousel/06-stacked-agent.png, ../assets/articles/gitbutler-agent-safe-git/carousel/07-vs-worktree.png, ../assets/articles/gitbutler-agent-safe-git/carousel/08-vs-jujutsu.png, ../assets/articles/gitbutler-agent-safe-git/carousel/09-but-skill.png, ../assets/articles/gitbutler-agent-safe-git/carousel/10-boundary.png, ../assets/articles/gitbutler-agent-safe-git/carousel/11-fit.png, ../assets/articles/gitbutler-agent-safe-git/carousel/12-checklist.png, ../assets/articles/gitbutler-agent-safe-git/carousel/13-links.png]
tags: [gitbutler, git, coding-agent, virtual-branches, agent-safe-git, worktree]
origin:
  private_path: raw/publish/2026-06-16-gitbutler-agent-safe-git.md
discussion:
  issue: 
  url: 
formats:
  html: /articles/gitbutler-agent-safe-git
  slides:
  video:
---

# Agent 改完代码，Git 谁来收拾？

让 Cursor 改完认证模块，diff 里混着三个文件的 bugfix、两个测试文件、一行误改的 `package.json`。

你怕的往往不是代码写错——是 **Git 状态再也理不清**：该开几个分支、哪些 commit 该拆开、Agent 又顺手 `git add .` 了一次。

GitButler 盯的是这后半段。它不是 GitHub 替代品，也不是全新版本控制系统；它是在现有 Git 仓库上加的一层 **工作区组织工具**——桌面 GUI、`but` CLI，以及 2026 年 6 月 release/0.20.0 强化的 **Agent skill** 接入。核心承诺很直白：同一个工作目录里维护多条分支泳道，把混杂 diff 拆成可审查的历史。

## 一、混杂 diff，才是 Agent 编程的后半场

Agent 写代码越来越快。慢下来的是整理：feature 和 bugfix 搅在一起，测试文件和配置改动并排出现，你盯着 `git status` 不知道下一刀该切哪。

传统 Git 的工作目录是排他的——`checkout` 一次只能站一条时间线上。要并行，常见做法是 `stash`、开分支、或者 `git worktree` 拉多个目录。

GitButler 走另一条路：**同一个目录里同时维护多条分支 lane**，按文件或 hunk 把改动划到不同泳道，再分别提交、推送、开 PR。底层仍是 Git，远端还是你的 GitHub/GitLab。和原生 Git 最大的差别不在「能不能并行」，而在 **后置分拣**：不必先想清楚分支结构，再让 Agent 动手。

对 Agent 尤其有用：你不必强迫模型一开始就完美分 commit。它可以在一条 lane 里自由改，你用 `but stage` 把 file / hunk 拨到 `feature-x` 和 `fix-y`，再各自 `but commit`。每条 lane 有独立的 staging area，互不 `stash`。

创始人 Scott Chacon 是 GitHub 联合创始人、《Pro Git》作者。2026 年 4 月 GitButler 完成 1700 万美元 A 轮；官方把叙事写得很直：Agent 生成代码之后，**整理、审查、回滚** 才是痛点。

## 二、四个词，够你建立心智模型

上手不必背缩写。记住这四个官方概念就够：

| 概念 | 一句话 |
|------|--------|
| **Branch lane（分支泳道）** | UI 里的槽位，对应一条 virtual branch |
| **Virtual branches** | 同目录多泳道并行，共享 working directory |
| **Stacked branches** | 有依赖关系的分支链，改底层自动 restack 上层 |
| **Operations log** | 操作前快照，`but undo` / `but oplog restore` 回退 |

泳道不是装饰性 UI。它是 GitButler 分配改动的单位：每个 session、每个 PR 切片，最好对应一条 lane。

## 三、`but` CLI：从 setup 到 commit

GUI 能做的事，CLI 基本都能做。Agent 接入也走 CLI。

```bash
but setup
but branch new feature-auth
but branch new bugfix-crash
but stage src/auth/login.ts feature-auth
but stage src/ui/Button.tsx bugfix-crash
but commit -o -m "feat: auth flow" feature-auth
but commit -o -m "fix: button crash" bugfix-crash
but oplog snapshot -m "before cleanup"
```

`-o` 表示只提交该泳道已归属的改动。典型流程是：`but setup` 初始化 → 建泳道 → `but stage` 分配文件 → `but commit -o` 按泳道提交 → 大改历史前 `oplog snapshot`。

`oplog` 是 Agent workflow 的保险丝。比单独翻 `reflog` 更贴近 GitButler 自己的状态模型——Agent 或你把历史改乱了，有明确回退路径。

## 四、堆叠 PR 与 Agent skill

有依赖关系的改动，适合拆成 stacked branches：

```text
infra-schema → feature-api → feature-ui
```

底层分支改完后，上层自动 restack，少手工 `rebase -i`。代价也实在：团队得对 merge 顺序有共识，stack 越深越难收拾。

`release/0.20.0`（2026-06-03）把 Agent 集成写进了 release 标题，同一版本移除了桌面端内嵌的 Claude Code GUI，改由 skill 工作流取代。0.20 起，Agent 主线是 `but skill install`，不是旧文档里的 in-app GUI，也不是优先推荐的 MCP 路径。

当前推荐路径：

```bash
but skill install          # 选 Cursor / Claude Code / Copilot 等
but skill check --update   # 升级 CLI 后同步 skill
```

旧方案 `but mcp` 在 2025 年底有过完整文档，但 2026 年主线已转向 skill。**新试点请以 `but skill install` 为准。**

一套可落地的 Agent session 流程：

1. `but skill install`，为本 session 独占一条泳道（`but branch new agent-…`）
2. Agent 改文件；大改历史前 `but oplog snapshot -m "…"`
3. `but stage` + `but commit -o` 分拣并只提交本泳道改动
4. CLI 升级后跑 `but skill check --update`

多 Agent 约定可以写进 Cursor rules：

- 每个 Agent session → 独占一条泳道
- 允许本地 commit；push / PR 需显式授权
- 大改历史前：`but oplog snapshot -m "reason"`
- 不要动其他 lane，不要碰 `gitbutler/workspace`

## 五、和 worktree、Jujutsu 怎么选

GitButler 经常和两个方案放在一起比。它们不是二选一，**分工不同**。

### git worktree

隔离的是**运行时**：独立 checkout、各自的 `node_modules`、各自的 dev server。工作方式是多个目录并行，`cd` 切换物理路径。适合两套方案竞争、不同 Node 版本、要起两个 dev server。学习成本是标准 Git，团队普遍熟悉。

### GitButler 泳道

隔离的是**提交历史**：同目录多 lane，共享依赖与 dev server。工作方式是 `but stage` 分配 file / hunk。适合 Agent 混改 diff、拆 PR、边修 bug 边做 feature。

强隔离用 worktree，同目录整理用泳道——可以组合，不是替代关系。

### Jujutsu（`jj`）

jj 是另一条路线：独立 VCS，revset 和 oplog 极强，改历史是核心能力。但换的是整套工作流心智，并行开发靠 bookmark + working copy 切换，没有官方 Agent skill。迁移成本像换工具，团队培训门槛高。

GitButler 仍基于 Git，远端不变，试点不满意可以 `but teardown` 退出。jj 适合愿意深度换工具的人；GitButler 适合「仍用 Git，但 Agent 改完需要有人收拾 diff」的场景。

如果你只是想要更好看的 Git 客户端，GitKraken / Tower 可能更省事。如果你高频用 Agent，且经常被「一堆混杂改动怎么拆 PR」卡住，GitButler 值得花 30 分钟试。

## 六、它不是什么

几条硬边界，试点前先看清楚：

| 误解 | 事实 |
|------|------|
| GitHub / GitLab 替代品 | 依赖现有远端与 forge 集成 |
| worktree 替代品 | 泳道共享依赖与 dev server |
| 严格开源 | FSL-1.1-MIT：可内部用；不可做竞争性商业产品 |
| 成熟企业 VCS | 远程 SSH、复杂 GitLab 场景仍有大量 open issue |

还有一个实操雷区：`gitbutler/workspace` 是 GitButler 管理的特殊集成分支。不要在其上 `git commit`、`reset --hard`、`rebase`、`clean` 或 force push。混用原生 Git 高风险命令，是试点失败的第一原因。

## 七、值不值得试

**适合**：Agent 高频、混杂 diff 常卡 PR；stacked PR 不想手工 restack；非核心仓愿意试点。

**谨慎**：核心生产仓无培训直接替换；远程 SSH / 复杂 forge；Agent 自动 push 没有 review 闸门；大 monorepo 性能待实测。

和 Graphite、GitKraken 等工具比，GitButler 的差异化不在「最好看的 GUI」，而在 **同目录多 lane + 可恢复历史编辑 + Agent 可调用的结构化 Git 动作**。

GitHub 上 open issues 在 600+ 量级（2026-06 调研）；HN 历史讨论里 first-class conflicts、worktree 对比、Fair Source 许可都有实质热度——说明产品主张碰到了真痛点，但第三方大规模生产验证仍少。团队需要自己验证虚拟分支与 CI、branch protection 的兼容性。

## 八、三十分钟最小验证

别在核心仓上赌。选一个有真实 commit 历史的 side project，按下面跑一遍：

1. 安装桌面端 + `but` CLI，`but setup`（确认远端干净）
2. 建两条 parallel branch，同一文件两个 hunk 分到不同 lane，分别 commit
3. `but oplog snapshot` → 故意 squash 乱一次 → `but undo` 恢复
4. `but skill install`，让一个 Agent **只本地 commit，不 push**
5. 记录：哪些步骤比原生 Git 省事？哪些状态你看不懂？

**出现任一条就停**：oplog 无法恢复的 workspace；团队频繁破坏 `gitbutler/workspace`；CI / 签名 / branch protection 与虚拟分支冲突；Agent 跨 lane 污染导致 review 成本反升。

## 九、参考链接

- 仓库：https://github.com/gitbutlerapp/gitbutler
- Release 0.20.0：https://github.com/gitbutlerapp/gitbutler/releases/tag/release%2F0.20.0
- Agent-safe Git：https://blog.gitbutler.com/agentic-safety
- `but` CLI：https://blog.gitbutler.com/but-cli
- `but skill`：https://docs.gitbutler.com/commands/but-skill
- 官网：https://gitbutler.com
