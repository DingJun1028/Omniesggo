# 文字裝飾判斷規則

程式碼生成前，對每個文本層級執行以下判斷，決定是否新增裝飾樣式。

## 漸變文字（gradient text）

**觸發條件**（滿足全部）：
- 風格 == "暗黑科技" 或 "活潑創意"
- 字號 >= 60px 或該元素是 Hero 主標題 h1

**實現**：
```css
background: linear-gradient(135deg, [主色], [強調色]);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

**禁止**：
- 极簡剋制風格（破坏剋制感）
- 白色背景 + 字號 < 40px（可讀性差）
- 正文段落 p（僅標題可用）

## 文字投影（text-shadow）

**A. 暗色背景 (bg 亮度 < 30%) + 字號 >= 80px** → subtle glow：
```css
text-shadow: 0 0 40px rgba([主色-RGB], 0.4);
```

**B. 活潑創意 + Hero 主標題** → layered drop shadow：
```css
text-shadow: 3px 3px 0 [強調色], 6px 6px 0 rgba(0,0,0,0.15);
```

**C. 溫暖商務 + 襯線標題 + 深色文字** → soft shadow：
```css
text-shadow: 0 2px 8px rgba(0,0,0,0.12);
```

**禁止**：
- 极簡剋制風格
- 已使用漸變文字時不疊加（視覺過載）
- 正文段落 p

## 裝飾性下劃線 / 高亮

- Section 小標題（11~13px，letter-spacing > 3px）→ `border-bottom: 2px solid [主色]` 或 background highlight
- 連結文字 hover → underline offset 或 color transition，不加 text-shadow

## 決策表（快速參考）

| 場景 | 极簡剋制 | 暗黑科技 | 溫暖商務 | 活潑創意 |
|------|---------|---------|---------|---------|
| Hero h1 漸變 | -- | Yes | -- | Yes |
| Hero h1 投影 | -- | glow | soft | layered |
| Section h2 漸變 | -- | 可選 | -- | Yes |
| Section h2 投影 | -- | -- | soft | 可選 |
| 正文 p 任何裝飾 | -- | -- | -- | -- |
