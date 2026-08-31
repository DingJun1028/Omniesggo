import json, re, sys

# 從 notion fetch result 提取 content 並轉 MD
raw = r'''<page url="https://app.notion.com/p/359ccd2097d78004924ddc9c77fa3081"><properties>{"title":"國際永續策略人才ESG 雙證課程"}</properties><content>
### TA 職務說明書與營運清單
**職務名稱**：企業 ESG 雙證課程營運教學助理 (TA)
**核心職責**
1. 跨平台與跨區營運：維護台灣與大陸學員雙軌學習環境。
2. 課程產出物追蹤：控管學員結業條件（出席率、Office Hour、三項交付物）。
3. 教材在地化與 AI 協作：中文化、排版與重點萃取。
4. Office Hour 控管：跨語言溝通與秩序維護。
**工具技能要求**
- 通訊與排程：Line、WeChat、Google Calendar
- 會議與系統：Zoom、Google Drive、百度雲
- AI 翻譯與產出：DeepL、語音轉文字
---
### 模塊二：營運工作清單
| 營運階段 | 任務分類 | 具體執行項目 | 檢核標準 |
| --- | --- | --- | --- |
| 開課前 (Pre) | 報名與法遵 | 確認繳費名單、證書資料、法律須知 | 名單無缺漏 |
| 開課前 (Pre) | 系統建置 | Zoom 分組、Line/WeChat 群組、雲端空間 | 跨區權限無阻礙 |
| 課中 (In) | 時程與場控 | 等待畫面、錄影、監控討論區 | 異常處置 < 3 分鐘 |
| 課後 (Post) | 資料沉澱 | 回放影片、AI 筆記、週報 | 24h 內上架 |
---
### 模塊三：面試題庫
1. 排班與代理規劃（12 週週六 + 週三夜間）
2. 美西/台灣時區換算與 Google Calendar 細節
3. 大陸學員 Google 雲端失效 + Zoom 失效的 3 分鐘處置
4. 群組抱怨負擔過重 + NDA 要求的第一線回覆
5. Office Hour 中斷冗長中文發言的話術
6. 越過窗口直接向美方講師催繳教材的策略
7. AI 處理 10 萬字翻譯與校對方法
8. AI 處理 6 小時錄音產出結構化筆記步驟
---
### 模塊五：TA 密集受訓表
| 階段 | 訓練模塊 | 內容 | 考核點 |
| --- | --- | --- | --- |
| 第一階段 5/18-5/22 | 課程架構與防線 | 雙軌架構、TA 邊界、NDA 防線 | 抽測三大產出物 |
| 第二階段 5/25-5/29 | 跨區系統與AI | Zoom 權限、雙軌群組、AI 工作流 | 30min 產出中英筆記 |
| 第三階段 6/1-6/4 | 情境模擬 | OH 控場、技術故障 SOP | Role-play 測試 |
| 總結 6/5 | 開課演習 | 完整 SOP 日程 | Checklist 簽收 |
---
### 階段一：邊界與認知
目標：明確「只做營運，不代工作業」紅線。
- 5/18 架構解盲：背誦雙軌制、三大交付物
- 5/19 法遵與紅線：NDA 拒絕話術、邊界劃分
- 5/20 溝通標準化：公版發言、跨平台語境
---
### 階段二：系統工具與 AI 賦能
- 5/25 Zoom 極限操作（免主持人入會、分組、雙錄影）
- 5/26 跨區排程與雲端隔離（時區防呆、百度雲備案）
- 5/27 AI 教材處理流（DeepL 原版面、重點提純）
- 5/28 AI 會議紀錄流（語音轉文字、結構化產出）
---
### 階段三：極限情境與災難演練
- 6/1 OH 控場演練（超時切斷、業師翻譯）
- 6/2 黃金 3 分鐘災難排除（Zoom/網路/麥克風）
- 6/4 開課總彩排（07:30-14:00 時程實跑）
---
### TA 行動錦囊 (SOP Cheat Sheet)
**異常升級通報樹狀圖**
- L1 (TA 獨立排除)：個別操作障礙、找不到連結
- L2 (通報團長)：超過 3 人相同問題、講者斷線 30s
- L3 (直通主責)：Zoom 崩潰、講者失聯 3min、重大客訴
**罐頭訊息**
- 網路異常安撫（雙群通用）
- 拒絕 NDA（法遵紅線）
- Office Hour 優雅中斷
- 陸區替代方案（WeChat/百度雲）
**黃金 3 分鐘 SOP**
- 主講者斷線：接管麥克風 → 播放圖卡 → WhatsApp 聯絡
- 學員忘關麥：強制靜音 → 私訊提醒
- 分組異常：手動派送 → 拉回主會議室
---
### 課程上線檢核表
課前：Zoom 設定、雙錄影、圖卡音樂、時差核對
課中：雙軌監控、紀錄 QA、截圖出席
課後：停止錄影、AI 筆記、校對上傳、群組預告
---
### 營運缺口補齊
- 備援：主副 TA 排班、交班日誌、權限集中
- 溝通：進度話術、兩岸術語對齊、群組控管
- 系統對接：ESG GO 繳交、數據標籤化 (Traceable)
---
### ESG Sunshine 正職選拔
目標：從學員篩選優秀人才錄用為 ESG Sunshine 全職
- 第一階段：選拔（提案實作力 40% / 系統操作力 30% / 溝通協作力 30%）
- 第二階段：4 週入職培訓（5T：Truthful/Trustworthy/Tasteful/Thankful/Transferful）
- 第三階段：職務分發（系統導入顧問 / 永續策略顧問 / 專案營運經理）
- 第四階段：正式任用與薪資福利
</content></page>'''

# 提取 content
m = re.search(r'<content>(.*?)</content>', raw, re.S)
content = m.group(1) if m else raw

# 處理表格
def conv_table(block):
    rows = re.findall(r'<tr>(.*?)</tr>', block, re.S)
    out=[]
    for i,r in enumerate(rows):
        cells=[c.strip() for c in re.findall(r'<t[dh]>(.*?)</t[dh]>', r, re.S)]
        if not cells: continue
        out.append('| '+' | '.join(cells)+' |')
        if i==0: out.append('| '+' | '.join(['---']*len(cells))+' |')
    return '\n'.join(out)

content = re.sub(r'<table>.*?</table>', lambda x: conv_table(x.group(0)), content, flags=re.S)
# 移除剩餘 tag
content = re.sub(r'<[^>]+>', '', content)
content = content.replace('\\n','\n').strip()
content = re.sub(r'\n{3,}','\n\n',content)

md = f"""---
title: 國際永續策略人才ESG 雙證課程
source: Notion
notion_id: 359ccd20-97d7-8004-924d-dc9c77fa3081
tags: [ESG, 雙證課程, TA, 營運SOP]
---

# 國際永續策略人才ESG 雙證課程

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/國際永續策略人才ESG雙證課程.md","w",encoding="utf-8").write(md)
print("WRITTEN bytes=",len(md))
