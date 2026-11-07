---
title: OmniCapture — 万能擷取 · 自動詳細文檔分析
canon_id: OMN-CAPTURE-001
date: 2026-11-02
tags: [omniesggo][omnicapture][ollama][zero-compute][document-analysis][auto-extract]
canonical: [[AI Research Index]]
---

# OmniCapture — 万能擷取 · 自動詳細文檔分析

> OmniCapture（万能擷取）負責 **自動將所有型別檔案做詳細文檔分析**，並使用 **Ollama 零算力機制**（本地 CPU 推論，零雲端算力成本）進行摘要、標籤、向量化與知識抽取。

## 0. Ollama 零算力機制

| 項目 | 值 |
|---|---|
| 引擎 | Ollama 0.40.13（本地，Windows） |
| 安裝路徑 | `C:\Users\Administrator\AppData\Local\Programs\Ollama` |
| 推論模型 | `qwen2.5:3b`（1.9 GB，CPU 推論） |
| 嵌入模型 | `nomic-embed-text`（274 MB，向量） |
| 算力成本 | **零雲端算力**（全本地 CPU） |
| API 端點 | `http://127.0.0.1:11434` |

## 1. 支援檔案型別（OmniCapture 全型別）

| 型別 | 處理方式 |
|---|---|
| `.md` / `.txt` | 直接文字抽取 + LLM 摘要/標籤 |
| `.pdf` | 文字層抽取 → LLM 摘要 |
| `.docx` / `.pptx` / `.xlsx` | 轉文字 → LLM 摘要 |
| `.json` / `.yaml` / `.toml` | 結構解析 + 欄位摘要 |
| 圖片（`.png/.jpg/.webp`） | OCR（Tesseract）→ LLM 摘要 |
| 程式碼（`.ts/.py/.js/...`） | AST/結構摘要 + 依賴分析 |

## 2. 自動分析流程（OmniCapture pipeline）

1. **擷取（Capture）**：檔案進入 vault `OmniCapture/inbox/`。
2. **型別偵測**：依副檔名與 MIME 判斷型別。
3. **文字抽取**：依型別走對應抽取器。
4. **LLM 分析（Ollama 零算力）**：qwen2.5:3b 產生摘要、關鍵字、標籤、實體。
5. **嵌入（Embedding）**：nomic-embed-text 產生向量，寫入本地向量庫。
6. **歸檔**：分析結果寫入 `OmniCapture/analysis/<原檔名>.md`，原檔移至 `OmniCapture/archive/`。

## 3. 輸出格式（分析筆記 frontmatter）

```yaml
---
title: <原檔名> — OmniCapture 分析
canon_id: OMN-CAP-<hash>
source: <原檔路徑>
source_origin: omnicapture
analyzed_at: <ISO8601>
model: qwen2.5:3b
embed_model: nomic-embed-text
tags: [...]
---
```

## 4. 目錄結構

```
OmniCapture/
├── inbox/        # 待分析檔案投遞區
├── analysis/     # 分析結果筆記
├── archive/      # 已分析原檔歸檔
└── failed/       # 分析失敗檔案
```

## 5. 連結

- [[OmniNote — 万能筆記 · 第二共享大腦]] — 万能筆記
- [[OBSIDIAN-SHARED-BRAIN-SYNC]] — 共享大腦同步

---
<sub>OmniCapture v2026-11-02 | source_origin: hermes-agent | License: AGPL-3.0</sub>
