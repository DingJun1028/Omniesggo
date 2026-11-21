/**
 * src/components/ui/spinner.tsx — 載入狀態組件
 */

'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Spinner({ size = 'md', color = 'text-accentTeal', label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${sizeMap[size]} ${color} animate-spin rounded-full border-2 border-current border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <span className="text-sm text-textSecondary">{label}</span>
      )}
    </div>
  );
}
