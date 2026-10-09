// iOS Safari 縮放防線：form 控制的字級必須 >= 16px。
//
// 背景：iOS Safari（以及多數 iOS 內建瀏覽器）對 font-size < 16px 的
// input/select/textarea，在 focus 時會自動縮放整個 viewport。使用者會
// 失去版面控制，且手機瀏覽器沒有明顯的「縮放回去」提示，屬實機可感知缺陷。
//
// 對照：Chrome/Android 不會縮放，所以這個問題在桌面測試完全看不出來 —
// 必須靠靜態檢查守住。
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC = path.resolve('src');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.jsx$/.test(e.name)) files.push(p);
  }
})(SRC);

// Tailwind 字級 -> px
const FONT_PX = { 'text-xs': 12, 'text-sm': 14, 'text-base': 16, 'text-lg': 18, 'text-xl': 20, 'text-2xl': 24 };
const MIN_PX = 16;

// 表單控制的樣式特徵（含這兩者之一才算是我們要保護的欄位）
const FORM_MARKERS = /w-full px-4 py-|w-full px-3 py-|rounded-(xl|lg) border/;

describe('iOS Safari 縮放防線', () => {
  it('form 控制的字級皆 >= 16px（iOS 聚焦不縮放）', () => {
    const offenders = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const lines = src.split('\n');
      lines.forEach((L, i) => {
        const m = L.match(/className=(?:"([^"]*)"|\{`([^`]*)`\})/);
        if (!m) return;
        const cls = m[1] || m[2] || '';
        // 這行是否在定義 form 控制？
        if (!/<(input|select|textarea)\b/.test(L) && !FORM_MARKERS.test(cls)) return;
        if (!FORM_MARKERS.test(cls)) return;
        for (const [tw, px] of Object.entries(FONT_PX)) {
          // 用空白包住，避免 text-sm 誤中 text-smaller 之類
          const re = new RegExp('(^|\\s)' + tw + '(\\s|$)');
          if (re.test(cls) && px < MIN_PX) {
            const tag = (L.match(/<(input|select|textarea)\b/) || [undefined, 'control'])[1];
            offenders.push(
              `${path.relative(SRC, f)}:${i + 1} <${tag}> ${tw}=${px}px < ${MIN_PX}px`
            );
          }
        }
      });
    }
    if (offenders.length) {
      console.log('\n以下 form 控制字級 < 16px，iOS 聚焦時會強制縮放頁面：');
      for (const o of offenders) console.log('  ' + o);
    }
    expect(offenders).toEqual([]);
  });

  it('每個含 form 控制的檔案都宣告了 text-base', () => {
    const missing = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      if (!/<(input|select|textarea)\b/.test(src)) continue;
      if (!/w-full/.test(src)) continue;
      if (!/text-base/.test(src)) {
        missing.push(path.relative(SRC, f));
      }
    }
    expect(missing).toEqual([]);
  });
});
