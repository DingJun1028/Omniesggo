import type { ReactNode } from 'react';

// Local shadcn-style card primitives for the marketing / omni-agent-zone pages.
// @esggo/ui intentionally does not export these names (its CardHeader has a
// different props contract), so the pages that need the composable
// Card / CardHeader / CardTitle / CardContent set import them from here.

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}
