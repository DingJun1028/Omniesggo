/**
 * src/components/ui/error-alert.tsx — 錯誤提示組件
 */

'use client';

import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

const variantStyles = {
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function ErrorAlert({ title, message, onDismiss, variant = 'error' }: ErrorAlertProps) {
  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`${iconStyles[variant]} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          {title && <h4 className="font-bold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded-sm"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
