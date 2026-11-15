import type { Metadata } from 'next';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'ESGGO — AI 驅動的永續報告書平台 | GRI、CSRD、ESRS 合規解決方案',
  description: 'ESGGO 提供 AI 協作、可驗證的 GRI 2024、CSRD ESRS 永續報告書工作台，整合重大性矩陣、碳盤查、供應鏈盡調與 5T Hash Lock 信任機制。',
  keywords: ['ESG報告書', 'GRI', 'CSRD', 'ESRS', '永續報告', '碳盤查', '重大性分析', '供應鏈盡職調查', 'ESG合規'],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
