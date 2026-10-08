# Changelog

All notable changes to ESG-GO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **JunAikey 萬能永憶**: 代理成長層 + 雙後端 (NCBDB primary / local fallback)
- **OmniTag 整合**: 6 維 MECE 結構化標籤 (`security` / `agent` / `squad` / `lifecycle` / `priority` / `platform` / `best-practice`)
- **Puppeteer 自動化**: `cf-create-billing-token.mjs` 建 read-only Cloudflare billing token
- **VPS 優化工具**: `junaikey-optimize.mjs` 一鍵安裝 (Docker log rotation + 自動 prune + swap + sysctl)
- **測試套件**: 29 個零依賴測試 (10 junaikey + 19 omnitag)
- **效能基準**: `junaikey.bench.mjs` 量化各操作耗時
- **CI workflow**: `.github/workflows/test.yml` 自動跑測試

### Changed
- 重構 `junaikey.mjs` 從 758 行單檔 → 289 行 + 7 模組
- 統一 filter 邏輯 (server-side NCB /search 優先, client-side trim)
- 統一 datetime 處理 (ISO 8601 ↔ MySQL DATETIME 自動轉換)
- NCB JSON 欄位自動 parse (traits / tags / grownSkills)

### Fixed
- local backend readSkills: traits 不再過濾 (支援 OmniTag 6 維)
- NCB 寫入後讀寫延遲 (1-5s): 自動 retry 4 次
- writeSkills regex `\Z` JS 不支援 → 改 `(?=\n##|\s*$)`
- readProgress 使用 `updatedat` 對齊 NCB 小寫化欄位

## [1.0.0] - 2026-10-08

### Added
- Oracle 零成本遷移:esggo-vps 重建於 A1.Flex (4 OCPU/24GB) + 105GB boot
- 199GB/200GB 容量達標 (A1 free tier)
- 雙 remote 同步推 (origin + omniesggo)
- 20 個 docker 容器從 rsync 完整恢復 (portainer / sonarqube / deer-flow / minio / ...)
- Cloudflare Workers Builds CI 全綠

[Unreleased]: https://github.com/DingJun1028/esggo/compare/8eac2a656...HEAD
[1.0.0]: https://github.com/DingJun1028/esggo/releases/tag/1.0.0
