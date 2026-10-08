# Changelog

All notable changes to ESG-GO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (通典合規 Round 2)
- **FR-05 標籤血緣追蹤**: `getLineage()` + NCB `junaikey_lineage` 表 + 本地 `lineage.jsonl`。記錄每次 tag 新增/移除/level-promote
- **F-04 知識沉澱 L1-L5**: `growSkill({level})` + `promoteSkill()` + `getSedimentationStats()` + 5 個沉澱層級常數
- **FR-03 LLM 智慧標籤生成**: `autoTagFromLLM()` 整合本地 Ollama (`qwen2.5:3b-64k` 預設),6 維 prompt + 自動 validateOmniTag
- **OmniTag 結界 inheritance**: `applyBoundaryInheritance()` 自動將 `best-practice:結界` 從 master skill 擴散到同 agent/squad
- **Skill merge/rename**: `mergeSkills(src, dst, {newName})` 合併 traits+body,可重新命名
- **NCB proxy setup guides**: `auth_proxy_setup.md` (451 行) + `data_proxy_setup.md` (564 行) 完整 Next.js 整合模板
- **Cloudflare billing automation**: `cf-create-billing-token.mjs` (Puppeteer 自動建 read-only token)
- **VPS 優化**: `junaikey-optimize.mjs` (Docker log rotation + 自動 prune + swap + sysctl)
- **CI workflow**: `.github/workflows/test.yml` Node 18/20/22 矩陣測試
- **44 個零依賴測試** (10 junaikey + 19 omnitag + 15 canon)
- **PRD-COMPLIANCE.md** 通典合規審查報告 (21 項 7/6/8 → 76% 修正後)

### Changed
- 重構 junaikey.mjs 從 758 行 → 289 行 + 7 模組 (schema/util/tags/dispatcher/operations + 2 backends)
- 統一 filter 邏輯 (server-side NCB /search 優先, client-side trim)
- 統一 datetime 處理 (ISO 8601 ↔ MySQL DATETIME 自動轉換)
- NCB JSON 欄位自動 parse (traits/tags/grownSkills)
- NCB tables 名稱 env-overridable (`NCBDB_TABLE_SKILLS=skills` 等)
- 移除 growSkill 對 SKILL_TRAITS 的過濾 (允許 OmniTag 6 維)
- vps/junaikey-setup.mjs TABLES 改為 env-aware

### Fixed
- local backend readSkills: traits 不再過濾,支援 OmniTag
- NCB 寫入後讀寫延遲 (1-5s): 自動 retry 4 次 (`_listAllWithRetry`)
- writeSkills regex `\Z` JS 不支援 → `(?=\n##|\s*$)`
- readProgress 使用 `updatedat` 對齊 NCB 小寫化欄位
- readSkills markdown 解析: `(Lx)` 與 `[traits]` 並存
- 衝突檢測:同 key 多 value 與預定義規則去重
- NCB health probe 改用實際 skills table (舊 probe 用 name_1,不存在會誤判)

### NCB Tables (用戶在 Dashboard 手動建)
- 5 tables: `skills` / `memory` / `progress` / `journal` / `lineage`
- 短名 (無 junaikey_ 前綴),用 `NCBDB_TABLE_*` env 覆寫
- **已知限制**: NCB 不支援 add-column。F-04 `level` 欄位需用戶手動加到 `skills` 表才能在 NCB 端持久化;本地端不受影響

### 通典合規度 (Omniesggo OMN-PRD-001 v1.0)
- 之前: 52% (21 項 7 合規/6 部分/8 未合規)
- 現在: **76%** (FR-03, FR-05, F-04, NFR-01 全綠)
- 待用戶: Cloudflare 最小權限 token + NCB skills 加 level column

## [1.0.0] - 2026-10-08

### Added
- Oracle 零成本遷移:esggo-vps 重建於 A1.Flex (4 OCPU/24GB) + 105GB boot
- 199GB/200GB 容量達標 (A1 free tier)
- 雙 remote 同步推 (origin + omniesggo)
- 20 個 docker 容器從 rsync 完整恢復 (portainer / sonarqube / deer-flow / minio / ...)
- Cloudflare Workers Builds CI 全綠

[Unreleased]: https://github.com/DingJun1028/esggo/compare/8eac2a656...HEAD
[1.0.0]: https://github.com/DingJun1028/esggo/releases/tag/1.0.0
