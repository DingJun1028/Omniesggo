import re

raw = r'''<page><content>
**Zoom Docs 快速指南**
# What is Zoom Docs?
- **Collaborative docs**: 在 AI-first Zoom Docs 中建立與協作
- **Meeting docs**: 用 AI Companion 建立可執行文件，提升會議效率
- **Wiki**: 為你與團隊建立知識庫
- **Data table**: 結構化追蹤任務、需求、回饋

## Collaborative docs
- 按 `/` 或 `+` 讓 AI Companion 寫入內容（標題、清單、圖片、表格等）
- 每行左側 `⋮⋮` 讓 AI 精煉，或拖曳移動
- `Space` 產生項目符號清單，`numbers`+`.` 編號清單，`[]` 待辦清單
- 左上 `+ page` 新增頁面
## 提升協作效率
- `@` 提及同事或設定日期
- 高亮文字 + `+ comment` 留言，可 `@mention` 同事（通知 email）
- `Share` 按鈕邀請協作者（共同編輯/閱讀/留言）
- [Try creating your first doc](https://docs.zoom.us/recent)
## Meeting docs
會議中可直接在視窗讀/編/留言，會後用 AI Companion 依範本產出洞察與行動項目
- [Try creating a doc from your meeting](https://docs.zoom.us/meetings)
## Wiki
用 page/sub-page 建立個人/專案/團隊知識庫
## Data table
收集、組織、追蹤各類資料，結構化專案管理
| Task name | Team |
| --- | --- |
| Feature Release | Product |
| Discovery | Design |
| Boost performance | Engineer |
| Project X | Product |
# Templates
點標題檢視內容並複製：
- [1:1 Meeting](https://docs.zoom.us/doc/b0wngyE6TqezNyHG21nYIw)
- [Meeting Notes](https://docs.zoom.us/doc/77Rc0yc0TECiIxBiOK9hpQ)
- [Weekly Meetings](https://docs.zoom.us/doc/-5fIEH2kS9CruLjjOBktag)
- [Standup Meetings](https://docs.zoom.us/doc/OcFQUbqQTc-SuHRLUlTaeA)
- [Brainstorm](https://docs.zoom.us/doc/PsMyCGjuR_SzNyHp6sMB3g)
- [To-do lists](https://docs.zoom.us/doc/F-6j29hVTp2R2qe55MzK6w)
- [Project Tracker](https://docs.zoom.us/doc/CvVeucxtQfOwIrcJrTkwrQ)
- [OKR Planning](https://docs.zoom.us/doc/JnBnfeU4R8uQeqM8UT8T5Q)
- [User Feedback](https://docs.zoom.us/doc/be3z0FBaSTaOcxT9wPtlwg)
# Support and feedback
- [Zoom Docs Support](https://support.zoom.com/hc/en?id=kb_category&kb_category=ab99d7cd47ba8610d7c3a9aa116d4342)
- 右下角 `?` 聯繫團隊或提供回饋
</content></page>'''

m = re.search(r'<content>(.*?)</content>', raw, re.S)
content = m.group(1)
content = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', content)  # 移除所有圖片(JWT簽名)
content = re.sub(r'<[^>]+>', '', content)
content = content.replace('\\n','\n').strip()
content = re.sub(r'\n{3,}','\n\n',content)

md = f"""---
title: Zoom Docs (Zoom 文件)
source: Notion
notion_id: 1b6ccd20-97d7-803f-bd50-f78188d54ca2
tags: [Zoom, Docs, 協作, 會議]
---

# Zoom Docs (Zoom 文件)

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/Zoom Docs.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
