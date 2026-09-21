// canon.i18n.ts -- 自動生成，勿手改
export const LOCALES = ['en', 'zh-TW'] as const;
export type Locale = typeof LOCALES[number];

export const DICT: Record<Locale, Record<string, string>> = {
  "en": {
    "app.title": "Omni Avatar",
    "app.subtitle": "Share with everyone, everywhere",
    "app.welcome": "Welcome to Omni Avatar",
    "nav.home": "Home",
    "nav.about": "About",
    "nav.contact": "Contact",
    "btn.submit": "Submit",
    "btn.cancel": "Cancel"
  },
  "zh-TW": {
    "app.title": "萬能分身",
    "app.subtitle": "與人共享，無處不在",
    "app.welcome": "歡迎來到萬能分身",
    "nav.home": "首頁",
    "nav.about": "關於",
    "nav.contact": "聯絡我們",
    "btn.submit": "提交",
    "btn.cancel": "取消"
  }
};

export const VERSION = '1.0.0';
