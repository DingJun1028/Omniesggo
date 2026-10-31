# Style Seeds

關鍵詞 → 初始 Token 對映。Round 2 中用於快速匹配使用者風格方向。

每個種子提供：色板、字型組合、圓角/陰影基調、推荐動效檔位。使用者確認后再細化為完整 Token。

---

## 1. 奶油編輯 (Cream Editorial)

**關鍵詞**：溫暖、編輯感、雜誌、剋制、紙質感
**氣質**：像一本排版精良的雜誌在螢幕上展開

```
色板:
  背景 #ECE7DE (暖奶油)    表面 #FFFFFF
  邊框 #D5D0C7 (暖灰)      強邊框 #2A2A2A
  文字 #1A1A1A / #6B6560    強調 #E8682A (橙)
字型:
  heading: Playfair Display (serif, 900)
  body: DM Sans (sans, 400-700)
  mono: JetBrains Mono
圓角: 16px    陰影: 僅 hover    檔位: L1
```

---

## 2. 暗黑科技 (Dark Tech)

**關鍵詞**：深邃、霓虹、未來、科技、賽博
**氣質**：深空站控制台，資訊在黑暗中發光

```
色板:
  背景 #0B0B0F             表面 rgba(255,255,255,0.03)
  邊框 rgba(255,255,255,0.08)
  文字 #F0F0F0 / #8B8B8B    主色 #00D4FF    輔色 #8B5CF6
字型:
  heading: Space Grotesk (sans, 700)
  body: Inter (sans, 400-600)
  mono: Fira Code
圓角: 12px    陰影: glow    檔位: L2-L3
特殊: Glassmorphism, 漸變流動背景
```

---

## 3. 极簡剋制 (Minimal Pure)

**關鍵詞**：乾淨、留白、精確、安靜、高級
**氣質**：美術館白牆上的一行字

```
色板:
  背景 #FAFAFA             表面 #FFFFFF
  邊框 #E8E8E8
  文字 #1A1A1A / #666666    強調 #0066FF (僅連結)
字型:
  heading: Instrument Serif (serif, 400)
  body: DM Sans (sans, 400-500)
圓角: 8px    陰影: 极輕    檔位: L1
特殊: 大字號對比建立層次，禁止裝飾
```

---

## 4. 溫暖商務 (Warm Professional)

**關鍵詞**：專業、信任、圓潤、友好、成熟
**氣質**：一家讓人放心的公司

```
色板:
  背景 #FFFFFF             表面 #F8FAFC
  邊框 #E2E8F0
  文字 #1E293B / #475569    主色 #2563EB    輔色 #F59E0B
字型:
  heading: Plus Jakarta Sans (sans, 700-800)
  body: Plus Jakarta Sans (sans, 400-500)
圓角: 12px    陰影: 柔和層疊    檔位: L1-L2
```

---

## 5. 活潑創意 (Playful Creative)

**關鍵詞**：大膽、有趣、年輕、跳躍、手寫
**氣質**：設計師朋友的生日派對邀請

```
色板:
  背景 #FFF8F0             表面 #FFFFFF
  邊框 #FFE0CC
  文字 #2D2D2D / #666666    主色 #FF3366    輔色 #FFD700    三色 #00CC88
字型:
  heading: Sora (sans, 700-800)
  body: Nunito (sans, 400-600)
  accent: Caveat (cursive, 手寫裝飾)
圓角: 16-24px (偏大)    陰影: 帶色    檔位: L2-L3
特殊: blob 裝飾, 手寫註釋, 彈性動畫
```

---

## 6. 中文優雅 (Chinese Elegant)

**關鍵詞**：文墨、東方、內斂、書卷氣、留白
**氣質**：一封用宣紙寫的信

```
色板:
  背景 #FAF8F5             表面 #FFFFFF
  邊框 #E8E0D8
  文字 #2C2C2C / #5C5C5C    主色 #C45C3C (赭石)    輔色 #2C5F6E
字型:
  heading: Noto Serif SC (宋體, 700)
  body: Noto Sans SC (黑體, 400-500)
  accent: LXGW WenKai (楷體, 裝飾)
圓角: 4px (極小)    陰影: 极輕    檔位: L1
特殊: 行高1.8+, 字距0.02em, 容器800px, 首行縮排2em
```

---

## 7. 賽博朋克 (Cyberpunk)

**關鍵詞**：故障、網格、刺眼、地下、資料流
**氣質**：駭客終端里跑著的霓虹資料

```
色板:
  背景 #0A0A0A             表面 #111111
  邊框 #222222
  文字 #00FF41 / #888888    主色 #FF0080    輔色 #00FFFF
字型:
  heading: Orbitron (sans, 700-900)
  body: IBM Plex Mono (mono, 400)
圓角: 0px (全直角)    陰影: 霓虹 glow    檔位: L3
特殊: glitch 效果, scanline, 資料流動畫, 打字機
```

---

## 8. 自然有機 (Organic Natural)

**關鍵詞**：泥土、手作、柔和、呼吸、可持續
**氣質**：鄉間集市上的手工肥皂包裝

```
色板:
  背景 #F5F0EB             表面 #FEFCF9
  邊框 #DDD5CA
  文字 #3D3228 / #7A6E60    主色 #5B8C5A (苔綠)    輔色 #C4956A (陶土)
字型:
  heading: Fraunces (serif, 600-700, optical size)
  body: Source Sans 3 (sans, 400-500)
圓角: 20px+ (偏圓)    陰影: 暖色极柔    檔位: L1-L2
特殊: 手繪紋理背景, 不規則邊緣, 柔和漸變
```

---

## 9. 瑞士設計 (Swiss Grid)

**關鍵詞**：網格、規則、理性、黑白、紅色
**氣質**：包豪斯學校走廊的海報

```
色板:
  背景 #FFFFFF             表面 #F5F5F5
  邊框 #000000 (實線)
  文字 #000000 / #555555    強調 #FF0000 (僅點綴)
字型:
  heading: Helvetica Neue / Inter (sans, 700)
  body: Helvetica Neue / Inter (sans, 400)
圓角: 0px    陰影: 無    檔位: L1
特殊: 嚴格網格, 粗體規則, 大量負空間, 不對稱構圖
```

---

## 10. 玻璃擬態 (Glassmorphism)

**關鍵詞**：透明、模糊、光影、層疊、夢幻
**氣質**：陽光穿過磨砂玻璃落在桌面上

```
色板:
  背景 線性漸變 #667eea → #764ba2
  表面 rgba(255,255,255,0.15)
  邊框 rgba(255,255,255,0.2)
  文字 #FFFFFF / rgba(255,255,255,0.7)
字型:
  heading: Outfit (sans, 600-700)
  body: Inter (sans, 400-500)
圓角: 16px    陰影: 大面積柔光    檔位: L2
特殊: backdrop-filter: blur(12px), 半透明層疊, 光效動畫
```

---

## 種子混搭規則

使用者經常不會完全匹配某一個種子。常見混搭：

- "暗黑但剋制" → 暗黑科技的色板 + 极簡剋制的動效檔位和裝飾規則
- "溫暖但有趣" → 溫暖商務的色調 + 活潑創意的圓角和動畫
- "中文 + 科技感" → 中文優雅的字型 + 暗黑科技的色板
- "瑞士但現代" → 瑞士設計的網格和黑白 + 更大圓角 + L2 動效

混搭時以**色板和字型**從一個種子取，**動效和裝飾規則**從另一個取。不要混搭兩套色板。
