/**
 * ==========================================
 * 完全代主自行 - 委派告警外部通知 sink
 * （監控→告警→處置 閉環）
 * ==========================================
 *
 * 將指標觀測器評估出的告警轉發至外部接收端，完成
 * 「監控 → 告警 → 處置」最後一哩。對齊平臺不變量：
 * - 全量：告警已在觀測器內全量留存；通知失敗不影響留存（catch 吞掉）。
 * - 雙向同步：與 SSE 即時幀同源（觀測器同時發布 delegation.alert.raised 事件），
 *   外部通知與 RWD 畫面一致。
 * - 全域：webhook 與郵件共用同一 `AlertNotifier` 介面，可由 `createCompositeNotifier`
 *   扇出至多個 sink（對齊「全域」不變量，無孤島）。
 *
 * 預設停用（no-op）：未設定對應環境變數時不發送；測試環境（NODE_ENV==='test'）
 * 一律停用，避免觸網。
 */

import type { DelegationAlert } from './metrics';

/** 通知器介面（所有 sink 共用） */
export interface AlertNotifier {
  /** 是否啟用（未啟用時 notify 為 no-op） */
  readonly enabled: boolean;
  /** 傳送一筆告警至外部接收端（非同步、失敗不拋） */
  notify(alert: DelegationAlert): Promise<void>;
}

// ----------------------------------------------------------
// webhook sink
// ----------------------------------------------------------

/** webhook 通知器組態 */
export interface AlertNotifierConfig {
  /** webhook 端點；未設定則停用 */
  webhookUrl?: string;
  /** 是否啟用；預設：有 webhookUrl 且非測試環境才啟用 */
  enabled?: boolean;
  /** 注入 fetch（便於測試） */
  fetchImpl?: typeof fetch;
  /** 注入 now（便於測試） */
  now?: () => number;
}

/**
 * 建立 webhook 通知器：以 POST + JSON 傳送告警至外部端點。
 */
export function createAlertNotifier(config: AlertNotifierConfig = {}): AlertNotifier {
  const webhookUrl = config.webhookUrl ?? process.env.DELEGATION_ALERT_WEBHOOK_URL;
  const enabled =
    config.enabled ?? (!!webhookUrl && process.env.NODE_ENV !== 'test');
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  const now = config.now ?? (() => Date.now());

  return {
    enabled: Boolean(enabled),
    async notify(alert: DelegationAlert): Promise<void> {
      if (!enabled || !webhookUrl) return;
      const payload = {
        schema: 'delegation-alert/v1',
        id: alert.id,
        level: alert.level,
        type: alert.type,
        delegationId: alert.delegationId,
        ts: alert.ts,
        message: alert.message,
        sentAt: now(),
      };
      try {
        await fetchImpl(webhookUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // 通知失敗不影響觀測/告警留存（對齊「全量」）
      }
    },
  };
}

// ----------------------------------------------------------
// email sink（經郵件閘道 webhook，免外部相依）
// ----------------------------------------------------------

/** 郵件通知器組態（指向郵件服務商 API，如 SendGrid / Resend / Mailgun） */
export interface EmailNotifierConfig {
  /** 郵件閘道 webhook 端點；未設定則停用 */
  webhookUrl: string;
  /** 收件人（預設取 DELEGATION_ALERT_EMAIL_TO） */
  to?: string;
  /** 寄件人（預設取 DELEGATION_ALERT_EMAIL_FROM） */
  from?: string;
  /** 主旨前綴 */
  subjectPrefix?: string;
  /** 是否啟用；預設：有 webhookUrl 且非測試環境才啟用 */
  enabled?: boolean;
  /** 注入 fetch（便於測試） */
  fetchImpl?: typeof fetch;
  /** 注入 now（便於測試） */
  now?: () => number;
}

/**
 * 建立郵件通知器：將告警格式化為郵件，POST 至郵件閘道 webhook。
 * 不引入 SMTP 相依，交由郵件服務商 API 投遞（對齊「全域」：與 webhook 共用傳輸）。
 */
export function createEmailNotifier(config: EmailNotifierConfig): AlertNotifier {
  const enabled =
    config.enabled ?? (!!config.webhookUrl && process.env.NODE_ENV !== 'test');
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  const now = config.now ?? (() => Date.now());

  return {
    enabled: Boolean(enabled),
    async notify(alert: DelegationAlert): Promise<void> {
      if (!enabled || !config.webhookUrl) return;
      const subject = `${config.subjectPrefix ?? '[委派告警]'} ${alert.level.toUpperCase()} · ${alert.type}`;
      const text =
        `委派 ${alert.delegationId} 觸發告警\n` +
        `等級: ${alert.level}\n` +
        `類型: ${alert.type}\n` +
        `時間: ${new Date(alert.ts).toISOString()}\n` +
        `訊息: ${alert.message}`;
      const payload = {
        schema: 'delegation-alert-email/v1',
        to: config.to ?? process.env.DELEGATION_ALERT_EMAIL_TO,
        from: config.from ?? process.env.DELEGATION_ALERT_EMAIL_FROM,
        subject,
        text,
        alert,
        sentAt: now(),
      };
      try {
        await fetchImpl(config.webhookUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // 通知失敗不影響觀測/告警留存（對齊「全量」）
      }
    },
  };
}

// ----------------------------------------------------------
// composite（扇出至多 sink）
// ----------------------------------------------------------

/**
 * 複合通知器：將告警扇出至多個 sink（僅啟用的會被呼叫；單一 sink 失敗不影響其他）。
 */
export function createCompositeNotifier(notifiers: AlertNotifier[]): AlertNotifier {
  const active = notifiers.filter((n) => n.enabled);
  return {
    enabled: active.length > 0,
    async notify(alert: DelegationAlert): Promise<void> {
      await Promise.all(active.map((n) => n.notify(alert).catch(() => {})));
    },
  };
}

/**
 * 依環境變數組出預設通知器：
 * - `DELEGATION_ALERT_WEBHOOK_URL` → webhook sink
 * - `DELEGATION_ALERT_EMAIL_WEBHOOK_URL` → 郵件 sink（另可設 TO/FROM）
 * 兩者皆未設定（或測試環境）時回傳停用中的 webhook notifier（no-op）。
 */
export function getDefaultAlertNotifier(): AlertNotifier {
  const parts: AlertNotifier[] = [];
  const webhook = createAlertNotifier();
  if (webhook.enabled) parts.push(webhook);
  const email = createEmailNotifier({
    webhookUrl: process.env.DELEGATION_ALERT_EMAIL_WEBHOOK_URL ?? '',
  });
  if (email.enabled) parts.push(email);
  return parts.length > 0 ? createCompositeNotifier(parts) : createAlertNotifier({ enabled: false });
}
