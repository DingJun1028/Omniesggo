# Scroll-Story Patterns

L3 級別的"電影式" scroll 敘事招式庫。參考標杆：doubao.com/about、apple.com/vision-pro、stripe.com、tome.app、readme.com、igloo.inc。

**觸發條件**：以下任一滿足時必走此級別，不再用"L2 reveal"兜底：
- 使用者明確要求"像 doubao / apple / stripe 那樣的滾動效果"
- 使用者說"普通"、"單調"、"要有滾動驅動"、"要 3D"、"要電影感"
- 頁面定位是"方法論、品牌、產品宣言"而非純資訊型

---

## L3 硬性要求（除 6 類基礎動效外加碼）

每個 L3 頁面必須至少包含以下 4 种 scroll-story 模式中的 **3 种**：

| 模式 | 必備數量 |
|------|----------|
| Pin-Scrub 場景（section 固定 + 滾動驅動內容形變） | ≥ 1 |
| 容器替換（左 pin / 右 swap）敘事 | ≥ 1 |
| 匯聚/散開轉場（多元素飛入飛出合併） | ≥ 1 |
| WebGL / 真 3D 簽名時刻（非僅 CSS 3D） | ≥ 1 |

共同原則：**每 1-2 屏必有一個 signature moment**。單調滑動三屏以上不被允許。

---

## Pattern 1 — Card Constellation Hero（卡片星座 Hero）

**出處**：doubao.com/about 首屏
**效果**：10-15 張內容樣本卡（每張代表產品能力的一個例項）在 3D 空間裡以不同 Z 深度、不同旋轉角度、不同動態模糊度浮動，圍繞中心的文字主張。滑鼠移動驅動整體視差。

### 實現模板

```css
.constellation {
  position: relative;
  perspective: 1400px;
  transform-style: preserve-3d;
  height: 100vh;
}
.star-card {
  position: absolute;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  transform-style: preserve-3d;
  will-change: transform, filter;
  transition: filter 0.5s var(--ease-cinema);
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}
/* 每張卡通過 inline style 或 data-attr 設定獨立位置:
   --x / --y / --z / --rx / --ry / --rz / --blur
*/
.star-card {
  top: calc(50% + var(--y) * 1px);
  left: calc(50% + var(--x) * 1px);
  transform:
    translate3d(-50%, -50%, var(--z, 0px))
    rotateX(var(--rx, 0deg))
    rotateY(var(--ry, 0deg))
    rotateZ(var(--rz, 0deg));
  filter: blur(var(--blur, 0px));
  opacity: calc(1 - var(--blur, 0) * 0.08);
}
```

```js
// 12 張卡隨機分佈（或按設計指定）
const cards = document.querySelectorAll('.star-card');

// 1. 基礎浮動（每張卡各自的 idle 呼吸）
cards.forEach((c, i) => {
  gsap.to(c, {
    y: `+=${gsap.utils.random(-16, 16)}`,
    rotate: `+=${gsap.utils.random(-4, 4)}`,
    duration: gsap.utils.random(4, 7),
    ease: 'sine.inOut',
    yoyo: true, repeat: -1,
  });
});

// 2. 滑鼠視差（整個 constellation 跟隨）
const stage = document.querySelector('.constellation');
stage.addEventListener('pointermove', (e) => {
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;
  cards.forEach((c, i) => {
    const depth = parseFloat(c.style.getPropertyValue('--z') || 0) / 200;
    gsap.to(c, { x: dx * 20 * depth, y: dy * 20 * depth, duration: 0.8, ease: 'power3.out' });
  });
});
```

### 設計指南
- Z 軸分佈：近景 (z: 0 ~ 100) 清晰不模糊、中景 (z: -200 ~ -400) 輕微模糊 2-4px、遠景 (z: -500 ~ -700) 模糊 6-10px
- 旋轉角度：|rx, ry, rz| ≤ 15°，超過會像碎紙
- 卡片尺寸參差（180×220 到 320×400），構成視覺節奏
- 卡片內容要"有意義"（產品樣本、真實截圖），避免佔位符

---

## Pattern 2 — Card Collapse Transition（卡片匯聚過渡）

**出處**：doubao.com/about 從 Hero 過渡到 "文字創作能力"
**效果**：Hero 里散開的卡片，在滾動到某閾值時整體飛向中心，合併為下一 section 的單一容器。

### 實現模板

```js
gsap.timeline({
  scrollTrigger: {
    trigger: '.constellation',
    start: 'bottom 80%',
    end: 'bottom top',
    scrub: 1,
  },
})
.to('.star-card', {
  x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0,
  filter: 'blur(0px)',
  scale: 0,
  opacity: 0,
  stagger: { amount: 0.6, from: 'random' },
  ease: 'power2.in',
})
.from('.next-section .hero-panel', {
  scale: 0.7, opacity: 0, duration: 1, ease: 'power3.out',
}, '-=0.4');
```

### 設計指南
- 匯聚終點應該是下一 section 的關鍵容器（不要憑空消失）
- stagger 用 `from: 'random'`（更自然，避免整齊劃一的波）
- 匯聚距離要夠長（跨 80-100vh 滾動）才有"風吹落"的感覺

---

## Pattern 3 — Left Pin / Right Swap Narrative（左 pin / 右 swap 敘事）

**出處**：doubao 產品能力四連（撰寫/繪製/知識/解答）、igloo.inc 多場景
**效果**：section pin 住，左側標題+描述+CTA 保持位置不動，右側容器按滾動進度切換 3-4 個場景（產品截圖/動畫 demo/3D 模型）。

### 實現模板

```html
<section class="pin-swap" data-scenes="4">
  <div class="pin-swap-inner">
    <div class="left">
      <h2 class="pin-title">標題 1</h2>
      <p class="pin-body">描述 1</p>
      <a class="pin-cta">立即體驗</a>
    </div>
    <div class="right">
      <div class="scene scene-1">場景 1 內容</div>
      <div class="scene scene-2">場景 2 內容</div>
      <div class="scene scene-3">場景 3 內容</div>
      <div class="scene scene-4">場景 4 內容</div>
    </div>
  </div>
</section>
```

```css
.pin-swap { height: 400vh; /* 每個場景 100vh */ }
.pin-swap-inner { position: sticky; top: 0; height: 100vh; display: grid; grid-template-columns: 1fr 1.2fr; gap: 48px; align-items: center; }
.scene { position: absolute; inset: 0; opacity: 0; }
.scene:first-child { opacity: 1; }
```

```js
const scenes = gsap.utils.toArray('.scene');
const titles = [/* 各場景文案物件陣列 */];

ScrollTrigger.create({
  trigger: '.pin-swap',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.5,
  onUpdate: (self) => {
    const progress = self.progress;
    const idx = Math.min(Math.floor(progress * scenes.length), scenes.length - 1);

    // 切換場景（淡入淡出）
    scenes.forEach((s, i) => {
      gsap.to(s, { opacity: i === idx ? 1 : 0, duration: 0.4, ease: 'power2.out' });
    });

    // 切換左側文案
    document.querySelector('.pin-title').textContent = titles[idx].title;
    document.querySelector('.pin-body').textContent = titles[idx].body;
  },
});
```

### 設計指南
- 場景切換點要讓使用者有"停頓"感（不能像翻書一樣急促）
- 右側場景之間的差異要顯著（不同產品/不同場景），不要只改文字
- 左側 CTA 可以不變，也可按場景變化（如改變連結目標）

---

## Pattern 4 — WebGL 3D Signature Moment（WebGL 3D 簽名時刻）

**出處**：doubao 的 Mobius / apple Vision Pro 的頭顯 / igloo.inc 的 3D 圖示
**效果**：section 居中一個 3D 物體（glass 材質、metallic、shader），隨滾動旋轉/變形，配合 orbital 粒子和光暈。

### 實現模板（Three.js 最小可用）

```html
<section class="webgl-scene">
  <canvas class="webgl-canvas"></canvas>
  <h2 class="webgl-title">章節標題</h2>
</section>
```

```js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('.webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
camera.position.z = 5;

// 玻璃/iridescent 材質
const geometry = new THREE.TorusKnotGeometry(1, 0.3, 180, 32);
const material = new THREE.MeshPhysicalMaterial({
  transmission: 0.92,
  thickness: 1.5,
  roughness: 0.15,
  iridescence: 1,
  iridescenceIOR: 1.3,
  clearcoat: 1,
  color: 0xffffff,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 環境光 + 點光源（染色）
scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 1));
const light1 = new THREE.PointLight(0x5EEAD4, 4, 20); light1.position.set(3, 3, 3); scene.add(light1);
const light2 = new THREE.PointLight(0xFB923C, 4, 20); light2.position.set(-3, -2, 3); scene.add(light2);

// ScrollTrigger 驅動旋轉
gsap.to(mesh.rotation, {
  y: Math.PI * 2, x: Math.PI,
  scrollTrigger: {
    trigger: '.webgl-scene',
    start: 'top bottom', end: 'bottom top',
    scrub: 1,
  },
});

// 渲染
function tick() {
  mesh.rotation.z += 0.002; // 自轉底噪
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// Resize
new ResizeObserver(() => {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}).observe(canvas);
```

### 設計指南
- **單頁不超過 1 個 WebGL scene**（多於 1 會撐爆 GPU，尤其移動端）
- 幾何體建議：TorusKnot / Möbius 帶 / Shader 球 / BoxGeometry（看風格）
- 材質：`MeshPhysicalMaterial` 的 `transmission + iridescence` 是 doubao 同款配方
- 相機 FOV 40-55°，物體距相機 3-5（太近會魚眼失真）
- 粒子/光暈：在物體周圍加 50-200 個小球（sprite），形成"塵埃"感
- 移動端降級：檢測 `navigator.hardwareConcurrency < 4` 或 `matchMedia('(max-width: 640px)')`，直接換成靜態大圖

### 依賴體量
- Three.js core: ~150KB gzipped
- OGL（輕量替代）: ~15KB，但需要自己寫 shader
- 推荐走 Three.js，因為社區材質/loader 成熟

---

## Pattern 5 — Section Title Bloom / Ghost（大標題光暈/幽靈影）

**出處**：doubao 的"研究領域"大標題
**效果**：Section 大標題後面帶一個模糊、偏移、低透明度的副本，形成視覺縱深。

```css
.ghost-title {
  position: relative;
  font-size: clamp(56px, 8vw, 120px);
  font-weight: 900;
  color: var(--text-1);
}
.ghost-title::before {
  content: attr(data-ghost);
  position: absolute; left: 4px; top: 4px;
  color: var(--accent-warm);
  opacity: 0.3;
  filter: blur(8px);
  z-index: -1;
}
```

---

## Pattern 6 — Abstract Gradient Art Top（抽象漸變藝術頂）

**出處**：doubao 研究領域三卡片（語音 / 大語言模型 / 多模態）
**效果**：功能卡片上半部分是一塊抽象藝術（漸變球/絲帶/粒子），下半是文字。藝術部分可以是靜態 PNG/SVG，也可以是 CSS mesh gradient。

```css
.art-card { background: var(--surface-1); border-radius: 16px; overflow: hidden; }
.art-top {
  aspect-ratio: 4 / 3;
  background:
    radial-gradient(circle at 30% 40%, var(--accent-cool) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, var(--accent-warm) 0%, transparent 45%),
    radial-gradient(circle at 50% 80%, #c084fc 0%, transparent 40%);
  filter: blur(0) saturate(140%);
}
.art-top.animated {
  background-size: 200% 200%;
  animation: artShift 18s ease-in-out infinite alternate;
}
@keyframes artShift {
  to { background-position: 100% 100%; }
}
```

加鉚釘裝飾（doubao 的卡片四角+四邊都有小方塊，仿照舊相紙/證件）：

```css
.art-card { position: relative; }
.art-card::before, .art-card::after,
.art-card > .rivet-tl, .art-card > .rivet-tr,
.art-card > .rivet-bl, .art-card > .rivet-br {
  content: ''; position: absolute; width: 6px; height: 6px;
  background: var(--surface-2); border: 1px solid var(--border);
  transform: rotate(45deg);
}
.art-card::before { top: 8px; left: 8px; }
.art-card::after { top: 8px; right: 8px; }
.rivet-bl { bottom: 8px; left: 8px; }
.rivet-br { bottom: 8px; right: 8px; }
```

---

## 降級與效能

| 裝置條件 | 降級策略 |
|----------|----------|
| `prefers-reduced-motion: reduce` | 所有 pin-scrub 改為簡單 fade；關閉 WebGL |
| `matchMedia('(max-width: 640px)')` | Constellation 降為 3-4 張靜態卡；pin-swap 保留但簡化為一次性入場；WebGL 換靜態圖 |
| `navigator.hardwareConcurrency < 4` | 關閉 WebGL，關閉 blur filter，關閉 custom cursor |
| Safari（效能偏差） | 若 FPS < 40 自動停用 filter blur |

效能檢測：

```js
const perf = {
  isMobile: matchMedia('(max-width: 640px)').matches,
  isLowCore: navigator.hardwareConcurrency < 4,
  reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  noHover: !matchMedia('(hover: hover)').matches,
};
document.documentElement.dataset.perf = JSON.stringify(perf);
// CSS 可通過 [data-perf*='"isMobile":true'] 做條件樣式
```
