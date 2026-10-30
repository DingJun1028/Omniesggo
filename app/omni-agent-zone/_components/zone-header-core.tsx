'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@esggo/ui';
import type { ReactNode } from 'react';

/**
 * omni-agent-zone 各頁面共用之頁首左側 scaffold（返回按鈕 + 圖示 + 標題）。
 * 提取自五個同構頁面，消除 SonarCloud duplication（PR #114 品質閘修復）。
 */
export function ZoneHeaderCore({
  icon,
  title,
  subtitle,
  iconBg = 'from-blue-500 to-cyan-500',
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <Link href="/omni-agent-zone">
        <Button variant="ghost" size="sm" className="group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          返回專區
        </Button>
      </Link>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-[var(--text-1)]">{title}</h1>
          {subtitle && <p className="text-xs text-[var(--text-3)]">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
