// lead-api — FTG / HTB 統一線索 API（Cloudflare Worker + D1）
// env:
//   DB                    D1 綁定（必備）
//   ALLOWED_ORIGINS       逗號分隔白名單（預設 https://ftgtours.esggo.co；HTB 走 Vercel 同源 proxy 不需列入）
//   RECAPTCHA_SECRET_KEY  設定後強制驗證 recaptchaToken（score >= 0.5）
//   RESEND_API_KEY / LEAD_NOTIFY_TO / LEAD_FROM  設定後寄 owner 通知 + 客戶回執；缺則優雅跳過
//   IP_HOURLY_CAP         每 IP 每小時配額（預設 5；schema 缺 created_at 時自動降級不限制）

const DEFAULT_ORIGINS = 'https://ftgtours.esggo.co';
const RECAPTCHA_MIN_SCORE = 0.5;

const json = (obj, status, corsHeaders) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function buildCors(origin, allowedSet) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  if (origin && allowedSet.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

async function verifyRecaptcha(env, token, ip) {
  const body = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token,
  });
  if (ip) body.set('remoteip', ip);
  const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: !!data.success, score: typeof data.score === 'number' ? data.score : 0 };
}

async function sendResend(env, { to, subject, html, replyTo }) {
  const payload = {
    from: env.LEAD_FROM || 'leads@ftgtours.esggo.co',
    to: [to],
    subject,
    html,
  };
  if (replyTo) payload.reply_to = [replyTo];
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return resp.ok;
}

const esc = (s) =>
  String(s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedSet = new Set(
      (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const origin = request.headers.get('Origin');
    const corsHeaders = buildCors(origin, allowedSet);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'lead-api' }, 200, corsHeaders);
    }

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      // 跨源請求必須在白名單；同源 proxy（Vercel rewrite）無 Origin 直接放行
      if (origin && !allowedSet.has(origin)) {
        return json({ ok: false, error: 'origin_not_allowed' }, 403, corsHeaders);
      }

      let data;
      try {
        data = await request.json();
      } catch (_) {
        return json({ ok: false, error: 'invalid_json' }, 400, corsHeaders);
      }

      try {
        return await handleContact(request, env, data, corsHeaders);
      } catch (e) {
        console.error('contact-error', e && e.message, e && e.stack);
        return json({ ok: false, error: 'server_error' }, 500, corsHeaders);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleContact(request, env, data, corsHeaders) {
  const ip = request.headers.get('cf-connecting-ip') || null;

  // 蜜罐：有填即回假成功（不落庫、不通知）
  if (data.hp) {
    return json({ ok: true }, 200, corsHeaders);
  }

  // reCAPTCHA：僅在設定 secret 時強制
  if (env.RECAPTCHA_SECRET_KEY) {
    if (!data.recaptchaToken) {
      return json({ ok: false, error: 'recaptcha_required' }, 403, corsHeaders);
    }
    const vr = await verifyRecaptcha(env, data.recaptchaToken, ip);
    if (!vr.ok || vr.score < RECAPTCHA_MIN_SCORE) {
      return json({ ok: false, error: 'recaptcha_failed' }, 403, corsHeaders);
    }
  }

  // 每 IP 每小時配額（schema 缺欄位時降級為不限制）
  const cap = parseInt(env.IP_HOURLY_CAP, 10) || 5;
  if (ip) {
    try {
      const q = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM contact_inquiries
         WHERE ip = ? AND created_at > datetime('now', '-1 hour')`
      )
        .bind(ip)
        .first();
      if (q && q.n >= cap) {
        return json({ ok: false, error: 'rate_limited' }, 429, corsHeaders);
      }
    } catch (_) {
      /* 無 created_at 欄位 → 降級跳過 */
    }
  }

  const binds = [
    data.company || null,
    data.contact_name || null,
    data.email || null,
    data.phone || null,
    data.participants ? parseInt(data.participants) || null : null,
    data.activity_type || null,
    data.preferred_date || null,
    data.message || null,
    ip,
  ];

  // 落庫：優先含 site 欄位；欄位未建時向後相容降級
  let res;
  let siteTracked = true;
  try {
    res = await env.DB.prepare(
      `INSERT INTO contact_inquiries
       (company, contact_name, email, phone, participants, activity_type, preferred_date, message, ip, status, site)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
    )
      .bind(...binds, data.site || 'ftg')
      .run();
  } catch (e) {
    // D1: "has no column named site"；本地 SQLite: "no such column: site"
    if (/no such column|has no column named/i.test(String(e && e.message))) {
      siteTracked = false;
      res = await env.DB.prepare(
        `INSERT INTO contact_inquiries
         (company, contact_name, email, phone, participants, activity_type, preferred_date, message, ip, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
      )
        .bind(...binds)
        .run();
    } else {
      throw e;
    }
  }

  // 通知：Resend 未設定或寄送失敗一律不影響受理
  if (env.RESEND_API_KEY && env.LEAD_NOTIFY_TO) {
    try {
      const site = data.site || 'ftg';
      const jobs = [
        sendResend(env, {
          to: env.LEAD_NOTIFY_TO,
          subject: `[lead-api:${site}] 新洽詢：${data.company || data.contact_name || '未具名'}`,
          html:
            `<h2>新商務洽詢（${esc(site)}）</h2><ul>` +
            `<li>身份：${esc(data.activity_type)}</li>` +
            `<li>姓名：${esc(data.contact_name)}</li>` +
            `<li>組織：${esc(data.company)}</li>` +
            `<li>Email：${esc(data.email)}</li>` +
            `<li>電話：${esc(data.phone)}</li>` +
            `<li>人數：${esc(data.participants)}</li>` +
            `<li>期望日期：${esc(data.preferred_date)}</li>` +
            `<li>IP：${esc(ip)}</li></ul>` +
            `<p>${esc(data.message).replace(/\n/g, '<br>')}</p>`,
          replyTo: data.email || undefined,
        }),
      ];
      if (data.email) {
        jobs.push(
          sendResend(env, {
            to: data.email,
            subject: '已收到您的洽詢（高科生技）',
            html: `<p>${esc(data.contact_name || '您好')}：</p><p>感謝您的洽詢，我們已收到您的資料，將於 24 小時內與您聯繫。</p><p>— 高科生技商務團隊</p>`,
          })
        );
      }
      await Promise.allSettled(jobs);
    } catch (_) {
      /* 通知失敗不影響受理 */
    }
  }

  return json({ ok: true, id: res.meta.last_row_id, site_tracked: siteTracked }, 200, corsHeaders);
}
