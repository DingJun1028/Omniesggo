import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from '../components/ErrorBoundary';

function Boom() {
  throw new Error('explode');
}

// 5T-Tangible: 未自訂邊界時，React 會掛上自己的預設邊界，那段文字是
// 「💿 Hey developer 👋 / You can provide a way better UX ...」——
// 寫給開發者的英文除錯文案，還帶兩個 emoji。正式官網的訪客不該看到這段。
//
// 註：本專案用宣告式 <Routes>（非 data router），route element 拋錯時
// react-router 的 errorElement 不攔截，錯誤會冒泡到上層的 React ErrorBoundary，
// 所以這一層才是實際生效的防線。
describe('ErrorBoundary (5T-Tangible)', () => {
  it('renders the branded zh-Hant fallback instead of the React default text', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      );
    });
    spy.mockRestore();

    const text = container.textContent;
    expect(text).toContain('頁面暫時無法顯示');
    expect(text).not.toContain('Hey developer');
    expect(text).not.toContain('💿');
    expect(text).not.toContain('👋');
  });

  it('offers both a retry and a way back to home', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      );
    });
    spy.mockRestore();

    expect(container.textContent).toContain('重新載入');
    expect(container.textContent).toContain('返回首頁');
  });

  it('renders children untouched when nothing throws', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ErrorBoundary>
          <p>正常內容</p>
        </ErrorBoundary>,
      );
    });

    expect(container.textContent).toContain('正常內容');
  });
});
