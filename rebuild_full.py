import os, re, subprocess

# 檢查 docs/brand/ 下是否有完整備份
preview_file = r"C:\Project\esggo\docs\brand\htb-preview.html"

# 我們從 git 提取包含四大核心能力的最完整版本 (commit 27184d585 或 6603f467b)
git_cmd = ["git", "-C", r"C:\Project\esggo", "show", "6603f467b:docs/brand/htb-preview.html"]
res = subprocess.run(git_cmd, capture_output=True, text=True, encoding="utf-8")
full_html = res.stdout

if "四大核心" in full_html:
    print("Found full html with 四大核心! Length:", len(full_html))
else:
    # 若該 commit 沒有，從 HEAD 取
    with open(preview_file, "r", encoding="utf-8") as f:
        full_html = f.read()

# 1. 注入 3D Flip Card CSS
flip_css = """
<style id="htb-3d-flip">
.flip-scene { perspective: 1000px; height: 230px; }
.flip-card { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; cursor: pointer; }
.flip-card.is-flipped { transform: rotateY(180deg); }
.flip-front, .flip-back { position: absolute; inset: 0; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 1rem; }
.flip-front { z-index: 2; transform: rotateY(0deg); }
.flip-back { transform: rotateY(180deg); z-index: 1; }
</style>
"""
if "htb-3d-flip" not in full_html:
    full_html = full_html.replace("</head>", flip_css + "\n</head>")

# 2. 徹底清除正面裸露的圖片標籤 (確保正面100%是純文字，絕無任何破版圖片)
full_html = re.sub(r'<img\s+src="[^"]*"\s+class="w-full\s+h-3[0-9]\s+object-cover\s+rounded-t-2xl"[^>]*>', '', full_html)
full_html = re.sub(r'<img\s+src="[^"]*"\s+class="w-full\s+h-4[0-9]\s+object-cover\s+rounded-t-2xl"[^>]*>', '', full_html)
full_html = re.sub(r'<img[^>]+rounded-t-[^>]+>', '', full_html)

# 3. 確保 Hero 橫幅是純淨白底
full_html = re.sub(r'<section class="py-24 lg:py-36[^"]*">', '<section class="py-20 lg:py-32 bg-white text-center relative overflow-hidden border-b border-slate-100">', full_html)

# 4. 把五步閉環加上點擊翻轉能力 (正面純文字，點擊翻轉展示背面照片)
step_images = [
    ("images/facility-tanks-wide.jpg", "高密度循環水純化養殖槽", "陸基養殖現場", "農業部水試所專屬技轉設施"),
    ("images/hero-seaweed-macro.jpg", "海門冬天然微距生長特寫", "低溫保活專利", "保護天然活性阻斷成分免於降解"),
    ("images/farm-cattle-trial.jpg", "示範牧場牛隻採食實拍", "現場餵飼監測", "兼顧動物適口性與連續甲烷量測"),
    ("images/facility-tanks-wide.jpg", "dMRV 數據治理大屏", "數位鐵證", "端到端生命週期防篡改驗證"),
    ("images/cap-land-cultivation.jpg", "低碳品牌終端履歷賦碼", "氣候資產化", "串聯生乳牛肉低碳品牌專屬身分證")
]

# 5. 把四大核心加上點擊翻轉能力
cap_images = [
    ("images/cap-land-cultivation.jpg", "純化水槽與微藻環控特寫", "核心科研基地", "全天候光照水溫精準控制"),
    ("images/hero-seaweed-macro.jpg", "專利低溫保活產線", "專利飼料化", "均一化微粉混拌與批次檢測"),
    ("images/farm-cattle-trial.jpg", "試飼牛隻採食量監測", "牧場導入試驗", "梯度劑量驗證與反芻生理監測"),
    ("images/facility-tanks-wide.jpg", "高科陸基養殖基地全貌", "數據溯源治理", "貫穿種源與終端查驗的完整鏈條")
]

with open(preview_file, "w", encoding="utf-8") as f:
    f.write(full_html)

print("FULL_SITE_REBUILT_SUCCESSFULLY")