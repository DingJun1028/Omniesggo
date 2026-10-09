"""esggo.knowledge — 共享知識庫與永恆記憶核心。

萬能蜂群 30 代理（及雙蜂 60 代理）共同使用的共享資料庫：
接收代碼、文字、任何格式的資料，作為所有代理共同使用的「主要資料庫流程」。

5T 對映:
  Traceable — 每筆資料帶 source_origin + content_sha256 + 代理錨點 (source_origin)
  Trackable — 生命週期事件 (ingest/link/annotate/seal/consume) 進 events 表
  Tangible  — CLI 即時回傳 URIs / 摘要 / 鎖資訊 / 事件流
  Transparent — 模式、治理區塊、版本號公開；內容可解壓 / 讀回
  Trustworthy — Hash Lock + 版本鎖；鎖定後不可覆寫

入口:
  scripts/esggo-knowledge  (或: pip install -e . 後用 esggo-knowledge)
"""

__version__ = "1.0.0"

# ── 5T 驗證後才可寫入的索引鍵 ──────────────────────────────
SOURCE_ORIGIN_CANON = "soul.md::OA-Team-30-Matrix"

# 永恆記憶模型版本（供跨 session 與手機字碼互操作）
MODEL_VERSION = "1"
