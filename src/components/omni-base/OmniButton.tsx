import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './OmniCard';

export interface OmniButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const OmniButton = forwardRef<HTMLButtonElement, OmniButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:shadow-cyan-500/20 border border-transparent',
      secondary: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 dark:bg-emerald-500 dark:hover:bg-emerald-400 border border-transparent',
      glass: 'backdrop-blur-md bg-cyan-100/50 dark:bg-cyan-950/40 border border-cyan-300/50 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-200/60 dark:hover:bg-cyan-900/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
      danger: 'bg-rose-500 text-white hover:bg-rose-400 shadow-md border border-transparent',
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
