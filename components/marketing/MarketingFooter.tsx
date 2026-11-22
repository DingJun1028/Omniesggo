import Link from 'next/link';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';

const FOOTER_LINKS = {
  product: [
    { label: '產品功能', href: '/#features' },
    { label: '解決方案', href: '/#solutions' },
    { label: '定價方案', href: '/pricing' },
    { label: '更新日誌', href: '/changelog' },
  ],
  resources: [
    { label: '使用指南', href: '/docs' },
    { label: 'API 文件', href: '/docs/api' },
    { label: '常見問題', href: '/faq' },
    { label: '部落格', href: '/blog' },
  ],
  company: [
    { label: '關於我們', href: '/about' },
    { label: '聯絡我們', href: '/contact' },
    { label: '隱私權政策', href: '/privacy' },
    { label: '服務條款', href: '/terms' },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cool)] to-emerald-400 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-[var(--text-1)]">ESGGO</span>
            </Link>
            <p className="text-[var(--text-2)] mb-6 max-w-md leading-relaxed">
              AI 驅動的永續報告書平台，整合 GRI、CSRD、ESRS 合規框架，
              提供可驗證、可追溯的 ESG 數據治理解決方案。
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[var(--text-2)]">
                <Mail className="w-5 h-5 text-[var(--accent-cool)] flex-shrink-0" />
                <a href="mailto:hello@esggo.co" className="hover:text-[var(--accent-cool)] transition-colors">
                  hello@esggo.co
                </a>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-2)]">
                <Phone className="w-5 h-5 text-[var(--accent-cool)] flex-shrink-0" />
                <a href="tel:+886-2-7743-1006" className="hover:text-[var(--accent-cool)] transition-colors">
                  +886-2-7743-1006
                </a>
              </div>
              <div className="flex items-start gap-3 text-[var(--text-2)]">
                <MapPin className="w-5 h-5 text-[var(--accent-cool)] flex-shrink-0 mt-0.5" />
                <span>台北市中山區<br />台灣</span>
              </div>
            </div>
          </div>

          {[
            { title: '產品', links: FOOTER_LINKS.product },
            { title: '資源', links: FOOTER_LINKS.resources },
            { title: '公司', links: FOOTER_LINKS.company },
          ].map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold text-[var(--text-1)] mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[var(--text-2)] hover:text-[var(--accent-cool)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[var(--text-3)] text-sm">
            © 2026 ESGGO. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[var(--text-3)] hover:text-[var(--accent-cool)] text-sm transition-colors">
              隱私權政策
            </Link>
            <Link href="/terms" className="text-[var(--text-3)] hover:text-[var(--accent-cool)] text-sm transition-colors">
              服務條款
            </Link>
            <Link href="/cookie-policy" className="text-[var(--text-3)] hover:text-[var(--accent-cool)] text-sm transition-colors">
              Cookie 政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
