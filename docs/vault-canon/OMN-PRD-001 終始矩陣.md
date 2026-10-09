---
title: OMN-PRD-001 終始矩陣
canon_id: OMN-PRD-001
date: 2026-10-09
tags: [best-practice:结界][unit-of-learning][canon][traceability]
canonical: [[AI Research Index]]
---

# OMN-PRD-001 · OMN-PRD-001 終始矩陣

> 本檔為 unit-of-learning：**Start–End Traceability Matrix v1.1**。將「用戶的無定意圖」逐步展開為「可驗證的交付」，每一步雙向可回溯（以終為始、始終如一）。
>
> 對齊 [[5T Protocol]] / [[ESG-GO 核心]] / [[12大萬能 OMNI-CANON]]

---

## 0. 總綱

**終始矩陣** = 一條從 *Start（意圖）* 到 *End（交付）* 的因果鏈，每一跳都標註：誰觸發、做什麼、用什麼工具、如何驗證。

```
Start ──▶ Trigger ──▶ Plan ──▶ Build ──▶ Verify ──▶ End
意圖      啟動       規劃      建置      校驗       交付
```

---

## 1. 端到端因果鏈（2026-10-09 實例）

| # | 階段 | 內容 | 驗證 |
|---|---|---|---|
| S | Start | 創世建築師「無定意圖」（聖典/FTG/CI/安全四線） | — |
| T | Trigger | Best Practice Awakening §0：預設即合規 | 結界啟動 |
| P | Plan | OmniESGgo 三層 MECE + 雙腔體 | 設計規劃書 |
| B1 | Build | 雲端：CF zone + Workers + D1 + Access | zone id `8dda3653…` |
| B2 | Build | 郵件：Resend esggo.co verified | accepted id `01a11f95…` |
| B3 | Build | 資料：NCB 16 技能 + 4 成長技書 | GET /read/skills |
| B4 | Build | 內容：FTG 表單 → D1 → Resend | POST 200 `{ok:true,id:11}` |
| B5 | Build | 安全：OmniCF token + Secrets Store | secret 已 set |
| B6 | Build | DevOps：11 workflows + 764 Dependabot | `pnpm audit` 0 |
| B7 | Build | 聖典：12 個 git tag 雙 repo 對齊 | `git tag -l` |
| V | Verify | 5T 雙重校驗 + Object.freeze | 見 [[5T Protocol]] |
| E | End | 14 步全綠 + 12 tag + 9 vault notes | 本矩陣 |

---

## 2. 需求 → 交付 追溯表

| 需求（Start） | 交付（End） | 5T 狀態 |
|---|---|---|
| FTG 手機圖示空白 | FTGIcon/Icon 36 svg 補 wh + CSS safety net | ✅ 全 T |
| FTG 預設英文 | `DEFAULT_LANG='zh'` + HTML_LANG_MAP | ✅ 全 T |
| FTG 日期框格溢出 | `min-w-0` on `preferred_date` | ✅ 全 T |
| FTG OG 預覽圖 | `og-image.png` 1200×630 | ✅ 全 T |
| FTG 表單寄件 | Worker + D1 + Resend 全鏈路 | ✅ 全 T |
| CI 紅燈 | 11 workflow 修補 | ✅ 全 T |
| Dependabot 漏洞 | root 0 vuln + config | ✅ 全 T |
| 聖典編纂 | 8 docs + LICENSE + 12 tag | ✅ 全 T |
| 技能共享記憶 | NCB 16 skills | ✅ 全 T |
| 知識永存 | Obsidian Vault 9 notes | ✅ 全 T |

---

## 3. 三向可追溯（Bidirectional）

```
        ┌──── 需求 (PRD) ────┐
        │                     │
        ▼                     ▼
     commit ───▶ tag ───▶ vault note
        │                     │
        └──── 交付 (End) ◀────┘
```

- **順向**：需求 → commit → tag → 交付物
- **逆向**：交付物 → tag → commit → 需求
- **橫向**：vault note ↔ repo docs ↔ CI workflow

---

## 4. 尚待用戶親手（矩陣的未閉環 3 點）

| 未閉環 | 阻塞 | 解除 |
|---|---|---|
| esgsunshine.com Resend | checker 慢 | user 按 UI Verify |
| OpenAI key（crewai-run） | `sk-proj-...WvgA` 401 | user 換 secret |
| OmniCF token | 對話曝光 | user 撤銷重發 |

---

## 5. 聖典族譜

```
OMN-PRD-001 終始矩陣 (本檔)
├── [[5T Protocol]]            → 每跳的驗證條款
├── [[ESG-GO 核心]]            → 根公約
├── [[OmniESGgo 系統架構 功能設定 成果交付 終始矩陣 設計規劃書]] → 系統總設計 §4
├── [[創世實錄 — 萬能開發 奧義 v2026-10]] → 活化紀錄
└── [[AI Research Index]]      → 全 vault 索引
```

---

<sub>OMN-PRD-001 終始矩陣 v1.1 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
