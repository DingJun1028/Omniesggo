# source_origin: AI Station §9.4 / §9.9 - Brand Preset (single source of truth)
"""Brand preset: 創價未來｜壽司博士 Dr. Source.

Encodes the channel planning bible (v1.0, 楊坤修博士 / 善向永續 ESG Sunshine)
as a first-class AI Station brand preset so the pipeline can produce
on-brand videos without re-explaining the brand every run.

This module is the SINGLE SOURCE OF TRUTH for brand colors and DNA markers
(soul.md §9.9). ``src/visuals/image_gen.py`` imports ``PALETTE`` from here so
the visual layer can never drift from the brand (5T: Tangible consistency).
"""

from __future__ import annotations

# ---- Brand palette (規劃書 §8.1) ----
# 5T Tangible: these exact hex values are the verified brand identity.
PALETTE = {
    "deep_blue": "#10243f",   # 思考與專業
    "warm_gold": "#c9a24b",   # 智慧與善意
    "rice_white": "#f3ede1",  # 人性與留白
    "green": "#3c6e47",       # 生命與永續
    "cold_blue": "#0a1626",   # 張力 / 衝突
}

BRAND = {
    "preset": "sushi_dr",
    "name": "創價未來｜壽司博士 Dr. Source",
    "tagline": "看懂變局，創造價值，帶著人性前行。",
    "host": "壽司博士 Dr. Source",
    "real_identity": "楊坤修博士",
    "org": "善向永續 ESG Sunshine",
    "positioning": "AI 時代的創價型知識與行動頻道",
    "palette": PALETTE,
    "formula": "場景 → 衝突 → 洞察 → 方法 → 反思",
    "intro_line": (
        "大家好，我是壽司博士。這裡談的不是料理，而是改變未來的 Source："
        "永續、AI、商業，以及人的價值。"
    ),
    "ai_boundary": (
        "思想、經驗、價值判斷與最終責任來自人；AI 負責研究、腳本初稿、"
        "視覺、剪輯與分發的協作，而不是思想主體。"
    ),
    "constitution": [
        "必須有原創判斷（壽司博士的判斷是什麼）。",
        "前 30 秒清楚說明與觀眾的關聯。",
        "必須提供方法或行動。",
        "AI 必須提高品質，而不是稀釋真實性。",
        "必須留下人性的餘韻。",
    ],
    # topics the AI visuals should NEVER default to (規劃書 §22)
    "forbidden_ai_visuals": [
        "藍紫霓虹", "機器人大腦", "漂浮數據", "無意義商務畫面", "過量未來科技動畫",
    ],
}

# ---- Script-DNA segment → brand palette ----
# Each beat of the story formula gets a distinct but on-brand gradient.
DNA_PALETTES = {
    "場景": (PALETTE["deep_blue"], PALETTE["warm_gold"], "scene"),
    "衝突": (PALETTE["cold_blue"], "#2a3a5c", "conflict"),
    "洞察": (PALETTE["deep_blue"], PALETTE["warm_gold"], "insight"),
    "方法": (PALETTE["green"], "#1c3a2a", "method"),
    "反思": ("#2a2418", PALETTE["warm_gold"], "reflection"),
}
# Default gradient when a script carries no DNA markers.
DEFAULT_THEME = (PALETTE["deep_blue"], "#2a3a5c", "brand")

# DNA markers in canonical order (§9.3 / §9.5).
DNA_MARKERS = ["場景", "衝突", "洞察", "方法", "反思"]

# ---- Series registry (規劃書 §11–§15) ----
SERIES = {
    "創價實驗室": {"lane": "核心主航道", "role": "旗艦深度對談", "freq": "每月 1 支"},
    "ESG做完了然後呢": {"lane": "核心主航道", "role": "ESG 2.0 專業權威", "freq": "每兩週 1 支"},
    "全球永續蒸餾室": {"lane": "核心主航道", "role": "趨勢蒸餾", "freq": "每月 1–2 支"},
    "AI正在學做人": {"lane": "核心主航道", "role": "擴張受眾", "freq": "每兩週 1 支"},
    "如果我是這家公司的顧問": {"lane": "專業擴展航道", "role": "實務顧問能力", "freq": "每月 1 支"},
    "那些商學院沒有講完的事": {"lane": "專業擴展航道", "role": "商管知識重構", "freq": "每月/雙週"},
    "世界可以重新設計": {"lane": "專業擴展航道", "role": "公共治理/城市", "freq": "每月 1 支"},
    "善道與人的選擇": {"lane": "靈魂航道", "role": "頻道靈魂", "freq": "每月 1 支"},
    "未來寓言": {"lane": "靈魂航道", "role": "文化 IP/故事", "freq": "不定期"},
    "午夜航圖": {"lane": "靈魂航道", "role": "深層反思", "freq": "每月/不定期"},
    "壽司切片": {"lane": "短影音", "role": "60 秒創價觀點", "freq": "每週 2 支"},
}

# ---- First-quarter 母題 (規劃書 §27) ----
SEED_TOPICS = [
    {
        "title": "ESG 報告寫完，公司真的改變了嗎？",
        "series": "ESG做完了然後呢",
        "judgment": "因為 ESG 被當成一份交付物，而不是經營系統。",
    },
    {
        "title": "AI 越來越像人，人類更需要學會什麼？",
        "series": "AI正在學做人",
        "judgment": "未來最珍貴的不是知識，而是承擔、慈悲與判斷。",
    },
    {
        "title": "為什麼 ESG 2.0 也必須找到 Product-Market Fit？",
        "series": "ESG做完了然後呢",
        "judgment": "永續要變成產品、服務與收入，而不只是合規門票。",
    },
    {
        "title": "城市不是替人民設計，而是與人民共同設計。",
        "series": "世界可以重新設計",
        "judgment": "公共價值來自共創，而非由上而下的優化。",
    },
    {
        "title": "慈悲能不能成為企業的一種競爭力？",
        "series": "善道與人的選擇",
        "judgment": "看見別人的苦，可能是創新與信任的開始。",
    },
    {
        "title": "當所有人都能用 AI 生產知識，真正珍貴的會是什麼？",
        "series": "創價實驗室",
        "judgment": "原創判斷與真實經驗無法被搬運，這才是稀缺價值。",
    },
]


def get_brand(preset: str = "sushi_dr") -> dict:
    """Return the active brand preset (only sushi_dr today)."""
    if preset != "sushi_dr":
        raise KeyError(f"unknown brand preset: {preset}")
    return BRAND


def dna_palette(segment: str) -> tuple:
    """Map a script-DNA segment label to a (color1, color2, name) tuple."""
    return DNA_PALETTES.get(segment, DEFAULT_THEME)


def parse_dna(script: str):
    """Parse a marker-delimited script (【場景】/【衝突】/【洞察】/【方法】/【反思】)
    into one shot per beat. Returns None if no markers are present.

    Accepts full-width or half-width brackets, with or without the 】 close.
    """
    import re

    pattern = re.compile(
        r"[\\[【]\s*(場景|衝突|洞察|方法|反思)\s*[\]】]\s*[:：]?\s*(.*?)"
        r"(?=[\\[【](?:場景|衝突|洞察|方法|反思)[\]】]|\Z)",
        re.S,
    )
    matches = list(pattern.finditer(script))
    if not matches:
        return None
    beats = []
    for m in matches:
        label = m.group(1)
        text = m.group(2).strip()
        if text:
            beats.append((label, text))
    return beats or None


if __name__ == "__main__":
    # 5T self-check: palette is frozen & verifiable.
    assert PALETTE["deep_blue"] == "#10243f"
    assert PALETTE["warm_gold"] == "#c9a24b"
    assert PALETTE["rice_white"] == "#f3ede1"
    assert PALETTE["green"] == "#3c6e47"
    beats = parse_dna("【場景】夜裡的圖書館。【洞察】安靜是線索。")
    assert beats == [("場景", "夜裡的圖書館。"), ("洞察", "安靜是線索。")]
    print("§9.4/§9.9 brand preset self-check: PASS")
