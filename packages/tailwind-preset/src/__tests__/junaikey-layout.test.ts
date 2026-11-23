import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';

/* junaikey-layout.css §6 硬標準靜態防護網（README §6／OmniBook §5）
   本測試為版面樣式表之回歸防護：任何誤刪響應式中斷點、觸控目標、
   reduced-motion 防護、面板顯隱狀態或代幣衍生色彩之變更，於此攔截。 */

const cssPath = fileURLToPath(new URL('../junaikey-layout.css', import.meta.url));
const css = readFileSync(cssPath, 'utf8');

describe('junaikey-layout.css — RWD 三視口硬標準', () => {
  test('Shell 四欄框架：圖示列／側欄／主區／右欄 grid 模板', () => {
    expect(css).toContain('.shell { display: grid; grid-template-columns: 48px 232px minmax(0, 1fr) 296px;');
  });

  test('四個響應式中斷點齊備（1280／1024／768／480）', () => {
    for (const w of [1280, 1024, 768, 480]) {
      expect(css).toContain('@media (max-width: ' + w + 'px)');
    }
  });

  test('面板與彈出層顯隱狀態（.show／.open／.collapsed）', () => {
    expect(css).toContain('.tab-panel.show { display: block; }');
    expect(css).toContain('.notif-pop.open { display: block; }');
    expect(css).toContain('.subnav.collapsed { display: none; }');
  });

  test('prefers-reduced-motion：應用層動畫與過場停用', () => {
    const idx = css.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(idx).toBeGreaterThan(-1);
    const block = css.slice(idx, idx + 400);
    expect(block).toContain('.live .pip { animation: none; }');
    expect(block).toContain('.perf-fill { transition: none; }');
  });

  test('觸控目標 ≥44×44px 與行動圖示列換行（360px 防溢流）', () => {
    const m = css.indexOf('@media (max-width: 768px)');
    expect(m).toBeGreaterThan(-1);
    const block = css.slice(m, css.indexOf("@media (max-width: 480px)"));
    expect(block).toContain('min-height: 44px');
    expect(block).toContain('.notif-head .mark-read, .recap-card .later { min-width: 44px; min-height: 44px;');
    expect(block).toMatch(/\.icon-rail \{[^}]*flex-wrap: wrap;/);
  });

  test('防溢流保險：網格子項 min-width 歸零', () => {
    expect(css).toContain('.grid > *, .item-row > *, .lane > * { min-width: 0; }');
  });

  test('色彩自代幣衍生（深色主題覆寫可跟隨）', () => {
    expect(css).toContain('[data-theme="dark"] select option { background: var(--white); color: var(--gray-900); }');
    expect(css).toContain('color-mix(in srgb, var(--primary) 35%, transparent)');
    expect(css).toContain('color-mix(in srgb, var(--primary) 45%, transparent)');
    expect(css).toContain('color-mix(in srgb, var(--success) 10%, transparent)');
  });
});
