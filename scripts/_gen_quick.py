import re

raw = r'''<page url="https://app.notion.com/p/64aafff4958f41bc80b812f5db400996"><properties>{"title":"快速筆記"}</properties><content>
2024.09.18
# Jot down some text
They found Mary, as usual, deep in the study of thorough-bass and human nature; and had some extracts to admire, and some new observations of threadbare morality to listen to.
# Make a to-do list
- [ ] Wake up
- [ ] Eat breakfast
- [x] Brush teeth
# Create sub-pages
- Sub Page
# Embed links
- bookmark
- bookmark
20240826 By Jun
# Summary of Action Lines / 行動方針
1. Sandy's ETA Salary Deduction / Sandy ETA 扣薪處理
- Action Item: Deduct a quarter of Sandy's salary. 扣除 Sandy 四分之一的薪水。
1. Discussion on ETA Review Meeting Presentation Format / 安排 ETA 審查會議的簡報格式討論
- Participants: Annie, Skyler, Jun, Tom, Declan
- Action Item: 根據教師時間表，通過 Outlook 邀請並討論簡報格式。
1. Quantification of Report Contents / 量化報告內容
- Action Item: 準備與 ETA 相關的量化報告，用於審查會議。
1. Letter to ETA Teachers / 致 ETA 教師的信
- 訓練結果及成長回饋；回顧經驗活動；分發 5 張個人照片和 3 張團體照片。
- 提醒學校未來重點（TLI 期望）；提供 TLI 聯絡資訊。
- 確定 ETA 個別獨特計劃作為最終訓練計劃。
1. [Important] Discuss the ETA End-of-Life Program with Declan / 與 Declan 討論 ETA 結束計劃
- Action Items: 每月報告新增「ETA 個別獨特主題」檢查清單。
Examples of Design Elements / 設計元素示例
- 行政教師的英語課程
- 每日 15 分鐘英語廣播
- 每月拼字比賽
# Upcoming Events / 即將舉行的活動
1. 333 Teacher Enrichment Training/ 333 師資增能會議
- Date: 每月第三個星期三下午 3 點（ETA 邀請 LET 參加）
- Taskade: https://www.taskade.com/invites/EqQa1tWdJv8xmgLZ
</content></page>'''

m = re.search(r'<content>(.*?)</content>', raw, re.S)
content = m.group(1)
content = re.sub(r'<page[^>]*>.*?</page>', lambda x: '- '+re.search(r'>(.*?)<', x.group(0), re.S).group(1), content, flags=re.S)
content = re.sub(r'<unknown[^>]*/>', '(bookmark)', content)
content = re.sub(r'<empty-block/>', '', content)
content = re.sub(r'<[^>]+>', '', content)
content = content.replace('\\n','\n').replace('\\"','"').strip()
content = re.sub(r'\n{3,}','\n\n',content)

md = f"""---
title: 快速筆記
source: Notion
notion_id: 64aafff4-958f-41bc-80b8-12f5db400996
tags: [快速筆記, 會議行動, ETA]
---

# 快速筆記

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/快速筆記.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
