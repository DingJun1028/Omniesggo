import { HTMLAttributes, forwardRef } from 'react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

// ── OmniCard (Ultra Liquid Glass Cyan) ──
interface OmniCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  variant?: 'default' | 'glass' | 'cyber';
}

export const OmniCard = forwardRef<HTMLDivElement, OmniCardProps>(
  ({ className, glow = false, variant = 'glass', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
      glass: 'backdrop-blur-2xl bg-white/70 dark:bg-slate-950/40 border border-white/60 dark:border-cyan-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      cyber: 'backdrop-blur-3xl bg-gradient-to-br from-white/90 to-cyan-50/80 dark:from-slate-900/90 dark:to-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 shadow-[inset_0_0_20px_rgba(6,182,212,0.05),0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_20px_rgba(6,182,212,0.1),0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col rounded-3xl transition-all duration-500 ease-out',
          variants[variant],
          glow && 'hover:-translate-y-2 hover:border-cyan-400 hover:shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)] dark:hover:border-cyan-400/60 dark:hover:shadow-[0_20px_60px_-15px_rgba(6,182,212,0.5)]',
          className
        )}
        {...props}
      >
        {variant === 'cyber' && (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 blur-[64px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[64px] rounded-full pointer-events-none" />
          </>
        )}
        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
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
      className={cn('flex flex-col space-y-2 p-6 pb-4', className)}
      {...props}
    />
  )
);
OmniCardHeader.displayName = 'OmniCardHeader';

// ── OmniCardTitle ──
export const OmniCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 bg-clip-text', className)}
      {...props}
    />
  )
);
OmniCardTitle.displayName = 'OmniCardTitle';

// ── OmniCardContent ──
export const OmniCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 flex-1 text-slate-600 dark:text-slate-300', className)} {...props} />
  )
);
OmniCardContent.displayName = 'OmniCardContent';
