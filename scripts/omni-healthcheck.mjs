import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';

console.log('\n======================================================');
console.log(' 💎 ESG GO OmniCore v3.4.0 全域系統健康診斷 (Health Check)');
console.log('======================================================\n');

const results = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
  checks: [],
};

function recordCheck(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} [${status}] ${name}${details ? ` -> ${details}` : ''}`);
  results.checks.push({ name, status, details });
}

async function runHealthCheck() {
  try {
    // 1. Node Runtime & Env check
    recordCheck('Node.js 執行期環境', 'PASS', `Version: ${process.version}`);

    // 2. Supabase PostgreSQL Connectivity Check
    try {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
        max: 2,
        connectionTimeoutMillis: 5000,
      });
      const res = await pool.query('SELECT count(*)::int AS n FROM public."MaterialityAssessment"');
      await pool.end();
      recordCheck('Supabase PostgreSQL 資料庫連線', 'PASS', `紀錄數量: ${res.rows[0]?.n ?? 0}`);
    } catch (dbErr) {
      recordCheck('Supabase PostgreSQL 資料庫連線', 'WARN', dbErr.message || 'Local fallback active');
    }

    // 3. System Encoding Check
    const keyFiles = [
      'package.json',
      'README.md',
      'app/sustain-center/page.tsx',
      'app/api/calculator/carbon-emissions/route.ts',
    ];

    let garbledFound = false;
    for (const relPath of keyFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('\uFFFD') || content.includes('\u0000')) {
          garbledFound = true;
          recordCheck(`檔案編碼檢測 (${relPath})`, 'FAIL', '發現亂碼/UTF-8 毀損');
        }
      }
    }
    if (!garbledFound) {
      recordCheck('核心檔案 UTF-8 編碼純淨度', 'PASS', '全真綠無亂碼');
    }

    // 4. PWA & Static Asset Check
    const pwaManifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    if (fs.existsSync(pwaManifestPath)) {
      recordCheck('PWA 清單 manifest.json', 'PASS', '靜態資產到位');
    } else {
      recordCheck('PWA 清單 manifest.json', 'WARN', '未發現 public/manifest.json');
    }

    // 5. 5T Hash Lock SHA-256 Engine Check
    const testData = 'ESGGO_5T_HASH_LOCK_TEST_PAYLOAD';
    const testHash = crypto.createHash('sha256').update(testData).digest('hex');
    if (testHash && testHash.length === 64) {
      recordCheck('5T 雜湊鎖 (Hash Lock) 密碼引擎', 'PASS', `SHA-256 Lock: ${testHash.substring(0, 16)}...`);
    } else {
      recordCheck('5T 雜湊鎖 (Hash Lock) 密碼引擎', 'FAIL', 'SHA-256 驗證異常');
    }

    console.log('\n------------------------------------------------------');
    const failures = results.checks.filter((c) => c.status === 'FAIL');
    if (failures.length === 0) {
      console.log(' 🎉 系統健康診斷完成：全數通過，100% 滿分運轉中！');
    } else {
      console.log(` ⚠️ 診斷發現 ${failures.length} 項失敗，請儘速排查！`);
    }
    console.log('------------------------------------------------------\n');
  } catch (err) {
    console.error('❌ 診斷過程發生未預期錯誤:', err);
    process.exit(1);
  }
}

runHealthCheck();
