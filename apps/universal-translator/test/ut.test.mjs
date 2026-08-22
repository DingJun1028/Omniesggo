// 萬能即時翻譯 — 生產級自動化測試 (Node 內建 test runner, 零依賴)
// 執行: node --test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { toCanonical, toEngineLang } from '../types/generated/lang-matrix.mjs';
import { translateDetailed, translateToMany } from '../translate.mjs';

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
// 外部免費服務會對 CI runner 的資料中心 IP 限流，google-gtx 因此可能優雅回落至 mymemory
// (soul.md §9.5「優雅回落機制」: 任一路徑失效自動回到免費路徑，不中斷生產)。
// 故此處斷言「引擎屬於免費白名單」而非釘死單一外部供應商；
// 同時排除 fallback-origin / passthrough — 那代表翻譯根本沒發生，仍必須讓測試失敗。
const FREE_ENGINES = ['gemini-live-3.5', 'ollama-', 'google-gtx', 'libretranslate', 'mymemory'];
const isFreeEngine = (e) => typeof e === 'string' && FREE_ENGINES.some((n) => e.includes(n));

// ── translate 引擎鏈整合測試 (真實外部免費 API, 引擎無關斷言) ──
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
  assert.ok(r.translations.en, '應有英文譯文');
  assert.ok(r.translations.ja, '應有日文譯文');
  assert.equal(Object.keys(r.engines).length >= 1, true);
}, 20000);

// ── 錯誤處理測試 ──
test('translateDetailed: 空文字回 passthrough (不拋錯)', async () => {
  const r = await translateDetailed('', 'en', 'zh-TW');
  assert.equal(r.engine, 'passthrough');
});

console.log('[test] universal-translator test suite loaded');
