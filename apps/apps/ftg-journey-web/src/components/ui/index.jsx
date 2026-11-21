import { useState } from 'react';
import { motion } from 'framer-motion';
const theme = {
  colors: { primary: '#10243f', secondary: '#f3ede1', accent: '#c9a24b', success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6', surface: '#ffffff', background: '#f9fafb', text: '#1f2937', textMuted: '#6b7280' },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.07)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.15)' },
  transitions: { fast: '0.15s ease', normal: '0.25s ease', slow: '0.4s ease' },
};

export function Button({ children, variant = 'primary', size = 'md', disabled, loading, onClick, className = '', ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', borderRadius: theme.radius.md, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `all ${theme.transitions.fast}`,
    opacity: disabled ? 0.6 : 1, fontFamily: 'inherit',
  };
  const variants = {
    primary: { background: theme.colors.primary, color: '#fff' },
    secondary: { background: theme.colors.secondary, color: theme.colors.primary },
    outline: { background: 'transparent', border: `2px solid ${theme.colors.primary}`, color: theme.colors.primary },
    ghost: { background: 'transparent', color: theme.colors.primary },
    danger: { background: theme.colors.error, color: '#fff' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 15 },
    lg: { padding: '14px 28px', fontSize: 17 },
  };
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      style={{ ...base, ...variants[variant], ...sizes[size] }}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      {...props}
    >
      {loading && <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </motion.button>
  );
}

export function Card({ children, hoverable = false, className = '', ...props }) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -4, boxShadow: theme.shadows.lg } : {}}
      style={{
        background: theme.colors.surface, borderRadius: theme.radius.lg,
        padding: theme.spacing.lg, boxShadow: theme.shadows.md,
        transition: `box-shadow ${theme.transitions.fast}`,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Input({ label, error, register, name, ...props }) {
  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: theme.colors.textMuted }}>{label}</label>}
      <input
        {...register?.(name)}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1.5px solid ${error ? theme.colors.error : '#e5e7eb'}`,
          borderRadius: theme.radius.md, fontSize: 15, outline: 'none',
          transition: `border-color ${theme.transitions.fast}`,
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: theme.colors.error, marginTop: 4, display: 'block' }}>{error}</span>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: theme.radius.xl, padding: theme.spacing.xl, maxWidth: 480, width: '90%', maxHeight: '80vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: theme.spacing.md, color: theme.colors.primary }}>{title}</h3>}
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const colors = {
    default: { bg: '#f3f4f6', text: '#374151' },
    success: { bg: '#d1fae5', text: '#065f46' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    error: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' },
  };
  const c = colors[variant] || colors.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: theme.radius.full, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text }}>
      {children}
    </span>
  );
}
