# Motion Library — vue-bits / reactbits

L2+ 頁面的動效預設從 [vue-bits](https://github.com/DavidHDev/vue-bits) 或 [reactbits](https://github.com/DavidHDev/react-bits) 選取（同作者 DavidHDev，Vue / React 雙端同一套效果，MIT 許可）。**能複用就不要重寫。**

落地專案是純 HTML 時，按效果原始碼的技術棧判斷：
- 僅 CSS 的 → 直接複製 class + keyframes
- GSAP 驅動的 → 直接複製邏輯（GSAP 本身是框架無關的）
- Three.js / OGL 驅動的 → 複製 canvas 初始化邏輯
- 深度依賴 Vue/React 生命週期的 → 抽成 `init()` / `destroy()` 對函式

---

## 硬性要求（L2+ 強制）

任何 L2 以上的頁面至少包含以下 6 類動效組合，**缺一項都算未達標**：

| 類別 | 至少數量 | 落點建議 |
|------|----------|----------|
| Text Animation — Hero H1 | 1 | 首屏大標題（入場 / 持續態）|
| Text Animation — Section H2 | 1 | 章節標題（滾動觸發）|
| Text Animation — Body / Label | 1 | 正文 / eyebrow / 程式碼行 |
| Animation — 元素級 | ≥ 1 | 按鈕磁吸、卡片 hover、游標、裝飾元素 |
| Component — 互動構件 | ≥ 1 | 卡片棧、畫廊、選單、3D 卡片等 |
| Background — 氛圍層 | 1 | Hero 背景或 section 底層 |

**同一頁面累計不少於 4 個 signature moments**。L3 頁面建議 6-8 個，但不要超過 10（會躁）。

---

## 目錄（截至 2026-04）

### Text Animations（24 個）

| 名稱 | 一句話 | 適合 | 標籤 |
|------|--------|------|------|
| ASCIIText | 文字用 ASCII 字元重新構建 | 技術感、終端風 | 重、裝飾 |
| BlurText | 字元逐個模糊 → 清晰入場 | 通用入場 | 輕、優雅 |
| CircularText | 文字沿圓形路徑排列 | Logo 環繞、裝飾徽章 | 輕、裝飾 |
| CountUp | 數字滾動到目標值 | 資料統計、KPI | 輕、功能 |
| CurvedLoop | 文字在曲線上迴圈流動 | 滾動 marquee、引用 | 輕、裝飾 |
| DecryptedText | 字元亂碼 → 解碼真實字元 | 技術/密碼風標語 | 中、技術 |
| FallingText | 文字像物理下墜重排 | 重點段落裝飾 | 重、娛樂 |
| FuzzyText | 文字帶噪點震顫 | 故障藝術 | 重、裝飾 |
| GlitchText | 故障位移 + 色差 | 賽博朋克 | 重、風格化 |
| GradientText | 文字填充漸變（可流動） | 關鍵詞、Logo | 輕、通用 |
| RotatingText | 單詞迴圈切換（打字機替代） | Hero 動詞迴圈 | 輕、功能 |
| ScrambleText | 字元亂碼 → 穩定 | 技術/文件風 eyebrow | 輕、技術 |
| **ScrollFloat** | 隨滾動浮入並保持精確位置 | **Section H2 首選** | 輕、通用 |
| **ScrollReveal** | 隨滾動詞/行逐個顯現 | **正文段落首選** | 輕、通用 |
| ScrollVelocity | 文字速度跟滾動速度聯動 | 裝飾橫條、視差 | 中、裝飾 |
| ShinyText | 金屬光澤掃過文字 | CTA、關鍵標語 | 輕、品牌感 |
| Shuffle | 文字字元位置洗牌 | 轉場 | 中、娛樂 |
| **SplitText** | 字元/詞/行逐個 stagger 入場 | **Hero H1 首選** | 輕、經典 |
| TextCursor | 游標打字效果 | 終端感、引導文案 | 輕、功能 |
| TextPressure | 字重隨滑鼠距離變化 | 互動性 Hero 標題 | 中、實驗 |
| TextTrail | 字元留下視覺余跡 | 視差裝飾 | 中、裝飾 |
| TextType | 打字機逐字輸入 | 程式碼塊、命令列 | 輕、功能 |
| TrueFocus | 焦點字清晰其餘模糊 | 引導讀者視線 | 中、功能 |
| VariableProximity | 滑鼠靠近處字型變粗 | 可變字型展示 | 中、實驗 |

### Animations — 元素級（29 個）

| 名稱 | 一句話 | 標籤 |
|------|--------|------|
| AnimatedContent | 通用入場（fade/slide/scale） | 輕、通用 |
| Antigravity | 滑鼠靠近時元素反推 | 中、實驗 |
| BlobCursor | 游標變形 blob | 中、裝飾 |
| ClickSpark | 點選濺出粒子 | 輕、反饋 |
| Crosshair | 十字游標 | 中、實驗 |
| Cubes | 3D 立方體網格自轉 | 重、裝飾 |
| ElectricBorder | 邊框電流光環 | 中、品牌感 |
| FadeContent | 簡單淡入 | 輕、基礎 |
| GhostCursor | 帶拖影游標 | 輕、裝飾 |
| GlareHover | 卡片 hover 時高光掃過 | 輕、品牌感 |
| GradualBlur | 漸進模糊 | 輕、過渡 |
| ImageTrail | 滑鼠拖出圖片尾跡 | 重、娛樂 |
| LaserFlow | 雷射流動 | 重、裝飾 |
| LogoLoop | 品牌 logo 無限橫滾 | 輕、功能 |
| MagicRings | 裝飾光環 | 中、裝飾 |
| **Magnet** | 元素磁吸滑鼠 | **CTA 首選**（輕）|
| MagnetLines | 磁力線裝飾 | 中、裝飾 |
| MetaBalls | 流體球 | 重、裝飾 |
| MetallicPaint | 金屬塗層光澤 | 中、品牌感 |
| Noise | 噪點紋理 | 輕、底噪 |
| OrbitImages | 圖片軌道旋轉 | 中、裝飾 |
| PixelTrail | 畫素化滑鼠尾跡 | 中、風格 |
| PixelTransition | 畫素化轉場 | 中、轉場 |
| Ribbons | 絲帶飄動 | 中、裝飾 |
| ShapeBlur | 形狀模糊動態 | 中、裝飾 |
| SplashCursor | 滑鼠濺射 | 重、娛樂 |
| StarBorder | 邊框流動星點 | 中、品牌感 |
| StickerPeel | 貼紙翹邊 | 中、娛樂 |
| TargetCursor | 瞄準線游標 | 中、實驗 |

### Components — 互動構件（30 個）

| 名稱 | 一句話 | 標籤 |
|------|--------|------|
| AnimatedList | 列表項動畫入場 | 輕、通用 |
| BorderGlow | 邊框發光追蹤 | 中、品牌感 |
| BounceCards | 卡片彈性展開 | 中、趣味 |
| BubbleMenu | 氣泡選單 | 中、趣味 |
| CardNav | 卡片式導航 | 輕、通用 |
| **CardSwap** | 卡片 3D 切換堆疊 | **Hero 卡片展示首選** |
| Carousel | 基礎輪播 | 輕、通用 |
| ChromaGrid | 色差網格 | 中、風格 |
| CircularGallery | 圓形畫廊 | 中、裝飾 |
| Counter | 動態計數 | 輕、功能 |
| DecayCard | 衰減卡片動畫 | 中、裝飾 |
| Dock | macOS 風停靠欄 | 輕、功能 |
| DomeGallery | 球面畫廊 | 重、裝飾 |
| ElasticSlider | 彈性滑動條 | 輕、功能 |
| FlowingMenu | 流動選單 | 中、裝飾 |
| FlyingPosters | 海報飛行 | 重、娛樂 |
| Folder | 資料夾動畫 | 輕、趣味 |
| GlassIcons | 玻璃圖示 | 輕、裝飾 |
| GlassSurface | 玻璃表面 | 中、裝飾 |
| GooeyNav | 膠質導航 | 中、趣味 |
| InfiniteMenu | 無限選單 | 中、裝飾 |
| **InfiniteScroll** | 無限橫滾/縱滾作品條 | **Showcase 首選** |
| **MagicBento** | Bento 網格 + hover 光效 | **Feature 網格首選** |
| Masonry | 瀑布流 | 輕、通用 |
| PillNav | 膠囊導航 | 輕、通用 |
| PixelCard | 畫素化卡片 | 中、風格 |
| ProfileCard | 3D 翻轉名片 | 輕、趣味 |
| RollingGallery | 滾輪畫廊 | 中、裝飾 |
| **ScrollStack** | 滾動卡片堆疊（pin + 疊加） | **敘事卡片首選** |
| **SpotlightCard** | 滑鼠跟隨聚光燈卡片 | **Feature 卡片首選** |
| Stack | 卡片堆疊 | 輕、通用 |
| StaggeredMenu | Stagger 入場選單 | 輕、通用 |
| Stepper | 步驟器 | 輕、功能 |
| **TiltedCard** | 3D 傾斜（陀螺儀 / 滑鼠） | **作品展示首選** |

### Backgrounds — 氛圍層（38 個）

| 名稱 | 一句話 | 效能 | 標籤 |
|------|--------|------|------|
| **Aurora** | 柔軟極光流動 | 中（WebGL） | **編輯暗色首選** |
| Balatro | 撲克風底紋 | 中 | 風格化 |
| Ballpit | 物理小球池 | 重 | 趣味 |
| Beams | 光束掃過 | 中 | 科技 |
| ColorBends | 色彩彎折 | 中 | 藝術 |
| DarkVeil | 深色面紗 | 輕 | 編輯暗色備選 |
| Dither | 抖動畫素 | 輕 | 復古 |
| DotGrid | 點陣網格 | 輕 | 极簡 |
| EvilEye | 眼睛追蹤 | 中 | 實驗 |
| FaultyTerminal | 故障終端 | 中 | 賽博 |
| FloatingLines | 浮動線條 | 輕 | 极簡 |
| Galaxy | 星系 | 中 | 科技 |
| GradientBlinds | 漸變百葉 | 輕 | 風格化 |
| Grainient | 顆粒漸變 | 輕 | 編輯風 |
| GridDistortion | 網格扭曲 | 中 | 實驗 |
| GridMotion | 網格流動 | 輕 | 科技 |
| GridScan | 掃描線網格 | 中 | 賽博 |
| Hyperspeed | 超光速隧道 | 重 | 賽博 |
| Iridescence | 虹彩光澤 | 中 | 品牌感 |
| LetterGlitch | 字元故障牆 | 重 | 賽博 |
| LightPillar | 光柱 | 中 | 戲劇 |
| LightRays | 光線放射 | 中 | 戲劇 |
| Lightning | 閃電 | 中 | 戲劇 |
| LineWaves | 線條波浪 | 輕 | 极簡 |
| LiquidChrome | 液態鉻合金 | 中 | 品牌感 |
| LiquidEther | 液態以太 | 中 | 藝術 |
| Orb | 能量球 | 中 | 裝飾 |
| Particles | 粒子系統 | 中 | 通用 |
| PixelBlast | 畫素爆破 | 重 | 賽博 |
| PixelSnow | 畫素雪 | 輕 | 季節 |
| Plasma | 等離子 | 中 | 藝術 |
| Prism | 稜鏡色散 | 中 | 品牌感 |
| PrismaticBurst | 稜鏡爆破 | 重 | 戲劇 |
| Radar | 雷達掃描 | 輕 | 科技 |
| RippleGrid | 漣漪網格 | 中 | 裝飾 |
| **Silk** | 絲綢流動 | 中 | **編輯暗色/亮色通用** |
| SoftAurora | 柔和極光（輕量版） | 輕 | 編輯暗色備選 |
| Squares | 方格 | 輕 | 极簡 |
| Threads | 絲線 | 輕 | 极簡 |
| Waves | 波浪 | 輕 | 极簡 |

---

## 按風格 × 場景的推荐組合

### Dark Editorial（hueapp / Linear 骨架類）
- Background: **Aurora** / **Silk** / **SoftAurora** / **Grainient**
- Hero H1: **SplitText** 或 **ShinyText**（關鍵詞） + **GradientText**（關鍵詞）
- H2: **ScrollFloat** 或 **BlurText**
- Body: **ScrollReveal**
- Animation: **Magnet**（CTA） + **GlareHover**（卡片）
- Component: **CardSwap** / **ScrollStack** / **SpotlightCard** / **MagicBento**

### Dark Tech / Cyber（cursor / warp / 賽博）
- Background: **LetterGlitch** / **Beams** / **Hyperspeed** / **FaultyTerminal**
- Hero H1: **GlitchText** / **DecryptedText** / **ShinyText**
- H2: **SplitText**
- Body: **TextType**（程式碼塊） + **ScrambleText**（eyebrow）
- Animation: **ElectricBorder** / **ClickSpark**
- Component: **TiltedCard** / **PixelCard**

### Minimal Pure / Editorial Light
- Background: **DotGrid** / **FloatingLines** / **Grainient**
- Hero H1: **SplitText**（剋制）+ **GradientText**（僅關鍵詞）
- H2: **ScrollFloat**
- Body: **ScrollReveal**
- Animation: **Magnet**（CTA，唯一動效） + **FadeContent**
- Component: **CardNav** / **InfiniteScroll** / **Masonry**

### Playful Creative
- Background: **Iridescence** / **LiquidChrome** / **Plasma**
- Hero H1: **TextPressure** / **FallingText** / **BounceCards** 文案
- H2: **Shuffle** / **SplitText**
- Body: **TextTrail** / **ScrollReveal**
- Animation: **ClickSpark** / **BlobCursor** / **StickerPeel**
- Component: **BounceCards** / **BubbleMenu** / **GooeyNav** / **FlyingPosters**

### Chinese Elegant
- Background: **Threads** / **FloatingLines** / **Grainient**（低對比度）
- Hero H1: **BlurText**（緩慢）+ **GradientText**（赭石漸變）
- H2: **ScrollFloat**
- Body: **ScrollReveal**（行粒度，不要字粒度——中文字粒度太碎）
- Animation: **Magnet**（克制）
- Component: **CircularGallery** / **Masonry**

### Warm Professional
- Background: **Silk** / **SoftAurora** / **Grainient**
- Hero H1: **SplitText** + **GradientText**
- H2: **ScrollFloat**
- Body: **ScrollReveal**
- Animation: **Magnet** + **GlareHover**
- Component: **MagicBento** / **SpotlightCard** / **InfiniteScroll**

---

## 效能原則

- 一個頁面不併存超過 **2 個重背景**（WebGL 背景只用 1 個）
- 移動端（< 640px）自動降級：重背景 → 靜態漸變；3D 元件 → 2D 版本
- Cursor 相關效果僅在 `matchMedia('(hover: hover)')` 下啟用
- 所有效果必須有 `prefers-reduced-motion` 降級路徑
- 單頁 GSAP timeline ≤ 3 個（更多會搶主執行緒）

## 複用規則

1. **優先直接複製**：vue-bits / reactbits 原始碼是 MIT，保留作者致謝就能用
2. **翻譯層**：原 Vue / React 程式碼移植到 vanilla HTML 時，把 props 展開為 data-attr 或函式引數
3. **致謝位置**：頁面 footer 或 README 加 "Motion effects inspired by / derived from [vue-bits](https://github.com/DavidHDev/vue-bits) by DavidHDev (MIT)"
