import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { translations } from '../i18n/translations';

// 5T-Trustworthy: 這組測試在「部署前」擋掉正式版最容易被忽略的兩類問題。
// 兩者都曾真實發生過：品牌字漂成「墳/塾」，以及下載連結指向不存在的檔案。

const ROOT = path.resolve(import.meta.dirname, '../..');
const SRC = path.join(ROOT, 'src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

// 這個 repo 刻意把「歷史錯字」寫進測試作為 WRONG 清單，
// 掃描時要排除 src/tests/ 與註解，否則會自我誤報。
const WRONG_BRAND = [0x587e, 0x58fe, 0x8056, 0x58ba, 0x8fb7].map((c) => String.fromCodePoint(c));

describe('品牌碼位 (5T-Trustworthy)', () => {
  it('no source file renders a historical wrong brand char', () => {
    const offenders = [];
    for (const f of walk(SRC)) {
      if (f.includes(`${path.sep}tests${path.sep}`)) continue; // 測試刻意列出錯字
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((ln, i) => {
        // 跳過註解行
        const t = ln.trim();
        if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
        for (const w of WRONG_BRAND) {
          if (ln.includes(w)) {
            offenders.push(`${path.relative(ROOT, f)}:${i + 1} U+${w.codePointAt(0).toString(16).toUpperCase()}`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the correct brand char U+58BE is actually present', () => {
    const ken = String.fromCodePoint(0x58be);
    const files = walk(SRC).filter((f) => !f.includes(`${path.sep}tests${path.sep}`));
    const hits = files.filter((f) => fs.readFileSync(f, 'utf8').includes(ken));
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe('內部連結 (5T-Transparent)', () => {
  it('every internal asset link resolves to a real file in public/', () => {
    const offenders = [];
    for (const f of walk(SRC)) {
      if (f.includes(`${path.sep}tests${path.sep}`)) continue;
      const c = fs.readFileSync(f, 'utf8');
      for (const m of c.matchAll(/(?:href|src)=["'`](\/[^"'`#?]+)["'`]/g)) {
        const url = m[1];
        if (!/\.[a-z0-9]{2,5}$/i.test(url)) continue; // 路由或無副檔名，跳過
        const disk = path.join(ROOT, 'public', decodeURIComponent(url));
        if (!fs.existsSync(disk)) offenders.push(`${path.relative(ROOT, f)} -> ${url}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('翻譯鍵對稱 (5T-Trustworthy)', () => {
  it('zh and en contact namespaces expose the same keys', () => {
    const zh = Object.keys(translations.zh.contact).sort();
    const en = Object.keys(translations.en.contact).sort();
    expect(zh).toEqual(en);
  });

  it('zh and en top-level namespaces match', () => {
    const zh = Object.keys(translations.zh).sort();
    const en = Object.keys(translations.en).sort();
    expect(zh).toEqual(en);
  });
});

// 5T-Transparent: 英文版不得殘留繁中。
// 背景：使用者回報「中英翻譯也是會突然出現不該出現的狀況 英文版 還是繁體中文」。
// 已查到的兩類成因：
//   (a) en 字典某個 key 的「值」仍是中文 —— key 在 ≠ 已翻譯；
//   (b) 元件整段硬編碼中文、完全沒接 t()（ErrorBoundary 就是這一類，
//       平時看不到、觸發錯誤時整頁中文）。
// 「翻譯鍵對稱」只擋得住 key 缺漏，擋不住上面兩種，所以另立這道 gate。
describe('英文版無中文殘留 (5T-Transparent)', () => {
  const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
  // 語言切換器按鈕本來就要顯示「繁中」——那是給英文訪客看的語言名稱，
  // 不是漏翻。同理品牌名 / 證照號碼等法定中文維持原樣。
  const ALLOW = new Set(['lang.zh']);

  function collect(node, path = '', out = []) {
    if (typeof node === 'string') {
      if (CJK.test(node) && !ALLOW.has(path)) out.push(`${path} → ${node}`);
      return out;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => collect(v, `${path}[${i}]`, out));
      return out;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) collect(v, path ? `${path}.${k}` : k, out);
    }
    return out;
  }

  it('en 字典沒有未翻譯的中文值', () => {
    const hits = collect(translations.en);
    expect(
      hits,
      `${hits.length} 個 en 值仍是中文，切英文版會看到繁中：\n  ${hits.join('\n  ')}`
    ).toEqual([]);
  });

  it('ErrorBoundary 四段文案在 zh/en 皆存在且非空', () => {
    // class 元件取不到 hook 的 t()，因此它自己讀 translations[lang]。
    // 這裡守住「兩邊都在」，否則會靜默落到 FALLBACK 而無人察覺。
    for (const lang of ['zh', 'en']) {
      const eb = translations[lang].errorBoundary;
      expect(eb, `${lang} 缺 errorBoundary 命名空間`).toBeTruthy();
      for (const k of ['title', 'body', 'retry', 'home']) {
        expect(typeof eb[k], `${lang}.errorBoundary.${k} 應為字串`).toBe('string');
        expect(eb[k].length, `${lang}.errorBoundary.${k} 為空字串`).toBeGreaterThan(0);
      }
    }
  });

  it('ErrorBoundary 原始碼已無硬編碼中文文案', () => {
    // 確保文案真的搬進字典了，而不是「字典有了但元件還寫死中文」。
    const src = fs.readFileSync(path.join(SRC, 'components', 'ErrorBoundary.jsx'), 'utf8');
    const body = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const hits = (body.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g) || []);
    // FALLBACK.zh 是刻意的中文備援（僅在字典缺 key 時才會用到），
    // 故只允許它出現在 FALLBACK 區塊內。
    const afterFallback = body.slice(body.indexOf('export default class'));
    const outside = (afterFallback.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g) || []);
    expect(
      outside,
      `render() 之後仍有硬編碼中文：${outside.join(' ')}`
    ).toEqual([]);
    expect(hits.length).toBeGreaterThan(0); // FALLBACK.zh 仍在，屬預期
  });
});

// 5T-Trustworthy: 自架字型子集的守衛。
// 背景：本站字型改為「依實際用字硬子集」後，體積從 Google Fonts 的 17.6MB / 366 檔
// 降到 734KB / 2 檔。代價是新增文案若用到子集沒有的字，該字會掉回系統字型——
// 這在畫面上很難察覺，所以在此變成可攔截的失敗。
describe('自架字型子集 (5T-Trustworthy)', () => {
  const FONT_DIR = path.join(ROOT, 'public', 'fonts');
  const cp = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

  // 掃描範圍對齊 scripts/build-fonts.py 的 SCAN（此處排除 dist/node_modules）。
  function scanForHan() {
    const files = [...walk(SRC)];
    for (const extra of ['index.html', 'public']) {
      const p = path.join(ROOT, extra);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) files.push(...walk(p));
      else if (fs.existsSync(p)) files.push(p);
    }
    const han = new Set();
    for (const f of files) {
      if (f.includes(`${path.sep}node_modules${path.sep}`)) continue;
      // 測試檔不會被渲染，其用字不影響字型需求；否則把中文斷言訊息
      // 寫進測試檔就會反向改變字型子集需求，形成自我糾纏。
      if (f.includes(`${path.sep}tests${path.sep}`)) continue;
      let text = fs.readFileSync(f, 'utf8');
      // HTML/JS/CSS 註解同樣不會被渲染。若不排除，則任何解釋性註解裡的一個生僻字
      // 都會強迫擴充字型子集，等於讓註解決定線上字型包大小。
      if (/\.(html|jsx?|tsx?|css)$/.test(f)) {
        text = text
          .replace(/<!--[\s\S]*?-->/g, '')  // HTML 註解
          .replace(/\/\*[\s\S]*?\*\//g, '')  // 區塊註解
          .replace(/^\s*\/\/.*$/gm, '')      // 行內註解
          .replace(/\/\/.*$/gm, (m) => (m.includes('://') ? m : '')); // 保留 URL 的 //
      }
      for (const m of text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []) {
        han.add(m);
      }
    }
    return han;
  }

  it('字型實體檔存在且非空', () => {
    for (const f of ['noto-serif-tc.woff2', 'inter-latin.woff2']) {
      const p = path.join(FONT_DIR, f);
      expect(fs.existsSync(p), `${f} 不存在`).toBe(true);
      expect(fs.statSync(p).size, `${f} 是空檔或過小`).toBeGreaterThan(1024);
    }
  });

  it('子集涵蓋全站用到的每一個漢字', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'font-subset-manifest.json'), 'utf8'));
    const covered = new Set(manifest.fonts['noto-serif-tc'].codepoints.split(' '));
    const han = scanForHan();
    const missing = [...han].filter((c) => !covered.has(cp(c)));
    expect(
      missing,
      `${missing.length} 個字不在 Noto Serif TC 子集內，會掉回系統字型：${missing.join('')}\n` +
        '修法：.fontenv/Scripts/python.exe scripts/build-fonts.py'
    ).toEqual([]);
  });

  it('index.css 不再引用 Google Fonts（@import 會序列阻塞）', () => {
    const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
    expect(css).not.toContain('fonts.googleapis.com');
  });

  it('fonts.css 為兩個字型各宣告一次 @font-face', () => {
    const css = fs.readFileSync(path.join(SRC, 'fonts.css'), 'utf8');
    expect((css.match(/@font-face/g) || []).length).toBe(2);
    expect(css).toContain("'Noto Serif TC'");
    expect(css).toContain("'Inter'");
  });

  it('index.html 以 preload 預載字型，且帶 crossorigin', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    for (const f of ['noto-serif-tc', 'inter-latin']) {
      const re = new RegExp(`<link rel="preload" href="/fonts/${f}\\.woff2"[^>]*crossorigin`);
      expect(html, `缺少 ${f}.woff2 的 preload 或 crossorigin`).toMatch(re);
    }
  });
});

// 5T-Trustworthy: 圖片路徑的 URL-safety 守衛。
// 線上實測證據：檔名含空格者回 HTTP 200 但 Content-Type 是 text/html，
// 內容為 SPA 首頁（`<!doctype html>`）——因為 nginx 匹配不到檔案就落到
// `try_files $uri $uri/ /index.html`。**只看狀態碼會誤判為成功。**
describe('圖片路徑 URL-safety (5T-Trustworthy)', () => {
  // 半形空格 / 全形空格 / 全形斜線 U+FF0F
  const BAD_PATH = /[ 　／]/;
  const IMG_REF = /['"`](\/images\/[^'"`]+?\.(?:webp|png|jpe?g|svg|avif))['"`]/g;

  function referencedImages() {
    const out = [];
    for (const f of [...walk(SRC), path.join(ROOT, 'index.html')]) {
      if (f.includes(`${path.sep}tests${path.sep}`)) continue;
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(IMG_REF)) out.push({ file: f, url: m[1] });
    }
    return out;
  }

  it('被引用的圖片路徑不含空格與全形斜線', () => {
    const offenders = referencedImages()
      .filter((r) => BAD_PATH.test(r.url))
      .map((r) => `${path.relative(ROOT, r.file)} -> ${r.url}`);
    expect(offenders, '含空格/全形斜線的圖片路徑在線上會回 SPA 首頁而非圖片').toEqual([]);
  });

  it('每個被引用的圖片在 public/ 都有對應實體檔', () => {
    const missing = referencedImages()
      .filter((r) => !fs.existsSync(path.join(ROOT, 'public', r.url.replace(/^\//, ''))))
      .map((r) => r.url);
    expect(missing, '這些引用在 public/ 找不到檔案').toEqual([]);
  });
});

// 5T-Tangible: 社群分享必須有可解析的 og:image。
// 實測線上 /images/logo.webp 回 Content-Type: image/webp，而 Facebook / LinkedIn /
// LINE 的 OG 解析器多數不支援 webp → 分享連結會無圖。故 og:image 必須指向 PNG/JPEG，
// 且同一個 meta name 不得重複宣告（重複時不同解析器取的欄位不一致，難以預測）。
describe('Open Graph 分享圖', () => {
  const html = () => fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  it('og:image 指向 PNG 且有實際對應檔案', () => {
    const m = html().match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    expect(m, '找不到 og:image meta').toBeTruthy();
    expect(m[1], 'og:image 必須是 .png/.jpg —— webp 多數 OG 解析器不支援').toMatch(/\.(png|jpe?g)$/i);

    const local = path.join(ROOT, 'public', new URL(m[1]).pathname.replace(/^\//, ''));
    expect(fs.existsSync(local), `og:image 指向的檔案不存在: ${local}`).toBe(true);
  });

  it('og:image 尺寸宣告為 OG 建議的 1200×630', () => {
    expect(html()).toMatch(/<meta\s+property="og:image:width"\s+content="1200"\s*\/?>/);
    expect(html()).toMatch(/<meta\s+property="og:image:height"\s+content="630"\s*\/?>/);
  });

  it('同一個 OG/Twitter meta 只宣告一次', () => {
    const counts = {};
    for (const m of html().matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[a-z:]+)"/g)) {
      counts[m[1]] = (counts[m[1]] || 0) + 1;
    }
    const dupes = Object.entries(counts)
      .filter(([, n]) => n > 1)
      .map(([k, n]) => `${k} 出現 ${n} 次`);
    expect(dupes, '重複的 OG meta 會讓不同解析器取到不一致的欄位').toEqual([]);
  });
});
