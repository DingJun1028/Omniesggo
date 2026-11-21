# -*- coding: utf-8 -*-
import os
import shutil
import subprocess

target = r"C:\Project\htb-esggo-co"
src_app = r"C:\Project\esggo\apps\htb-b2b"
src_docs = r"C:\Project\esggo\docs\brand"

print("[1/5] Cloning remote repository...")
subprocess.run(["git", "clone", "https://github.com/DingJun1028/htb-esggo-co.git", target], check=True)

print("[2/5] Copying web application files...")
for item in os.listdir(src_app):
    s = os.path.join(src_app, item)
    d = os.path.join(target, item)
    if item in [".git", "node_modules", "dist", ".turbo"]:
        continue
    if os.path.isdir(s):
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        shutil.copy2(s, d)

print("[3/5] Copying architecture and audit documentation...")
docs_target = os.path.join(target, "docs")
os.makedirs(docs_target, exist_ok=True)

doc_files = [
    ("高科生技新官網_完整規格書比對與驗收分析報告_v1.0.md", "高科生技新官網_完整規格書比對與驗收分析報告_v1.0.md"),
    ("htb-delivery-handover.md", "htb-delivery-handover.md"),
    ("htb-site-architecture.md", "htb-site-architecture.md"),
    ("htb-preview.html", "htb-standalone-preview.html")
]

for src_name, dst_name in doc_files:
    sp = os.path.join(src_docs, src_name)
    dp = os.path.join(docs_target, dst_name)
    if os.path.exists(sp):
        shutil.copy2(sp, dp)

print("[4/5] Writing comprehensive README.md...")
readme_content = """# 🌿 高科生技官方網站 (Hi-Tech Biotechnology Co., Ltd)

> **「、、」> 致力於透過陸基循環水養殖海門冬（），。
- **線上正式營運站**：- **獨立靜態預覽**：--- **架構與驗收報告**：
---

## 📐 專案特色與設計規範

1. **頂級視覺語言**：   - 採用客戶指定深藍（）（）   - Header 與 Footer 配備 8x 超採樣重構之官方莫比烏斯環雙色分子圖標（）2. **純淨字體與排版**：   - 全站無孤兒字句，（。），   - Hero 標語精確微調：「」，「」「、、」3. **9 卡跨裝置自適應 Modal 彈窗互動**：   - 涵蓋五步商業閉環（）（）   - 桌面端與行動端均支援點擊彈出大圖與完整規格說明，，4. **真實科研證據**：   - 100% 採用水槽、、，   - 徹底杜絕非原生標籤，「」「」
---

## 🛠 技術架構 (Tech Stack)

- **核心框架**：- **建置工具**：- **樣式引擎**：- **圖標套件**：- **字體配置**：
---

## 🚀 快速開始 (Getting Started)

### 安裝依賴
```bash
pnpm install
# 或 npm install
```

### 本地開發預覽
```bash
pnpm run dev
# 或 npm run dev
```
啟動後瀏覽器打開 `http://localhost:5173` 即可即時預覽。
### 正式環境打包
```bash
pnpm run build
# 或 npm run build
```
打包產物將生成於 `dist/` 目錄，（）。
---

## 📂 目錄結構說明

```
htb-esggo-co/
├─── docs/                                          # 專案文檔與規格書
│   ├─── 高科生技新官網_完整規格書比對與驗收分析報告_v1.0.md  # 規格書 22 大章深度驗收對照
│   ├── htb-delivery-handover.md                   # 專案交付手冊
│   ├─── htb-site-architecture.md                   # P01-P24 資訊架構總表
│   └─── htb-standalone-preview.html                # 獨立自包含單檔預覽
├─── public/                                        # 靜態資源 (Logo, 試驗照片)
│   ├─── htb-logo.png                               # 官方超高清分子 Logo
│   └─── favicon.ico
├── src/                                           # Vue 3 原始碼
│   ├── components/                                # 模組化 UI 組件
│   ├─── views/                                     # 各頁面視圖
│   ├── assets/                                    # 樣式與媒體
│   ├── App.vue                                    # 根組件
│   └─── main.js                                    # 入口檔
├─── index.html                                     # 單頁入口
├─── package.json
├─── tailwind.config.js
└── vite.config.js
```

---

## 📜 授權與版權聲明

版權所有 © 2026 高科生物技術股份有限公司 (Hi-Tech Biotechnology Co., Ltd)。。"""

with open(os.path.join(target, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_content)

print("[5/5] Committing and pushing to remote main branch...")
subprocess.run(["git", "add", "-A"], cwd=target, check=True)
subprocess.run(["git", "commit", "-m", "feat(init): 初始化高科生技新官網完整交付包 (Hi-Tech Biotechnology Co., Ltd)"], cwd=target, check=True)
subprocess.run(["git", "push", "origin", "main"], cwd=target, check=True)

print("PACK_AND_PUSH_COMPLETED_SUCCESSFULLY")
