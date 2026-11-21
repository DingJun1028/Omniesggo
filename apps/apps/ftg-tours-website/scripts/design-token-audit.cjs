/**
 * 設計 token 稽核工具（SSOT 版本）
 *
 * 設計原則：token 清單一律從 tailwind.config.js 讀取（single source of truth），
 * 不在此處硬編碼副本 —— 否則刪除 token 後工具會誤報幽靈 token（5T-Traceable）。
 *
 * 檢查項目：
 *   1. 已定義 token 的使用次數（找出閒置 token）
 *   2. 已使用但未定義的類別（Tailwind 會靜默失效，不報錯 —— 最危險的失敗型態）
 *
 * 執行：node scripts/design-token-audit.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// ── 1. 從 tailwind.config.js 解析 SSOT ────────────────────────────────
function parseTailwindConfig() {
  const cfgPath = path.join(root, 'tailwind.config.js');
  const src = fs.readFileSync(cfgPath, 'utf8');

  // ── 色彩 ────────────────────────────────────────────────────────
  // 結構無關的解析策略（不依賴變數名或物件展開位置）：
  //   1. 抓全檔所有 `name: '#hex'`        → 基礎色票
  //   2. 抓所有 `name: <something>.<key>` → 別名引用，解析成實際 hex
  // 因此 config 改成 `const palette = {...}` + spread 宣告時仍正確。
  const colors = {};
  const hexRe = /([A-Za-z][A-Za-z0-9]*)\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]/g;
  let m;
  while ((m = hexRe.exec(src)) !== null) colors[m[1]] = m[2];

  // 別名可能引用同檔任一色票，收集後統一解析（處理宣告順序）
  const aliasRe = /([A-Za-z][A-Za-z0-9]*)\s*:\s*[A-Za-z][A-Za-z0-9]*\.([A-Za-z][A-Za-z0-9]*)/g;
  const pending = [];
  while ((m = aliasRe.exec(src)) !== null) pending.push([m[1], m[2]]);
  for (const [name, target] of pending) {
    if (colors[target]) colors[name] = colors[target];
  }

  // 解析 fontFamily 區塊：sans: [...], serif: [...]
  const fonts = {};
  const fontBlock = src.match(/fontFamily:\s*\{([\s\S]*?)\n\s{4}\}/);
  if (fontBlock) {
    const re = /([A-Za-z][A-Za-z0-9]*)\s*:\s*\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(fontBlock[1])) !== null) {
      fonts[m[1]] = m[2]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }
  }
  return { colors, fonts };
}

// ── 2. 收集 src 下所有 js/jsx ────────────────────────────────────────
function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, files);
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const { colors: definedColors, fonts: definedFonts } = parseTailwindConfig();
const definedColorNames = Object.keys(definedColors);
const definedFontNames = Object.keys(definedFonts);
const files = collectFiles(path.join(root, 'src'));

// ── 3. 掃描使用情況 ───────────────────────────────────────────────────
// 只掃 className / class 屬性的字串內容，避免誤判：
//   - href="/files/ftg-tours-brochure.pdf"  → URL，非類別
//   - data-ftg-seo="true"                  → data 屬性，非類別
//   - 註解中的文字
const colorUsage = {};
const fontUsage = {};
const orphanColors = new Map(); // 用了但未定義 -> 檔案
const orphanFonts = new Map();

// Tailwind 內建的 font-weight scale，非自訂 fontFamily token
const BUILTIN_FONT_WEIGHTS = new Set([
  'thin', 'extralight', 'light', 'normal', 'medium',
  'semibold', 'bold', 'extrabold', 'black',
]);

// 取出 className="..." / className={'...'} / class="..." 的內容
const classAttrRe = /\bclass(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{'([^']*)'\})/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(root, f).replace(/\\/g, '/');

  for (const m of content.matchAll(classAttrRe)) {
    const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? '';
    // class 清單以空白分隔；變數插值 ${...} 自動被忽略
    for (const token of value.split(/\s+/)) {
      if (!token) continue;

      // 色票：token 內含 ftg-<name>（前綴可能是 bg-/text-/border-/from-/via-/to- 等）
      const cm = token.match(/ftg-([a-z][a-z0-9]*)/);
      if (cm) {
        const name = cm[1];
        if (definedColorNames.includes(name)) {
          colorUsage[name] = (colorUsage[name] || 0) + 1;
        } else {
          if (!orphanColors.has(name)) orphanColors.set(name, new Set());
          orphanColors.get(name).add(rel);
        }
        continue;
      }

      // 字型：僅比對裸 font-<name>（排除 font-bold 等內建字重）
      const fm = token.match(/(?:^|:)font-([a-z][a-z0-9]*)/);
      if (fm) {
        const name = fm[1];
        if (BUILTIN_FONT_WEIGHTS.has(name)) continue; // Tailwind 內建
        if (definedFontNames.includes(name)) {
          fontUsage[name] = (fontUsage[name] || 0) + 1;
        } else {
          if (!orphanFonts.has(name)) orphanFonts.set(name, new Set());
          orphanFonts.get(name).add(rel);
        }
      }
    }
  }
}

// ── 4. 輸出報告 ───────────────────────────────────────────────────────
const out = [];
const push = s => out.push(s);

push('設計 token 稽核報告 — FTG Tours');
push('====================================');
push(`SSOT 來源：tailwind.config.js`);
push(`掃描檔案數：${files.length}`);
push('');

push('【色彩 token】');
for (const name of definedColorNames) {
  const n = colorUsage[name] || 0;
  push(`  ftg-${name.padEnd(8)} ${definedColors[name]}  ${String(n).padStart(3)} 次  ${n === 0 ? '⚠️ 閒置' : '✅'}`);
}
push('');

push('【字型 token】');
for (const name of definedFontNames) {
  const n = fontUsage[name] || 0;
  push(`  font-${name.padEnd(6)} ${(definedFonts[name] || []).join(', ')}  ${String(n).padStart(3)} 次  ${n === 0 ? '⚠️ 閒置' : '✅'}`);
}
push('');

push('【未定義類別（Tailwind 會靜默失效）】');
if (orphanColors.size === 0 && orphanFonts.size === 0) {
  push('  無 — 所有用到的 token 皆有定義 ✅');
} else {
  for (const [name, where] of orphanColors) {
    push(`  ❌ ftg-${name}  未定義於 tailwind.config.js`);
    for (const w of where) push(`       ${w}`);
  }
  for (const [name, where] of orphanFonts) {
    push(`  ❌ font-${name}  未定義於 tailwind.config.js`);
    for (const w of where) push(`       ${w}`);
  }
}
push('');

const idleColors = definedColorNames.filter(c => !colorUsage[c]);
const idleFonts = definedFontNames.filter(f => !fontUsage[f]);
push('【稽核結論】');
if (orphanColors.size || orphanFonts.size) {
  push(`  🔴 有 ${orphanColors.size + orphanFonts.size} 個未定義類別，樣式會靜默失效，必須修正`);
} else if (idleColors.length || idleFonts.length) {
  push(`  🟡 無未定義類別；但有閒置 token：${[...idleColors.map(c => 'ftg-' + c), ...idleFonts.map(f => 'font-' + f)].join(', ')}`);
  push('     （閒置不影響功能；若要收斂設計系統可從 tailwind.config.js 移除）');
} else {
  push('  ✅ 所有 token 皆有定義且皆被使用，設計系統閉環完整');
}

const report = out.join('\n');
console.log(report);
fs.writeFileSync(path.join(__dirname, 'design-token-audit-report.txt'), report + '\n');

// 有未定義類別時以 non-zero 結束 —— 讓本腳本可直接作為
// CI 或 pre-commit 閘門，阻止樣式靜默失效進入 main。
if (orphanColors.size || orphanFonts.size) process.exit(1);
