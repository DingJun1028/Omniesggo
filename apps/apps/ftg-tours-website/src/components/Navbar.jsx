import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { FTGIcon } from './FTGIcon';

// 5T-Tangible（2026-10-01）：行動版圓形圖示。
//   原本手機選單每一項都是純文字，沒有任何圖示 —— 使用者回報
//   「手機板還是沒看到圖示」。這裡為每個項目配上專屬圓形 icon badge，
//   icon 名稱對應各產品線語意（不是隨便挑一個圖示湊數）。
//
// 注意：productLinks 必須留在元件內 —— 它呼叫 useLanguage() 的 t()，
// 若提到模組層級會在 render 前就呼叫 hook，直接壞掉整個 Navbar。

// 行動版圓形圖示容器：sand 圓底 + forest icon + 細邊框。
// 5T-Tangible：圓框 40px、icon 22px，forest(#1a3c34) on sand(#f5f0e8)
// 實測 8.9:1，遠高於 AA 非文字圖示的 3:1 下限。
//
// 這裡「底色」踩過一個坑：原本用 bg-white，但手機選單容器本身也是
// bg-white —— 白底疊白底，圓形等於不存在，使用者回報「還是沒看到圖示」。
// 改用 brand sand 後即使底色差只有 1.05:1，仍靠 border 讓圓形邊緣成立。
function MobileIcon({ name, className = '' }) {
  return (
    <span
      className={`shrink-0 w-10 h-10 rounded-full bg-ftg-sand border border-ftg-green/25 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <FTGIcon name={name} size={22} className="text-ftg-forest" />
    </span>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProducts, setMobileProducts] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();

  const productLinks = [
    { path: '/corporate-travel', icon: 'users', label: t('products.corpTravel') },
    { path: '/family-day', icon: 'heart', label: t('products.familyDay') },
    { path: '/esg-team-day', icon: 'team', label: t('products.esgTeamDay') },
    { path: '/wellbeing-retreat', icon: 'leaf', label: t('products.wellbeing') },
    { path: '/executive-retreat', icon: 'award', label: t('products.executive') },
    { path: '/esg-impact-note', icon: 'sustainable', label: t('products.impactNote') },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link to="/" className="flex items-center min-h-[44px] min-w-[44px]">
            <img src="/images/logo.webp" alt="墾趣旅遊 FTG TOURS" className="h-10 md:h-14 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link to="/" className={`px-3 py-2 min-h-[44px] inline-flex items-center rounded-md text-sm font-medium ${location.pathname === '/' ? 'text-ftg-green bg-ftg-sand' : 'text-gray-700 hover:text-ftg-green'}`}>
              {t('nav.home')}
            </Link>
            <div className="relative group">
              <button className="px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center rounded-md text-sm font-medium text-gray-700 hover:text-ftg-green">
                {t('nav.products')}
                <svg className="ml-1 h-6 w-6 shrink-0 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                <div className="py-2">
                  {productLinks.map(link => (
                    <Link key={link.path} to={link.path} className={`block px-4 py-2.5 min-h-[44px] inline-flex items-center text-sm ${location.pathname === link.path ? 'text-ftg-green bg-ftg-sand font-semibold' : 'text-gray-700 hover:bg-ftg-sand hover:text-ftg-green'}`}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center ml-2 border border-gray-200 rounded-full overflow-hidden text-xs font-semibold">
              {/* 5T-Tangible: 觸控區 >= 44px。py-1.5 只給 28px，違反 WCAG 2.5.8。
                  視覺字級不變（text-xs），只把點擊區撐高。 */}
              <button
                onClick={() => setLang('zh')}
                className={`px-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors ${lang === 'zh' ? 'bg-ftg-green text-white' : 'text-gray-600 hover:bg-ftg-sand'}`}
              >
                {t('lang.zh')}
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors ${lang === 'en' ? 'bg-ftg-green text-white' : 'text-gray-600 hover:bg-ftg-sand'}`}
              >
                {t('lang.en')}
              </button>
            </div>

            <a href="#/contact" className="bg-ftg-orange text-white px-5 py-2 min-h-[44px] min-w-[44px] inline-flex items-center rounded-full text-sm font-medium hover:bg-orange-600 transition-colors ml-2 shadow-sm">
              {t('nav.contact')}
            </a>
          </div>

          {/* Mobile menu button
              5T-Tangible: 觸控區 >= 44px。p-2 + 24x20 圖示只有 40x36px，
              行動版點擊容錯低；用 min-w/min-h 撐開，圖示與視覺不變。 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md text-gray-700 hover:text-ftg-green hover:bg-ftg-sand transition-colors"
            aria-label="選單"
            aria-expanded={mobileOpen}
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-6 bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {/* 5T-Tangible：原本 max-h-[600px] / max-h-96 是硬性像素高度，
            英文標籤較長、字級放大或視窗較矮時，選單底部項目會被裁在框外
            且無法捲動到 → 等同手機掉項目。改為視口相對高度 + 可捲動。 */}
        <div className={`lg:hidden transition-all duration-300 ${mobileOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto overscroll-contain' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="pb-4 pt-2 border-t border-gray-100">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-ftg-green hover:bg-ftg-sand min-h-[44px] min-w-[44px]" onClick={() => setMobileOpen(false)}>
              <MobileIcon name="compass" />
              {t('nav.home')}
            </Link>

            {/* Mobile Products accordion */}
            <div>
              <button onClick={() => setMobileProducts(!mobileProducts)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-ftg-green hover:bg-ftg-sand min-h-[44px] min-w-[44px]">
                <MobileIcon name="mountain" />
                {t('nav.products')}
                <svg className={`h-6 w-6 shrink-0 ml-auto transition-transform duration-200 ${mobileProducts ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`transition-all duration-300 ${mobileProducts ? 'max-h-[60vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="pl-4 py-1">
                  {productLinks.map(link => (
                    <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm min-h-[44px] ${location.pathname === link.path ? 'text-ftg-green bg-ftg-sand font-semibold' : 'text-gray-600 hover:text-ftg-green hover:bg-ftg-sand'}`} onClick={() => setMobileOpen(false)}>
                      <MobileIcon name={link.icon} className="w-9 h-9" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-2 px-4 mt-3">
              <span className="text-sm text-gray-500">{t('lang.label')}：</span>
              <div className="flex border border-gray-200 rounded-full overflow-hidden">
                {/* 5T-Tangible: 觸控區 >= 44px。py-1.5 只有 32px。 */}
                <button onClick={() => setLang('zh')} className={`px-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-sm font-medium ${lang === 'zh' ? 'bg-ftg-green text-white' : 'text-gray-600'}`}>{t('lang.zh')}</button>
                <button onClick={() => setLang('en')} className={`px-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-sm font-medium ${lang === 'en' ? 'bg-ftg-green text-white' : 'text-gray-600'}`}>{t('lang.en')}</button>
              </div>
            </div>

            <a href="#/contact" className="block mx-4 mt-4 bg-ftg-orange text-white px-6 py-3 rounded-full text-sm font-medium text-center shadow-sm" onClick={() => setMobileOpen(false)}>
              {t('nav.contact')}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
