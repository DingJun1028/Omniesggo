import type { ReactNode } from 'react';

/**
 * omni-agent-zone 各頁面共用之頁面 scaffold（頁首列 + main 容器）。
 * 提取自八個同構頁面，消除 SonarCloud duplication（PR #114 品質閘修復）。
 */
export function ZonePageShell({
  header,
  mainClassName = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8',
  children,
}: {
  header: ReactNode;
  mainClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">{header}</div>
        </div>
      </header>
      <main className={mainClassName}>{children}</main>
    </div>
  );
}
