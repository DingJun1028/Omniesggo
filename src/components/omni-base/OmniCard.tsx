import { HTMLAttributes, forwardRef } from 'react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

// ── OmniCard (Liquid Glass Cyan) ──
interface OmniCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  variant?: string;
}

export const OmniCard = forwardRef<HTMLDivElement, OmniCardProps>(
  ({ className, glow = false, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300',
          'bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)]', // Light Editorial Base
          'dark:bg-slate-900/60 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]', // Dark Editorial Base
          glow && 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-cyan-500/30 dark:hover:shadow-[0_12px_40px_rgba(6,182,212,0.15)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
OmniCard.displayName = 'OmniCard';

// ── OmniCardHeader ──
export const OmniCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6 pb-3', className)}
      {...props}
    />
  )
);
OmniCardHeader.displayName = 'OmniCardHeader';

// ── OmniCardTitle ──
export const OmniCardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-bold leading-none tracking-tight text-slate-800 dark:text-slate-100', className)}
      {...props}
    />
  )
);
OmniCardTitle.displayName = 'OmniCardTitle';

// ── OmniCardContent ──
export const OmniCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 flex-1', className)} {...props} />
  )
);
OmniCardContent.displayName = 'OmniCardContent';
