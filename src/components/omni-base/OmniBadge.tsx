import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './OmniCard';

export interface OmniBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'glass';
}

export const OmniBadge = forwardRef<HTMLDivElement, OmniBadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    
    const variants = {
      default: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
      glass: 'backdrop-blur-sm bg-white/20 dark:bg-slate-900/40 border border-white/40 dark:border-slate-700 text-slate-800 dark:text-slate-200',
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
