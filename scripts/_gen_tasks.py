import json

data = {"results":[
{"工作項目":None,"優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"測試","優先順序":"未開始","優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"確認A料件外觀","優先順序":"重要、緊急","優先級":None,"date:Deadline:start":"2024-08-02","備註":None},
{"工作項目":"處理A料件的保固事情","優先順序":"重要、不緊急","優先級":None,"date:Deadline:start":"2024-08-15","備註":None},
{"工作項目":"任務自訂欄位已更新（觸發器）|任務幫助中心","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"建立專案進度報告的互動式圖表","優先順序":"不重要、緊急","優先級":None,"date:Deadline:start":"2024-08-28","備註":None},
{"工作項目":"vika OKR管理系統- vika維格雲端解決方案- vika維格雲","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"與專案利害關係人了解回饋","優先順序":"不重要、緊急","優先級":None,"date:Deadline:start":"2024-08-20","備註":None},
{"工作項目":"開 kick-off 會議","優先順序":"重要、緊急","優先級":None,"date:Deadline:start":"2024-08-13","備註":None},
{"工作項目":"擬定專案進度表","優先順序":"重要、緊急","優先級":None,"date:Deadline:start":"2024-08-29","備註":None},
{"工作項目":"電子郵件到任務轉換自動化 AI 自動化範本 |塔斯卡德","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"策劃產品發表會","優先順序":"不重要、緊急","優先級":None,"date:Deadline:start":"2024-09-06","備註":None},
{"工作項目":"建立預算估算表","優先順序":"重要、不緊急","優先級":None,"date:Deadline:start":"2024-08-23","備註":None},
{"工作項目":"LINE Chat","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Capacities: How to Organize Your Knowledge with Links, Databases, Collections, and Tags","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Next steps and additional needs @ 32:00","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"3/19 (三) 體檢日","優先順序":"重要、緊急","優先級":None,"date:Deadline:start":"2025-03-19","備註":"相關文件需帶齊"},
{"工作項目":"Impromptu Microsoft Teams Meeting - December 10","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Customized language programs for TSMC @ 2:00","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Specific course offerings for TSMC @ 11:00","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Personalized learning support @ 28:00","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Overview of TLI's language and cultural training services @ 0:03","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"Unique features of TLI's training approach @ 6:00","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None},
{"工作項目":"VIEW RECORDING - 36 mins (No highlights)","優先順序":None,"優先級":None,"date:Deadline:start":None,"備註":None}
]}

lines = ["---","title: 任務總表 (Task Master)","source: Notion database (任務總表)","notion_db: 11cccd20-97d7-8107-811b-e7b1d23934f1","tags: [任務, 待辦, 專案管理]","---","","# 任務總表 (Task Master)","","> 從 Notion 「任務總表」database 遷移（含空行 %d 筆）" % len(data["results"]),"",""]
n=0
for r in data["results"]:
    item = r.get("工作項目")
    if not item:
        continue
    n+=1
    order = r.get("優先順序") or ""
    pri = r.get("優先級") or ""
    dl = r.get("date:Deadline:start") or ""
    note = r.get("備註") or ""
    line = f"{n}. [{'x' if order=='完成' else ' '}] {item}"
    meta=[]
    if order: meta.append(f"順序: {order}")
    if pri: meta.append(f"級: {pri}")
    if dl: meta.append(f"DL: {dl}")
    if meta: line += " — " + " | ".join(meta)
    parts=[line]
    if note: parts.append(f"   - 備註: {note}")
    lines.append("\n".join(parts))
lines.append("")

md="\n".join(lines)
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/任務總表.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md), "tasks:", n)
