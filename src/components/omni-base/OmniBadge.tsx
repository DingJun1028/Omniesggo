import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './OmniCard';

export interface OmniBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'glass' | 'cyber';
  glow?: boolean;
}

export const OmniBadge = forwardRef<HTMLDivElement, OmniBadgeProps>(
  ({ className, variant = 'default', glow = false, children, ...props }, ref) => {
    
    const variants = {
      default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-transparent',
      cyan: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30',
      emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30',
      amber: 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30',
      rose: 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30',
      indigo: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30',
      glass: 'backdrop-blur-md bg-white/50 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700 text-slate-800 dark:text-slate-200',
      cyber: 'bg-cyan-50 dark:bg-slate-950 text-cyan-700 dark:text-cyan-400 border border-cyan-400 dark:border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)] dark:shadow-[0_0_10px_rgba(6,182,212,0.5)] uppercase tracking-widest',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-all',
          variants[variant],
          glow && `shadow-[0_0_12px_var(--tw-shadow-color)] shadow-${variant}-500/40`,
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-1.5">{children}</span>
      </div>
    );
  }
);
OmniBadge.displayName = 'OmniBadge';
