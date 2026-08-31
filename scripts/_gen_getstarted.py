import re

raw = r'''<page><content>
👋 Welcome to Notion!
Here are the basics:
- [ ] Click anywhere and just start typing
- [ ] Hit `/` to see all the types of content you can add - headers, videos, sub pages, etc.
  - Example sub page
- [ ] Highlight any text, and use the menu that pops up to **style** *your* ~~writing~~ `however` [you](https://www.notion.so/product) like
- [ ] See the `⋮⋮` to the left of this checkbox on hover? Click and drag to move this line
- [ ] Click the `+ New Page` button at the bottom of your sidebar to add a new page
- [ ] Click `Templates` in your sidebar to get started with pre-built pages
<details>
This is a toggle block.
- [Template Gallery](https://www.notion.so/notion/Notion-Template-Gallery-181e961aeb5c4ee6915307c0dfd5156d): More templates built by the Notion community
- [Help & Support](https://www.notion.so/notion/Help-Support-e040febf70a94950b8620e6f00005004): Guides and FAQs for everything in Notion
- Stay organized with your sidebar and nested pages
</details>
See it in action (YouTube tutorials):
- https://youtu.be/TL_N2pmh9O0 (1 min)
- https://youtu.be/FXIrojSK3Jo (4 min)
- https://youtu.be/2Pwzff-uffU (2 min)
- https://youtu.be/O8qdvSxDYNY (2 min)
Visit our [YouTube channel](http://youtube.com/c/notion) to watch 50+ more tutorials
👉 **Have a question?** Click the `?` at the bottom right for more guides, or to send us a message.
</content></page>'''

m = re.search(r'<content>(.*?)</content>', raw, re.S)
content = m.group(1)
content = re.sub(r'<page[^>]*>.*?</page>', lambda x: '- '+re.search(r'>(.*?)<', x.group(0), re.S).group(1), content, flags=re.S)
content = re.sub(r'<video[^>]*>.*?</video>', '', content)
content = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', content)
content = re.sub(r'<[^>]+>', '', content)
content = content.replace('\\n','\n').strip()
content = re.sub(r'\n{3,}','\n\n',content)

md = f"""---
title: Getting Started
source: Notion
notion_id: 77835d10-8998-4fe0-b109-a04cc537b68c
tags: [Notion, 入門, 歡迎]
---

# Getting Started

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/Getting Started.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
