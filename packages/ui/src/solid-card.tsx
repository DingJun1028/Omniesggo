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

// ═══════════════════════════════════════════════════════════════
// StandardPage — 12 欄 Bento Grid 頁面框架 (生物級 C-ORG)
// 對齊 wiki/wiki/萬能元件.md C-ORG
// RWD: 手機 1 欄 / 平板 4 欄 / 桌機 12 欄
// ═══════════════════════════════════════════════════════════════

export interface StandardPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function StandardPage({ title, subtitle, children, sidebar, headerActions }: StandardPageProps) {
  return (
    <div
      className="standard-page"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #F8FAFC)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'var(--bg-secondary, #FFFFFF)',
          borderBottom: '1px solid var(--border-color, #E2E8F0)',
          padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: 700,
              color: 'var(--accent-teal, #009EB0)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: '4px 0 0', fontSize: 'clamp(12px, 1.5vw, 14px)', color: 'var(--text-secondary, #64748B)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerActions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{headerActions}</div>}
      </header>

      {/* Body */}
      <PageLayout sidebar={sidebar}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'clamp(12px, 2vw, 20px)',
            alignContent: 'start',
          }}
          className="bento-grid"
        >
          {children}
        </div>
      </PageLayout>

      {/* RWD: 12-col → 4-col → 1-col */}
      <style>{`
        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-color-scheme: dark) {
          .standard-page { background: #0F172A !important; }
          .standard-page header { background: #1E293B !important; border-color: #334155 !important; }
        }
      `}</style>
    </div>
  );
}

// Bento Grid Item — 佔據 1-12 欄
export interface BentoItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  rowSpan?: 1 | 2 | 3;
}

export function BentoItem({ children, colSpan = 4, rowSpan = 1 }: BentoItemProps) {
  return (
    <div
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        minWidth: 0,
      }}
      className="bento-item"
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HermesFloatingAgent — 全域懸浮 AI 助手 (生物級 C-ORG)
// 對齊 wiki/wiki/萬能元件.md C-ORG
// 語音 + 視覺掃描 + 5T 狀態指示
// ═══════════════════════════════════════════════════════════════

export interface HermesFloatingAgentProps {
  agentName?: string;
  status?: 'online' | 'busy' | 'offline';
  onActivate?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function HermesFloatingAgent({
  agentName = 'OmniAgent',
  status = 'online',
  onActivate,
  position = 'bottom-right',
}: HermesFloatingAgentProps) {
  const posStyle: React.CSSProperties =
    position === 'bottom-right'
      ? { bottom: 24, right: 24 }
      : position === 'bottom-left'
      ? { bottom: 24, left: 24 }
      : position === 'top-right'
      ? { top: 24, right: 24 }
      : { top: 24, left: 24 };

  const statusColor =
    status === 'online' ? '#10B981' : status === 'busy' ? '#F59E0B' : '#64748B';

  return (
    <button
      onClick={onActivate}
      aria-label={`啟動 ${agentName}`}
      className="hermes-floating-agent"
      style={{
        position: 'fixed',
        ...posStyle,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #009EB0 0%, #003262 100%)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,158,176,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,158,176,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,158,176,0.3)';
      }}
    >
      {/* Agent Icon */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Status Dot */}
      <span
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: statusColor,
          border: '2px solid #FFF',
        }}
      />

      {/* Tooltip */}
      <span
        className="hermes-tooltip"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1E293B',
          color: '#FFF',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
        }}
      >
        {agentName} {status === 'online' ? '在線上' : status === 'busy' ? '忙碌中' : '離線'}
      </span>

      <style>{`
        .hermes-floating-agent:hover .hermes-tooltip { opacity: 1; }
        @media (max-width: 768px) {
          .hermes-floating-agent { width: 48px !important; height: 48px !important; }
        }
      `}</style>
    </button>
  );
}

// 向下相容 — 與 @esggo/shared DESIGN_TOKENS 同步
import { DESIGN_TOKENS } from '@esggo/shared';
export const SOLID_CARD_TOKENS = DESIGN_TOKENS;
