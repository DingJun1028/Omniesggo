import type { ComponentConfig } from '../index';
import { cn, variantClasses, sizeClasses } from './utils';

export interface ButtonProps extends ComponentConfig {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function Button({ label, onClick, variant = 'primary', size = 'md', disabled, loading, className, icon }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center gap-2 font-medium transition-colors', variantClasses(variant), sizeClasses(size), disabled && 'opacity-50 cursor-not-allowed', className)}
    >
      {loading ? <span className="animate-spin">...</span> : icon}
      {label}
    </button>
  );
}

export interface BadgeProps extends ComponentConfig {
  label: string;
  color?: string;
}

export function Badge({ label, color = 'bg-accentTeal text-white', className }: BadgeProps) {
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', color, className)}>{label}</span>;
}

export interface CardProps extends ComponentConfig {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ title, children, footer, className }: CardProps) {
  return (
    <div className={cn('bg-surface border border-borderColor rounded-lg p-4 shadow-sm', className)}>
      {title && <h3 className="text-textPrimary font-semibold mb-2">{title}</h3>}
      <div className="text-sm text-textSecondary mb-3">{children}</div>
      {footer && <div className="mt-3 pt-3 border-t border-borderColor/50">{footer}</div>}
    </div>
  );
}
