'use client';

import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent } from '@esggo/ui';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cool)] to-emerald-400 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl text-[var(--text-1)]">ESGGO</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-1)] mb-2">登入您的帳號</h1>
          <p className="text-[var(--text-2)]">歡迎回到 ESGGO 永續報告書平台</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                  電子郵件
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-1)] mb-2">
                  密碼
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-[var(--border)]" />
                  <span className="text-sm text-[var(--text-2)]">記住我</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-[var(--accent-cool)] hover:underline">
                  忘記密碼？
                </Link>
              </div>
              <Link href="/app/dashboard">
                <Button variant="primary" size="lg" className="w-full">
                  登入
                </Button>
              </Link>
            </form>
            <div className="mt-6 text-center">
              <p className="text-[var(--text-2)]">
                還沒有帳號？{' '}
                <Link href="/register" className="text-[var(--accent-cool)] hover:underline font-medium">
                  立即註冊
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
