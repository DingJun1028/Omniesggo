// ============================================================
// Universal-Translator 遠端驗證腳本
// 部署後於 VPS 執行：
//   ssh ubuntu@your-vps 'bash <(curl -s https://raw.githubusercontent.com/DingJun1028/esggo/main/apps/universal-translator/test_remote.mjs)'
// 或本機下載後執行：
//   curl -O https://.../test_remote.mjs && node test_remote.mjs
// ============================================================
import http from 'node:http';
import process from 'node:process';

const PORT = process.env.PORT || 8788;
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 10000;

async function check(name, url, opts = {}) {
  return new Promise((resolve) => {
    const req = http.request(url, opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ name, status: r.statusCode, body: d.trim().slice(0,200) }));
    });
    req.on('error', e => resolve({ name, status: 'ERROR', body: e.message }));
    req.setTimeout(TIMEOUT, () => { req.abort(); resolve({ name, status: 'TIMEOUT', body: '連線超時' }); });
    req.end();
  });
}

async function main() {
  console.log('🧪 Universal-Translator 遠端驗證\n');

  const results = await Promise.all([
    check('/health', `${HOST}/health`),
    check('/translate', `${HOST}/translate`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'hello world',from:'en',to:'zh'})}),
    check('/translate (multi)', `${HOST}/translate`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'thank you',targets:['zh-TW','ja','es']})}),
  ]);

  results.forEach(r => {
    const mark = r.status === 200 ? '✅' : (r.status === 'TIMEOUT' ? '⏱' : '❌');
    console.log(`${mark} ${r.name}: ${r.status} ${r.body || ''}`);
  });

  console.log('\n✅ 若全✅則服務正常');
}

main();