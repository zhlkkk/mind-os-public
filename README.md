# Mind-OS Public

Mind-OS Public 是 Mind-OS 私人知识库的公开发布层。

它不公开私人 vault，也不承载全部笔记；它只接收经过筛选、脱敏和整理后的公开内容，并提供两个公开入口：

- `content/`：文章、讲稿、图表源文件等公开正文内容。
- GitHub Issues：每篇内容对应一个讨论线程，用于反馈、勘误、补充案例和后续选题。

长期目标是把一份内容母稿编译成多种公开形态：网页长文、幻灯片、视频脚本、图文卡片和 RSS。

## 产品定位

这个仓库是一个“公开内容渲染与讨论项目”，不是私人知识库镜像。

私有仓库中的 `raw/publish/` 是内容母稿层；本仓库中的 `content/` 是公开正文层；Issue 是讨论层；未来的前端站点是渲染层。

```text
private mind-os vault
  raw/publish/*.md
       │
       │  sanitize / sync / bind issue
       ▼
public mind-os-public repo
  content/articles/*.md
       │
       ├── site renders readable HTML
       └── GitHub issue hosts discussion
```

## 当前阶段

当前仓库先建立发布产品的需求、内容协议和协作规则。前端实现会在这些约定稳定后再推进。

已包含：

- [需求说明](docs/requirements.md)
- [内容协议](docs/content-contract.md)
- [发布工作流](docs/publishing-workflow.md)
- [系统架构](docs/architecture.md)
- [路线图](docs/roadmap.md)
- [内容目录说明](content/README.md)
- [前端项目说明](site/README.md)

## 目录结构

```text
mind-os-public/
├── content/
│   ├── articles/       # 公开文章 Markdown
│   └── assets/         # 公开图片、图表、附件
├── docs/               # 产品需求与发布规范
├── scripts/            # 发布同步脚本
├── test/               # 同步脚本测试
├── site/               # 前端渲染项目，后续实现
└── .github/
    └── ISSUE_TEMPLATE/ # 讨论与反馈模板
```

## 单向内容同步

当前支持从私人 `raw/publish/` 单向生成公开 `content/articles/`：

```bash
ruby scripts/sync_content.rb --source /path/to/mind-os/raw/publish
```

目录同步默认只处理 `status: ready` / `status: published` 的母稿，跳过 `draft`；单文件同步视为人工明确指定，会生成 `status: ready` 的公开文章。脚本不会回写私人 vault。

## 内容与讨论的绑定方式

每篇公开文章拥有一个稳定 `slug`，并在 frontmatter 中记录对应 Issue 编号。

示例：

```yaml
---
title: 从 LLM Wiki 到个人 Harness
slug: from-llm-wiki-to-personal-harness
date: 2026-05-19
status: published
tags: [llm-wiki, knowledge-management, mind-os]
discussion:
  issue: 1
  url: https://github.com/<owner>/mind-os-public/issues/1
---
```

正文由 `content/articles/*.md` 提供，讨论由 `discussion.issue` 指向的 GitHub Issue 承载。

## 发布原则

- 不公开私人 vault、日记、`wiki/insights/` 或未脱敏素材。
- 公开仓库只接收主动选择发布的内容。
- 文章正文可版本化，讨论沉淀在 Issue 中。
- 任何从 `raw/publish/` 同步过来的内容都必须经过脱敏检查。
- GitHub Issue 不作为唯一正文源，避免正文编辑和版本历史被评论系统绑架。

## 后续开发入口

下一步优先级：

1. 补第一篇公开文章到 `content/articles/`。
2. 创建对应 GitHub Issue，并回填 frontmatter。
3. 实现最小前端：文章列表、文章详情、Issue 讨论链接。
4. 增加发布同步脚本，把私有 `raw/publish/` 转换为公开 `content/`。
