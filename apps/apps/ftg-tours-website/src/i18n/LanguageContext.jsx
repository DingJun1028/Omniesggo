import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'ftg_lang';
// 預設為 繁體中文版（官方預設語系；English 為切換選項）
const DEFAULT_LANG = 'zh';
const HTML_LANG_MAP = { zh: 'zh-Hant', en: 'en' };

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') return saved;
    }
    return DEFAULT_LANG;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = HTML_LANG_MAP[lang] || HTML_LANG_MAP[DEFAULT_LANG];
    }
  }, [lang]);

  // t(key, params) 支援巢狀 key，如 t('home.heroTitle')
  // 5T-Traceable: params 可代入 {placeholder}，讓隱私權政策/服務條款直接
  // 引用 src/data/company.js 的法定主體資料，而不是在翻譯字串裡再寫一份
  // （重複寫死正是先前聯絡資訊與登記資料不符的根因）。
  // 既有呼叫只傳 key，行為完全不變。
  const t = (key, params) => {
    const dict = translations[lang] || translations.zh;
    const raw = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict) ?? key;
    if (!params || typeof raw !== 'string') return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? params[name] : m));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useT() {
  return useLanguage().t;
}

export default LanguageContext;
