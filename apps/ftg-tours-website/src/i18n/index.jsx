/**
 * i18n/index.jsx — language context for ftgtours.
 *
 * 5T-Traceable: source_origin = deployed bundle /var/www/ftgtours/assets/
 *                index-XzYV-tOx.js  (context created via createContext at 334200,
 *                provider `cr`, consumer hook `lr`)
 *
 * Recovered then fixed. Three defects in the deployed build are corrected here:
 *
 *  1. NO BROWSER-LANGUAGE DETECTION. The deployed provider returned 'zh'
 *     unconditionally unless ftg_lang was already in localStorage, so a
 *     first-time visitor — or anyone who cleared storage — always got
 *     Traditional Chinese, including English readers. We now detect
 *     navigator.language, and honour an explicit stored choice first.
 *
 *  2. MISSING KEY LEAKED A RAW DOTTED KEY. The deployed translator ended in
 *     `?? e`, so an untranslated key rendered literally as e.g.
 *     `executive.heroCta` on the page. We now report the missing key in dev and
 *     fall back to the other locale, then to a visible marker.
 *
 *  3. NO STORAGE VALIDATION / no write guard. Stored values other than
 *     zh|en were trusted in spirit and could not recover.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import zh from './zh.js';
import en from './en.js';

export const DICTIONARIES = { zh, en };
export const STORAGE_KEY = 'ftg_lang';
export const DEFAULT_LANG = 'zh';

const LanguageContext = createContext(null);

/** Read the stored preference, but only if it is a locale we actually ship. */
function readStoredLang() {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'zh' || v === 'en' ? v : null;
  } catch {
    // Private-mode / disabled storage: fall through to detection.
    return null;
  }
}

/**
 * Pick a starting locale.
 * Explicit stored choice wins, then the browser's preference, then DEFAULT_LANG.
 */
function detectInitialLang() {
  const stored = readStoredLang();
  if (stored) return stored;
  if (typeof navigator !== 'undefined') {
    const wanted = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of wanted) {
      if (typeof tag !== 'string') continue;
      const lower = tag.toLowerCase();
      // Only Simplified/Traditional Chinese should get the zh copy.
      if (lower.startsWith('zh')) {
        if (/hant|tw|hk|mo/.test(lower)) return 'zh';
        // zh-Hans / zh-CN: still serve the zh dictionary rather than English,
        // but this is a single zh locale, so fall through and return it.
        return 'zh';
      }
      if (lower.startsWith('en')) return 'en';
    }
  }
  return DEFAULT_LANG;
}

/** Resolve a dotted key path without throwing on a missing branch. */
function resolve(dict, dottedKey) {
  let cur = dict;
  for (const part of dottedKey.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    if (!(part in cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function interpolate(template, params) {
  if (typeof template !== 'string' || !params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    params[key] === undefined ? match : params[key]
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Non-fatal: the session still works, it just will not be remembered.
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }, [lang]);

  // Keep the document title direction/label in sync for screen readers.
  useEffect(() => {
    const meta = document.querySelector('meta[name="content-language"]');
    if (meta) meta.setAttribute('content', lang === 'zh' ? 'zh-Hant' : 'en');
  }, [lang]);

  const value = useMemo(() => {
    const primary = DICTIONARIES[lang] || DICTIONARIES[DEFAULT_LANG];
    const secondary = DICTIONARIES[lang === 'zh' ? 'en' : 'zh'];

    const t = (dottedKey, params) => {
      let str = resolve(primary, dottedKey);
      if (typeof str !== 'string') {
        // Missing in the active locale: borrow the other one so the user never
        // sees a raw key, and so a gap is obvious to us rather than to them.
        str = resolve(secondary, dottedKey);
        if (typeof str !== 'string') {
          if (import.meta.env?.DEV) {
            console.warn(`[i18n] missing key: ${dottedKey}`);
          }
          return `[i18n:${dottedKey}]`;
        }
        if (import.meta.env?.DEV) {
          console.warn(`[i18n] ${dottedKey} missing in "${lang}", fell back`);
        }
      }
      return interpolate(str, params);
    };

    return { lang, setLang: setLangState, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageContext;
