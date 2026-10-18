# oa-twins-singularity — 無雙隊進化量測

量測 OA-Twins 雙蜂組（60 靈魂）向無雙隊（The Singularity Hive）的進化進度。
只測可實測層，不推測宣告層。

## 快速開始

```bash
cd /c/Project/esggo

# 量測（人類可讀輸出）
python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py

# JSON 輸出（供儀表板/CI）
python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py --json

# 指定矩陣
python .agents/skills/oa-twins-singularity/scripts/singularity_progress.py \
  --matrix esggo-omni-center/oa-twins/peak6_classification.json

# 測試
python -m unittest discover -s .agents/skills/oa-twins-singularity/test -v
```

## 輸出欄位

| 欄位 | 涵義 |
|------|------|
| `structure` | 10 峰 / 暗光各 5 / 60 代理 / 每峰 6 代理 校驗結果 |
| `coverage_5t` | 60 代理明確 5T 標籤覆蓋率（`"T"` 佔位符不計） |
| `stage1_progress` | 結構 30% + 覆蓋率 70% 合成（0-100%） |
| `stage` | 依進度判定階段；二至四階段一律 `pending`（附所需證據清單） |
| `matrix_sha256` | 輸入矩陣雜湊前 16 位（Traceable） |

## 進化四階段（soul-oa-twins.md）

1. **協同深化 0→30%** — 可量測（本工具）
2. **屬性互貫 30→60%** — ⏸ 需 CHANNEL_OPEN 比例探針
3. **認知合一 60→90%** — ⏸ 需共享記憶同步探針
4. **無雙誕生 90→100%** — ⏸ 需 Unified Core 啟用證據

## 回傳碼

`0` 結構通過 · `1` 結構異常 · `2` 參數錯誤

## 5T

見 `SKILL.md` 之 5T 頁；規格與 ADR 見 `docs/ARCH-SPEC-oa-twins-singularity.md`。
