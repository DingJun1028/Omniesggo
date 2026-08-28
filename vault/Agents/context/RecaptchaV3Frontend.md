---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [recaptcha, spam, form, frontend]
related: [[WebsiteGapAudit]] [[FTGJourneyAppArchitecture]]
---

# reCAPTCHA v3 前端架構 · 知識分身

> 官網聯絡表單防垃圾架構（2026-08-29 實作前端，待使用者提供 v3 site key 啟用）。

## 實作（contact.jsx）
```jsx
// 1. 常數讀 env（.env.example 提供）
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'REPLACE_WITH_YOUR_V3_SITE_KEY';

// 2. useEffect 動態載入 script（避免重複）
useEffect(() => {
  if (RECAPTCHA_SITE_KEY.startsWith('REPLACE')) return;
  if (document.querySelector(`script[src*="recaptcha/api.js"]`)) return;
  const s = document.createElement('script');
  s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  s.async = true;
  document.head.appendChild(s);
}, []);

// 3. 提交前取 token 附 body
let recaptchaToken = '';
try {
  if (!RECAPTCHA_SITE_KEY.startsWith('REPLACE') && window.grecaptcha) {
    recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit_contact' });
  }
} catch (err) { console.warn('reCAPTCHA skipped:', err); }
// POST /api/contact with { ...form, recaptchaToken }
```

## 後端驗證點（註解說明，ftgtours-api Worker 待加）
```
POST https://www.google.com/recaptcha/api/siteverify
  secret=RECAPTCHA_SECRET_KEY
  response=recaptchaToken
→ score >= 0.5 才受理
```

## 經驗
- v3 隱形（無 checkbox），使用者體驗最佳
- site key 前端暴露安全（secret key 只在後端）
- `.env.example` 已建：`VITE_RECAPTCHA_SITE_KEY=REPLACE_WITH_YOUR_V3_SITE_KEY`
- 前端若無 key 則 `REPLACE` 前綴跳過，表單仍正常提交（降級）

## 關聯
- [[WebsiteGapAudit]] — 聯絡表單後端已由 ftgtours-api Worker 處理
- [[FTGJourneyAppArchitecture]] — 同一官網生態
