/* =========================================================
   web-design SKILL · app.js (GradientBlinds + RollingGallery)
   Motion effects derived from vue-bits by DavidHDev (MIT)
   https://github.com/DavidHDev/vue-bits
   ========================================================= */

import { Renderer, Program, Mesh, Triangle } from 'https://esm.sh/ogl@1.0.11';

/* ---------- Perf flags ---------- */
const perf = {
  reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  noHover: !matchMedia('(hover: hover)').matches,
  isMobile: matchMedia('(max-width: 640px)').matches,
  isLowCore: (navigator.hardwareConcurrency || 8) < 4,
};

/* ---------- Scroll progress bar ---------- */
const progress = document.querySelector('.scroll-progress');
if (progress) {
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progress.style.transform = `scaleX(${p})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ---------- Nav scrolled state ---------- */
const nav = document.querySelector('.nav');
let navTicking = false;
const updateNav = () => {
  if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
  navTicking = false;
};
window.addEventListener('scroll', () => {
  if (!navTicking) { requestAnimationFrame(updateNav); navTicking = true; }
}, { passive: true });
updateNav();

/* ---------- Reveal on scroll — early trigger for smooth up-fade ---------- */
if ('IntersectionObserver' in window) {
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        rio.unobserve(e.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => rio.observe(el));
}

/* ---------- Magnetic buttons ---------- */
if (!perf.reduceMotion && !perf.noHover && typeof gsap !== 'undefined') {
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    const strength = 0.28;
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      gsap.to(btn, { x, y, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* =========================================================
   🔥 GradientBlinds (port of vue-bits · MIT)
   ========================================================= */

const hexToRGB = (hex) => {
  const c = hex.replace('#', '').padEnd(6, '0');
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ];
};

const MAX_COLORS = 8;
const prepStops = (stops) => {
  const base = (stops && stops.length ? stops : ['#5EEAD4', '#FB923C']).slice(0, MAX_COLORS);
  if (base.length === 1) base.push(base[0]);
  while (base.length < MAX_COLORS) base.push(base[base.length - 1]);
  const arr = base.map(hexToRGB);
  const count = Math.max(2, Math.min(MAX_COLORS, stops?.length ?? 2));
  return { arr, count };
};

function initGradientBlinds(container, opts = {}) {
  if (perf.reduceMotion || perf.isLowCore) return null;

  const params = Object.assign({
    gradientColors: ['#5EEAD4', '#8B5CF6', '#FB923C', '#5EEAD4'],
    angle: 25,
    noise: 0.2,
    blindCount: 14,
    blindMinWidth: 80,
    mouseDampening: 0.04, // ↓ reduced from 0.2 → near-instant mouse follow
    mirrorGradient: true,
    spotlightRadius: 0.55,
    spotlightSoftness: 1,
    spotlightOpacity: 0.9,
    distortAmount: 1.6,
    shineDirection: 'left',
    mixBlendMode: 'lighten',
  }, opts);

  let renderer, gl, program, mesh, geometry, canvas;
  let raf = 0;
  let mouseTarget = [0, 0];
  let lastTime = 0;
  let firstResize = true;
  let running = true;

  const vertex = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
  `;

  const fragment = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform vec3 iResolution; uniform vec2 iMouse; uniform float iTime;
    uniform float uAngle; uniform float uNoise; uniform float uBlindCount;
    uniform float uSpotlightRadius; uniform float uSpotlightSoftness; uniform float uSpotlightOpacity;
    uniform float uMirror; uniform float uDistort; uniform float uShineFlip;
    uniform vec3 uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
    uniform vec3 uColor4; uniform vec3 uColor5; uniform vec3 uColor6; uniform vec3 uColor7;
    uniform int uColorCount;
    varying vec2 vUv;

    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
    vec2 rotate2D(vec2 p, float a){ float c = cos(a); float s = sin(a); return mat2(c, -s, s, c) * p; }

    vec3 getGradientColor(float t){
      float tt = clamp(t, 0.0, 1.0);
      int count = uColorCount; if (count < 2) count = 2;
      float scaled = tt * float(count - 1);
      float seg = floor(scaled); float f = fract(scaled);
      if (seg < 1.0) return mix(uColor0, uColor1, f);
      if (seg < 2.0 && count > 2) return mix(uColor1, uColor2, f);
      if (seg < 3.0 && count > 3) return mix(uColor2, uColor3, f);
      if (seg < 4.0 && count > 4) return mix(uColor3, uColor4, f);
      if (seg < 5.0 && count > 5) return mix(uColor4, uColor5, f);
      if (seg < 6.0 && count > 6) return mix(uColor5, uColor6, f);
      if (seg < 7.0 && count > 7) return mix(uColor6, uColor7, f);
      if (count > 7) return uColor7; if (count > 6) return uColor6;
      if (count > 5) return uColor5; if (count > 4) return uColor4;
      if (count > 3) return uColor3; if (count > 2) return uColor2;
      return uColor1;
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord){
      vec2 uv0 = fragCoord.xy / iResolution.xy;
      float aspect = iResolution.x / iResolution.y;
      vec2 p = uv0 * 2.0 - 1.0; p.x *= aspect;
      vec2 pr = rotate2D(p, uAngle); pr.x /= aspect;
      vec2 uv = pr * 0.5 + 0.5;

      vec2 uvMod = uv;
      if (uDistort > 0.0) {
        float a = uvMod.y * 6.0; float b = uvMod.x * 6.0;
        float w = 0.01 * uDistort;
        uvMod.x += sin(a) * w; uvMod.y += cos(b) * w;
      }
      float t = uvMod.x;
      if (uMirror > 0.5) t = 1.0 - abs(1.0 - 2.0 * fract(t));
      vec3 base = getGradientColor(t);

      vec2 offset = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);
      float d = length(uv0 - offset);
      float r = max(uSpotlightRadius, 1e-4);
      float dn = d / r;
      float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
      vec3 cir = vec3(spot);
      float stripe = fract(uvMod.x * max(uBlindCount, 1.0));
      if (uShineFlip > 0.5) stripe = 1.0 - stripe;
      vec3 ran = vec3(stripe);

      vec3 col = cir + base - ran;
      col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;
      fragColor = vec4(col, 1.0);
    }
    void main() { vec4 color; mainImage(color, vUv * iResolution.xy); gl_FragColor = color; }
  `;

  try {
    // Lower DPR cap on mobile / low-core devices to avoid frame drops
    const dprCap = (perf.isMobile || perf.isLowCore) ? 1 : 1.5;
    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, dprCap),
      alpha: true,
      antialias: !perf.isMobile,
    });
    gl = renderer.gl;
    canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    if (params.mixBlendMode) canvas.style.mixBlendMode = params.mixBlendMode;
    container.appendChild(canvas);

    const { arr, count } = prepStops(params.gradientColors);
    const uniforms = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iMouse: { value: [0, 0] },
      iTime: { value: 0 },
      uAngle: { value: (params.angle * Math.PI) / 180 },
      uNoise: { value: params.noise },
      uBlindCount: { value: Math.max(1, params.blindCount) },
      uSpotlightRadius: { value: params.spotlightRadius },
      uSpotlightSoftness: { value: params.spotlightSoftness },
      uSpotlightOpacity: { value: params.spotlightOpacity },
      uMirror: { value: params.mirrorGradient ? 1 : 0 },
      uDistort: { value: params.distortAmount },
      uShineFlip: { value: params.shineDirection === 'right' ? 1 : 0 },
      uColor0: { value: arr[0] }, uColor1: { value: arr[1] },
      uColor2: { value: arr[2] }, uColor3: { value: arr[3] },
      uColor4: { value: arr[4] }, uColor5: { value: arr[5] },
      uColor6: { value: arr[6] }, uColor7: { value: arr[7] },
      uColorCount: { value: count },
    };

    program = new Program(gl, { vertex, fragment, uniforms });
    geometry = new Triangle(gl);
    mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
      if (params.blindMinWidth > 0) {
        const maxByMinWidth = Math.max(1, Math.floor(rect.width / params.blindMinWidth));
        uniforms.uBlindCount.value = Math.max(1, Math.min(params.blindCount, maxByMinWidth));
      }
      if (firstResize) {
        firstResize = false;
        uniforms.iMouse.value = [gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2];
        mouseTarget = [...uniforms.iMouse.value];
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Listen on the whole container (not just canvas) so the move fires even
    // when pointer is over hero content (title / buttons). rAF-throttled.
    let pmRaf = 0;
    const onPointerMove = (e) => {
      if (pmRaf) return;
      pmRaf = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        const scale = renderer.dpr || 1;
        mouseTarget = [
          (e.clientX - rect.left) * scale,
          (rect.height - (e.clientY - rect.top)) * scale,
        ];
        pmRaf = 0;
      });
    };
    const host = container.parentElement || container;
    host.addEventListener('pointermove', onPointerMove, { passive: true });

    // Pause when off-screen
    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(container);

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!running) return;
      uniforms.iTime.value = t * 0.001;
      if (params.mouseDampening > 0) {
        if (!lastTime) lastTime = t;
        const dt = (t - lastTime) / 1000;
        lastTime = t;
        const factor = Math.min(1, 1 - Math.exp(-dt / Math.max(1e-4, params.mouseDampening)));
        const cur = uniforms.iMouse.value;
        cur[0] += (mouseTarget[0] - cur[0]) * factor;
        cur[1] += (mouseTarget[1] - cur[1]) * factor;
      } else {
        uniforms.iMouse.value = mouseTarget;
      }
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    requestAnimationFrame(() => container.classList.add('is-ready'));

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      io.disconnect();
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
  } catch (err) {
    console.warn('GradientBlinds init failed:', err);
    return null;
  }
}

const blindsContainer = document.querySelector('.gradient-blinds');
if (blindsContainer) {
  initGradientBlinds(blindsContainer, {
    gradientColors: ['#5EEAD4', '#8B5CF6', '#FB923C', '#5EEAD4'],
    angle: 25,
    blindCount: 14,
    blindMinWidth: 80,
    spotlightRadius: 0.55,
    spotlightOpacity: 0.9,
    mirrorGradient: true,
    distortAmount: 1.6,
    noise: 0.18,
    mouseDampening: 0.04, // responsive feel
  });
}

/* =========================================================
   🎡 RollingGallery (port of vue-bits · MIT)
   3D cylinder with drag + autoplay
   ========================================================= */

function initRollingGallery(root) {
  if (!root) return;
  const track = root.querySelector('.rolling-track');
  const viewport = root.querySelector('.rolling-viewport');
  if (!track || !viewport) return;

  const faceCount = track.querySelectorAll('.rolling-face').length;
  const autoplay = root.dataset.autoplay === 'true' && !perf.reduceMotion;
  const pauseOnHover = root.dataset.pauseOnHover === 'true';

  let rotateY = 0;
  let isDragging = false;
  let isHovered = false;
  let startX = 0;
  let startRot = 0;
  let autoTimer = null;
  const DRAG_FACTOR = 0.25;
  const MOMENTUM = 0.1;
  const STEP = 360 / faceCount;

  const apply = () => track.style.setProperty('--roll', rotateY + 'deg');
  apply();

  const onDown = (clientX) => {
    isDragging = true;
    startX = clientX;
    startRot = rotateY;
    track.classList.add('dragging');
    stopAuto();
  };
  const onMove = (clientX) => {
    if (!isDragging) return;
    const delta = clientX - startX;
    rotateY = startRot + delta * DRAG_FACTOR;
    apply();
  };
  const onUp = (clientX) => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('dragging');
    const momentum = (clientX - startX) * MOMENTUM;
    rotateY += momentum;
    apply();
    if (autoplay && !(pauseOnHover && isHovered)) {
      setTimeout(() => startAuto(), 1400);
    }
  };

  // Mouse
  viewport.addEventListener('mousedown', (e) => { onDown(e.clientX); e.preventDefault(); });
  window.addEventListener('mousemove', (e) => onMove(e.clientX));
  window.addEventListener('mouseup', (e) => onUp(e.clientX));

  // Touch
  viewport.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0]; onUp(t?.clientX ?? startX);
  });

  // Hover
  viewport.addEventListener('mouseenter', () => {
    isHovered = true;
    if (pauseOnHover && autoplay) stopAuto();
  });
  viewport.addEventListener('mouseleave', () => {
    isHovered = false;
    if (pauseOnHover && autoplay && !isDragging) startAuto();
  });

  // Wheel (horizontal scroll to spin, without blocking page scroll when small delta)
  viewport.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      rotateY -= e.deltaX * 0.5;
      apply();
    }
  }, { passive: false });

  function startAuto() {
    if (!autoplay) return;
    stopAuto();
    autoTimer = setInterval(() => {
      if (isDragging || (pauseOnHover && isHovered)) return;
      rotateY -= STEP;
      apply();
    }, 2400);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // Pause autoplay when off-screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && autoplay) startAuto();
      else stopAuto();
    }, { threshold: 0.2 }).observe(root);
  } else if (autoplay) {
    startAuto();
  }
}

document.querySelectorAll('.rolling-gallery').forEach(initRollingGallery);

/* =========================================================
   🌐 DomeGallery — ported from react-bits DomeGallery (MIT)
   Faithful to original geometry: 35 X-cols × staggered Y-rows,
   each tile size 2×2 (same as source). Dense, evenly-spaced grid.
   Adds a gentle auto-spin (paused while dragging / hovered briefly).
   ========================================================= */

function initDomeGallery(root) {
  if (!root) return;
  const main = root.querySelector('.dome-main');
  const sphere = root.querySelector('.dome-sphere');
  const palette = root.querySelector('.dome-palette');
  if (!main || !sphere || !palette) return;

  // ---- geometry (原版 DomeGallery 同款引數) ----
  const SEGMENTS = 35;        // segments 對半球的經緯切分
  const TILE_SX = 2;
  const TILE_SY = 2;
  const MAX_VERT = 5;         // 原版 maxVerticalRotationDeg = 5
  const DRAG_SENS = 20;       // 原版 dragSensitivity = 20
  const DRAG_DAMP = 0.6;
  const AUTO_SPIN = 0.035;    // 輕度自轉：每幀 0.035deg ≈ 2.1 deg/s

  // 同步 CSS 變數（驅動 --rot-y / --rot-x / --item-width / --item-height）
  root.style.setProperty('--segments-x', SEGMENTS);
  root.style.setProperty('--segments-y', SEGMENTS);

  // 圖片調色盤（每張 <img> 都是一個 tile 的視覺源，JS 迴圈平鋪到整個半球）
  const paletteImgs = palette.content
    ? Array.from(palette.content.querySelectorAll('img.dome-img'))
    : Array.from(palette.querySelectorAll('img.dome-img'));
  const imgs = paletteImgs.length
    ? paletteImgs
    : Array.from(palette.querySelectorAll('img.dome-img'));
  if (!imgs.length) return;

  // 生成交錯網格座標（和原版完全一致）
  // xCols: [-34, -32, ..., 32, 34]  (35 列)
  // evenYs: [-4, -2, 0, 2, 4]; oddYs: [-3, -1, 1, 3, 5]
  const xCols = Array.from({ length: SEGMENTS }, (_, i) => -SEGMENTS - 1 + 2 * i + 1);
  // 上面寫法彆扭，直接按原版來：-37 + i*2 會偏左，改成居中 2 格間隔
  const xColsCentered = [];
  const half = (SEGMENTS - 1);
  for (let i = 0; i < SEGMENTS; i++) xColsCentered.push((i * 2) - half);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs  = [-3, -1, 1, 3, 5];

  // 建 tiles
  let k = 0;
  xColsCentered.forEach((x, c) => {
    const ys = (c % 2 === 0) ? evenYs : oddYs;
    ys.forEach((y) => {
      const tile = document.createElement('div');
      tile.className = 'dome-tile';
      tile.style.setProperty('--offset-x', x);
      tile.style.setProperty('--offset-y', y);
      tile.style.setProperty('--item-size-x', TILE_SX);
      tile.style.setProperty('--item-size-y', TILE_SY);

      const inner = document.createElement('div');
      inner.className = 'dome-tile-inner';

      // 迴圈從調色盤取圖（同一張圖會在球面上重複出現多次）
      const srcImg = imgs[k % imgs.length];
      const imgNode = srcImg.cloneNode(true);
      imgNode.draggable = false;
      inner.appendChild(imgNode);

      tile.appendChild(inner);
      sphere.appendChild(tile);
      k++;
    });
  });

  // ---- 旋轉狀態 ----
  const rot = { x: 0, y: 0 };
  const applyTransform = () => {
    sphere.style.transform =
      `translateZ(calc(var(--radius) * -1)) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
  };
  applyTransform();

  // ---- 工具函式 ----
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const wrapSigned = (d) => {
    const a = (((d + 180) % 360) + 360) % 360;
    return a - 180;
  };

  // ---- 拖拽 ----
  let dragging = false;
  let autoPausedUntil = 0;      // 拖拽后暫停自轉一段時間
  let startX = 0, startY = 0;
  let startRot = { x: 0, y: 0 };
  let lastMoveT = 0;
  let vX = 0, vY = 0;
  let lastX = 0, lastY = 0;
  let inertiaRAF = null;

  const stopInertia = () => {
    if (inertiaRAF) { cancelAnimationFrame(inertiaRAF); inertiaRAF = null; }
  };

  const startInertia = () => {
    const friction = 0.94 + 0.055 * DRAG_DAMP;
    const stopThresh = 0.02;
    const step = () => {
      vX *= friction;
      vY *= friction;
      if (Math.abs(vX) < stopThresh && Math.abs(vY) < stopThresh) {
        inertiaRAF = null;
        return;
      }
      rot.x = clamp(rot.x - vY, -MAX_VERT, MAX_VERT);
      rot.y = wrapSigned(rot.y + vX);
      applyTransform();
      inertiaRAF = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRAF = requestAnimationFrame(step);
  };

  const onDown = (e) => {
    stopInertia();
    dragging = true;
    main.classList.add('dragging');
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    startRot = { ...rot };
    lastMoveT = performance.now();
    main.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    rot.x = clamp(startRot.x - dy / DRAG_SENS, -MAX_VERT, MAX_VERT);
    rot.y = wrapSigned(startRot.y + dx / DRAG_SENS);
    applyTransform();
    const now = performance.now();
    const dt = Math.max(1, now - lastMoveT);
    vX = ((e.clientX - lastX) / DRAG_SENS) * (16 / dt);
    vY = ((e.clientY - lastY) / DRAG_SENS) * (16 / dt);
    lastX = e.clientX; lastY = e.clientY;
    lastMoveT = now;
  };
  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    main.classList.remove('dragging');
    try { main.releasePointerCapture?.(e.pointerId); } catch {}
    autoPausedUntil = performance.now() + 1500; // 鬆手 1.5s 后自轉才恢復
    if (Math.abs(vX) > 0.1 || Math.abs(vY) > 0.1) startInertia();
  };
  main.addEventListener('pointerdown', onDown);
  main.addEventListener('pointermove', onMove);
  main.addEventListener('pointerup', onUp);
  main.addEventListener('pointercancel', onUp);
  main.addEventListener('pointerleave', onUp);

  // ---- 自動輕轉（主迴圈） ----
  let visible = true;
  const autoTick = () => {
    const now = performance.now();
    const canSpin = !dragging && !inertiaRAF && visible && now >= autoPausedUntil;
    if (canSpin) {
      rot.y = wrapSigned(rot.y + AUTO_SPIN);
      applyTransform();
    }
    requestAnimationFrame(autoTick);
  };
  requestAnimationFrame(autoTick);

  // ---- 離屏時暫停 ----
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) stopInertia();
    }, { threshold: 0.05 }).observe(root);
  }
}

document.querySelectorAll('.dome-root').forEach(initDomeGallery);

/* =========================================================
   💎 Copy button · sparkle + tooltip
   ========================================================= */

function spawnSparks(btn) {
  if (perf.reduceMotion) return;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'copy-spark';
    const angle = (Math.PI * 2 * i) / n;
    s.style.setProperty('--dx', Math.cos(angle) * 32 + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * 32 + 'px');
    btn.appendChild(s);
    setTimeout(() => s.remove(), 620);
  }
}
document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd || '';
    const label = btn.querySelector('.copy-label');
    const toast = btn.querySelector('.copy-toast');
    const lang = document.documentElement.dataset.lang || 'en';
    const doneText = (lang === 'en') ? 'Copied ✓' : '已複製 ✓';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cmd).then(() => {
        btn.classList.add('is-copied');
        const orig = label.textContent;
        label.textContent = doneText;
        if (toast) toast.classList.add('show');
        spawnSparks(btn);
        setTimeout(() => {
          btn.classList.remove('is-copied');
          label.textContent = orig;
          if (toast) toast.classList.remove('show');
        }, 2000);
      });
    }
  });
});

/* =========================================================
   i18n
   ========================================================= */

const i18n = {
  en: {
    brand: 'web-design',
    'hero.eyebrow': 'THE DESIGN SKILL FOR CLAUDE CODE',
    'hero.before': 'First a ', 'hero.spec': 'spec', 'hero.comma': ', ',
    'hero.before2': 'then the ', 'hero.code': 'code', 'hero.period': '.',
    'hero.sub1': 'Feed it a PRD, a reference URL, or a screenshot.',
    'hero.sub2': 'It produces a readable, editable, portable <em>DESIGN.md</em> first.',
    'hero.sub3': 'Then it generates web code where UI, visuals, motion, and responsiveness all land.',
    'hero.cta1': 'Install now', 'hero.cta2': 'Why it works this way →',
    'step.1': 'Input PRD / URL / Screenshot', 'step.2': 'Produce DESIGN.md spec', 'step.3': 'Output 100-score code',
    'why.eyebrow': 'WHY DESIGN.MD', 'why.title': 'Why a spec first',
    'why.sub': 'AI writes code directly vs. spec-first, code-second — not in the same league.',
    'why.bad.tag': 'AI writes directly',
    'why.bad.l1': '× Colors drift between pages',
    'why.bad.l2': '× Type sizes depend on AI memory',
    'why.bad.l3': '× Motion tier picked on a whim',
    'why.bad.l4': '× New tool or chat → start over',
    'why.good.tag': 'DESIGN.md first, then code',
    'why.good.l1': '✓ Colors, type, spacing all named',
    'why.good.l2': '✓ Consistent across pages',
    'why.good.l3': '✓ Portable across AI tools',
    'why.good.l4': '✓ Edit one DESIGN.md line, site-wide',
    'inputs.eyebrow': 'THREE INPUTS · ONE OUTPUT',
    'inputs.title': 'Start from anywhere',
    'inputs.sub': 'A PRD, a reference URL, a screenshot — or any combination. The SKILL decides where to extract design cues from.',
    'input.1.title': 'PRD document',
    'input.1.desc': 'Derives direction from positioning, audience, pages and competitors.',
    'input.2.title': 'Reference URL',
    'input.2.desc': 'Playwright crawler extracts palette, fonts, spacing and motion — 48 tokens in seconds.',
    'input.3.title': 'Screenshot / Sketch',
    'input.3.desc': 'Extracts mood, temperature, density and type tone straight from pixels. Reliable fallback.',
    'wf.eyebrow': 'WORKFLOW · THREE PHASES', 'wf.title': 'A → B → C · three phases',
    'wf.sub': 'No one-shot shortcut. Each phase leaves you an approval gate.',
    'wf.a.name': 'Understand',
    'wf.a.desc': 'Extract design cues from PRD / URL / screenshot / keywords / brand name; fallback chain has your back.',
    'wf.a.o1': '· Tone keywords × 5',
    'wf.a.o2': '· Competitor tokens × 48',
    'wf.a.o3': '· Interaction tier suggestion',
    'wf.b.name': 'Produce DESIGN.md',
    'wf.b.desc': 'A full 9-section spec. Once you approve it, it lives in your project and can be edited by hand.',
    'wf.c.name': 'Generate code',
    'wf.c.desc': 'Strictly follows the spec. Self-audits against the 100-score checklist. Diff-audits when a reference exists.',
    'wf.c.o2': '✓ All component states covered',
    'wf.c.o3': '✓ Responsive + reduced-motion',
    'inside.eyebrow': "WHAT'S INSIDE", 'inside.title': 'A full design asset vault',
    'inside.sub': 'The SKILL ships with its own reference library — drag to spin, hover to pause.',
    'rolling.hint': 'Drag or scroll to spin · hover to pause',
    'art.1.title': '58 brand presets',
    'art.1.body': 'Linear · Stripe · Apple · Supabase · Vercel · Figma · Cursor · …',
    'art.2.title': '10 style seeds',
    'art.2.body': 'Editorial · Dark tech · Minimal · Pro · Playful · Zen · Cyber · Organic · Swiss · Glass',
    'art.3.title': '3 interaction tiers',
    'art.3.body': 'L1 static · L2 fluid · L3 immersive (pin + 3D + WebGL)',
    'art.4.title': '7 scene defaults',
    'art.4.body': 'Landing · Portfolio · Blog · Dashboard · PPT · App UI · Email',
    'art.5.title': 'Motion library · 124',
    'art.5.body': 'Text 24 + Animations 29 + Components 32 + Backgrounds 40, curated per style.',
    'art.6.title': 'Crawler + QA scripts',
    'art.6.body': 'Playwright viewport crawler · static token extractor · quality checklist self-audit.',
    'showcase.eyebrow': 'BUILT WITH', 'showcase.title': 'Made with this SKILL',
    'ring.hint': 'Hold & drag to spin',
    'author.eyebrow': 'MADE BY',
    'author.bio': 'web-design is a side project. If it saves you time, a star on GitHub helps keep it actively maintained.',
    'install.eyebrow': "INSTALL · IT'S OPEN SOURCE",
    'install.free': 'Free', 'install.open': 'open-source', 'install.works': 'to run',
    'install.sub': 'No account. No API key. No subscription.',
    'install.copy': 'Copy', 'install.toast': 'In your clipboard →', 'install.req': 'Requires',
    'install.github': 'View on GitHub',
    'footer.tag': 'Phase A → B → C · DESIGN.md driven',
    'footer.credits': 'Credits', 'footer.links': 'Links',
    'footer.top': 'Back to top', 'footer.install': 'Install',
  },
  zh: {
    brand: 'web-design',
    'hero.eyebrow': 'THE DESIGN SKILL FOR CLAUDE CODE',
    'hero.before': '先出', 'hero.spec': '規範', 'hero.comma': '，',
    'hero.before2': '再出', 'hero.code': '程式碼', 'hero.period': '。',
    'hero.sub1': '輸入 PRD、參考 URL 或截圖，',
    'hero.sub2': '先產出一份可讀、可改、可傳遞的 <em>DESIGN.md</em>，',
    'hero.sub3': '再基於規範生成 UI/UX、視覺、動效、響應式全部達標的 web 程式碼。',
    'hero.cta1': '立即安裝', 'hero.cta2': '為什麼要這樣 →',
    'step.1': '輸入 PRD / URL / 截圖', 'step.2': '生成 DESIGN.md 規範', 'step.3': '輸出 100 分程式碼',
    'why.eyebrow': 'WHY DESIGN.MD', 'why.title': '為什麼要有規範',
    'why.sub': 'AI 直接擼程式碼 vs 先規範、再程式碼 — 結果不在一個量級。',
    'why.bad.tag': 'AI 直接擼',
    'why.bad.l1': '× 每次生成頁面色值不一致',
    'why.bad.l2': '× 字號字重靠 AI 當時記憶',
    'why.bad.l3': '× 動效檔位看心情',
    'why.bad.l4': '× 換工具 / 換對話重來一遍',
    'why.good.tag': '先 DESIGN.md，再程式碼',
    'why.good.l1': '✓ 色、字、距都有命名',
    'why.good.l2': '✓ 跨頁面一致',
    'why.good.l3': '✓ 跨 AI 工具可延續',
    'why.good.l4': '✓ 改一行 DESIGN.md，全站跟著變',
    'inputs.eyebrow': 'THREE INPUTS · ONE OUTPUT',
    'inputs.title': '任何起點都可以',
    'inputs.sub': '一份 PRD、一個參考 URL、一張截圖，或者三者任意混合——SKILL 自行判斷從哪裡抽取設計線索。',
    'input.1.title': 'PRD 文件',
    'input.1.desc': '從產品定位、目標使用者、核心頁面、競品中，推導風格方向。',
    'input.2.title': '參考 URL',
    'input.2.desc': 'Playwright 爬蟲抓取色板、字型、間距、動效，48 個 CSS token 秒級提取。',
    'input.3.title': '截圖 / 草稿',
    'input.3.desc': '從視覺直接提煉氣質、色溫、密度、字型風格，降級兜底可靠。',
    'wf.eyebrow': 'WORKFLOW · THREE PHASES',
    'wf.title': 'A → B → C 三段式',
    'wf.sub': '不求一鍵出活，每一步都留給你審閱點。',
    'wf.a.name': '理解需求',
    'wf.a.desc': '從 PRD / URL / 截圖 / 關鍵詞 / 品牌名，提取設計線索；按降級鏈路兜底。',
    'wf.a.o1': '· 調性關鍵詞 × 5',
    'wf.a.o2': '· 競品 token × 48',
    'wf.a.o3': '· 互動檔位建議',
    'wf.b.name': '輸出 DESIGN.md',
    'wf.b.desc': '9 章節完整規範。使用者確認后落盤專案目錄，跨專案複用、可手動修改。',
    'wf.c.name': '生成程式碼',
    'wf.c.desc': '嚴格按規範生成；100 分質量底線自檢；有參考時做差異審計。',
    'wf.c.o2': '✓ 全元件狀態齊全',
    'wf.c.o3': '✓ 響應式 + reduced-motion',
    'inside.eyebrow': "WHAT'S INSIDE",
    'inside.title': '一個完整的設計資產倉庫',
    'inside.sub': 'SKILL 自帶的引用庫——拖拽旋轉，懸停暫停。',
    'rolling.hint': '拖拽或滾輪旋轉 · 懸停暫停',
    'art.1.title': '58 個品牌預置',
    'art.1.body': 'Linear · Stripe · Apple · Supabase · Vercel · Figma · Cursor · …',
    'art.2.title': '10 种風格種子',
    'art.2.body': '奶油編輯 · 暗黑科技 · 极簡剋制 · 溫暖商務 · 活潑創意 · 中文優雅 · 賽博朋克 · 自然有機 · 瑞士設計 · 玻璃擬態',
    'art.3.title': '3 檔互動層級',
    'art.3.body': 'L1 精緻靜態 · L2 流暢互動 · L3 沉浸體驗（pin + 3D + WebGL）',
    'art.4.title': '7 种場景預設',
    'art.4.body': 'Landing · Portfolio · Blog · Dashboard · 課件 · App UI · 郵件模板',
    'art.5.title': 'Motion 庫 · 124 項',
    'art.5.body': 'Text 24 + Animations 29 + Components 32 + Backgrounds 40，按風格 × 場景推荐組合。',
    'art.6.title': '爬蟲 + 質檢指令碼',
    'art.6.body': 'Playwright 爬蟲 · 輕量靜態 Token 提取 · 質量 checklist 自檢。',
    'showcase.eyebrow': 'BUILT WITH', 'showcase.title': '用它做出來的頁面',
    'ring.hint': '按住左右拖拽旋轉',
    'author.eyebrow': '作者',
    'author.bio': '這是小普的一個 side project。如果它幫你省了時間，去 GitHub 點個 Star 就是最大的支持。',
    'install.eyebrow': "INSTALL · IT'S OPEN SOURCE",
    'install.free': '免費', 'install.open': '開源', 'install.works': '就能用',
    'install.sub': 'No account. No API key. No subscription.',
    'install.copy': '複製', 'install.toast': '已裝進剪貼簿 →', 'install.req': 'Requires',
    'install.github': '在 GitHub 查看',
    'footer.tag': 'Phase A → B → C · DESIGN.md 驅動',
    'footer.credits': '開源致謝', 'footer.links': '連結',
    'footer.top': '回到頂部', 'footer.install': '安裝',
  },
};

function applyLang(lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  const dict = i18n[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
}
document.querySelector('.lang-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.dataset.lang || 'en';
  applyLang(current === 'zh' ? 'en' : 'zh');
});
applyLang('en'); // default English

console.log('%c web-design · build ready ', 'background:#5EEAD4; color:#0a0b0e; font-weight:700; padding:3px 8px; border-radius:3px;');
