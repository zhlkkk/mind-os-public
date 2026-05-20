# Mind-OS Public 需求说明

创建日期：2026-05-20  
状态：已确认基础方向，等待实现

## 背景

Mind-OS 私人知识库中已经有 `raw/publish/` 作为公开内容母稿目录。这里的内容适合被发布、讨论和再加工，但私人 vault 本身包含日记、洞察、原始素材和未脱敏信息，不适合作为公开仓库直接推送。

因此需要一个独立公开项目，用来承载经过筛选后的内容、公开讨论和后续多形态渲染。

## 核心判断

采用混合模式：

- 正文来自公开仓库的 `content/`。
- 每篇正文绑定一个 GitHub Issue 作为评论和讨论区。
- 前端站点读取 `content/` 渲染文章，而不是把 Issue body 当作唯一正文。

这个模式保留了 Markdown 内容的版本管理能力，也利用 GitHub Issues 获得天然的公开讨论、订阅、标签和反馈能力。

## 目标用户

- 对 Mind-OS、LLM Wiki、个人知识管理和 Agent 工作流感兴趣的读者。
- 想复刻部分实践、但不需要访问私人 vault 的开发者。
- 未来想围绕文章提出问题、勘误、补充案例或分享实践的人。

## 产品目标

1. 提供一个公开、可读、可维护的 Mind-OS 内容发布入口。
2. 让每篇内容都有可追踪的讨论线程。
3. 保持私人知识库和公开内容之间的清晰边界。
4. 让同一份公开正文未来可以派生为网页、幻灯片、视频脚本和图文素材。

## 非目标

- 不公开完整 Mind-OS vault。
- 不同步 `journals/`、`wiki/insights/`、未整理 `raw/` 或任何私人素材。
- 不把 GitHub Issue 当作唯一内容数据库。
- 第一阶段不追求 CMS、账号系统、点赞、站内评论等重型功能。

## 核心体验

读者打开站点后，可以：

- 浏览文章列表。
- 阅读排版良好的 HTML 文章。
- 点击“参与讨论”跳转到对应 GitHub Issue。
- 通过标签、日期或主题找到相关文章。

作者本地维护时，可以：

- 在私人 vault 的 `raw/publish/` 编写母稿。
- 选择某篇内容发布到公开仓库 `content/`。
- 为内容创建或绑定 GitHub Issue。
- 在 frontmatter 中维护发布状态和讨论链接。

## 内容生命周期

```text
draft in private raw/publish
  → ready after local review
  → sanitized public content copy
  → issue created or linked
  → published on site
  → feedback collected in issue
  → revised content version
```

## MVP 范围

第一阶段应完成：

- 公开仓库基础文档。
- `content/articles/` 内容目录约定。
- 每篇文章的 frontmatter 协议。
- Issue 模板。
- 前端项目说明。

第二阶段应完成：

- 最小前端站点。
- 第一篇文章发布。
- Issue 绑定和讨论链接。
- 基础构建与部署说明。

第三阶段再考虑：

- 从私有 `raw/publish/` 自动同步到公开 `content/`。
- 自动创建 Issue。
- RSS。
- 幻灯片和视频脚本导出。

## 验收标准

- 仓库 README 能让新读者理解项目定位和边界。
- 需求文档明确说明“content 正文 + Issue 讨论”的混合模式。
- 内容协议能指导未来新增文章。
- 发布工作流能避免误公开私人内容。
- Issue 模板能承载文章讨论和一般反馈。
- 后续前端实现不需要重新定义产品边界。

