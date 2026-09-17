// Gmail Polling Worker — 輪詢 Gmail 收件箱捕捉 GitHub 錯誤通知
// 雙模式：IMAP 輪詢（預設每 60 秒）或 Gmail Pub/Sub 推送
// 5T 治理：所有信件解析結果皆透過 Webhook 送往 Self-Healing Engine

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGINE_URL = process.env.ENGINE_URL || 'http://127.0.0.1:8790';
const POLL_INTERVAL_MS = Number(process.env.GMAIL_POLL_INTERVAL_MS || 60000);
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const GMAIL_QUERY = process.env.GMAIL_QUERY || 'from:notifications@github.com subject:(failed OR error OR failure)';

// 狀態檔：記錄已處理的 Message-ID 避免重複
const STATE_FILE = resolve(__dirname, '.gmail-poller-state.json');
let processedIds = new Set();

async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    const state = JSON.parse(data);
    processedIds = new Set(state.processedIds || []);
  } catch {
    processedIds = new Set();
  }
}

async function saveState() {
  await fs.writeFile(STATE_FILE, JSON.stringify({
    processedIds: [...processedIds].slice(-500),  // 保留最近 500 筆
    lastRun: Date.now(),
  }), 'utf-8');
}

/**
 * 使用 imap-fetch 或內建 IMAP 輪詢 Gmail
 * 這裡使用 Node 原生 imap 協簡化版本（實際部署建議用 google-gmail-api）
 */
async function pollGmailIMAP() {
  // 使用 Python imaplib 作為 fallback（更穩定）
  // 或呼叫 Gmail API via OAuth2
  const script = `
import imaplib
import email
import json
import sys
import os

try:
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login(os.environ['GMAIL_USER'], os.environ['GMAIL_APP_PASSWORD'])
    mail.select('inbox')
    
    # 搜尋 GitHub 失敗通知
    search_criteria = '(FROM "notifications@github.com" SUBJECT "failed" UNSEEN)'
    _, message_numbers = mail.search(None, search_criteria)
    
    results = []
    for num in message_numbers[0].split():
        _, msg_data = mail.fetch(num, '(RFC822)')
        email_body = msg_data[0][1]
        msg = email.message_from_bytes(email_body)
        
        subject = msg['Subject'] or ''
        from_addr = msg['From'] or ''
        message_id = msg['Message-ID'] or ''
        
        # 只取信件內文前 2000 字
        body = ''
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    body = part.get_payload(decode=True).decode('utf-8', errors='replace')[:2000]
                    break
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='replace')[:2000]
        
        results.append({
            'messageId': message_id,
            'subject': subject,
            'from': from_addr,
            'body': body,
            'isWorkflowFailure': 'failed' in subject.lower() or 'error' in subject.lower()
        })
    
    mail.logout()
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;

  try {
    const result = execSync(`python3 -c "${script.replace(/"/g, '\\"')}"`, {
      env: { ...process.env, GMAIL_USER, GMAIL_APP_PASSWORD },
      timeout: 30000,
      encoding: 'utf-8',
    });
    return JSON.parse(result);
  } catch (e) {
    return [{ error: e.message }];
  }
}

/**
 * 使用 Gmail API（OAuth2）— 推薦的正式方案
 */
async function pollGmailAPI() {
  // 需要 GMAIL_OAUTH_TOKEN 或 service account
  // 這裡提供接口，實作可擴充
  const token = process.env.GMAIL_OAUTH_TOKEN;
  if (!token) return [{ error: 'GMAIL_OAUTH_TOKEN not set' }];

  try {
    const resp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(GMAIL_QUERY)}&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) return [{ error: `Gmail API ${resp.status}` }];

    const data = await resp.json();
    const messages = data.messages || [];

    const results = [];
    for (const msg of messages.slice(0, 5)) {
      const detail = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!detail.ok) continue;
      const msgData = await detail.json();

      const headers = msgData.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const messageId = headers.find(h => h.name === 'Message-ID')?.value || msg.id;

      results.push({
        messageId,
        subject,
        from,
        body: msgData.snippet || '',
        isWorkflowFailure: subject.toLowerCase().includes('failed') || subject.toLowerCase().includes('error'),
      });
    }
    return results;
  } catch (e) {
    return [{ error: e.message }];
  }
}

/**
 * 將信件送往 Self-Healing Engine
 */
async function forwardToEngine(emailData) {
  try {
    const resp = await fetch(`${ENGINE_URL}/webhook/gmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailContent: Buffer.from(
          `Subject: ${emailData.subject}\nFrom: ${emailData.from}\nMessage-ID: ${emailData.messageId}\n\n${emailData.body}`
        ).toString('base64'),
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * 主輪詢迴圈
 */
async function runPollingLoop() {
  console.log(`[Gmail Poller] 啟動輪詢（間隔 ${POLL_INTERVAL_MS / 1000}s）`);
  console.log(`[Gmail Poller] 引擎: ${ENGINE_URL}`);
  console.log(`[Gmail Poller] 查詢: ${GMAIL_QUERY}`);

  await loadState();

  while (true) {
    try {
      // 優先使用 Gmail API，fallback 到 IMAP
      const emails = process.env.GMAIL_OAUTH_TOKEN
        ? await pollGmailAPI()
        : await pollGmailIMAP();

      for (const email of emails) {
        if (email.error) {
          console.error(`[Gmail Poller] 錯誤: ${email.error}`);
          continue;
        }

        if (!email.isWorkflowFailure) continue;
        if (processedIds.has(email.messageId)) continue;

        console.log(`[Gmail Poller] 偵測到失敗通知: ${email.subject}`);
        const forwarded = await forwardToEngine(email);

        if (forwarded) {
          processedIds.add(email.messageId);
          console.log(`[Gmail Poller] 已轉往 Engine（Message-ID: ${email.messageId}）`);
        }
      }

      await saveState();
    } catch (e) {
      console.error(`[Gmail Poller] 輪詢例外:`, e.message);
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// 啟動
if (import.meta.url === `file://${process.argv[1]}`) {
  runPollingLoop().catch(console.error);
}

export { pollGmailIMAP, pollGmailAPI, runPollingLoop };
