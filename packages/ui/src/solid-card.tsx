import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'gold' | 'blue' | 'success' | 'warning' | 'error' | 'muted';
  size?: 'sm' | 'md';
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

// CSS 變數對應（主題感知）
const css = (v: string) => `var(${v})`;
const TK = {
  teal: css('--accent-teal'),
  gold: css('--accent-gold'),
  blue: css('--accent-blue'),
  success: css('--accent-green'),
  warning: css('--accent-gold'),
  error: css('--accent-green'),
  surface: css('--bg-secondary'),
  border: css('--border-color'),
  textPrimary: css('--text-primary'),
  textSecondary: css('--text-secondary'),
  textMuted: css('--text-muted'),
};

export function SolidCard({ children, className = '', variant = 'default', onClick }: CardProps) {
  const borderVar =
    variant === 'highlight' ? TK.teal :
    variant === 'success' ? TK.success :
    variant === 'warning' ? 'var(--accent-gold)' :
    variant === 'error' ? 'var(--accent-green)' :
    'transparent';

  return (
    <div
      onClick={onClick}
      className={`solid-card ${className}`}
      style={{
        background: TK.surface,
        border: `1px solid ${TK.border}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '16px',
        borderLeft: borderVar !== 'transparent' ? `4px solid ${borderVar}` : undefined,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, transform 0.15s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,158,176,0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon && <span style={{ color: TK.teal, fontSize: '18px' }}>{icon}</span>}
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: TK.textPrimary }}>{title}</h3>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: '13px', color: TK.textSecondary }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function MetricCard({ label, value, unit, change, trend, icon }: MetricCardProps) {
  const trendColor =
    trend === 'up' ? TK.success :
    trend === 'down' ? 'var(--accent-green)' :
    TK.textMuted;

  const trendIcon = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192';

  return (
    <SolidCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: TK.textSecondary, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: TK.teal, lineHeight: 1.2 }}>
            {value}
            {unit && <span style={{ fontSize: '14px', fontWeight: 400, color: TK.textSecondary, marginLeft: '4px' }}>{unit}</span>}
          </div>
          {change !== undefined && (
            <div style={{ fontSize: '13px', color: trendColor, marginTop: '4px', fontWeight: 500 }}>
              {trendIcon} {Math.abs(change)}% vs 上期
            </div>
          )}
        </div>
        {icon && (
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'color-mix(in srgb, var(--accent-teal) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.teal }}>
            {icon}
          </div>
        )}
      </div>
    </SolidCard>
  );
}

export function Badge({ children, variant = 'teal', size = 'sm' }: BadgeProps) {
  const colorMap: Record<string, string> = {
    teal: TK.teal,
    gold: TK.gold,
    blue: TK.blue,
    success: TK.success,
    warning: 'var(--accent-gold)',
    error: 'var(--accent-green)',
    muted: TK.textSecondary,
  };

  const base = colorMap[variant] || TK.teal;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '4px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        background: `color-mix(in srgb, ${base} 18%, transparent)`,
        color: base,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, className }: ButtonProps) {
  const style: Record<string, React.CSSProperties> = {
    primary: { background: TK.teal, color: '#FFF', border: 'none', boxShadow: '0 2px 4px color-mix(in srgb, var(--accent-teal) 40%, transparent)' },
    secondary: { background: TK.surface, color: TK.textPrimary, border: `1px solid ${TK.border}` },
    ghost: { background: 'transparent', color: TK.teal, border: 'none' },
    danger: { background: 'var(--accent-green)', color: '#FFF', border: 'none' },
  };

  const paddings: Record<string, string> = { sm: '6px 12px', md: '8px 16px', lg: '12px 24px' };
  const fontSizes: Record<string, string> = { sm: '13px', md: '14px', lg: '16px' };
  const s = style[variant] || style.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`solid-btn ${className}`}
      style={{
        ...s,
        borderRadius: '6px',
        padding: paddings[size],
        fontSize: fontSizes[size],
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s, box-shadow 0.2s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <section className={className} style={{ marginBottom: '32px' }}>
      {title && (
        <div style={{ marginBottom: '16px', borderBottom: `2px solid ${TK.teal}`, paddingBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, color: TK.teal }}>{title}</h2>
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: '14px', color: TK.textSecondary }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Grid({ children, columns = 3, gap = 16, style }: { children: React.ReactNode; columns?: number; gap?: number; style?: React.CSSProperties }) {
  // RWD: 手機 1 欄 / 平板 2 欄 / 桌機 N 欄
  const minW = columns <= 1 ? '100%' : columns === 2 ? '280px' : '240px';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minW}, 1fr))`,
        gap: `clamp(8px, 2vw, ${gap}px)`,
        width: '100%',
        ...style,
      }}
      className="solid-grid"
    >
      {children}
    </div>
  );
}

/** RWD 容器查詢容器 — 行動版 100% 寬 */
export function Container({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`solid-container ${className ?? ''}`}
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: 'clamp(12px, 3vw, 24px)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** RWD 側邊欄佈局 — 手機單欄、桌機 12 欄 */
export function PageLayout({ sidebar, children, sidebarWidth = 280 }: { sidebar?: React.ReactNode; children: React.ReactNode; sidebarWidth?: number }) {
  return (
    <div
      className="solid-page-layout"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 'clamp(12px, 2vw, 24px)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {sidebar && (
        <aside
          style={{
            width: `${sidebarWidth}px`,
            flexShrink: 0,
            display: 'block',
          }}
          className="solid-sidebar"
        >
          {sidebar}
        </aside>
      )}
      <main style={{ flex: 1, minWidth: 0, width: '100%' }}>{children}</main>
      <style>{`
        @media (max-width: 768px) {
          .solid-page-layout { flex-direction: column !important; }
          .solid-sidebar { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

export function Divider() {
  return <hr style={{ border: 'none', borderTop: `1px solid ${TK.border}`, margin: '24px 0' }} />;
}

export function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: TK.border, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color || TK.teal, borderRadius: '4px', transition: 'width 0.3s ease' }} />
    </div>
  );
}

// 向下相容 — 與 @esggo/shared DESIGN_TOKENS 同步
import { DESIGN_TOKENS } from '@esggo/shared';
export const SOLID_CARD_TOKENS = DESIGN_TOKENS;
