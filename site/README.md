# 前端项目说明

`site/` 是 Mind-OS Public 的 Astro 静态站点。

## 第一版目标

第一版前端只做可读、适合分享的公开文章站：

- 首页展示文章列表。
- 文章页渲染 Markdown。
- 展示日期、标签和摘要。
- 提供 GitHub Issue 讨论入口。
- 部署为静态站点。
- 复制 `content/assets/` 到站点公开资源目录。

## 本地开发

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://127.0.0.1:4321/
```

## 构建

```bash
npm run build
```

构建会先执行 `scripts/sync-assets.mjs`，将仓库根目录的 `content/assets/` 同步到 `site/public/assets/`。

GitHub Pages 构建会设置 `GITHUB_PAGES=true`，站点发布到：

```text
https://kain-ai.xyz/
```

## 内容读取

前端只读取公开仓库内的数据：

```text
../content/articles/*.md
../content/assets/**
```

前端不读取私人 vault，也不依赖本机绝对路径。

## 设计方向

视觉基调是暖色的个人知识杂志：米白纸张、琥珀、陶土与橄榄作为底色，辅以青绿、蓝色和玫红突出标签、讨论入口和结构节点。
