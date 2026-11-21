// ============================================================
// Universal-Translator UI/API 測試腳本
// 用法：node apps/universal-translator/test_ui.mjs
// ============================================================
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8788;

console.log('🧪 Universal-Translator 測試開始\n');

// 1. 健康檢查
console.log('=== 1. 健康檢查 /health ===');
const healthReq = await new Promise((res, rej) => {
  http.get(`http://localhost:${PORT}/health`, (r) => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res(JSON.parse(d)));
  }).on('error', e => rej(e));
});
console.log('健康狀態:', healthReq.status === 'ok' ? '✅ OK' : healthReq);

// 2. 單語翻譯測試 (en→zh)
console.log('\n=== 2. 單語翻譯測試 (en→zh) ===');
const singleReq = await new Promise((res, rej) => {
  const req = http.request({hostname:'localhost',port:PORT,
    path:'/translate',method:'POST',
    headers:{'Content-Type':'application/json'}}, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res(JSON.parse(d)));
  });
  req.write(JSON.stringify({text:'hello world',from:'en',to:'zh'}));
  req.end();
  req.on('error', e => rej(e));
});
console.log('翻譯結果:', singleReq.text === '你好世界' ? '✅ 正確' : singleReq);

// 3. 多語平行翻譯測試
console.log('\n=== 3. 多語平行翻譯測試 ===');
const multiReq = await new Promise((res, rej) => {
  const req = http.request({hostname:'localhost',port:PORT,
    path:'/translate',method:'POST',
    headers:{'Content-Type':'application/json'}}, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res(JSON.parse(d)));
  });
  req.write(JSON.stringify({text:'thank you',from:'en',targets:['zh-TW','ja','es','fr']}));
  req.end();
  req.on('error', e => rej(e));
});
console.log('多語結果:', multiReq.translations ? '✅ 正確' : multiReq);

// 4. SSE 端點檢查
console.log('\n=== 4. SSE /stream 端點檢查 ===');
const esTest = await new Promise((res) => {
  const es = new EventSource(`http://localhost:${PORT}/stream`);
  es.onopen = () => { es.close(); res('✅ 連線成功'); };
  es.onerror = (e) => { es.close(); res('❌ 連線失敗: ' + e); };
});
console.log('SSE 狀態:', esTest);

console.log('\n🎉 測試完成！');
process.exit(0);