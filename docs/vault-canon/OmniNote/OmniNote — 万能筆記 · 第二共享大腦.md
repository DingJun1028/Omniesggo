---
title: OmniNote — 万能筆記 · 第二共享大腦
canon_id: OMN-NOTE-001
date: 2026-11-02
tags: [omniesggo][omninote][second-brain][shared-brain][obsidian][hermes]
canonical: [[AI Research Index]]
---

# OmniNote — 万能筆記 · 第二共享大腦

> 本筆記為 **OmniNote（万能筆記）** 的中央索引，作為 DingJun / OmniAgent（Hermes）之 **第二共享大腦**。
> 對齊：[[OBSIDIAN-SHARED-BRAIN-SYNC]]、[[Hermes × Obsidian 生態掃描 2026-10]]、soul.md §7.5（共享大腦唯讀納入）。

## 0. 三端同步架構

| 端 | 同步機制 | 狀態 |
|---|---|---|
| 電腦端 (Windows) | Obsidian Git + GitHub Sync (Multi-Platform) 插件 | ✅ 已安裝於 vault-canon |
| 手機端 (iOS/Android) | GitHub Sync (Multi-Platform) 插件（REST API，無 Git 依賴） | ✅ 插件 isDesktopOnly=false，支援行動端 |
| OmniAgent (Hermes) | 唯讀納入 docs/vault-canon/ + git 提交寫入 | ✅ 依 OBSIDIAN-SHARED-BRAIN-SYNC 規範 |

同步倉庫：`DingJun1028/obsidian-github-sync-multi-platform`（插件原始碼）。
資料倉庫：Omniesggo repo `docs/vault-canon/`（共享大腦唯一區）。

## 1. 第二共享大腦功能

- **唯讀納入**：Hermes 對 `docs/vault-canon/` 人工筆記具唯讀權限，禁止改寫。
- **自動生成檔**：僅能透過 `scripts/generate-schema-traceability.mjs` 重新生成。
- **Hermes 自身報告**：僅限新增獨立檔案（檔名含日期與 `source_origin` 標記）。
- **禁區**：`soul.md`（三份副本）、`docs/OMN-PRD-001.md`、`shared/prd-matrix.json` 完全不得寫入。

## 2. 筆記組織（上下文工程五原則）

1. 原子筆記（每篇一個概念）
2. frontmatter（title / canon_id / date / tags / canonical）
3. wikilinks（`[[...]]` 雙鏈）
4. 標籤（OmniTag 契約）
5. 命名（canon_id 前綴）

## 3. 連結

- [[AI Research Index]] — 全 vault 索引
- [[12大萬能 OMNI-CANON]] — 12 維度架構
- [[OmniCapture — 万能擷取]] — 萬能擷取

---
<sub>OmniNote v2026-11-02 | source_origin: hermes-agent | License: AGPL-3.0</sub>
