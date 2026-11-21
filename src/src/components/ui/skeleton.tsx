/**
 * src/components/ui/skeleton.tsx — 骨架屏載入組件
 */

interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'title' | 'card' | 'avatar';
}

export function Skeleton({ className = '', lines = 1, variant = 'text' }: SkeletonProps) {
  const baseStyle = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  if (variant === 'avatar') {
    return (
      <div className={`${baseStyle} w-10 h-10 rounded-full ${className}`} />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseStyle} h-32 ${className}`} />
    );
  }

  if (variant === 'title') {
    return (
      <div className={`${baseStyle} h-6 w-1/3 ${className}`} />
    );
  }

  // text variant
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${baseStyle} h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
