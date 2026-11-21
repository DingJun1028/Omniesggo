'use client';

import React, { type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary wrapper for ESGGO pages.
 * Catches runtime errors and displays a user-friendly fallback.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof window !== 'undefined') {
      console.error('[ESGGO ErrorBoundary]', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: 40,
          textAlign: 'center',
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: "'Noto Sans TC', sans-serif",
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>
            頁面發生錯誤
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', maxWidth: 400 }}>
            很抱歉，此頁面遇到了技術問題。請嘗試重新整理頁面。
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: 16,
              padding: 16,
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              maxWidth: 600,
              textAlign: 'left',
              fontSize: 12,
              fontFamily: "'Fira Code', monospace",
              color: '#991B1B',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                錯誤詳情 (僅開發環境顯示)
              </summary>
              {this.state.error.message}
              {this.state.error.stack && (
                <>
                  {'\n\n'}
                  {this.state.error.stack}
                </>
              )}
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#009EB0',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            重新整理頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
