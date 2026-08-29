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
  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY, journey_id TEXT, email TEXT, name TEXT,
    latitude REAL, longitude REAL, note TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS esg_task_logs (
    id TEXT PRIMARY KEY, journey_id TEXT, task_id TEXT, email TEXT,
    data TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY, name TEXT, icon TEXT, description TEXT,
    category TEXT, requirement TEXT, threshold INTEGER, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY, email TEXT, badge_id TEXT, journey_id TEXT,
    earned_at INTEGER, UNIQUE(email, badge_id)
  );
  CREATE TABLE IF NOT EXISTS executive_tools (
    id TEXT PRIMARY KEY, journey_id TEXT, tool_type TEXT,
    data TEXT, created_at INTEGER, updated_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS wellbeing_diagnosis (
    id TEXT PRIMARY KEY, journey_id TEXT, email TEXT, data TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS follow_up_entries (
    id TEXT PRIMARY KEY, journey_id TEXT, email TEXT, day INTEGER, mood TEXT, energy INTEGER, note TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS family_tasks (
    id TEXT PRIMARY KEY, journey_id TEXT, email TEXT, data TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS family_observations (
    id TEXT PRIMARY KEY, journey_id TEXT, email TEXT, data TEXT, created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY, journey_id TEXT, email TEXT, url TEXT, created_at INTEGER
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

// ===== 健康檢查 =====
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ftg-journey-server', timestamp: Date.now() });
});

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

// ===== 現場簽到 =====

// 簽到（成員以上權限）
app.post('/api/journeys/:id/checkin', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const id = uid();
  const { latitude, longitude, note } = req.body;
  run('INSERT INTO checkins (id,journey_id,email,name,latitude,note,created_at) VALUES (?,?,?,?,?,?,?)',
    id, req.params.id, req.user.email, req.user.name || req.user.email, latitude || null, note || '', Date.now());
  
  // 檢查授勳
  const newBadges = checkAndAwardBadges(req.user.email, req.params.id);
  
  res.json({ id, message: '簽到成功', newBadges });
});

// 查看簽到記錄（成員以上權限）
app.get('/api/journeys/:id/checkins', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  res.json(all('SELECT * FROM checkins WHERE journey_id=? ORDER BY created_at DESC', req.params.id));
});

// ===== ESG 任務 =====

// 永續標誌定義
const BADGES = [
  { id: 'first_cleanup', name: '清淨先鋒', icon: '🧹', description: '首次完成 Clean-up Walk，為環境盡一份力', category: 'cleanup', requirement: '完成首次垃圾撿拾', threshold: 1 },
  { id: 'cleanup_10', name: '拾荒達人', icon: '🗑️', description: '累積撿拾 10 件垃圾', category: 'cleanup', requirement: '累積撿拾 10 件垃圾', threshold: 10 },
  { id: 'cleanup_50', name: '無痕守護者', icon: '🏔️', description: '累積撿拾 50 件垃圾，山林因你而純淨', category: 'cleanup', requirement: '累積撿拾 50 件垃圾', threshold: 50 },
  { id: 'first_carbon', name: '碳跡行者', icon: '👣', description: '首次記錄碳足跡，意識自身的環境影響', category: 'carbon', requirement: '首次記錄碳足跡', threshold: 1 },
  { id: 'carbon_100', name: '低碳領航員', icon: '🌱', description: '累積記錄 100 km 低碳交通', category: 'carbon', requirement: '累積 100 km 低碳交通', threshold: 100 },
  { id: 'first_bio', name: '生態之眼', icon: '👁️', description: '首次觀察並記錄生態物種', category: 'biodiversity', requirement: '首次記錄生態觀察', threshold: 1 },
  { id: 'bio_10', name: '博物學者', icon: '🦋', description: '累積觀察 10 種不同物種', category: 'biodiversity', requirement: '累積觀察 10 種物種', threshold: 10 },
  { id: 'first_local', name: '地方支持者', icon: '🏪', description: '首次記錄地方消費，支持在地經濟', category: 'local', requirement: '首次記錄地方消費', threshold: 1 },
  { id: 'local_500', name: '共益推手', icon: '🤝', description: '累積在地消費 500 元', category: 'local', requirement: '累積在地消費 500 元', threshold: 500 },
  { id: 'first_water', name: '水源守護者', icon: '💧', description: '首次記錄用水節約', category: 'water', requirement: '首次記錄用水節約', threshold: 1 },
  { id: 'water_100', name: '節水達人', icon: '🚿', description: '累積節約 100 公升水資源', category: 'water', requirement: '累積節約 100L 水', threshold: 100 },
  { id: 'first_waste', name: '減廢先鋒', icon: '♻️', description: '首次記錄一次性廢棄物減量', category: 'waste', requirement: '首次記錄廢棄物減量', threshold: 1 },
  { id: 'waste_20', name: '零廢生活家', icon: '🌿', description: '累積減少 20 件一次性用品', category: 'waste', requirement: '累積減少 20 件一次性用品', threshold: 20 },
  { id: 'first_checkin', name: '旅程起點', icon: '📍', description: '完成首次現場簽到', category: 'checkin', requirement: '首次簽到', threshold: 1 },
  { id: 'first_note', name: '心聲傳遞者', icon: '📝', description: '留下第一則旅程筆記', category: 'note', requirement: '首次撰寫筆記', threshold: 1 },
];

// 初始化徽章資料
function initBadges() {
  const existing = all('SELECT id FROM badges');
  if (existing.length === 0) {
    BADGES.forEach(b => {
      run('INSERT OR IGNORE INTO badges (id,name,icon,description,category,requirement,threshold,created_at) VALUES (?,?,?,?,?,?,?,?)',
        b.id, b.name, b.icon, b.description, b.category, b.requirement, b.threshold, Date.now());
    });
  }
}
initBadges();

// 檢查並授勳
function checkAndAwardBadges(email, journeyId) {
  const newlyEarned = [];
  
  // 計算各類型統計
  const esgStats = {};
  const logs = all('SELECT * FROM esg_task_logs WHERE email=?', email);
  logs.forEach(log => {
    const data = JSON.parse(log.data || '{}');
    if (!esgStats[log.task_id]) esgStats[log.task_id] = 0;
    if (data.count) esgStats[log.task_id] += Number(data.count);
    if (data.distance) esgStats[log.task_id] += Number(data.distance);
    if (data.amount) esgStats[log.task_id] += Number(data.amount);
    if (data.saved) esgStats[log.task_id] += Number(data.saved);
  });
  
  // 檢查各任務類型首次完成
  BADGES.forEach(badge => {
    const existing = get('SELECT id FROM user_badges WHERE email=? AND badge_id=?', email, badge.id);
    if (existing) return;
    
    let earned = false;
    
    if (badge.category === 'cleanup' && badge.id === 'first_cleanup') {
      earned = esgStats.cleanup >= 1;
    } else if (badge.category === 'cleanup' && badge.id === 'cleanup_10') {
      earned = esgStats.cleanup >= 10;
    } else if (badge.category === 'cleanup' && badge.id === 'cleanup_50') {
      earned = esgStats.cleanup >= 50;
    } else if (badge.category === 'carbon' && badge.id === 'first_carbon') {
      earned = esgStats.carbon >= 1;
    } else if (badge.category === 'carbon' && badge.id === 'carbon_100') {
      const carbonLogs = all('SELECT * FROM esg_task_logs WHERE email=? AND task_id=?', email, 'carbon');
      let totalDist = 0;
      carbonLogs.forEach(l => { totalDist += Number(JSON.parse(l.data || '{}').distance) || 0; });
      earned = totalDist >= 100;
    } else if (badge.category === 'biodiversity' && badge.id === 'first_bio') {
      earned = esgStats.biodiversity >= 1;
    } else if (badge.category === 'biodiversity' && badge.id === 'bio_10') {
      earned = esgStats.biodiversity >= 10;
    } else if (badge.category === 'local' && badge.id === 'first_local') {
      earned = esgStats.local >= 1;
    } else if (badge.category === 'local' && badge.id === 'local_500') {
      earned = esgStats.local >= 500;
    } else if (badge.category === 'water' && badge.id === 'first_water') {
      earned = esgStats.water >= 1;
    } else if (badge.category === 'water' && badge.id === 'water_100') {
      earned = esgStats.water >= 100;
    } else if (badge.category === 'waste' && badge.id === 'first_waste') {
      earned = esgStats.waste >= 1;
    } else if (badge.category === 'waste' && badge.id === 'waste_20') {
      earned = esgStats.waste >= 20;
    } else if (badge.category === 'checkin') {
      const checkinCount = get('SELECT COUNT(*) as c FROM checkins WHERE email=?', email);
      earned = checkinCount.c >= badge.threshold;
    } else if (badge.category === 'note') {
      const noteCount = get('SELECT COUNT(*) as c FROM notes WHERE email=?', email);
      earned = noteCount.c >= badge.threshold;
    }
    
    if (earned) {
      run('INSERT OR IGNORE INTO user_badges (email,badge_id,journey_id,earned_at) VALUES (?,?,?,?)',
        email, badge.id, journeyId, Date.now());
      newlyEarned.push(badge);
    }
  });
  
  return newlyEarned;
}

// 取得 ESG 任務列表 + 紀錄 + 統計
app.get('/api/journeys/:id/esg-tasks', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const logs = all('SELECT * FROM esg_task_logs WHERE journey_id=? ORDER BY created_at DESC', req.params.id);
  
  // 計算各任務統計
  const totals = {};
  logs.forEach(log => {
    const data = JSON.parse(log.data || '{}');
    if (log.task_id === 'cleanup' && data.count) {
      totals.cleanup = (totals.cleanup || 0) + Number(data.count);
    }
    if (log.task_id === 'carbon' && data.distance) {
      // 簡易碳足跡計算：距離 * 排放係數
      const mode = data.mode || '汽車';
      const factors = { '步行': 0, '腳踏車': 0, '公車/捷運': 0.05, '火車': 0.04, '汽車': 0.17, '飛機': 0.25 };
      const factor = factors[mode] || 0.17;
      const passengers = Number(data.passengers) || 1;
      totals.carbon = (totals.carbon || 0) + Number(data.distance) * factor / passengers;
    }
    if (log.task_id === 'biodiversity' && data.count) {
      totals.biodiversity = (totals.biodiversity || 0) + Number(data.count);
    }
    if (log.task_id === 'local' && data.amount) {
      totals.local = (totals.local || 0) + Number(data.amount);
    }
    if (log.task_id === 'water' && data.saved) {
      totals.water = (totals.water || 0) + Number(data.saved);
    }
    if (log.task_id === 'waste' && data.count) {
      totals.waste = (totals.waste || 0) + Number(data.count);
    }
  });

  res.json({
    tasks: [
      { id: 'cleanup', title: 'Clean-up Walk', icon: '🗑️' },
      { id: 'carbon', title: '碳足跡記錄', icon: '🌱' },
      { id: 'biodiversity', title: '生態觀察', icon: '🦋' },
      { id: 'local', title: '地方支持', icon: '🏪' },
      { id: 'water', title: '水資源', icon: '💧' },
      { id: 'waste', title: '廢棄物減量', icon: '♻️' },
    ],
    logs: logs.map(l => ({ ...l, data: JSON.parse(l.data || '{}') })),
    totals,
  });
});

// 提交 ESG 任務記錄
app.post('/api/journeys/:id/esg-tasks', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const id = uid();
  const { task_id, data } = req.body;
  run('INSERT INTO esg_task_logs (id,journey_id,task_id,email,data,created_at) VALUES (?,?,?,?,?,?)',
    id, req.params.id, task_id, req.user.email, JSON.stringify(data || {}), Date.now());
  
  // 自動同步到 impact 表
  const impactSync = {
    cleanup: { metric_id: 'trash_collected', key: 'count', unit: '件' },
    carbon: { metric_id: 'carbon_saved', key: 'distance', unit: 'kg' },
    biodiversity: { metric_id: 'species_observed', key: 'count', unit: '種' },
    local: { metric_id: 'local_spending', key: 'amount', unit: '元' },
    water: { metric_id: 'water_saved', key: 'saved', unit: 'L' },
    waste: { metric_id: 'waste_reduced', key: 'count', unit: '件' },
  };
  
  const sync = impactSync[task_id];
  if (sync && data[sync.key]) {
    run('INSERT INTO impact (id,journey_id,metric_id,value,note) VALUES (?,?,?,?,?)',
      uid(), req.params.id, sync.metric_id, Number(data[sync.key]), JSON.stringify(data));
  }
  
  // 檢查授勳
  const newBadges = checkAndAwardBadges(req.user.email, req.params.id);
  
  res.json({ id, message: '任務記錄已提交', newBadges });
});

// ===== 成果摘要自動生成 =====

// 取得所有可用勳章
app.get('/api/badges', verifyToken, (req, res) => {
  const badges = all('SELECT * FROM badges ORDER BY category, threshold');
  res.json(badges);
});

// 取得使用者已獲得勳章
app.get('/api/me/badges', verifyToken, (req, res) => {
  const userBadges = all('SELECT ub.*, b.name, b.icon, b.description, b.category, b.requirement, b.threshold FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.email=? ORDER BY ub.earned_at DESC', req.user.email);
  res.json(userBadges);
});

// ===== 高階主管共識營 =====

// 取得工具資料
app.get('/api/journeys/:id/executive/:toolType', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const tool = get('SELECT * FROM executive_tools WHERE journey_id=? AND tool_type=? ORDER BY updated_at DESC LIMIT 1', req.params.id, req.params.toolType);
  if (tool) {
    res.json({ ...tool, data: JSON.parse(tool.data || '{}') });
  } else {
    res.json({ data: {} });
  }
});

// 儲存工具資料
app.post('/api/journeys/:id/executive/:toolType', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const existing = get('SELECT id FROM executive_tools WHERE journey_id=? AND tool_type=?', req.params.id, req.params.toolType);
  const id = existing ? existing.id : uid();
  const data = JSON.stringify(req.body.data || {});
  
  if (existing) {
    run('UPDATE executive_tools SET data=?, updated_at=? WHERE id=?', data, Date.now(), id);
  } else {
    run('INSERT INTO executive_tools (id,journey_id,tool_type,data,created_at,updated_at) VALUES (?,?,?,?,?,?)',
      id, req.params.id, req.params.toolType, data, Date.now(), Date.now());
  }
  
  // 檢查授勳
  const newBadges = checkAndAwardBadges(req.user.email, req.params.id);
  
  res.json({ id, message: '已儲存', newBadges });
});

// ===== 復元流：需求診斷 + 30-day 追蹤 =====

// 取得診斷資料
app.get('/api/journeys/:id/wellbeing/diagnosis', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const diag = get('SELECT * FROM wellbeing_diagnosis WHERE journey_id=? AND email=?', req.params.id, req.user.email);
  if (diag) {
    res.json({ ...diag, data: JSON.parse(diag.data || '{}') });
  } else {
    res.json({ data: {} });
  }
});

// 儲存診斷資料
app.post('/api/journeys/:id/wellbeing/diagnosis', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const existing = get('SELECT id FROM wellbeing_diagnosis WHERE journey_id=? AND email=?', req.params.id, req.user.email);
  const id = existing ? existing.id : uid();
  const data = JSON.stringify(req.body.data || {});
  if (existing) {
    run('UPDATE wellbeing_diagnosis SET data=? WHERE id=?', data, id);
  } else {
    run('INSERT INTO wellbeing_diagnosis (id,journey_id,email,data,created_at) VALUES (?,?,?,?,?)',
      id, req.params.id, req.user.email, data, Date.now());
  }
  res.json({ id, message: '已儲存' });
});

// 取得 follow-up 紀錄
app.get('/api/journeys/:id/wellbeing/followup', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const entries = all('SELECT * FROM follow_up_entries WHERE journey_id=? AND email=? ORDER BY day ASC', req.params.id, req.user.email);
  res.json(entries);
});

// 新增 follow-up 紀錄
app.post('/api/journeys/:id/wellbeing/followup', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const id = uid();
  const { day, mood, energy, note } = req.body;
  run('INSERT INTO follow_up_entries (id,journey_id,email,day,mood,energy,note,created_at) VALUES (?,?,?,?,?,?,?)',
    id, req.params.id, req.user.email, day, mood, energy, note || '', Date.now());
  res.json({ id, message: '已新增' });
});

// ===== 共好流：家庭日 =====

// 取得家庭任務
app.get('/api/journeys/:id/family-tasks', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const task = get('SELECT * FROM family_tasks WHERE journey_id=? AND email=?', req.params.id, req.user.email);
  if (task) {
    res.json({ ...task, data: JSON.parse(task.data || '{}') });
  } else {
    res.json({ data: {} });
  }
});

// 儲存家庭任務
app.post('/api/journeys/:id/family-tasks', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const existing = get('SELECT id FROM family_tasks WHERE journey_id=? AND email=?', req.params.id, req.user.email);
  const id = existing ? existing.id : uid();
  const data = JSON.stringify(req.body.data || {});
  if (existing) {
    run('UPDATE family_tasks SET data=? WHERE id=?', data, id);
  } else {
    run('INSERT INTO family_tasks (id,journey_id,email,data,created_at) VALUES (?,?,?,?,?)',
      id, req.params.id, req.user.email, data, Date.now());
  }
  res.json({ id, message: '已儲存' });
});

// 取得觀察記錄
app.get('/api/journeys/:id/family-observations', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const obs = get('SELECT * FROM family_observations WHERE journey_id=? AND email=?', req.params.id, req.user.email);
  if (obs) {
    res.json({ ...obs, data: JSON.parse(obs.data || '{}') });
  } else {
    res.json({ data: {} });
  }
});

// 儲存觀察記錄
app.post('/api/journeys/:id/family-observations', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const existing = get('SELECT id FROM family_observations WHERE journey_id=? AND email=?', req.params.id, req.user.email);
  const id = existing ? existing.id : uid();
  const data = JSON.stringify(req.body.data || {});
  if (existing) {
    run('UPDATE family_observations SET data=? WHERE id=?', data, id);
  } else {
    run('INSERT INTO family_observations (id,journey_id,email,data,created_at) VALUES (?,?,?,?,?)',
      id, req.params.id, req.user.email, data, Date.now());
  }
  res.json({ id, message: '已儲存' });
});

// 取得照片列表
app.get('/api/journeys/:id/photos', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const photos = all('SELECT * FROM photos WHERE journey_id=? ORDER BY created_at DESC', req.params.id);
  res.json({ photos });
});

// 上傳照片（使用現有 upload API 後寫入 photos 表）
app.post('/api/journeys/:id/photos', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const { url } = req.body;
  const id = uid();
  run('INSERT INTO photos (id,journey_id,email,url,created_at) VALUES (?,?,?,?,?)',
    id, req.params.id, req.user.email, url, Date.now());
  res.json({ id, url });
});

app.get('/api/journeys/:id/summary', verifyToken, (req, res) => {
  if (!requireAccess(req.params.id, req.user.email, res)) return;
  const journey = get('SELECT * FROM journeys WHERE id=?', req.params.id);
  if (!journey) return res.status(404).json({ error: '旅程不存在' });

  const members = all('SELECT * FROM journeys_members WHERE journey_id=?', req.params.id);
  const prep = all('SELECT * FROM prep_items WHERE journey_id=?', req.params.id);
  const schedule = all('SELECT * FROM schedule WHERE journey_id=?', req.params.id);
  const notes = all('SELECT * FROM notes WHERE journey_id=?', req.params.id);
  const impact = all('SELECT * FROM impact WHERE journey_id=?', req.params.id);
  const checkins = all('SELECT * FROM checkins WHERE journey_id=?', req.params.id);

  // 計算準備完成率
  const prepTotal = prep.length;
  const prepDone = prep.filter(p => p.done).length;
  const prepRate = prepTotal > 0 ? Math.round((prepDone / prepTotal) * 100) : 0;

  // 計算簽到率
  const memberCount = members.length + 1; // +1 for owner
  const checkinCount = checkins.length;
  const checkinRate = memberCount > 0 ? Math.round((checkinCount / memberCount) * 100) : 0;

  // 計算總影響值
  const totalImpact = impact.reduce((sum, i) => sum + (i.value || 0), 0);

  // 統計 mood 分佈
  const moodCounts = {};
  notes.forEach(n => {
    if (n.mood) moodCounts[n.mood] = (moodCounts[n.mood] || 0) + 1;
  });

  res.json({
    journey: {
      id: journey.id,
      title: journey.title,
      destination: journey.destination,
      start_date: journey.start_date,
      end_date: journey.end_date,
      purpose: journey.purpose,
      service_type: journey.service_type,
      stage: journey.stage,
    },
    stats: {
      member_count: memberCount,
      prep_total: prepTotal,
      prep_done: prepDone,
      prep_rate: prepRate,
      schedule_count: schedule.length,
      note_count: notes.length,
      checkin_count: checkinCount,
      checkin_rate: checkinRate,
      impact_count: impact.length,
      total_impact_value: totalImpact,
      mood_distribution: moodCounts,
    },
    generated_at: Date.now(),
  });
});

app.listen(PORT, () => console.log(`FTG Journey server on :${PORT}`));
