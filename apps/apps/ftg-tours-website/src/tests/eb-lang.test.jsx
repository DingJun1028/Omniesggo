import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../components/ErrorBoundary';

function Boom() { throw new Error('explode'); }

function renderEB(lang) {
  window.localStorage.clear();
  if (lang) window.localStorage.setItem('ftg_lang', lang);
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  act(() => { root.render(<ErrorBoundary><Boom /></ErrorBoundary>); });
  spy.mockRestore();
  return container.textContent;
}

describe('ErrorBoundary 雙語', () => {
  it('ftg_lang=en 時全英文，零中文', () => {
    const t = renderEB('en');
    expect(t).toContain('This page could not be displayed');
    expect(t).toContain('Reload');
    expect(t).toContain('Back to home');
    expect(t).not.toMatch(/[\u4e00-\u9fff]/);
  });

  it('ftg_lang=zh 時全繁中', () => {
    const t = renderEB('zh');
    expect(t).toContain('頁面暫時無法顯示');
    expect(t).toMatch(/[\u4e00-\u9fff]/);
  });

  it('無 localStorage 時不炸，退回 zh', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const real = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: undefined, configurable: true });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    act(() => { root.render(<ErrorBoundary><Boom /></ErrorBoundary>); });
    spy.mockRestore();
    Object.defineProperty(window, 'localStorage', { value: real, configurable: true });
    expect(container.textContent).toContain('頁面暫時無法顯示');
  });
});
