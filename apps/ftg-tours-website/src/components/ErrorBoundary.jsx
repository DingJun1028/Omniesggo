import React from 'react';
import FTGIcon from './FTGIcon.jsx';
import { translations } from '../i18n/translations.js';

/**
 * 品牌化錯誤邊界。
 *
 * 為什麼要自訂：未自訂時 React 會掛上自己的預設邊界，那段文字是英文
 * 開發者口吻、還帶 💿 / 👋 兩個 emoji。對一隻正式官網來說，等於把
 * 「出錯了，開發者你好」直接秀給造訪的客戶看，而且違反本專案
 * 「圖示不用 emoji、走高級簡約線條風」的既定規則。
 *
 * 5T-Tangible: 訪客在出錯時仍看到品牌語彙與可行動的出路（重試 / 回首頁），
 *              而不是一段與品牌無關的除錯訊息。
 *
 * 5T-Transparent（2026-10-02）：接上雙語。
 *   這裡原本整片硬編碼繁中，且沒有任何 t() —— 使用者回報
 *   「英文版 還是繁體中文」。錯誤邊界是「平時看不到、但出事就整頁中文」
 *   的型別：字典全綠、key 全齊，掃描工具也掃不到（因為它沒接 t()），
 *   但一旦觸發就是最傷品牌形象的那一頁。
 *
 *   ErrorBoundary 是 class 元件，拿不到 hook 的 t()。這裡改讀
 *   translations[lang] 並在 componentDidCatch 記錄當下語系，
 *   用一個小的 renderErrorCopy() 取文案 —— 語系來源仍是單一權威
 *   (localStorage 'ftg_lang' 與 translations)，不另立第二套。
 */

// class 元件不能用 hook，因此從 localStorage 直接讀語系，與
// LanguageContext 使用同一個 key，兩者不會各說各話。
const STORAGE_KEY = 'ftg_lang';

function detectLang() {
  // 讀寫 localStorage 在隱私模式 / 禁用 cookie 時會直接 throw。
  // 這裡是錯誤邊界 —— 它自己再 throw 一次就變成白畫面，比顯示中文更糟。
  // 所以任何存取失敗都退回預設語系，寧可語系不對也不要炸掉。
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'zh';
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

function pick(dict, key) {
  const raw = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
  return typeof raw === 'string' ? raw : '';
}

// 英文版缺少這組 key 時的最小退讓文案 —— 寧可少一句說明，
// 也不能在英文版吐繁中（那正是使用者回報的症狀）。
const FALLBACK = {
  zh: {
    title: '頁面暫時無法顯示',
    body: '這個頁面剛才沒有載入成功。請重新載入，或回到首頁繼續瀏覽其他旅程。',
    retry: '重新載入',
    home: '返回首頁',
  },
  en: {
    title: 'This page could not be displayed',
    body: 'Something went wrong while loading this page. Please reload, or return to the home page to keep browsing.',
    retry: 'Reload',
    home: 'Back to home',
  },
};

function renderErrorCopy(lang) {
  const dict = translations[lang] || translations.zh;
  const group = dict.errorBoundary || {};
  const fb = FALLBACK[lang] || FALLBACK.zh;
  return {
    title: pick(group, 'title') || fb.title,
    body: pick(group, 'body') || fb.body,
    retry: pick(group, 'retry') || fb.retry,
    home: pick(group, 'home') || fb.home,
  };
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 5T-Traceable: 保留可追溯的診斷資訊，不吞掉 stack。
    // 同時記下當下語系 —— 出錯後回報要能重現「使用者看到哪一種語言」。
    this.setState({ lang: detectLang() });
    // TODO: 若之後接上 Sentry / Cloudflare Analytics，在此改為上报。
    console.error('[FTG] unhandled render error:', error, info?.componentStack);
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const copy = renderErrorCopy(this.state.lang || detectLang());

    return (
      <div
        role="alert"
        className="min-h-screen bg-ftg-cream text-ftg-forest flex items-center justify-center px-4"
      >
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-ftg-forest/10 flex items-center justify-center mx-auto mb-6 text-ftg-forest">
            <FTGIcon name="compass" size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{copy.title}</h1>
          <p className="text-base text-gray-600 leading-relaxed mb-8">
            {copy.body}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-6 py-3 rounded-full bg-ftg-forest text-white text-sm font-medium hover:bg-ftg-green transition-colors"
            >
              {copy.retry}
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="px-6 py-3 rounded-full border border-ftg-forest text-ftg-forest text-sm font-medium hover:bg-ftg-forest hover:text-white transition-colors"
            >
              {copy.home}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
