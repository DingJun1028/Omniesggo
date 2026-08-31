# ESG SUNSHINE 品牌標誌規範書 — 原子色號光標籤版
Brand Identity Guideline: Atomic Light Label Edition

## 1. 核心原子色彩定義 (The Atomic Core)

| 色彩名稱 | 原子色號 (HEX) | 角色定義 |
|----------|---------------|----------|
| 水色青 (Aqua Cyan) | `#00FFFF` | 象徵純淨數據流動、科技與理性的核心能量色。 |
| 永恆金 (Eternal Gold) | `#FFD700` | 象徵價值、陽光與永續承諾的核心能量色。 |

> 這兩個色號是色彩的最高亮度基發光點或標準純色，不可撼動。

## 2. 色彩擴張：建立「光標籤」的實體感

核心原子色（`#00FFFF`, `#FFD700`）是光線照射在物體最亮處的顏色；擴張色則是物體的轉折面與暗部。

### 2.1 水色青系擴張 (Aqua Cyan Spectrum)

用於標誌的外焰結構、中心圓點，以及「ESG」、「善向永續」標準字。

| 色彩層級 | HEX | 視覺描述與用途 |
|----------|-----|---------------|
| 核心亮部 (Highlight) | `#00FFFF` | 漸層中最亮的高光區域 |
| 中調基色 (Midtone) | `#00C4D9` | 文字標準色或漸層過渡色 |
| 結構暗部 (Shadow) | `#008BA3` | 火焰轉折處的深色陰影 |

### 2.2 永恆金系擴張 (Eternal Gold Spectrum)

用於標誌的內焰結構，以及「SUNSHINE」標準字。

| 色彩層級 | HEX | 視覺描述與用途 |
|----------|-----|---------------|
| 核心亮部 (Highlight) | `#FFD700` | 漸層中最亮的高光區域 |
| 中調基色 (Midtone) | `#E6BE00` | 文字標準色 |
| 結構暗部 (Shadow) | `#C9A000` | 內焰的深邃感 |

## 3. 標準光標籤組合規範 (Standard Light Label Composition)

應用場景：官方白皮書、網站淺色模式 Header、名片、信箋。
背景色：純白 `#FFFFFF` 或淺灰 `#F5F7FA`。

### 圖形色彩分布
- **外焰 (Outer Flame)**：水色青系漸層（`#008BA3` → `#00FFFF` 高光）
- **內焰 (Inner Flame)**：永恆金系漸層（`#C9A000` → `#FFD700` 高光）
- **中心圓點 (Central Dot)**：水色青系漸層

### 標準字色彩分布
- **ESG / 善向永續**：`#00C4D9`（水色青中調，確保白底閱讀性）
- **SUNSHINE**：`#E6BE00`（永恆金中調）

## 4. CSS Design Tokens（官方參考實作）

```css
:root {
  /* Aqua Cyan Spectrum */
  --esg-cyan: #00FFFF;
  --esg-cyan-mid: #00C4D9;
  --esg-cyan-shadow: #008BA3;

  /* Eternal Gold Spectrum */
  --esg-gold: #FFD700;
  --esg-gold-mid: #E6BE00;
  --esg-gold-shadow: #C9A000;

  /* Surfaces */
  --esg-paper: #FFFFFF;
  --esg-paper-dim: #F5F7FA;
}
```

## 5. 色彩檢核總結

- **核心不變**：絕對使用 `#00FFFF` 和 `#FFD700` 作為色彩基因的頂點。
- **適應環境**：透過擴張暗部色階，將「發光色」轉換為適應亮室的「有光澤的實體色」。
- **未引入其他色相**：不加入標準藍或標準黃，嚴格遵守品牌色域。
