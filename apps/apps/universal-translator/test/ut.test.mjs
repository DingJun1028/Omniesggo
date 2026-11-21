// 萬能即時翻譯 — 生產級自動化測試 (Node 內建 test runner, 零依賴)
// 執行: node --test
//
// 設計原則 (修復 #882 CI flake 根因):
//   原測試直接依賴現網免費翻譯 API (google-gtx / mymemory)。
//   CI runner 位於資料中心, 其 IP 常被外部免費翻譯服務限流,
//   導致所有引擎失效 → translateDetailed 優雅回落 fallback-origin,
//   使「engine 必須是免費引擎鏈」斷言不穩定失敗。
//   本版改以 __setTestEngineChain 注入「確定性免費引擎」,
//   在完全脫離外部網路的前提下, 穩定驗證 5T 溯源合約
//   (engine 標記 / 實際發生翻譯 / passthrough / fallback / 快取),
//   並明確覆蓋「全引擎失效 → fallback-origin 兜底」路徑。
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { toCanonical, toEngineLang } from '../types/generated/lang-matrix.mjs';
import { translateDetailed, translateToMany, __setTestEngineChain, __resetTestEngineChain } from '../translate.mjs';

// ── lang-matrix 碼規範單元測試 ──
test('toCanonical: 繁中標準化', () => {
  assert.equal(toCanonical('zh-TW'), 'zh-TW');
  assert.equal(toCanonical('zh_tw'), 'zh-TW');
  assert.equal(toCanonical('中文'), 'zh-TW'); // 別名映射
  assert.equal(toCanonical(''), 'auto');
});

test('toEngineLang: 各引擎查表正確', () => {
  assert.equal(toEngineLang('ollama', 'zh-TW'), 'zh-TW');
  assert.equal(toEngineLang('mymemory', 'zh-TW'), 'zh-CN');
  assert.equal(toEngineLang('libretranslate', 'zh-TW'), 'zh');
  assert.equal(toEngineLang('google-gtx', 'en'), 'en');
});

// ── 免費引擎白名單 (5T Traceable: engine 標記必須來自已核准的免費引擎鏈) ──
// translate.mjs engineChain() 順序:
//   gemini-live-3.5? → ollama-*? → google-gtx → libretranslate? → mymemory
// fallback-origin / passthrough 代表翻譯根本沒發生, 不在白名單內。
const FREE_ENGINES = ['gemini-live-3.5', 'ollama-', 'google-gtx', 'libretranslate', 'mymemory'];
const isFreeEngine = (e) => typeof e === 'string' && FREE_ENGINES.some((n) => e.includes(n));

// 確定性免費引擎: 脫離現網, 保證成功且標記為免費引擎鏈成員
const deterministicFreeEngine = /** @type {[string, (text: string, from: string, to: string) => Promise<string>]} */ ([
  'google-gtx',
  async (text, _from, to) => `【${to}】${text}`,
]);

// 所有整合測試共用確定性引擎鏈, 確保 CI 不依賴外部網路
before(() => { __setTestEngineChain([deterministicFreeEngine]); });
after(() => { __resetTestEngineChain(); });

// ── translate 引擎鏈整合測試 (確定性, 引擎無關斷言) ──
test('translateDetailed: 雙向翻譯回傳 engine 標記 (5T 溯源)', async () => {
  const r = await translateDetailed('Hello', 'en', 'zh-TW');
  assert.ok(r.text.length > 0, '翻譯結果非空');
  assert.ok(isFreeEngine(r.engine), '應使用免費引擎鏈之一 (且非 fallback-origin): ' + r.engine);
  assert.notEqual(r.text, 'Hello', '應實際完成翻譯而非回傳原文');
  assert.equal(typeof r.cached, 'boolean');
}, 15000);

test('translateDetailed: 繁中→英', async () => {
  const r = await translateDetailed('你好世界', 'zh-TW', 'en');
  assert.ok(r.text.length > 0);
  assert.ok(isFreeEngine(r.engine), '應使用免費引擎鏈之一 (且非 fallback-origin): ' + r.engine);
  assert.notEqual(r.text, '你好世界', '應實際完成翻譯而非回傳原文');
}, 15000);

test('translateToMany: 多語平行翻譯', async () => {
  const r = await translateToMany('早上好', 'zh-TW', ['en', 'ja']);
  assert.ok(r.translations.en && r.translations.en.length > 0, '應有英文譯文');
  assert.ok(r.translations.ja && r.translations.ja.length > 0, '應有日文譯文');
  assert.ok(isFreeEngine(r.engines.en), 'en 引擎應為免費引擎鏈: ' + r.engines.en);
  assert.ok(isFreeEngine(r.engines.ja), 'ja 引擎應為免費引擎鏈: ' + r.engines.ja);
}, 20000);

// ── 錯誤處理 / 兜底合約 ──
test('translateDetailed: 空文字回 passthrough (不拋錯)', () => {
  // 注意: 空文字在進入引擎鏈前即短路, 不受測試引擎鏈影響
  return translateDetailed('', 'en', 'zh-TW').then((r) => {
    assert.equal(r.engine, 'passthrough');
  });
});

test('translateDetailed: 全引擎失效優雅回落 fallback-origin (不拋錯, 回傳原文)', async () => {
  // 暫時以「必敗引擎鏈」取代確定性引擎, 驗證優雅回落合同
  __setTestEngineChain([
    ['google-gtx', async () => { throw new Error('injected fail'); }],
    ['mymemory', async () => { throw new Error('injected fail'); }],
  ]);
  try {
    const r = await translateDetailed('__fallback_probe__', 'en', 'zh-TW');
    assert.equal(r.engine, 'fallback-origin', '全引擎失效應回落 fallback-origin');
    assert.equal(r.text, '__fallback_probe__', '兜底應回傳原文 (不丟失輸入)');
  } finally {
    // 還原確定性引擎, 維持後續測試穩定
    __setTestEngineChain([deterministicFreeEngine]);
  }
});

console.log('[test] universal-translator test suite loaded');
