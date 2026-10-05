import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './OmniCard';

export interface OmniBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'glass' | 'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose';
}

export const OmniBadge = forwardRef<HTMLDivElement, OmniBadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    
    const variants: Record<string, string> = {
      default: 'bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30',
      cyan: 'bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30',
      success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30',
      emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30',
      warning: 'bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-500/30',
      amber: 'bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-500/30',
      indigo: 'bg-indigo-50 text-indigo-800 border border-indigo-200/90 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-500/30',
      danger: 'bg-rose-50 text-rose-800 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-500/30',
      rose: 'bg-rose-50 text-rose-800 border border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-500/30',
      outline: 'border border-slate-300 text-slate-700 bg-white dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900',
      glass: 'bg-slate-100/80 text-slate-800 border border-slate-200 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-200',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider transition-colors',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
OmniBadge.displayName = 'OmniBadge';
