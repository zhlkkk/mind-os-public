# 发布工作流

本文描述从私人 `raw/publish/` 到公开 `content/` 和 GitHub Issue 的流程。

## 角色分层

```text
raw/publish/         私有内容母稿
content/articles/    公开正文副本
GitHub Issues        公开讨论区
site/                前端渲染层
```

## 手动发布流程

1. 在私人 vault 的 `raw/publish/` 完成母稿。
2. 检查母稿 frontmatter，确认 `status: ready`。
3. 复制或转换到本仓库 `content/articles/`。
4. 执行脱敏检查。
5. 在 GitHub 创建文章讨论 Issue。
6. 将 Issue 编号和 URL 回填到公开正文 frontmatter。
7. 前端站点重新构建并发布。
8. 后续修改正文时保留同一个 `slug` 和 Issue。

## Issue 标题约定

文章讨论 Issue 标题推荐：

```text
[Article] 从 LLM Wiki 到个人 Harness
```

一般反馈 Issue 标题推荐：

```text
[Feedback] 关于文章站点的建议
```

## Issue 标签约定

推荐基础标签：

- `article`：文章讨论。
- `feedback`：一般反馈。
- `errata`：勘误。
- `question`：读者问题。
- `practice-report`：读者实践反馈。
- `future-topic`：后续选题。

文章标签可以同步到 Issue label，例如：

```text
llm-wiki
mind-os
knowledge-management
```

## 单向同步脚本

当前提供一个保守的单向同步脚本：只读取私人 `raw/publish/`，只写入公开 `content/articles/`，不会回写私人 vault。

同步单篇文章：

```bash
ruby scripts/sync_content.rb \
  --source /path/to/mind-os/raw/publish/2026-05-19-from-llm-wiki-to-personal-harness.md
```

同步目录中所有 `ready` / `published` 母稿：

```bash
ruby scripts/sync_content.rb \
  --source /path/to/mind-os/raw/publish
```

也可以通过环境变量配置默认来源：

```bash
MIND_OS_PUBLISH_SOURCE=/path/to/mind-os/raw/publish ruby scripts/sync_content.rb
```

脚本会执行：

```text
read raw/publish/*.md
  → strip private-only fields
  → convert Obsidian links
  → write content/articles/*.md
```

保守规则：

- 目录同步默认跳过 `status: draft` 的母稿。
- 单文件同步视为人工明确指定，会生成 `status: ready` 的公开文章。
- 公开 frontmatter 只保留内容协议需要的字段，并写入 `origin.private_path`。
- 普通 Obsidian wikilink 会转成公开文本；Obsidian 图片引用会转成“公开版暂未同步图片”的文本提示。
- Issue 创建、Issue 回填和公开资源复制仍需后续流程处理。

自动化脚本必须默认保守：发现无法判断是否安全公开的内容时中断，而不是继续发布。

## 失败处理

- 如果发现误公开内容，第一动作是从公开仓库删除或修订对应内容。
- 如果 Issue 中出现勘误，优先修订 `content/articles/`，再在 Issue 中说明。
- 如果文章标题变化但主题不变，保留 `slug` 和 Issue，避免讨论断裂。
- 如果文章主题重写为另一篇内容，新建 `slug` 和 Issue。
