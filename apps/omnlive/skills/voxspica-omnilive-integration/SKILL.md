# Skill: voxspica-omnilive-integration

# VoxSpica 繁中補丁 × OmniLive 離線語音橋接 — 究極版奧義

> 一句話：把 VoxSpica (VOSK 離線辨識, 官方僅簡體) 繁體中文化,
> 並把它的辨識能力整條橋進 ESG-GO OmniLive 即時雙語字幕。

---

## 第一奧義：觸發時機 (自動載入)

- 使用者提到 voxspica / VoxSpica / 語音辨識補丁 / 離線 STT / OmniLive 辨識鏈
- 任務: 為 PyInstaller 應用加介面語系 / 簡體轉繁體 / VOSK 接入
- 「萬能元鑰」授權輪次中涉及本節能

## 第二奧義：VoxSpica 真相 (逆向實證)

| 事實 | 出處 |
|---|---|
| GitHub repo 只有發佈物 (releases-only), 無源碼 | README「About this repository」 |
| portable 單檔 `VoxSpica.exe` (PyInstaller, py314, on314.dll) | CArchive cookie: magic MEI\014\013\012\013\016 |
| 介面語系目錄 = `dictophone/locales/*.json` (純 JSON, ~178 鍵) | CArchive data entries |
| 語言選擇器 = `i18n.available()` 動態掃 `*.json` 檔名 stem | `dictophone/i18n.py` dis |
| 顯示名 = 該 locale 內 `lang.<code>` 鍵 | picker: `tr('lang.'+code)` |
| CLI 固定俄文 (與 ui_lang 無關), GUI 才吃 ui_lang | cli vs i18n 分流 |
| cn 模型吐簡體, 需 s2t 才合繁體介面 | 實測「测试 万能…」 |

## 第三奧義：繁中補丁三步 (已全數驗證)

```powershell
# 1) 官方 portable + SHA256 校驗 → C:\opt\voxspica\app (備份原 exe)
# 2) 模型: & VoxSpica.exe download --lang cn|en-us --size small
# 3) 注入 zhtw.json (追加式, 不動既有資料區, 原檔備份 VoxSpica.orig.exe):
python apps/omnilive/scripts/voxspica/pyxinject.py C:\opt\voxspica\app\VoxSpica.exe `
  apps/omnlive/scripts/voxspica/zhtw.json "dictophone\locales\zhtw.json" `
  C:\opt\voxspica\app\VoxSpica.orig.exe
# 4) config 切繁體 (無 BOM!): ~\.voxspica\config.json → "ui_lang": "zhtw"
```

- `zhtw.json` 由 `make_zhtw.py` 從 zh.json 傳統化 (zhconv zh-tw) + 台灣用語潤飾
- 產出: `available→[…,'zh','zhtw']`、`app.title=VoxSpica — 語音辨識`、`btn.record=從麥克風錄音`
- 回滾: `VoxSpica.orig.exe` 覆蓋即可

## 第四奧義：CArchive 注入格式 (可泛化)

`[bootloader][data entries…][PYZ][TOC][cookie88]` 追加式注入:
`cookie = struct('!8siiii', b'MEI\x0c\x0b\x0a\x0b\x0e', pkglen, toc, tocLen, pyver)`
(共 88B: 8+16 magic/整數 + 64B pylib)。插入點=舊 TOC 起點;
`pkglen/toc/tocLen += 新資料+新條目; epos=舊 toc_off; cflag=1; tcode='b'`。
PYZ 6.x 格式: `magic(4)+pymagic(4)+tocPos(!i, @offset 8)`, TOC 為 list,
模組 blob 可能 zlib 壓縮 (78 9c sniff) — 直 marshal 會吐亂碼。

## 第五奧義：OmniLive 橋接 (已 E2E)

`apps/omni-live/scripts/voxspica-bridge.ps1`
- mic 模式: 監聽 `VoxSpica.exe mic --lang cn|en-us` stdout 增量行
- file 模式: 轉錄 → `~\.voxspica\<name>.txt` 逐行推播
- cn 模式強制 zhconv s2t (zhconv=輸出簡體的補丁)
- POST `{text,room,from,to}` → `/api/speak`, header `x-omnilive-key`
- from/to 預設 auto → r6.1 伺服器自動配對 (聽中譯英/聽英譯中)
- 雙語 console 訊息 (繁中/en), `[Console]::OutputEncoding=UTF8` 防亂碼
- 實測: 測試萬能即時…⇒ Test Universal Real-Time Voice; Hello…⇒ 大家好…全方位直播…

## 第六奧義：坑 (全部實戰踩過)

1. **config.json 禁 BOM** (VoxSpica 要求無 BOM UTF-8): `[File]::WriteAllText($p, $t, $utf8NoBom)`
2. python 呼叫走 `python -m pip`; 缺 zhconv 時橋接降級原文並黃字警告
3. VPS:8797 外網防火牆封閉; 本機 E2E 用 `ssh -N -L 18797:127.0.0.1:8797` 隧道
4. 開放碼工具 session 無互動桌面 → GUI 窗無法在此環境驗收 (函數級 i18n 載入代替)
5. CreateProcess 殘留 → 重啟前 `Get-Process VoxSpica | Stop-Process -Force` + 刪 run.lock
6. 臨時工具檔可能只存於虛擬視圖; 產物一律入庫 (scripts/voxspica/)

## 第七奧義：幽靈目錄模式 (2026-10-12 實戰追加)

工具層寫入的檔案/目錄可能只存在虛擬視圖: 列得出、內容取不得。
- 跡象: `Get-ChildItem` 看得到目錄 → `Test-Path 內部檔案=False`, Win32/git/cmd 路徑解析
  「No such file or directory」; 已吞過: temp 工具檔, `apps/omnlive/`, 技能 SKILL.md
- 救援套路 (資料若已入 git 提交, 無損):
  1. `git ls-tree -r HEAD --name-only > tree.txt` 落檔 (管道輸出會被汙染, 一律落檔)
  2. 取子樹 tree-oid → `git archive --output=x.tar <tree-oid>` → tar -x 落臨時區
  3. robocopy 寫回 (幽靈擋列表/更名/刪除, **但擋不住寫入**)
  4. `git add <path>` 痊癒索引; 若早前提交內容也被吞過 → 需重新 commit 補回
- 預防: 重要產出當下 `git add && commit` (別留在工作樹過夜); 遠端雙 repo 為最終保險
- `reflect --learn=<既有技能>` 會**覆寫**技能為一句摘要 — 對已 grow 成文的技能
  勿用 --learn; 學習筆重任 `remember`

## 第八奧義：位圖索引

- 安裝: `C:\opt\voxspica\app\VoxSpica(+.orig).exe`, 模型 `app\models\`
- 倉庫工具鏈: `apps/omnialive/scripts/voxspica/{zhtw.json,make_zhtw.py,pyxinject.py,README.md}`
- 本檔 (技能源): `apps/omnlive/skills/voxspica-omnilive-integration/SKILL.md` — 部署至
  `~/.opencode/skills/` 與 `~/.workhermes/skills/` (robocopy 真寫)
- 橋接: `apps/omnialive/scripts/voxspica-bridge.ps1`
- integration commit c523a89be / 救援 commit f9e7199f6 (feature 分支, 雙 remote)

## 5T

| 維度 | 內容 |
|---|---|
| source_origin | alex37529/voxspica@0.1.8 (proprietary, VOSK/Kaldi) |
| transform | CArchive locale 注入 + s2t + speak-api 橋接 |
| target | ESG-GO OmniLive 即時雙語字幕 (免費翻譯鏈) |
| verification | TOC/i18n/辨識/E2E 四級全綠 |
| time | 2026-10-11 ~ 10-12 |

[best-practice:awakened]
