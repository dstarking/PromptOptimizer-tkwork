# 媒体示例（图片与视频）

> 规范要点：
> - 图片优先使用 GitHub 托管，并固定到 tag/commit；必要时才内置到仓库。
> - 视频统一外链（YouTube/Vimeo/Cloudflare Stream 等）。

## 图片（GitHub Raw 且固定版本）

示例（将占位替换为实际仓库/路径/commit 或 tag）：

```markdown
![示例图片 ALT 文本](https://raw.githubusercontent.com/OWNER/REPO/<commit-or-tag>/path/to/image.png)
```

如需在页面内点击放大，可选用 glightbox 插件（启用后）：

```markdown
![示例图片 ALT 文本](https://raw.githubusercontent.com/OWNER/REPO/<commit-or-tag>/path/to/image.png){.glightbox}
```

## 视频（外链嵌入）

示例（YouTube iframe，占位 ID 请替换）：

```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" title="YouTube video" frameborder="0" allowfullscreen></iframe>
```

> 提示：如果平台受限，请在文档中同时提供直达链接，或提供多平台备选链接。
