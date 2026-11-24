/**
 * 儀表板渲染流程基礎整合測試
 *
 * 驗證首頁（MarketingHomePage）與 AppShell 在 happy-dom 環境下能正確渲染
 * 關鍵內容：hero 標題、CTA 按鈕、stats、feature 卡片、benefits 清單、側邊欄導覽。
 */
// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';

// ── Mocks（最小化外部依賴）──────────────────────────────────────────────

// next/link → 普通 <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    React.createElement('a', { href, ...rest }, children),
}));

// next/navigation → usePathname 固定回 '/'
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// framer-motion → 透傳 children（略過動畫）
vi.mock('framer-motion', () => {
  const passthrough = ({ children, ...rest }: { children?: ReactNode }) =>
    React.createElement('div', rest, children);
  return { motion: { div: passthrough } };
});

// @esggo/ui → Button 渲染為 <button>
vi.mock('@esggo/ui', () => ({
  Button: ({ children, ...rest }: { children?: ReactNode }) =>
    React.createElement('button', rest, children),
}));

// @/components/AuthProvider → 提供靜態 context
vi.mock('@/components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: null, loading: false, isAuthenticated: false }),
}));

// @/lib/auth → onAuthChange 回傳 no-op unsubscribe
vi.mock('@/lib/auth', () => ({
  onAuthChange: () => () => {},
}));

// ── 測試元件（延遲 import 以確保 mock 生效）─────────────────────────────

import React from 'react';
import MarketingHomePage from '../app/(marketing)/page';
import { AppShell } from '../app/components/layout/AppShell';

// ── 測試套件 ──────────────────────────────────────────────────────────

describe('儀表板渲染流程', () => {
  beforeEach(() => {
    // happy-dom 需要乾淨的 DOM
    document.body.innerHTML = '';
  });

  describe('MarketingHomePage（首頁內容）', () => {
    it('渲染 hero 標題包含「永續報告書平台」', () => {
      render(<MarketingHomePage />);
      const h1 = document.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toContain('永續報告書平台');
    });

    it('渲染 badge「AI 驅動 • 可驗證 • 合規就緒」', () => {
      render(<MarketingHomePage />);
      expect(screen.getByText(/AI 驅動 • 可驗證 • 合規就緒/)).toBeInTheDocument();
    });

    it('渲染副標題包含 GRI、CSRD、ESRS 關鍵字', () => {
      render(<MarketingHomePage />);
      expect(screen.getByText(/GRI、CSRD、ESRS 合規挑戰/)).toBeInTheDocument();
    });

    it('渲染兩個 CTA 按鈕', () => {
      render(<MarketingHomePage />);
      expect(screen.getByText('免費開始使用')).toBeInTheDocument();
      expect(screen.getByText('預約產品導覽')).toBeInTheDocument();
    });

    it('渲染 4 個 stats 數值', () => {
      render(<MarketingHomePage />);
      expect(screen.getByText('GRI 2024')).toBeInTheDocument();
      expect(screen.getByText('CSRD ESRS')).toBeInTheDocument();
      expect(screen.getByText('5T')).toBeInTheDocument();
      expect(screen.getByText('Hash Lock')).toBeInTheDocument();
    });

    it('渲染 6 個 feature 卡片標題', () => {
      render(<MarketingHomePage />);
      const titles = [
        'AI 協作報告書',
        '雙重重大性矩陣',
        '5T Hash Lock 信任機制',
        '供應鏈盡職調查',
        '碳盤查與淨零路徑',
        '智能解析與查驗',
      ];
      for (const title of titles) {
        expect(screen.getByText(title)).toBeInTheDocument();
      }
    });

    it('渲染「為何選擇 ESGGO」區塊標題', () => {
      render(<MarketingHomePage />);
      expect(screen.getByText('為何選擇 ESGGO')).toBeInTheDocument();
    });

    it('渲染 6 個 benefits 項目', () => {
      render(<MarketingHomePage />);
      const benefits = [
        '節省 60% 報告撰寫時間',
        '自動符合國際永續準則',
        '完整證據追溯機制',
        '跨部門協作無縫銜接',
        '即時合規性檢查',
        '專業顧問支援服務',
      ];
      for (const benefit of benefits) {
        expect(screen.getByText(benefit)).toBeInTheDocument();
      }
    });
  });

  describe('AppShell（側邊欄導覽）', () => {
    it('渲染全部 11 個導覽項目', () => {
      render(
        <AppShell>
          <div>test-content</div>
        </AppShell>,
      );

      const navLabels = [
        'A01 萬能中心',
        'A02 報告中心',
        'A03 智能解析',
        'A04 重大性矩陣',
        'A05 供應鏈盡調',
        'A06 碳排淨零',
        'A07 信任金庫',
        '5T 防偽查驗',
        '村莊治理',
        'AI 控制台',
        '資源總覽',
      ];
      for (const label of navLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it('將 children 渲染在主內容區', () => {
      render(
        <AppShell>
          <div data-testid="child">dashboard-content</div>
        </AppShell>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('dashboard-content')).toBeInTheDocument();
    });
  });
});
