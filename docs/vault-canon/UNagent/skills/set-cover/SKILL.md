---
name: 设置封面
description: 把一张图片设为一篇笔记的 frontmatter cover 字段（封面图）。
mode: lazy
tools: [update_frontmatter, generate_image, read_note, search_notes]
---

# 设置笔记封面

【何时使用】用户想把某张图片设为笔记封面，设置 frontmatter 的 cover 字段。

【步骤】
1. 确认用户想设封面的笔记是哪篇（不确定时先 search_notes 或 read_note 定位）。
2. 如果图片还未生成，用 generate_image 先生成图片（无需 asCover 参数）。
3. 用 update_frontmatter 将笔记的 cover 字段设为图片路径：updates: {cover: "<图片路径>"}。
4. 告知用户封面已设置完成。

【注意】
- 图片路径是 vault 相对路径（如 "UNagent/images/AI-image-2026-08-01_120000.png"）。
- 若用户已有图片但未在 vault 中，先解释需要将图片放入 vault 后再设置封面。
- 设置封面不会修改笔记正文，只改 YAML frontmatter。
