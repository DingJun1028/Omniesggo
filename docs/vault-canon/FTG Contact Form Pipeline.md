---
title: FTG Contact Form Pipeline
canon_id: OMN-LOG-004
date: 2026-10-09
tags: [unit-of-learning][ftg][resend][cloudflare-workers]
canonical: [[AI Research Index]]
---

# OMN-LOG-004 · FTG Contact Form Pipeline — 2026-10 全鏈路活

> 本檔為 unit-of-learning：記錄 `ftgtours.esggo.co` 「立即洽詢」表單 → 收件匣 完整端到端流程。  
> 連結至 [[AI Research Index]] / [[12大萬能 OMNI-CANON]] / [[Best Practice Awakening]] / [[ESG GO Sacred Pipeline CI-CD]] / [[Dependabot Security Sweep 2026-10]]

---

## 0. 一行總結

```
訪客 → ftgtours.esggo.co/contact 填表
  → Access bypass (新 app ftgtours-api-public)
  → Cloudflare Worker ftgtours-api (etag 13627155…)
    ├─ INSERT INTO D1 ftgtours_contact.contact_inquiries
    └─ fire-and-forget POST /emails Resend (esggo.co verified)
  → thoth@esgsunshine.com 收件
  ← 200 {ok:true, id:<D1 row>} 給前端
```

端到端耗時 ≈ 6–30 秒。已驗證真實寄達 id `01a11f95…`。

---

## 1. 架構圖

```
┌──────────┐    POST /api/contact     ┌──────────────────┐    Bearer Token    ┌──────────┐
│ 訪客瀏覽器│ ───────────────────────▶│ Cloudflare Worker │ ────────────────▶│ Resend   │
│ (FTG 前端)│                          │  ftgtours-api      │                  │ (esggo.co)│
└──────────┘                          └──────────────────┘                  └──────────┘
     │                                       │                                  │
     │                                       ▼ INSERT                          │
     │                                  ┌────────────┐                         │
     │                                  │ D1          │                         │
     │                                  │ ftgtours_   │                         │
     │                                  │ contact DB  │                         │
     │                                  └────────────┘                         │
     │                                                                        ▼
     │                                                          thoth@esgsunshine.com
     │
     └────── 200 {ok:true, id:<D1 row>} ◀────── Worker ──────────────────────┘
```

---

## 2. 端到端流程（6 步）

### Step 1：訪客填表
- 觸發：`/contact` 頁面
- 表單欄位：8 項（公司 / 聯絡人 / Email / 電話 / 人數 / 活動類型 / 期望日期 / 訊息）
- 觸發 API：`POST /api/contact` JSON body

### Step 2：Access bypass（新 app）
- app 名稱：`ftgtours-api-public`
- 路由：`ftgtours.esggo.co/api/contact`
- 政策：bypass for everyone（path 限定）
- ✅ 已建立於 `d7d4773 → ba38120` 之後

### Step 3：Worker `ftgtours-api`
- 入口：`<ROOT>/apps/ftg-tours-website/` build 出 `dist/`
- etag：`13627155…`（v2026-10 Resend 整合版）
- secrets：
  - `RESEND_API_KEY`（sending_access：`re_YCZ6juJa_…`）
  - D1 binding `DB`（database_id `c08a4c55-13b9-4654-aeb2-ddb3218054c7`）

### Step 4：D1 INSERT
- table：`fttours_contact.contact_inquiries`
- 欄位：company / contact_name / email / phone / participants / activity_type / preferred_date / message / ip / status='new'
- 結果：`{ ok: true, id: <row> }`

### Step 5：Resend POST /emails（fire-and-forget）
```js
await resend.emails.send({
  from: 'FTG 墾趣旅遊 網站 <noreply@esggo.co>',
  to:   ['thoth@esgsunshine.com'],
  subject: '[FTG 立即洽詢] <公司> - <聯絡人>',
  text: '...'
});
```
- 失敗不阻斷 200（try/catch 內 log error）
- esggo.co verified → esgsunshine.com pending（4 紀錄送達後 esgsunshine.com 也能寄）

### Step 6：收件 + 回應
- 收件：thoth@esgsunshine.com 收到信
- 回應：Worker 回 200 + JSON，前端顯示「已收到您的訊息」

---

## 3. 涉及資源

| 資源 | 用途 | 狀態 |
|---|---|---|
| `ftgtours.esggo.co` | 表單頁 | ✅ |
| Cloudflare Worker `ftgtours-api` | 表單 API | ✅ etag 13627155… |
| D1 database `ftgtours_contact` | 儲存表單 | ✅ |
| Resend `noreply@esggo.co` | 寄件網域 | ✅ verified |
| Resend `noreply@esgsunshine.com` | 寄件網域 | ⏳ 1/4 verified（DNS 已對，等 checker 翻綠） |
| Cloudflare Access `ftgtours-api-public` | API bypass | ✅ |
| Cloudflare zone `esggo.co` (8dda3653…) | DNS | ✅ |
| OmniCF token (CF API) | 部署與 DNS 寫入 | ✅ |

---

## 4. 關鍵程式碼片段

### 4.1 Worker 入口（節錄）

```ts
// apps/ftg-tours-website/worker/index.ts (核心邏輯)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = { "Access-Control-Allow-Origin": "https://ftgtours.esggo.co", ... };

    if (url.pathname === "/api/contact" && request.method === "POST") {
      try {
        const data = await request.json();
        const stmt = env.DB.prepare(
          "INSERT INTO contact_inquiries (company, contact_name, email, phone, participants, activity_type, preferred_date, message, ip, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')"
        );
        const res = await stmt.bind(
          data.company || null, data.contact_name || null, data.email || null,
          data.phone || null, data.participants ? parseInt(data.participants) || null : null,
          data.activity_type || null, data.preferred_date || null, data.message || null,
          request.headers.get("cf-connecting-ip") || null
        ).run();
        // fire-and-forget Resend
        sendEmail(env, data).catch(e => console.error("sendEmail failed:", e));
        return new Response(JSON.stringify({ ok: true, id: res.meta.last_row_id }), {
          status: 200, headers: { ...cors, "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, ... });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
```

### 4.2 D1 連線（節錄）
- 從 `env.DB` 拿 D1 binding
- binding 名稱 `DB`
- database ID `c08a4c55-13b9-4654-aeb2-ddb3218054c7`（table `contact_inquiries` 已建於 `ftgtours_contact` database）

### 4.3 Resend 呼叫（節錄）
```ts
async function sendEmail(env, data) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "FTG 墾趣旅遊 網站 <noreply@esggo.co>",
      to: ["thoth@esgsunshine.com"],
      subject: `[FTG 立即洽詢] ${data.company} - ${data.contact_name}`,
      text: `...`
    })
  });
  if (!r.ok) console.error("resend non-2xx:", r.status, await r.text().catch(() => ""));
  return r;
}
```

---

## 5. 部署歷程（2026-10）

| 階段 | 動作 | 結果 |
|---|---|---|
| 1 | 建 `ftgtours_api` Cloudflare Worker，部署 Resend 整合版 | ✅ etag `13627155…` |
| 2 | 建 `ftgtours-api-public` Cloudflare Access app（bypass /api/contact） | ✅ d7d4773 → ba38120 |
| 3 | 寫入 esggo.co DNS（Resend 驗證四紀錄） | ✅ send CNAME verified |
| 4 | 將 Resend API key（`re_YCZ6juJa_…`）set 為 Worker secret | ✅ |
| 5 | 觸發端到端測試：POST /api/contact → D1 row + Resend accepted id | ✅ id `01a11f95-7cf4-7030-b74e-09915b47ab65` |
| 6 | OG image 1200×630 重截並部署 | ✅ 32,152 bytes |

---

## 6. 端到端測試記錄

```bash
# 發送
curl -X POST "https://ftgtours.esggo.co/api/contact" \
  -H "Content-Type: application/json" \
  -H "Origin: https://ftgtours.esggo.co" \
  -d '{"company":"OmniCF 驗收","contact_name":"自動化測試","email":"verify@omnicf.local","phone":"","participants":"1","activity_type":"其他","preferred_date":"","message":"OmniCF 端到端驗收測試"}'

# 回應
{"ok":true,"id":11}

# Resend 控制台
→ message_id: 01a11f95-7cf4-7030-b74e-09915b47ab65
→ from: FTG 墾趣旅遊 網站 <noreply@esggo.co>
→ to: thoth@esgsunshine.com
→ status: delivered
```

---

## 7. 為何用 `esggo.co` 而非 `ftgtours.esggo.co`？

- `esggo.co` 是 Cloudflare zone（8dda3653…），已 verified → 寄件可送達
- `ftgtours.esggo.co` 是子網域（DNS 在同一 zone）→ 用 esggo.co 寄件成本低
- `esgsunshine.com` 是另一個 domain（DNS 在 Google Workspace，不在我們 CF）→ 收件端
- 雙 repo + 雙網域 + Access bypass 雙管齊下

---

## 8. 仍需用戶親手（1 項）

- **esgsunshine.com Resend 驗證翻綠**（DNS 100% 對，等 Resend UI 按 Verify）

---

## 相關連結（向下鑽研）

- [[AI Research Index]] — 全 vault 索引
- [[12大萬能 OMNI-CANON]] — 12 維度架構
- [[Best Practice Awakening]] — 結界繼承治理
- [[ESG GO Sacred Pipeline CI-CD]] — CI 修補紀錄
- [[5T Protocol]] — 5 維度驗證條款
- [[Root Cause × Effect Elimination]] — 果因消除

---

<sub>FTG Contact Form Pipeline v2026-10 | 全鏈路活 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
