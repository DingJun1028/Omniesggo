// 觸控目標回歸測試：所有 <a>/<button>/<Link> 都必須有 >= 44px 的觸控區。
// 這是 WCAG 2.5.8 (Target Size, Minimum) 的專案化落地。
// 設計：不依賴瀏覽器（CI 快速），改以「class 宣告 + CSS 編譯結果」雙重驗證。
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const DIST_CSS = 'dist/assets';

function walk(dir, ext, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, acc);
    else if (e.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}

describe('WCAG 2.5.8 觸控目標 >= 44px', () => {
  const files = walk(SRC, '.jsx');
  const hasCss = fs.existsSync(DIST_CSS) &&
    fs.readdirSync(DIST_CSS).some(f => f.endsWith('.css'));
  const css = hasCss
    ? fs.readFileSync(path.join(DIST_CSS, fs.readdirSync(DIST_CSS).find(f => f.endsWith('.css'))), 'utf8')
    : '';

  // 宣告觸控區的 class：min-h-[44px] / min-w-[44px]，
  // 或有足夠 padding（py-3=24px 單邊 → 48px）/ 固定尺寸
  // 注意：py-2 與 py-2.5 只有 36-40px，不足 44，故不列為合格。
  const DECLARES_TAP = /min-h-\[4[4-9]px\]|min-h-1[0-9]\b|min-w-\[4[4-9]px\]|\bpy-3\b|\bpy-4\b|\bpy-5\b|\bh-1[0-9]\b|\bh-2[0-9]\b|\bh-\d{2}\b|\bsize-1[0-9]\b|\bsize-\d{2}\b/;

  const offenders = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    // <a ...>、<button ...>、<Link ...> 開標籤
    const re = /<(a|button|Link)\b([^>]*)>/g;
    let m;
    while ((m = re.exec(src))) {
      const attrs = m[2];
      // 排除：href="#" 且是純佔位、honeypot、aria-hidden 容器內
      if (/aria-hidden="true"/.test(attrs)) continue;
      const clsMatch = attrs.match(/className=\{?["`]([^"'`]*)/);
      if (!clsMatch) continue;
      const cls = clsMatch[1];
      if (DECLARES_TAP.test(cls)) continue;
      // p-1.5 (6px) / p-2 (8px) / p-2.5 (10px) 單邊撐不起 44px，必須搭配 min-h。
      // 這裡只放行同時有 min-h/min-w 的情況，避免「以為補了但其實沒補」。
      if (/\bp-1\.5\b|\bp-2(\.\d)?\b/.test(cls) && !/min-h-|min-w-/.test(cls)) {
        const line = src.slice(0, m.index).split('\n').length;
        offenders.push(`${f}:${line} <${m[1]}> small padding without min-h: "${cls.slice(0, 60)}"`);
        continue;
      }
      // 排除：內含 <img> 或 aspect 容器的 Link（本體尺寸由子元素決定）
      // 視窗要夠大：產品卡的 aspect 容器在 <img> 之後、p-6 還更後面。
      const after = src.slice(m.index, m.index + 600);
      const tagEnd = after.indexOf('>');
      const body = after.slice(tagEnd, tagEnd + 500);
      if (/<img[^>]*className="[^"]*h-\d/.test(body)) continue;
      // 產品卡：內含 aspect-[16/9] 圖片容器 + p-6，實際高度 > 300px
      if (/aspect-\[\d+\/\d+\]/.test(body) && /\bp-6\b/.test(body)) continue;
      // honeypot 隱藏欄位
      if (/left-\[-9999px\]/.test(cls)) continue;

      const line = src.slice(0, m.index).split('\n').length;
      const label = (body.match(/>([^<>{}\n]{2,20})</) || ['', ''])[1].trim();
      offenders.push(`${f}:${line} <${m[1]}> cls="${cls.slice(0, 60)}" label="${label}"`);
    }
  }

  it('沒有未宣告觸控區的 a / button / Link', () => {
    if (offenders.length) {
      console.log('\n以下目標未宣告 >= 44px 觸控區（WCAG 2.5.8）：');
      for (const o of offenders) console.log('  ' + o);
    }
    expect(offenders).toEqual([]);
  });

  it.skipIf(!hasCss)('觸控區 class 已被 Tailwind 編譯進 CSS 產物', () => {
    // Tailwind 會把 [44px] 編譯成 .min-h-\[44px\]{min-height:44px}
    for (const rule of ['.min-h-\\[44px\\]{min-height:44px}', '.min-w-\\[44px\\]{min-width:44px}']) {
      expect(css).toContain(rule);
    }
  });

  // 5T-Transparent：本專案先前連續三輪「修一個 → 實測又找到一個」，
  // 根因是只擋「完全沒宣告」，擋不住「只宣告 min-h 卻漏 min-w」。
  // WCAG 2.5.8 同時要求兩個軸都達標，故此處強制成對。
  it('min-h-[44px] 與 min-w-[44px] 必須成對出現（單獨宣告視為未完成）', () => {
    const lone = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /className="([^"]*)"/g;
      let m;
      while ((m = re.exec(src))) {
        const c = m[1];
        const hasH = c.includes('min-h-[44px]');
        const hasW = c.includes('min-w-[44px]');
        if (hasH !== hasW) {
          const line = src.slice(0, m.index).split('\n').length;
          lone.push(`${f}:${line} has min-h=${hasH} min-w=${hasW} -> "${c.slice(0, 70)}"`);
        }
      }
    }
    if (lone.length) {
      console.log('\n以下只宣告單一軸，WCAG 2.5.8 要求寬高都 >= 44px：');
      for (const l of lone) console.log('  ' + l);
    }
    expect(lone).toEqual([]);
  });

  it('原始碼中觸控區宣告數 >= 20（防止誤刪批次修正）', () => {
    let n = 0;
    for (const f of files) {
      n += (fs.readFileSync(f, 'utf8').match(/min-h-\[44px\]/g) || []).length;
    }
    expect(n).toBeGreaterThanOrEqual(20);
  });
});
