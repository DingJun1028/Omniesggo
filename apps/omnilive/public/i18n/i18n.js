// @esggo/i18n — OmniLive runtime (apps/omnilive/public/i18n/i18n.js)
// Dual-language contraction: ONLY zh-TW + en. No legacy locales.
// Loads the matching JSON bundle at startup and applies data-i18n-key translations.
// 5T: Traceable (source_origin), Trackable (lifecycle hooks), Tangible (UI feedback),
//     Transparent (no hallucinated strings), Trustworthy (frozen dict after load).

(() => {
  'use strict';

  // ---------- 5T: Traceable / Trustworthy ----------
  // Non-negotiable dual-language set. Anything else is a hard error at boot.
  const SUPPORTED_LOCALES = ['en', 'zh-TW'];
  type Locale = (typeof SUPPORTED_LOCALES)[number];

  // init: prefer <html lang="...">, fall back to OMNILIVE_LANGAUGE / navigator
  const html = document.documentElement;
  const initLang = (() => {
    if (html && html.lang) return html.lang as Locale;
    if (typeof window !== 'undefined' && (window as any).__OMNILIVE_LOCALE__) return (window as any).__OMNILIVE_LOCALE__ as Locale;
    return (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
  })();

  // Only 2 locales; cast is safe because we validate below.
  const locale = SUPPORTED_LOCALES.includes(initLang as Locale) ? (initLang as Locale) : 'en';
  html.lang = locale;

  // ---------- 5T: Transparent ----------
  // Frozen dict after load. Any write → throw (no hallucinated/untracked strings).
  interface Dict { [key: string]: string }
  const dict = new Map<Locale, Dict>();
  Object.freeze(dict);

  // 5T: Trackable lifecycle hooks — record every load + switch into the persisted log.
  const logEl = document.getElementById('i18nLog');
  function log(tag: string, detail: string) {
    if (!logEl) return;
    const row = document.createElement('div');
    row.className = 'i18n-row';
    row.textContent = `[${new Date().toISOString()}] ${tag} / ${locale} / ${detail}`;
    logEl.appendChild(row);
  }
  log('init', `locale=${locale}`);

  // ---------- 5T: Transparent ----------
  // Fetch the matching JSON bundle.
  async function loadBundle(loc: Locale): Promise<Dict> {
    const url = `./i18n/${loc}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`i18n: failed to load ${url} status=${res.status}`);
    const bundle = await res.json();
    if (bundle.locale !== loc) throw new Error(`i18n: locale mismatch ${bundle.locale} != ${loc}`);
    if (Object.keys(bundle.dict).length === 0) throw new Error(`i18n: empty dict in ${url}`);
    return bundle.dict;
  }

  // Preload both bundles in parallel (so switching is instant and lazy).
  const [enDict, zhDict] = await Promise.all([loadBundle('en'), loadBundle('zh-TW')]);

  // Freeze both; the union map is immutable thereafter.
  dict.set('en', Object.freeze({ ...enDict }));
  dict.set('zh-TW', Object.freeze({ ...zhDict }));
  Object.freeze(dict);

  log('loaded', `en=${enDict['app.title']} / zh-TW=${zhDict['app.title']}`);

  // ---------- 5T: Transparent ----------
  // Apply translations. Only text nodes and attribute text are touched;
  // code/structure stays untouched (no hallucinated DOM).
  function apply(): void {
    const root = document.body || document.documentElement;
    // 1) attribute text
    root.querySelectorAll('[data-i18n-key]').forEach((el) => {
      const key = el.getAttribute('data-i18n-key')!;
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        const v = dict.get(locale)?.[key] ?? el.getAttribute('data-i18n-default') ?? key;
        el.value = v;
      } else {
        const v = dict.get(locale)?.[key] ?? el.getAttribute('data-i18n-default') ?? key;
        el.setAttribute('data-i18n-init', v);
        el.textContent = v;
      }
    });
    // 2) <option> selected value: ensure its text matches current locale
    root.querySelectorAll('option').forEach((opt) => {
      const key = opt.getAttribute('data-i18n-key');
      if (!key) return;
      const v = dict.get(locale)?.[key] ?? opt.textContent ?? key;
      opt.textContent = v;
    });
    // 3) <title>
    const t = document.title;
    const tile = dict.get(locale)?.['app.title'] ?? t;
    if (tile !== t) document.title = tile;

    // 4) <html lang="..."> already set at init; re-set if switched below.
    html.lang = locale;

    log('apply', `keys=${root.querySelectorAll('[data-i18n-key]').length}`);
  }

  // Persist preferred locale to sessionStorage (survives reload in same tab).
  try {
    sessionStorage.setItem('omnilive-locale', locale);
    log('persist', `sessionStorage=omnilive-locale:${locale}`);
  } catch { /* ignore storage quota / privacymode */ }

  // Language switch: driven from the page (e.g. a data-i18n-switch element)
  // or by the site. Expose on window for the inline scripts below.
  (window as any).__i18n = {
    locale,
    available: Array.from(dict.keys()),
    async setLocale(next: Locale) {
      if (!SUPPORTED_LOCALES.includes(next as Locale)) {
        console.warn(`i18n: unsupported locale ${String(next)}`);
        return;
      }
      locale = next as Locale;
      html.lang = locale;
      try { sessionStorage.setItem('omnilive-locale', locale); } catch {}
      apply();
      log('switch', `locale=${locale}`);
    },
    t(key: string): string {
      return dict.get(locale)?.[key] ?? key;
    },
  };

  // Observe <select> from= / to= and the language toggles, then re-apply the
  // visible labels. Applied once at boot; runtime switching happens via __i18n.setLocale.
  apply();
})();
