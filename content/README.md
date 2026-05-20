# 内容目录

`content/` 是公开正文层，只存放确认可以公开的内容。

它可以来自私人 Mind-OS vault 的 `raw/publish/`，但必须经过脱敏、链接转换和格式规范化。

## 子目录

```text
content/
├── articles/  # 公开文章
└── assets/    # 公开资源
```

## 新增文章检查清单

- [ ] 文件名是英文 kebab-case。
- [ ] frontmatter 符合 `docs/content-contract.md`。
- [ ] `slug` 稳定且唯一。
- [ ] `status` 合理。
- [ ] Obsidian `[[wikilinks]]` 已转换。
- [ ] 私人信息已脱敏。
- [ ] 公开资源已经放入 `content/assets/`。
- [ ] 发布后已绑定 GitHub Issue。

