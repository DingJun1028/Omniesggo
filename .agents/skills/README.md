# agents/skills — Omniesggo 技能套件

> 萬能 ESG-GO 的 AI 代理技能套件，包含 30+ 個技能模組。
> 每個技能包含 `SKILL.md`（輸入/輸出規範）與可選資源檔（`README.md`、`references/`、`scripts/`、`tests/`、`templates/`）。

---

## 技能列表

| 技能 | 類別 | 狀態 |
|------|------|------|
| [accidental-data-loss-prevention](accidental-data-loss-prevention/) | 安全 | ✅ |
| [adk-boundary](adk-boundary/) | 邊界控制 | ✅ |
| [best-practice-awakening](best-practice-awakening/) | 最佳實踐 | ✅ |
| [data-autocleaning](data-autocleaning/) | 資料清理 | ✅ |
| [encoding-forensics](encoding-forensics/) | 編碼分析 | ✅ |
| [esggo-omniskill](esggo-omniskill/) | ESG 技能 | ✅ |
| [esggo-standards](esggo-standards/) | 標準規範 | ✅ |
| [eslint-optimizer](eslint-optimizer/) | 程式碼優化 | ✅ |
| [gcloud-auth-verification](gcloud-auth-verification/) | 雲端認證 | ✅ |
| [github-actions-fixer](github-actions-fixer/) | GitHub Actions | ✅ |
| [global-healing](global-healing/) | 全域治理 | ✅ |
| [junai-sovereign-ultimate](junai-sovereign-ultimate/) | 集體智慧 | ✅ |
| [junaikey](junaikey/) | 開發者金鑰 | ✅ |
| [lhub-ai-routing](lhub-ai-routing/) | 路由 | ✅ |
| [managing-python-dependencies](managing-python-dependencies/) | Python 管理 | ✅ |
| [ml-best-practices](ml-best-practices/) | ML 最佳實踐 | ✅ |
| [notebook-guidance](notebook-guidance/) | 筆記指引 | ✅ |
| [oa-ecosystem-best-practices](oa-ecosystem-best-practices/) | OA 生態 | ✅ |
| [oa-team-bee-colony](oa-team-bee-colony/) | 蜂群協作 | ✅ |
| [omni-bitwarden](omni-bitwarden/) | 萬能金庫 | ✅ |
| [omni-sync-memory](omni-sync-memory/) | 同步記憶 | ✅ |
| [omnibase-global-healing](omnibase-global-healing/) | 基礎治理 | ✅ |
| [omnitag](omnitag/) | 標籤管理 | ✅ |
| [pdf-decoder](pdf-decoder/) | PDF 解析 | ✅ |
| [python-ci-setup](python-ci-setup/) | Python CI | ✅ |
| [react-quality-fix](react-quality-fix/) | React 品質 | ✅ |
| [render-*` (20+ 個) | 系統佈署 | ✅ |
| [skill-repair](skill-repair/) | 技能修復 | ✅ |
| [smart-ai-router](smart-ai-router/) | 智能路由 | ✅ |
| [supabase](supabase/) | Supabase | ✅ |
| [supabase-postgres-best-practices](supabase-postgres-best-practices/) | 資料庫最佳實踐 | ✅ |
| [web-design](web-design/) | 網頁設計 | ✅ |
| [xcode-project-setup](xcode-project-setup/) | Xcode | ✅ |
| [zkp-seal](zkp-seal/) | 零知識證明 | ✅ |

---

## 技能文件結構

每個技能目錄應包含：

```text
skill-name/
├── SKILL.md          # 輸入/輸出規範（必需）
├── README.md         # 使用者指南（可選）
├── references/       # 參考資料（可選）
├── scripts/          # 自動化腳本（可選）
├── templates/        # 模板檔案（可選）
├── tests/            # 測試檔案（可選）
```

### `SKILL.md` 必須標頭

每個 `SKILL.md` 開頭需有 YAML frontmatter：

```yaml
---
title: 技能名稱
name: skill-name
description: 一句話說明技能用途
category: category-name
version: 2.0.0
author: Hermes Agent
license: AGPL-3.0
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [tag1, tag2]
    category: security
    related_skills: [related1, related2]
---
```

---

## 安裝與更新

### 本地開發

```bash
# 1. 更新技能套件
bash scripts/update-agent-skills.sh

# 2. 檢查技能一致性
bash scripts/update-agent-skills.sh check

# 3. 更新索引
bash scripts/update-agent-skills.sh index
```

### GitHub Actions

技能文件會在 CI 期間自動檢查：

```yaml
- name: 檢查技能文件
  run: bash scripts/update-agent-skills.sh check
```

---

## 技能一致性檢查

`scripts/update-agent-skills.sh` 會檢查：

| 檢查項目 | 說明 |
|----------|------|
| SKILL.md 存在 | 每個技能必須有 `SKILL.md` |
| Frontmatter 合規 | 必須包含 `title`, `name`, `description`, `category`, `version` |
| 自動更新 | 針對 `agents/skills/*` 自動掃描 |
| 索引更新 | 生成 `skills/index.md` 供快速查閱 |

---

## 引用文件

- [OmniBitwarden 技能](omni-bitwarden/) — 萬能金庫系統（v2.0.0）
- [Web Design 技能](web-design/) — RWD/UI/UX 最佳實踐
- [Omniesggo 解說聖典](../vault-canon/Omniesggo 解說聖典.md) — 萬能 ESG-GO 名詞解說（20 個名詞 × 8 項）
