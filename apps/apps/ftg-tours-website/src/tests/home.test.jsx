import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';
import { LanguageProvider } from '../i18n/LanguageContext';

// 5T-Trustworthy: 品牌字以碼位鎖定，不靠肉眼比對。
// 墾 = U+58BE 是正確品牌字（2026-09-30 品牌主確認）；塾 U+587E / 壾 U+58FE / 聖 U+8056 都是歷史錯字。
// 這個 repo 長期在「墳趣」「墾趣」之間漂移過（見 skill P1/P54），
// 所以測試必須用碼位斷言 —— 人眼與 patch 的 fuzzy match 都不夠可靠。
const BRAND = String.fromCodePoint(0x58be); // 墾
const WRONG = [0x587e, 0x58fe, 0x8056, 0x58ba, 0x8fb7].map((c) => String.fromCodePoint(c));

// Render <Home /> (which needs router + i18n context) into a real DOM node.
// Uses react-dom directly so the suite needs no extra dev dependency.
function renderHome() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <LanguageProvider>
          <Home />
        </LanguageProvider>
      </MemoryRouter>,
    );
  });
  return { container, root };
}

describe('FTG Journey - Home Page', () => {
  let rendered;

  beforeEach(() => {
    window.localStorage.clear();
    rendered = renderHome();
  });

  it('renders the responsive hero section with a capped height', () => {
    const heroSection = rendered.container.querySelector('section[class*="min-h-[52vh]"]');
    expect(heroSection).not.toBeNull();
  });

  it('renders exactly one h1 in the hero', () => {
    const headings = rendered.container.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent.trim().length).toBeGreaterThan(0);
  });

  it('renders the brand hero banner image', () => {
    const heroImg = rendered.container.querySelector('section[class*="min-h-[52vh]"] img');
    expect(heroImg).not.toBeNull();
    expect(heroImg.getAttribute('alt')).toContain(`${BRAND}趣旅遊`);
  });

  it('exposes no untranslated translation keys in the hero', () => {
    const hero = rendered.container.querySelector('section[class*="min-h-[52vh]"]');
    expect(hero.textContent).not.toMatch(/\b(home|nav|footer)\.[a-zA-Z]/);
  });

  // 5T-Trustworthy: 整頁不得出現任何歷史錯字。
  it('uses the correct brand codepoint U+58BE throughout the page', () => {
    const text = rendered.container.textContent;
    expect(text).toContain(BRAND);
    for (const w of WRONG) {
      expect(text.includes(w), `found wrong brand char U+${w.codePointAt(0).toString(16).toUpperCase()}`).toBe(false);
    }
  });

  // P23: 圖示一律走 FTGIcon 線條 SVG，不用 emoji。
  it('renders no emoji anywhere on the page', () => {
    const text = rendered.container.textContent;
    const emoji = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu);
    expect(emoji ?? []).toHaveLength(0);
  });
});
