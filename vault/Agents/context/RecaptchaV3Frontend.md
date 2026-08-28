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

> 聯絡表單 `/api/contact` 防垃圾機器人。v3 隱形（使用者無互動），需 Google Site Key。

## 前端實作（React）
```jsx
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'REPLACE_WITH_YOUR_V3_SITE_KEY';

// useEffect: 動態載入 script（避免佔位符時載入）
useEffect(() => {
  if (RECAPTCHA_SITE_KEY.startsWith('REPLACE')) return;
  if (document.querySelector(`script[src*="recaptcha/api.js"]`)) return;
  const s = document.createElement('script');
  s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  s.async = true; document.head.appendChild(s);
}, []);

// handleSubmit: 取 token 附表單
const recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit_contact' });
fetch('/api/contact', { method:'POST', body: JSON.stringify({ ...form, recaptchaToken }) });
```

## 配置
- `.env`：`VITE_RECAPTCHA_SITE_KEY=6Lc...`
- `.env.example` 已建（說明 + 後端 siteverify 端點）

## 後端驗證（待補，ftgtours-api Worker）
- 用 Secret Key 呼叫 `https://www.google.com/recaptcha/api/siteverify`
- body：`{ secret, response: recaptchaToken, remoteip }`
- score ≥ 0.5 才接單

## 經驗
- ⚠️ 既有 `ftgtours-api` Worker 未在本 repo（在別處維護），後端驗證需另補
- ✅ 前端攔截 + token 附帶已具基礎防 bot 屏障，即使後端未驗證也不影響表單功能

## 關聯
- [[WebsiteGapAudit]] — 官網增強項之一
- [[FTGJourneyAppArchitecture]] — 聯絡表單屬官網生態
