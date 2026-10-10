---
title: Hermes × Obsidian 生態掃描 2026-10
canon_id: OMN-LOG-005
date: 2026-10-09
tags: [unit-of-learning][hermes][obsidian][llm-wiki][audit][best-practice:awakened]
canonical: [[AI Research Index]]
---

# OMN-LOG-005 · Hermes × Obsidian 生態掃描 — 2026-10

> 本檔為 unit-of-learning：掃描 2026 外部生態教學（文章 ×2、LiveSync 教程、B 站影片），
> 對照本機實際環境逐一稽核並收斂做法。
> 連結至 [[AI Research Index]] / [[12大萬能 OMNI-CANON]] / [[5T Protocol]] / [[創世實錄 — 萬能開發 奧義 v2026-10]]

---

## 0. 一行總結

本機 Hermes × Obsidian 第二大腦已是生態標杆：Hermes v0.21.6+141（git 安裝、Nous Research）/
iCloud vault（OMN canon，20 檔 / 252 連結 / 0 斷鏈）/ 免費同步。
四份外部教學「概念層」全對，「落地細節」多數不適用本機；僅 LiveSync 教程（詳細見 §2.3）提供值得納入的「手機即時雙向同步」選項。

---

## 1. 掃描資源清單

| # | 資源 | 作者 / 來源 | 日期 | 性質 |
|---|---|---|---|---|
| 1 | Hermes x Obsidian 全方位指南 | 清涼遊俠（內容平台貼文，無 URL 提供） | 2026-05-27 | AI 生成體教學文 |
| 2 | Obsidian AI 第二大腦完整指南 | NxCode Team（nxcode.io）| 2026-02-21 | 行銷文（no-code 平台自帶 CTA）|
| 3 | How I set up Obsidian Second Brain for My Hermes Agent | Fahd Mirza（= moghalsaif，obsidian.procss.online）| 2026-08 起 | 個人實戰教程 + LiveSync 架構 |
| 4 | 【全网最细】Hermes+Obsidian+本地LLM 知識庫（BV13ZLw6TEon）| 吴恩达Agent-（B 站，非吳恩達本人）| 2026-05-18 | 教學影片（無字幕、描述空）|

---

## 2. 各資源稽核結論

### 2.1 清涼遊俠〈Hermes x Obsidian 全方位指南〉
- ✅ 正確：Hermes 由 **Nous Research** 開發維護（本機 `hermes-agent/README.md` 實證 "Built by Nous Research"、MIT）；Obsidian 本地 Markdown / 雙鏈 / 圖譜。
- ❌ 不適用：`D:\AI\Claude Code Haha`（不存在）、`claude-haha` / `claude` CLI（PATH 上零）。
- ❌ 機制錯：無 `skill install` 命令（`hermes --help` 無 skills 子命令）；本機技能＝資料夾 + 自動學習（`~/.hermes/skills` 現役 20 個）。
- ❌ vault 路徑錯：`hermes-wiki` ≠ 實際 `iCloud~md~obsidian/DingJun`；無 raw/entities/concepts/comparisons 結構。

### 2.2 NxCode〈Obsidian AI 第二大腦〉
- ✅ 本機相符：Copilot / Templater / Dataview / Calendar 皆已安裝；Ollama 本地模型（qwen2.5:3b-64k + nomic-embed-text 兩個，2026-10-10 收斂：qwen2.5:3b tag 已併入 3b-64k）。
- ❌ 未安裝：Smart Connections / Nova / Smart Second Brain；`obsidian-mcp-server` / `~/.claude/settings.json`。
- ◐ 本機對應物更強：`hermes-agent` Obsidian 插件 + opencode 的 Hermes local MCP ＋ `omnisearch`，取代「Claude Code + MCP」；`github-sync` / `obsidian-git` / `remotely-save` **免費**取代 $5 Sync。
- ✅ 上下文工程五原則（原子筆記 / frontmatter / wikilinks / 標籤 / 命名）：本機 OMN canon 已內化並超標。

### 2.3 Fahd Mirza〈Obsidian Second Brain for Hermes Agent〉（LiveSync 教程）
- ✅ 概念同構：Karpathy LLM Wiki（`index.md` 導覽 / raw 證據層 / 編譯式維基）+ 可信連結檢索 —— 與本機 OMN canon（Index Registry + canon_id + 圖譜閉環）同思路。
- ✅ Self-hosted LiveSync：端到端加密、憑證自 secret store 取（**不把密碼貼進 wiki**）、Setup URI 一把同步到手機 —— 本機目前用 iCloud + github-sync（免費），LiveSync 是「手機即時雙向」的升級選項（需自架 CouchDB 後端）。
- ✅ 可複製提示詞模式：`sales-wiki-maintainer`（index → 只選相關頁 → 引證來源 → 衝突並存標記）與本機 5T / 引用紀律一致。
- 啟示：手機端若有更高同步需求 → 納入 LiveSync 評估計畫。

### 2.4 B 站《Hermes+Obsidian+本地LLM 知識庫》（BV13ZLw6TEon）
- 描述 = 標題重複、**無字幕**（player/v2.subtitles=[]）→ 無法逐字稽核；標題「全网最细／99% 弯路」為流量文套路。
- 標題骨架（安裝 Hermes + 本地 LLM + LLM-Wiki 自動整理）＝本機已走完之路。
- ✅ 已用 Jina/API 取得 metadata：UP 主「吴恩达Agent-」、4912 播放 / 174 讚 / 632 收藏。

---

## 3. 收斂：本機該 / 不該做

| 建議 | 判定 |
|---|---|
| 維持現有免費同步主力（iCloud + github-sync + obsidian-git）| ✅ 不動 |
| 若需「手機即時雙向 + E2E 加密」：評估 Self-hosted LiveSync（自架後端）| ◐ 選配，不阻塞 |
| 補 `SCHEMA.md` 層（給 AI 看的知識庫規範），補足「index 導覽」缺口 | ✅ 擬補 |
| 外部教學用詞（`skill install` / claude）→ 統一改標本機事實（`hermes chat` / opencode MCP）| ✅ 已內化 |
| 持續用 OMN canon 當唯一知識組織基準，不照搬 raw/entities/concepts | ✅ 維持 |

---

## 4. 稽核方法（可複用）

- 驗證可執行聲明：PATH / 目錄存在 / 版本 / config 檔實測，不靠猜。
- 文件全文抓取：webfetch；B 站走 `api.bilibili.com`（view / player/v2）避開網頁 412；被擋時用 `r.jina.ai` 代理。
- 誠實界線：無字幕 / 描述空 → 不編造內容（本檔第 2.4 節即演示）。
- 標記每項：✔️ 正確 / ❌ 不適用 / ◐ 部分。

---

## 相關連結（向下鑽研）

- [[AI Research Index]] — 全 vault 索引
- [[12大萬能 OMNI-CANON]] — 12 維度架構
- [[創世實錄 — 萬能開發 奧義 v2026-10]] — 萬能開發紀錄
- [[5T Protocol]] — 5 維度驗證條款
- [[OmniTag Universal Labeling Contract]] — 標籤契約
- [[Best Practice Awakening]] — 結界繼承治理
- [[OMNITAG/Root Cause × Effect Elimination]] — 果因消除

---

<sub>Hermes × Obsidian 生態掃描 v2026-10 | 無作妙德・圓通無礙・永恆覺醒 [best-practice:awakened] | License: AGPL-3.0</sub>