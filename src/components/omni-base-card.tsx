import React from 'react';
import { OmniCard, OmniCardContent } from '@/components/omni-base/OmniCard';

export interface OmniBaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** 卡片視覺風格，支援預設與玻璃擬態 (Liquid Glass) */
  variant?: 'default' | 'liquid-glass' | 'ghost';
  /** 5T 協定狀態徽章 */
  statusIndicator?: 'trustworthy' | 'unverified' | 'warning' | 'error';
  /** 5T 密碼學綁定 Hash Lock 顯示 (Traceable/Trustworthy) */
  hashLock?: string;
}

/**
 * OmniBaseCard (萬能基礎卡片)
 * 根據 ESGGO 憲章與設計 10 大原則建構的通用 UI 元件。
 * [Phase 3 升級] 現已全面封裝並繼承至 Liquid Glass Cyan OmniCard 架構。
 */
export const OmniBaseCard: React.FC<OmniBaseCardProps> = ({
  children,
  className = '',
  variant = 'default',
  statusIndicator,
  hashLock,
  ...props
}) => {
  const isLiquid = variant === 'liquid-glass';

  // 渲染狀態燈號
  const renderStatus = () => {
    if (!statusIndicator) return null;
    const colors = {
      trustworthy: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      unverified: 'bg-slate-500',
      warning: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]',
      error: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
    };
    return (
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {hashLock && (
          <span className="font-mono text-[10px] text-cyan-700/60 dark:text-cyan-400/50 hidden sm:inline-block tracking-widest border border-cyan-500/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {hashLock}
          </span>
        )}
        <div className={`w-2.5 h-2.5 rounded-full ${colors[statusIndicator]} animate-pulse`} title={`Status: ${statusIndicator}`} />
      </div>
    );
  };

  return (
    <OmniCard 
      glow={isLiquid || variant === 'default'} 
      className={className} 
      {...props}
    >
      {renderStatus()}
      <OmniCardContent className="h-full pt-6">
        {children}
      </OmniCardContent>
    </OmniCard>
  );
};
