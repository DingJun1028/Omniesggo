import type { Metadata } from 'next';
import { I18nProvider } from './i18n/I18nProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { AgnesProvider } from '@/components/AgnesProvider';
import { AppShell } from './components/layout/AppShell';
import { OmniErrorBoundary } from '@/core/services/error-boundary';
import { KeyboardShortcutProvider } from './components/keyboard-shortcut-provider';
import './globals.css';
import ThemeProvider from './components/theme-client';

export const metadata: Metadata = {
  title: 'ESGGO — 永續發展無限進化',
  description: 'ESGGO 永續發展無限進化：5T 永續數據治理、萬能中心、ESG 報告產生器',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;600;700&family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <AgnesProvider>
                <KeyboardShortcutProvider>
                  <AppShell>
                    <OmniErrorBoundary>
                      {children}
                    </OmniErrorBoundary>
                  </AppShell>
                </KeyboardShortcutProvider>
              </AgnesProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
