import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './OmniCard';

export interface OmniButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'cyber' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const OmniButton = forwardRef<HTMLButtonElement, OmniButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_4px_14px_0_rgba(6,182,212,0.39)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.23)] hover:-translate-y-0.5 border border-transparent',
      secondary: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 border border-transparent',
      glass: 'backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-300 hover:bg-white/60 dark:hover:bg-cyan-900/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
      cyber: 'relative group overflow-hidden bg-cyan-50 dark:bg-slate-950 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/50 hover:border-cyan-400 dark:hover:border-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]',
      ghost: 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:backdrop-blur-sm',
      danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 border border-transparent',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs tracking-wider uppercase',
      md: 'h-12 px-8 py-2 text-sm font-semibold tracking-wide',
      lg: 'h-14 px-10 text-base font-bold tracking-wide',
      icon: 'h-12 w-12 justify-center p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 ease-out will-change-transform',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          'disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {variant === 'cyber' && (
          <span className="absolute inset-0 w-full h-full -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        )}
        
        {isLoading && (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
OmniButton.displayName = 'OmniButton';
