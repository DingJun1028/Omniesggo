'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  healingStatus: 'idle' | 'healing' | 'healed' | 'failed';
  healingData: Record<string, unknown> | null;
}

export class OmniErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    healingStatus: 'idle',
    healingData: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, healingStatus: 'idle', healingData: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OmniCore Exception Caught:', error, errorInfo);
    this.triggerCelestialHealing(error, errorInfo);
  }

  private async triggerCelestialHealing(error: Error, errorInfo: ErrorInfo) {
    this.setState({ healingStatus: 'healing' });
    try {
      const res = await fetch('/api/nexus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'google_jules:karma_protocol',
          arguments: {
            failureReason: error.message,
            context: errorInfo.componentStack
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        this.setState({ healingStatus: 'healed', healingData: data.data });
      } else {
        this.setState({ healingStatus: 'failed' });
      }
    } catch (e) {
      console.error('Failed to trigger healing', e);
      this.setState({ healingStatus: 'failed' });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bgBase flex flex-col items-center justify-center p-6 font-mono text-textPrimary">
          <div className="max-w-2xl w-full bg-surface/80 backdrop-blur-xl border border-danger/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(245,34,45,0.1)]">
            <div className="flex items-center gap-4 mb-6">
              <ShieldAlert className="text-danger animate-pulse" size={40} />
              <div>
                <h1 className="text-2xl font-bold text-danger">系統異常中斷</h1>
                <p className="text-sm text-textSecondary">OmniCore 5T 協議已攔截此崩潰</p>
              </div>
            </div>

            <div className="bg-bgBase border border-borderColor p-4 rounded-lg mb-6 overflow-auto max-h-40 text-xs text-textSecondary">
              <p className="font-bold text-danger mb-2">{this.state.error?.toString()}</p>
            </div>

            {this.state.healingStatus === 'healing' && (
              <div className="flex items-center gap-3 text-accentGold bg-accentGold/10 p-4 rounded-lg border border-accentGold/20">
                <Loader2 className="animate-spin" size={20} />
                <span>OmniJules 果因協議啟動中... 正在進行 Celestial Flow 封印</span>
              </div>
            )}

            {this.state.healingStatus === 'healed' && this.state.healingData && (
              <div className="flex flex-col gap-3 text-success bg-success/5 p-4 rounded-lg border border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span className="font-bold">修復草案已生成 (Hash Lock 鎖定)</span>
                </div>
                <div className="text-xs text-textSecondary grid gap-1">
                  <p><strong>階段:</strong> {String(this.state.healingData.phase)}</p>
                  <p><strong>分析:</strong> {String(this.state.healingData.analysis)}</p>
                  <p><strong>憑證:</strong> <span className="font-mono bg-bgBase px-1 rounded">{String(this.state.healingData.hashLock)}</span></p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-success text-bgBase px-4 py-2 rounded-lg font-bold hover:bg-success/90 transition-colors"
                >
                  重新載入系統
                </button>
              </div>
            )}

            {this.state.healingStatus === 'failed' && (
              <div className="text-danger text-sm">自我修復網路連線失敗，請稍後重試。</div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
