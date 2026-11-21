// Telegram Notifier — 發送修復通知到 Telegram
// 使用 Bot API，無需 OAuth

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

/**
 * 發送 Telegram 訊息
 */
export async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set' };
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!resp.ok) {
    return { ok: false, error: `HTTP ${resp.status}` };
  }

  const data = await resp.json();
  return data;
}

/**
 * 發送修復完成通知
 */
export async function notifyTelegramFixComplete(record) {
  const text = `
<b>🛠 Self-Healing Engine 修復完成</b>

<b>UUID:</b> <code>${record.uuid}</code>
<b>狀態:</b> ${record.governance.trackable.lifecycle_stage}
<b>迭代次數:</b> ${record.governance.trackable.attempt_count}
<b>來源:</b> ${record.governance.traceable.source_origin}

<b>Hash Lock:</b> <code>${record.governance.trustworthy.hash_lock?.slice(0, 16) || 'N/A'}...</code>

<i>${new Date(record.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</i>
`.trim();

  return sendTelegramMessage(text);
}

/**
 * 發送修復失敗通知
 */
export async function notifyTelegramFixFailed(record, error) {
  const text = `
<b>❌ Self-Healing Engine 修復失敗</b>

<b>UUID:</b> <code>${record.uuid}</code>
<b>錯誤:</b> ${error?.message || 'Unknown error'}
<b>迭代次數:</b> ${record.governance.trackable.attempt_count}

<i>${new Date(record.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</i>
`.trim();

  return sendTelegramMessage(text);
}
