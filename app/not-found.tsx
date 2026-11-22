'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@esggo/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-[var(--accent-cool)] to-emerald-400 bg-clip-text text-transparent">
            404
          </h1>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] mb-4">
          找不到頁面
        </h2>
        <p className="text-[var(--text-2)] mb-8 leading-relaxed">
          抱歉，您所尋找的頁面不存在或已被移除。
          請檢查網址是否正確，或返回首頁。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="primary" size="lg" className="group w-full sm:w-auto">
              <Home className="w-5 h-5 mr-2" />
              返回首頁
            </Button>
          </Link>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => window.history.back()}
            className="group w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回上一頁
          </Button>
        </div>
      </div>
    </div>
  );
}
