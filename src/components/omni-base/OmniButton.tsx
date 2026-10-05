import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './OmniCard';

export interface OmniButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger' | 'cyber' | 'emerald' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const OmniButton = forwardRef<HTMLButtonElement, OmniButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants: Record<string, string> = {
      primary: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm border border-transparent dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:font-bold',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300/80 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700',
      outline: 'bg-transparent text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-sm dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
      emerald: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm border border-transparent dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 dark:font-bold',
      cyber: 'bg-teal-700 text-white font-semibold hover:bg-teal-800 shadow-sm border border-transparent dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:font-bold',
      glass: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-sm dark:bg-slate-900/60 dark:text-cyan-300 dark:border-cyan-500/30 dark:hover:bg-slate-800/80',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:bg-slate-800',
      danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm border border-transparent dark:bg-rose-500 dark:hover:bg-rose-400',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-6 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10 justify-center p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
OmniButton.displayName = 'OmniButton';
