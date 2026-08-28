import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { DatabaseSync } from 'node:sqlite';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ftg-journey.db');
const JWT_SECRET = process.env.JWT_SECRET || 'ftg-journey-secret-key-change-in-production';
// 上傳檔案存放根目錄（Linux 部署路徑，可用環境變數覆寫）
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/ftg-journey-web/uploads/';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 上傳圖片大小上限：5MB

// ===== 角色對應 =====
function resolveRole(email) {
  if (!email) return 'member';
  const adminList = (process.env.ADMIN_EMAILS || 'dingjunhong1028@gmail.com').split(',').map(s => s.trim());
  const staffDomains = (process.env.STAFF_DOMAINS || '@esggo.co,@ftg.com.tw').split(',').map(s => s.trim());
  if (adminList.includes(email)) return 'admin';
  if (staffDomains.some(d => email.endsWith(d))) return 'staff';
  return 'member';
}

// ===== DB 初始化 =====
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
// 確保上傳目錄存在（純 Node.js，不依賴外部套件）
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY, name TEXT, picture TEXT, role TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS journeys (
    id TEXT PRIMARY KEY, owner_email TEXT, title TEXT, service_type TEXT,
    destination TEXT, start_date TEXT, end_date TEXT, purpose TEXT, stage TEXT DEFAULT 'planning', created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS journeys_members (
    journey_id TEXT, email TEXT, role TEXT, consent_public INTEGER DEFAULT 0,
    PRIMARY KEY (journey_id, email)
  );
  CREATE TABLE IF NOT EXISTS prep_items (
    id TEXT PRIMARY KEY, journey_id TEXT, category TEXT, text TEXT, done INTEGER DEFAULT 0, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY, journey_id TEXT, title TEXT, date TEXT, time TEXT, location TEXT, alarm INTEGER DEFAULT 0, note TEXT
  );
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY, journey_id TEXT, date TEXT, mood TEXT, text TEXT, photo TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS impact (
    id TEXT PRIMARY KEY, journey_id TEXT, metric_id TEXT, value REAL, note TEXT
  );
`);

const get = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);

// ===== 權限檢查輔助函式 =====

// 判斷指定使用者是否為旅程擁有者
function isJourneyOwner(journeyId, email) {
  const row = get('SELECT id FROM journeys WHERE id=? AND owner_email=?', journeyId, email);
  return !!row;
}

// 判斷指定使用者是否有權限存取旅程（擁有者或已被邀請的成員皆可）
function hasJourneyAccess(journeyId, email) {
  if (isJourneyOwner(journeyId, email)) return true;
  const row = get('SELECT journey_id FROM journeys_members WHERE journey_id=? AND email=?', journeyId, email);
  return !!row;
}

// 若非擁有者則回傳 403（用於修改/刪除等寫入操作前檢查）
function requireOwner(journeyId, email, res) {
  if (!isJourneyOwner(journeyId, email)) {
    res.status(403).json({ error: 'forbidden' });
    return false;
  }
  return true;
}

// 若無存取權限則回傳 403（用於查看操作前檢查）
function requireAccess(journeyId, email, res) {
  if (!hasJourneyAccess(journeyId, email)) {
    res.status(403).json({ error: 'forbidden' });
    return false;
  }
  return true;
}

// ===== Google 驗證 =====
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Simple JWT (HMAC SHA-256)
function simpleSign(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
  return header + '.' + body + '.' + sig;
}

// 正常的 Token 驗證中介層：過期即視為無效
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
  try {
    const parts = auth.slice(7).split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return res.status(401).json({ error: 'expired' });
    req.user = { email: payload.email, name: payload.name, picture: payload.picture };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// 解析並驗證 JWT 簽章（不檢查是否過期），供刷新端點使用
function decodeTokenUnsafe(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // 重新計算簽章並比對，防止偽造
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(parts[0] + '.' + parts[1]).digest('base64url');
    if (parts[2] !== expectedSig) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch {
    return null;
  }
}

const app = express();
app.use(cors());
// 提高 JSON 解析上限至 10MB，以便容納 5MB 圖片經 base64 編碼後（約 6.7MB）的請求主體
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ===== Google Auth Token Exchange =====
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'no credential' });
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    const role = resolveRole(email);
    const token = simpleSign({ email, name: payload.name, picture: payload.picture, role });
    run('INSERT INTO users (email,name,picture,role,created_at) VALUES (?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name, picture=excluded.picture',
      email, payload.name, payload.picture, role, Date.now());
    res.json({ token, user: { email, name: payload.name, picture: payload.picture, role } });
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
});

// ===== API Routes =====
app.get('/api/me', verifyToken, (req, res) => {
  res.json(get('SELECT email,name,picture,role FROM users WHERE email=?', req.user.email));
});

// 取得旅程列表：擁有者本人 + 被邀請為成員的旅程
app.get('/api/journeys', verifyToken, (req, res) => {
  res.json(all(`
    SELECT j.* FROM journeys j
    LEFT JOIN journeys_members m ON m.journey_id = j.id
    WHERE j.owner_email = ? OR m.email = ?
    ORDER BY j.created_at DESC
  `, req.user.email, req.user.email));
});

app.post('/api/journeys', verifyToken, (req, res) => {
  const id = uid();
  const { title, service_type, destination, start_date, end_date, purpose } = req.body;
  run('INSERT INTO journeys (id,owner_email,title,service_type,destination,start_date,end_date,purpose,stage,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    id, req.user.email, title, service_type, destination, start_date, end_date, purpose, 'planning', Date.now());
  res.json({ id });
});

app.put('/api/journeys/:id', verifyToken, (req, res) => {
  // 僅擁有者可修改旅程
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const f = Object.keys(req.body).map(k => `${k}=?`).join(',');
  run(`UPDATE journeys SET ${f} WHERE id=? AND owner_email=?`, ...Object.values(req.body), req.params.id, req.user.email);
  res.json({ ok: true });
});

app.delete('/api/journeys/:id', verifyToken, (req, res) => {
  // 僅擁有者可刪除旅程
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  run('DELETE FROM journeys WHERE id=? AND owner_email=?', req.params.id, req.user.email);
  res.json({ ok: true });
});

// ===== JWT 刷新 API =====
// 即使 Token 已過期，只要在 7 天寬限期內仍可換發新 Token
app.post('/api/refresh', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
  const token = auth.slice(7);
  const payload = decodeTokenUnsafe(token);
  if (!payload) return res.status(401).json({ error: 'invalid token' });
  const now = Date.now() / 1000;
  // exp 過期後仍允許 7 天內刷新；超過則拒絕
  if (payload.exp && now > payload.exp + 7 * 24 * 3600) {
    return res.status(401).json({ error: 'token too old' });
  }
  // 保留原始 email / name / picture / role 換發新 Token
  const newToken = simpleSign({ email: payload.email, name: payload.name, picture: payload.picture, role: payload.role });
  res.json({ token: newToken });
});

// ===== 檔案上傳 API（純 Node.js，不使用 multipart 套件）=====
// 接收 base64 圖片資料，解碼後寫入上傳目錄，回傳可存取網址
app.post('/api/upload', verifyToken, (req, res) => {
  const { data, filename } = req.body || {};
  if (!data) return res.status(400).json({ error: 'no data' });

  // 解析 base64，支援 data URI（data:image/png;base64,xxxx）或直接 base64 字串
  let base64 = data;
  let ext = 'jpg';
  const mimeMatch = /^data:image\/(\w+);base64,(.*)$/.exec(data);
  if (mimeMatch) {
    ext = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
    base64 = mimeMatch[2];
  } else if (filename && /\.(\w+)$/.test(filename)) {
    ext = filename.split('.').pop().toLowerCase();
  }

  let buf;
  try {
    buf = Buffer.from(base64, 'base64');
  } catch {
    return res.status(400).json({ error: 'invalid base64' });
  }
  // 限制 5MB
  if (buf.length === 0) return res.status(400).json({ error: 'empty file' });
  if (buf.length > MAX_UPLOAD_BYTES) return res.status(413).json({ error: 'file too large' });

  const name = uid() + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.json({ url: '/uploads/' + name });
});

// ===== 成員管理 API =====

// 取得成員列表（擁有者與具存取權限的成員皆可查看）
app.get('/api/journeys/:id/members', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  res.json(all('SELECT email, role, consent_public, created_at FROM journeys_members WHERE journey_id=?', req.params.id));
});

// 邀請成員（僅擁有者可邀請）
app.post('/api/journeys/:id/members', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const { email, role, consent_public } = req.body;
  if (!email) return res.status(400).json({ error: 'no email' });
  // 邀請時若旅程尚未有擁有者紀錄，確保資料一致性由呼叫端保證
  run(`INSERT INTO journeys_members (journey_id,email,role,consent_public) VALUES (?,?,?,?)
      ON CONFLICT(journey_id,email) DO UPDATE SET role=excluded.role, consent_public=excluded.consent_public`,
    req.params.id, email, role || 'member', consent_public ? 1 : 0);
  res.json({ ok: true });
});

// 更新成員角色 / consent（僅擁有者可修改）
app.put('/api/journeys/:id/members/:email', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const f = Object.keys(req.body).map(k => `${k}=?`).join(',');
  run(`UPDATE journeys_members SET ${f} WHERE journey_id=? AND email=?`, ...Object.values(req.body), req.params.id, req.params.email);
  res.json({ ok: true });
});

// 移除成員（僅擁有者可移除）
app.delete('/api/journeys/:id/members/:email', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  run('DELETE FROM journeys_members WHERE journey_id=? AND email=?', req.params.id, req.params.email);
  res.json({ ok: true });
});

// ===== 旅程子資源 API（套用權限檢查）=====

// 準備事項
app.get('/api/journeys/:id/prep', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  res.json(all('SELECT * FROM prep_items WHERE journey_id=?', req.params.id));
});
app.post('/api/journeys/:id/prep', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const id = uid();
  run('INSERT INTO prep_items (id,journey_id,category,text,done,created_at) VALUES (?,?,?,?,?,?)',
    id, req.params.id, req.body.category, req.body.text, req.body.done ? 1 : 0, Date.now());
  res.json({ id });
});

// 行程
app.get('/api/journeys/:id/schedule', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  res.json(all('SELECT * FROM schedule WHERE journey_id=?', req.params.id));
});
app.post('/api/journeys/:id/schedule', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const id = uid();
  const { title, date, time, location, alarm, note } = req.body;
  run('INSERT INTO schedule (id,journey_id,title,date,time,location,alarm,note) VALUES (?,?,?,?,?,?,?,?)',
    id, req.params.id, title, date, time, location, alarm ? 1 : 0, note);
  res.json({ id });
});

// 筆記
app.get('/api/journeys/:id/notes', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  res.json(all('SELECT * FROM notes WHERE journey_id=? ORDER BY created_at DESC', req.params.id));
});
app.post('/api/journeys/:id/notes', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const id = uid();
  run('INSERT INTO notes (id,journey_id,date,mood,text,photo,created_at) VALUES (?,?,?,?,?,?,?)',
    id, req.params.id, req.body.date, req.body.mood, req.body.text, req.body.photo, Date.now());
  res.json({ id });
});

// 影響指標
app.get('/api/journeys/:id/impact', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  res.json(all('SELECT * FROM impact WHERE journey_id=?', req.params.id));
});
app.post('/api/journeys/:id/impact', verifyToken, (req, res) => {
  if (!requireOwner(req.params.id, req.user.email, res)) return;
  const id = uid();
  run('INSERT INTO impact (id,journey_id,metric_id,value,note) VALUES (?,?,?,?,?)',
    id, req.params.id, req.body.metric_id, req.body.value, req.body.note);
  res.json({ id });
});

app.listen(PORT, () => console.log(`FTG Journey server on :${PORT}`));
