import json

data = {"results":[
{"標題":"What Happens After The Hype? Lessons From Mobile Internet’s Long Road to Success","網址":"https://blog.startupstash.com/what-happens-after-the-hype-lessons-from-mobile-internets-long-road-to-success-22d0b15e0625","摘要":"Technology bubbles are inevitable. A breakthrough happens, excitement builds, billions get invested in preparation …"},
{"標題":"Regular expression to match a line that doesn't contain a word","網址":"https://stackoverflow.com/questions/406230/regular-expression-to-match-a-line-that-doesnt-contain-a-word/406408#406408","摘要":"Match lines that do not contain a specific word using regex"},
{"標題":"The Trump Administration Wants Immigrants to Self-Deport","網址":"https://www.wired.com/story/trump-administration-wants-immigrants-to-self-deport/","摘要":"The Trump administration has been virtually begging immigrants in the US to self-deport, even offering money."},
{"標題":"Snapchat/Valdi: cross-platform UI framework","網址":"https://github.com/Snapchat/Valdi","摘要":"Valdi is a cross-platform UI framework that delivers native performance without sacrificing developer velocity."},
{"標題":"Anthropic Bought Bun: Here's What It Really Means for Us","網址":"https://dev.to/arjuncodess/anthropic-bought-bun-heres-what-it-really-means-for-us-kj2","摘要":"Anthropic bought the one missing piece that turns..."},
{"標題":"Apple’s head of UI design is leaving for Meta","網址":"https://www.theverge.com/news/837654/apple-meta-alan-dye-designer","摘要":"Apple’s Alan Dye, who has led its UI design team since 2015, is leaving to join Meta."},
{"標題":"NOTION_API_KEY 與 NOTION_DATABASE_ID","網址":None,"摘要":"Notion API 設定相關筆記"},
{"標題":"Changelog - Blue","網址":"https://blue.app/changelog","摘要":None},
{"標題":"The Quiet Revolution: How Notion Changed the Way We Think About Work","網址":"https://medium.com/@ananyavhegde2001/the-quiet-revolution-how-notion-changed-the-way-we-think-about-work-338935638f0f","摘要":"How Notion changed the way we think about work."},
{"標題":"The Context-Switching Problem: Why I Built a Tracker That Lives in My Terminal","網址":"https://dev.to/tejas1233/the-context-switching-problem-why-i-built-a-tracker-that-lives-in-my-terminal-4dpe","摘要":"Productivity tracker in terminal."},
{"標題":"One day, AI might be better than you at surfing the web. That day isn’t today","網址":"https://www.theverge.com/tech/837287/ai-browsers-comet-chatgpt-atlas-edge-copilot-chrome-gemini","摘要":"We test Comet, ChatGPT Atlas, Dia, Copilot in Edge, and Gemini in Chrome."},
{"標題":"Kickstarter Sparks a New Wave in Desktop Manufacturing","網址":"https://modernengineeringmarvels.com/2025/12/03/kickstarter-sparks-a-new-wave-in-desktop-manufacturing/","摘要":"Open-source standard for desktop manufacturing."},
{"標題":"How we built user behavior analysis with multi-modal LLMs (PostHog)","網址":"https://posthog.com/blog/multi-modal-llm-user-behavior-analysis","摘要":"PostHog captures user behavior data, analyzed with multi-modal LLMs."},
{"標題":"The Crucial Role of AI in Cybersecurity | LinkedIn","網址":"https://www.linkedin.com/pulse/crucial-role-ai-cybersecurity-jeevan-george-john-tbqxe/","摘要":"The Crucial Role of AI in Cybersecurity"},
{"標題":"tryfabric/martian: Markdown to Notion","網址":"https://github.com/tryfabric/martian","摘要":"Convert Markdown and GFM to Notion API Blocks and RichText."},
{"標題":"Chasing the Ghost of Notion, Coda’s trap","網址":"https://huizer.medium.com/chasing-the-ghost-of-notion-codas-trap-95c0842cb390","摘要":"Why the promise that complexity is optional backfired."},
{"標題":"mozilla/readability: standalone readability lib","網址":"https://github.com/mozilla/readability","摘要":"A standalone version of the readability lib."},
{"標題":"Why Teams Switch From Legacy Wikis to Notion","網址":"https://www.youtube.com/watch?v=xm-RiXrJ4Hw","摘要":"Notion is an AI workspace where teams capture knowledge."},
{"標題":"Templates for LinkedIn Content Planning and Tracking","網址":"https://www.reddit.com/r/notioncreations/comments/1pdt78i/templates_for_linkedin_content_planning_and/","摘要":"3 Notion templates to track LinkedIn content and engagement."},
{"標題":"The Enchanted Realm of Water Lilies and Lotuses","網址":"https://strangeplants.substack.com/p/the-enchanted-realm-of-water-lilies","摘要":"Floating flowers that thrive in dark waters."},
{"標題":"HBO Max’s ‘Mad Men’ Vomit Scene Proves ‘Remastered’ Doesn’t Mean ‘Better’","網址":"https://www.wired.com/story/hbo-maxs-mad-men-barf-scene-proves-remastered-doesnt-mean-better/","摘要":"Reformatting things that are better off left alone."}
]}

lines = ["---","title: 資源庫 (Resources)","source: Notion database (資源)","notion_db: 2ccccd20-97d7-837c-a181-81a8cdea2362","tags: [資源, 書籤, 連結]","---","","# 資源庫 (Resources)","","> 從 Notion 「資源」database 遷移，共 %d 筆" % len(data["results"]),"",""]
for i, r in enumerate(data["results"], 1):
    title = r.get("標題") or "(無標題)"
    url = r.get("網址")
    summ = r.get("摘要")
    if url:
        lines.append(f"{i}. [{title}]({url})")
    else:
        lines.append(f"{i}. {title}")
    if summ:
        lines.append(f"   - {summ}")
    lines.append("")

md = "\n".join(lines)
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/資源庫.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md), "entries:", len(data["results"]))
