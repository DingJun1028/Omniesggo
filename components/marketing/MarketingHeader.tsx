'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf, ArrowRight } from 'lucide-react';
import { Button } from '@esggo/ui';

const NAV_ITEMS = [
  { href: '/#features', label: '產品功能' },
  { href: '/#solutions', label: '解決方案' },
  { href: '/pricing', label: '定價方案' },
  { href: '/resources', label: '資源中心' },
  { href: '/about', label: '關於我們' },
];

export function MarketingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[var(--surface-1)]/95 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cool)] to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(13,148,136,0.3)] group-hover:shadow-[0_0_30px_rgba(13,148,136,0.5)] transition-all">
                <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="font-bold text-xl lg:text-2xl tracking-wide text-[var(--text-1)]">
                ESGGO
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--accent-cool)] transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--accent-cool)] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="md">
                  登入
                </Button>
              </Link>
              <Link href="/app">
                <Button variant="primary" size="md" className="group">
                  開始使用
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label="開啟選單"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            role="button"
            tabIndex={0}
            aria-label="關閉選單"
            onClick={() => setIsMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter') setIsMenuOpen(false);
            }}
          />
          <div className="absolute top-0 right-0 w-full max-w-sm h-full bg-[var(--surface-1)] shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cool)] to-emerald-400 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-[var(--text-1)]">ESGGO</span>
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)]"
                aria-label="關閉選單"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--accent-cool)] transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 space-y-2 border-t border-[var(--border)]">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full">
                    登入
                  </Button>
                </Link>
                <Link href="/app" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full group">
                    開始使用
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
