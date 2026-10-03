/**
 * OmniSub 端對端驗證（jsdom 真實 DOM + 真實網路請求）
 * source_origin: apps/omnisub/verify.mjs
 * 驗證範圍：語言偵測 / 翻譯鏈 / 字幕渲染 / 去重 / SRT 匯出 / XSS / 引擎切換 / VAD 門檻
 *
 * jsdom 解析：monorepo 以 pnpm 管理，jsdom 未提升到根 node_modules，
 * 故直接由 .pnpm store 路徑載入，避免為了單檔驗證而改動 workspace 依賴。
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const html = readFileSync(join(here, 'index.html'), 'utf8');

// 由 pnpm store 找出可用的 jsdom
const pnpmDir = join(repoRoot, 'node_modules', '.pnpm');
let jsdomPath = null;
if (existsSync(pnpmDir)) {
  for (const d of readdirSync(pnpmDir)) {
    if (!d.startsWith('jsdom@')) continue;
    const p = join(pnpmDir, d, 'node_modules', 'jsdom', 'lib', 'api.js');
    if (existsSync(p)) { jsdomPath = p; break; }
  }
}
if (!jsdomPath) {
  console.error('找不到 jsdom（pnpm store 內未安裝）');
  process.exit(2);
}
const { JSDOM, VirtualConsole } = await import(pathToFileURL(jsdomPath).href);
console.log('jsdom:', jsdomPath.replace(repoRoot, '<repo>'));

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail) {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}${detail ? ' :: ' + detail : ''}`); }
}

// 攔截 fetch：真實打網路，但記錄呼叫
const fetchLog = [];
const realFetch = globalThis.fetch;

const vc = new VirtualConsole();
const consoleMsgs = [];
vc.on('jsdomError', e => consoleMsgs.push('jsdomError: ' + e.message));
vc.on('error', (...a) => consoleMsgs.push('error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://localhost/omnisub',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    /* 跨 realm 修補：jsdom 自帶的 AbortController 產生的 signal 並非
       Node 原生 AbortSignal 的實例（instanceof === false），直接餵給
       undici 的 fetch 會在 Promise 鏈之外「同步」拋出 TypeError：
         RequestInit: Expected signal ("AbortSignal {}") to be an instance of AbortSignal.
       該同步例外會繞過產品碼的 .catch(onFail)，被 Translation.run 的外層
       catch 接走 → 渲染失敗佔位字串，看起來像「翻譯成功」實為假陽性。
       真實瀏覽器中 fetch 與 AbortController 同 realm，不存在此問題，
       故此處僅修補測試環境，產品碼不需改動。 */
    window.AbortController = AbortController;
    window.AbortSignal = AbortSignal;
    window.fetch = function (url, opts) {
      fetchLog.push({ url: String(url), opts: opts || {} });
      return realFetch(url, opts);
    };
    // jsdom 無 MediaRecorder / AudioContext，模擬最小可用介面
    window.AudioContext = class { constructor(){ this.sampleRate = 48000; this.destination = {}; this.state='running'; }
      createAnalyser(){ return { fftSize: 1024, getFloatTimeDomainData(){} }; }
      createMediaStreamSource(){ return { connect(){}, disconnect(){} }; }
      createScriptProcessor(){ return { connect(){}, disconnect(){}, onaudioprocess: null }; }
      createGain(){ return { gain:{value:1}, connect(){} }; }
      createBufferSource(){ return { buffer:null, connect(){}, start(){} }; }
      createBuffer(ch,len){ return { copyToChannel(){}, getChannelData(){ return new Float32Array(len); } }; }
      resume(){} close(){ return Promise.resolve(); } };
    window.OfflineAudioContext = class { constructor(){} startRendering(){ return Promise.resolve({ getChannelData(){ return new Float32Array(16000); } }); } };
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
  },
});

const { window } = dom;
const doc = window.document;
const $ = id => doc.getElementById(id);

console.log('=== OmniSub 端對端驗證 ===\n');

// ---------- 1. 載入無錯誤 ----------
const api = window.__omnisub;
check('頁面載入並掛載 __omnisub 測試鉤子', !!api);
if (!api) { console.log(results.join('\n')); process.exit(1); }

// ---------- 2. UI 初始化 ----------
check('標題為 OmniSub', doc.title.includes('OmniSub'));
check('面板存在', !!$('panel'));
check('字幕區存在', !!$('subtitleArea'));
check('底色為 esggo 深藍', html.includes('--navy:#10243f'));
check('暖金 #c9a24b 存在', html.includes('--gold:#c9a24b'));
check('無 emoji 於 UI 標題', !/[\u{1F300}-\u{1FAFF}]/u.test($('titlebar').textContent));

// ---------- 3. 語言偵測（僅繁中 ⇄ 英文 雙向） ----------
const dl = api.detectLang;
check('偵測繁中', dl('今天開會嗎') === 'zh-TW', dl('今天開會嗎'));
check('偵測英文', dl('Hello world this is fine') === 'en');
check('繁中含標點與數字仍判中文', dl('我們在 2026 年discuss了3個方案。') === 'zh-TW', dl('我們在 2026 年discuss了3個方案。'));
check('純英文（含縮寫）', dl('The CFO approved the Q3 budget.') === 'en');
check('日文假名不被誤判為中文（原版缺陷修正）', dl('こんにちは、元気ですか') === 'en', dl('こんにちは'));
check('韓文不被誤判為中文', dl('안녕하세요') === 'en', dl('안녕하세요'));
// 僅含漢字的日文在技術上無法與中文區分（會、議、日 皆為漢字且不含假名），
// detectLang 必然判為 zh-TW。這是兩語範圍下的已知且可接受限制
//（使用者已限定僅需繁中 ⇄ 英文），故此處驗證「含假名時才排除」。
// 注意：不可用「今日の会議」當例子 —— 其中的「の」(U+306E) 是平假名，
// 會被 KANA 規則正確攔下而判為 en，無法用來示範純漢字情境。
check('含假名的夾漢字日文判為非中文（避免誤譯）', dl('今日の会議') === 'en', dl('今日の会議'));
check('含の之日文亦判為非中文（の=U+306E 平假名）', dl('この会議は来週です') === 'en', dl('この会議は来週です'));
check('純漢字日文無法區分（已知限制，記錄為 zh-TW）', dl('会議資料') === 'zh-TW', dl('会議資料'));
check('空字串安全回傳 en', dl('') === 'en');

// ---------- 4. 目標語言恆為對方（雙向自動對翻） ----------
check('繁中 → 目標 en', api.resolveTarget('zh-TW') === 'en');
check('英文 → 目標 zh-TW', api.resolveTarget('en') === 'zh-TW');
check('日文（判為 en）→ 目標 zh-TW', api.resolveTarget(dl('こんにちは')) === 'zh-TW');

// ---------- 5. SRT 時間格式 ----------
check('SRT 格式 00:00:01,500', api.fmtSRT(1.5) === '00:00:01,500', api.fmtSRT(1.5));
check('SRT 格式 01:02:03,000', api.fmtSRT(3723) === '01:02:03,000', api.fmtSRT(3723));
// 進位：先算整數毫秒總數再分解。反序分解會讓 1.9999 秒變 00:00:01,999 →
// 玩家端讀成 1 秒整，白掉近一秒。
check('SRT 進位 1.9999 → 00:00:02,000（非 1,999）', api.fmtSRT(1.9999) === '00:00:02,000', api.fmtSRT(1.9999));
// 跨分鐘進位：101.9999s → 102000ms → 102s → 00:01:42,000。
// 注意不是 00:01:41,999 —— 那會被播放器讀成 1 分 41.999 秒後截斷。
check('SRT 跨分鐘進位 101.9999 → 00:01:42,000', api.fmtSRT(100 + 1.9999) === '00:01:42,000', api.fmtSRT(100 + 1.9999));
// 跨小時進位：3599.9999s → 3600000ms → 01:00:00,000（不可變成 00:59:59,999）
check('SRT 跨小時進位 3599.9999 → 01:00:00,000', api.fmtSRT(3599.9999) === '01:00:00,000', api.fmtSRT(3599.9999));
check('SRT 小數不四捨五入成整秒（1.4 → ,400）', api.fmtSRT(1.4) === '00:00:01,400', api.fmtSRT(1.4));

// ---------- 6. 翻譯鏈順序（實測基準） ----------
api.S.chain = 'auto';
check('預設鏈以 MyMemory 為首（實測最穩）',
  api.Translation.chainFor()[0] === 'mymemory', api.Translation.chainFor().join('>'));
check('鏈含 gtx 與 libre 備援', api.Translation.chainFor().length === 3);

// ---------- 7. 雙向收斂後：resolveTarget 恆為對方，無同語言短路可測 ----------
// 舊版以 S.target 覆寫為同語言來驗證「零網路請求」短路；該欄位已隨
// 目標語言下拉選單一併移除，src === tgt 僅為防禦性殘留（正常永不成立）。
// 改驗真正仍存在的不變條件：偵測語言與目標語言必不同。
const pairMismatch = dl('今天天氣很好') !== api.resolveTarget(dl('今天天氣很好'))
  && dl('The weather is nice today') !== api.resolveTarget(dl('The weather is nice today'));
check('偵測語言與目標語言恆不同（雙向對翻，無同語言空轉）', pairMismatch,
  `zh→${api.resolveTarget('zh-TW')}, en→${api.resolveTarget('en')}`);

// ---------- 8. 真實翻譯管線（打真網路） ----------
fetchLog.length = 0;
const t0 = Date.now();
await api.Translation.run('The meeting has been postponed until next Friday because of heavy rain.', 'en');
const elapsed = Date.now() - t0;
const transText = $('transLine').textContent;
const badge = $('engineBadge').textContent;
// 失敗佔位字串為 '（僅辨識 · 翻譯服務未回應）'，內含中文，
// 故僅以 /[\u4e00-\u9fff]/.test() 斷言會造成假陽性，必須顯式排除。
const FAIL_SENTINEL = '僅辨識';
const isRealTranslation = !!transText
  && transText !== '—'
  && !transText.includes(FAIL_SENTINEL)
  && /[\u4e00-\u9fff]/.test(transText);
check('真實翻譯產出譯文（MyMemory 實測可用）', isRealTranslation, `譯文=${transText}`);
check('譯文非原文回Echo（確實經過翻譯）', transText !== 'The meeting has been postponed until next Friday because of heavy rain.', transText);
check('翻譯耗時合理（確實打了網路，非 2ms 空轉）', elapsed > 100, `${elapsed}ms`);
check('引擎徽章顯示實際使用的引擎', badge.includes('Engine') && !badge.includes('全數逾時'), badge);
check('有實際送出網路請求', fetchLog.length > 0, `fetch 數=${fetchLog.length}`);
check('首選端點為 MyMemory（免金鑰）', fetchLog[0]?.url.includes('mymemory'), fetchLog[0]?.url);
console.log(`  [i] 翻譯耗時 ${elapsed}ms · 譯文: ${transText}`);

// ---------- 9. 快取命中（第二次同句不再打網路） ----------
fetchLog.length = 0;
await api.Translation.run('The meeting has been postponed until next Friday because of heavy rain.', 'en');
check('相同句第二次命中快取（不重複請求）', fetchLog.length === 0, `fetch 數=${fetchLog.length}`);

// ---------- 10. 去重（Whisper 重疊整句問題修正） ----------
const histBefore = api.UI.hist.length;
api.UI.render('This is a duplicated sentence.', '這是重複的句子。', 'test', true);
const afterFirst = api.UI.hist.length;
api.UI.render('this is a duplicated   sentence.', '這是重複的句子。', 'test', true);
const afterDup = api.UI.hist.length;
check('首次入史', afterFirst === histBefore + 1, `${histBefore}→${afterFirst}`);
check('標點/大小寫差異的重複句不重複入史（去重修正）', afterDup === afterFirst, `${afterFirst}→${afterDup}`);

// ---------- 11. XSS 防護（textContent，非 innerHTML） ----------
const payload = '<img src=x onerror="window.__xss=1">';
api.UI.render(payload, '<script>window.__xss=2<\/script>', 'test', true);
check('XSS payload 未被解析成元素（img 未注入）', doc.querySelectorAll('img').length === 0,
  `img 數=${doc.querySelectorAll('img').length}`);
check('XSS payload 以純文字顯示', $('transLine').textContent.includes('<script>'));
check('無全域 XSS 副作用', window.__xss === undefined, `__xss=${window.__xss}`);

// ---------- 12. 歷史紀錄與去重修剪 ----------
check('歷史有紀錄', api.UI.hist.length > 0, `hist=${api.UI.hist.length}`);
check('歷史 DOM 已渲染', $('historyWrap').children.length > 0, `rows=${$('historyWrap').children.length}`);

// ---------- 13. VAD 門檻（零算力核心） ----------
api.S.vad = true;
api.AC.noiseFloor = 0.006;
check('低於門檻的靜音被判定為非語音（不觸發推論）', api.AC.gate(0.001) === false);
check('高於門檻的語音被判定為語音', api.AC.gate(0.05) === true);
api.S.vadThr = 20;
check('提高門檻後中等音量被擋（更省算力）', api.AC.gate(0.01) === false);
api.S.vadThr = 6;
api.S.vad = false;
check('VAD 關閉時一律視為語音', api.AC.gate(0.0001) === true);
api.S.vad = true;

// ---------- 14. STT 排程器 busy / 佇列上限 ----------
check('STT 佇列上限為 2（記憶體有界）', api.STT.MAX_QUEUE === 2);
api.STT.queue = [];
for (let i = 0; i < 5; i++) api.STT.enqueue(new Float32Array(100));
check('超出上限自動丟棄過期片段（只留最新）', api.STT.queue.length === 2, `queue=${api.STT.queue.length}`);
api.STT.queue = [];

// ---------- 15. Web Speech 重連修正 ----------
check('STT 有 wsWanted 狀態（修正 onend 不重連）', api.STT.wsWanted === false);

// ---------- 16. 引擎切換 UI ----------
$('sttToggleBtn').dispatchEvent(new window.Event('click'));
check('STT 引擎可切換至 whisper', api.S.sttEngine === 'whisper', api.S.sttEngine);
check('whisper 選項面板顯示', $('whisperOpts').style.display === 'block');
$('sttToggleBtn').dispatchEvent(new window.Event('click'));
check('STT 引擎可切回 webspeech', api.S.sttEngine === 'webspeech', api.S.sttEngine);
check('webspeech 時 whisper 選項隱藏', $('whisperOpts').style.display === 'none');

// ---------- 17. 零算力審計：無付費/金鑰端點 ----------
const urls = [...html.matchAll(/https?:\/\/[a-z0-9.\-]+/gi)].map(m => m[0]);
const paid = urls.filter(u => /openai|anthropic|api\.deepl|paid|azure|gcp|googleapis\.com\/v1/.test(u));
check('程式碼內無付費 AI 端點（零算力/零費用）', paid.length === 0, paid.join(','));
check('無 API key 欄位残留（Gemini 已移除）', !html.includes('AIza'));

// ---------- 18. 暫停真的停止推論（原版無效） ----------
api.UI.paused = true;
check('暫停時擷取層完全停止處理（不燒 CPU）', (() => {
  const before = api.AC.bufferMs;
  api.AC.bufferMs = 999; // 模擬有資料
  let called = false;
  const origEnq = api.STT.enqueue;
  api.STT.enqueue = () => { called = true; };
  api.AC.flush();
  api.STT.enqueue = origEnq;
  return !called;
})());
api.UI.paused = false;

// ---------- 19. 降級與冷卻機制（決定性驗證，不依賴線上端點是否恰好故障） ----------
// 舊版此處斷言「gtx 必須失敗」，但 gtx 屬暫時性 IP 限流，複測已 4/4 成功，
// 拿線上服務的偶發狀態當斷言前提必然 flaky。改為直接注入可控故障：
// 先手動把 gtx 標記為冷卻中，驗證 tryEngine 會跳過它（零請求）並降級 MyMemory。
api.S.chain = 'gtx';
api.Translation.cooldown = { gtx: Date.now() + 60000, mymemory: 0, libre: 0 };
fetchLog.length = 0;
const tBefore = Date.now();
await api.Translation.run('A short test sentence for the fallback chain.', 'en');
const cooledMs = Date.now() - tBefore;
check('冷卻中的引擎被跳過（不發請求、不白等逾時）',
  !fetchLog.some(f => f.url.includes('googleapis')), `fetch=${fetchLog.map(f => f.url.slice(0, 46)).join(' | ')}`);
check('跳過 gtx 後自動降級到 MyMemory 並產出譯文（不中斷字幕）',
  /[\u4e00-\u9fff]/.test($('transLine').textContent) && !$('transLine').textContent.includes('僅辨識'),
  $('transLine').textContent);
check('冷卻中的引擎跳過是即時的（未耗時逾時）', cooledMs < 3000, `${cooledMs}ms`);

// 再驗證：故障引擎成功後冷卻會被清除（cooldown 僅在失敗時寫入）
check('未實際發生的失敗不會寫入冷卻（gtx 冷卻值未被本次執行改動）',
  api.Translation.cooldown.gtx > Date.now(), `cooldown.gtx=${api.Translation.cooldown.gtx}`);
console.log(`  [i] 降級耗時 ${cooledMs}ms · 譯文: ${$('transLine').textContent.slice(0, 40)}`);
api.S.chain = 'auto';

// ---------- 20. SRT 匯出不拋錯 ----------
let srtOk = true, srtErr = '';
try {
  const clicks = [];
  const origClick = window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click = function () { clicks.push(this.download); };
  const origCreate = window.URL.createObjectURL;
  window.URL.createObjectURL = () => 'blob:mock';
  $('srtBtn').dispatchEvent(new window.Event('click'));
  window.HTMLAnchorElement.prototype.click = origClick;
  window.URL.createObjectURL = origCreate;
  srtOk = clicks.length === 1 && String(clicks[0]).endsWith('.srt');
  srtErr = 'clicks=' + JSON.stringify(clicks);
} catch (e) { srtOk = false; srtErr = e.message; }
check('SRT 匯出觸發下載', srtOk, srtErr);

// ---------- 21. 鍵盤快捷鍵 ----------
$('histBtn').dispatchEvent(new window.Event('click'));
check('快捷鍵展開歷史', $('historyWrap').classList.contains('open'));
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('Esc 關閉設定抽屜', !$('drawer').classList.contains('open'));

// ---------- 22. 非字串 / 非有限值防護（NaN SRT 與 PeerJS 弱型別回歸） ----------
//
// 根因：PeerJS 收端（index.html Peer 收發）只檢查 `d.orig !== undefined`，
// 而 `null !== undefined` 為 true，遠端分享端可送任意 JSON 型別打進來：
//   - orig 為數字/物件 → .length 為 undefined → e 變 NaN → fmtSRT 輸出
//     "aN:aN:aN,NaN"，SRT 格式非法，播放器直接跳過該段
//   - orig 為 null → norm() 的 s.toLowerCase() 拋 TypeError，整個 render 崩潰
//   - sec 為 NaN/±Infinity/undefined → 同樣產生非法時間碼
// 修法（兩個收斂點，非症狀點）：
//   1. UI.render 拒絕所有非字串 orig（根因，一次收斂 Web Speech / Whisper /
//      BroadcastChannel / PeerJS 四條路徑）
//   2. fmtSRT 把所有非有限值收斂為 0（防禦，SRT 唯一出口）
//
// 兩種斷言都要有：靜態錨點（守衛被刪時明確失敗）+ 動態行為（守衛被刪時拋錯）。

// (a) 靜態錨點 —— 確認守衛原始碼確實在 index.html 裡
check('靜態錨點：UI.render 含 typeof orig !== "string" 守衛',
  html.includes("if(typeof orig !== 'string') return;"),
  'UI.render 型別守衛已從 index.html 移除');
check('靜態錨點：fmtSRT 含 !isFinite(sec) 守衛',
  html.includes('if(!isFinite(sec)) sec = 0;'),
  'fmtSRT 非有限值守衛已從 index.html 移除');

// (b) 動態行為 —— 非字串 orig 一律不入史且不拋錯
const histBeforeGuards = api.UI.hist.length;
const nonStringCases = [
  ['null', null],
  ['數字 123', 123],
  ['數字 0', 0],
  ['物件 {}', {}],
  ['陣列 []', []],
  ['undefined', undefined],
  ['布林 true', true],
];
for (const [label, val] of nonStringCases) {
  let threw = null;
  try { api.UI.render(val, 'trans', 'test', true); } catch (e) { threw = e; }
  check(`render(${label}) 不拋例外（非字串輸入被守衛擋下）`, threw === null,
    threw ? `${threw.name}: ${threw.message}` : '');
}
check('所有非字串輸入均未寫入歷史（NaN 時間碼無法產生）',
  api.UI.hist.length === histBeforeGuards,
  `hist ${histBeforeGuards}→${api.UI.hist.length}`);

// (c) 動態行為 —— 非有限值 sec 全部收斂為合法時間碼
const nonFiniteCases = [
  ['NaN', NaN, '00:00:00,000'],
  ['Infinity', Infinity, '00:00:00,000'],
  ['-Infinity', -Infinity, '00:00:00,000'],
  ['undefined', undefined, '00:00:00,000'],
  ['null', null, '00:00:00,000'],
];
for (const [label, val, want] of nonFiniteCases) {
  const got = api.fmtSRT(val);
  const legal = /^\d{2}:\d{2}:\d{2},\d{3}$/.test(got);
  check(`fmtSRT(${label}) 輸出合法時間碼`, legal && got === want, `got=${got} want=${want}`);
}
// 負數與超長值也要是合法 SRT（不可出現負號或溢出欄位）
check('fmtSRT(-5) 收斂為合法時間碼', /^\d{2}:\d{2}:\d{2},\d{3}$/.test(api.fmtSRT(-5)), api.fmtSRT(-5));
check('fmtSRT(3600) → 01:00:00,000', api.fmtSRT(3600) === '01:00:00,000', api.fmtSRT(3600));

// (d) 正常字串仍須入史（守衛不可連正常路徑一起擋掉）
api.UI.render('守衛回歸測試字串', 'guard regression', 'test', true);
check('字串仍正常入史（守衛未誤擋正常路徑）',
  api.UI.hist.length === histBeforeGuards + 1,
  `hist ${histBeforeGuards}→${api.UI.hist.length}`);
check('字串字幕已渲染至 DOM', $('origLine').textContent === '守衛回歸測試字串',
  $('origLine').textContent);

// ---------- 23. 無 console 錯誤 ----------
const realErrors = consoleMsgs.filter(m => !/Could not parse CSS|Not implemented/.test(m));
check('執行期間無未預期錯誤', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

// ---------- 24. CDN 多鏡像回退契約 ----------
// 為何是靜態斷言：loadTransformersLib 位於 index.html 的 module scope，未 export，
// 本 harness 無法直接呼叫；而真實下載 800KB+ bundle 會讓測試失去決定性與離線性。
// 故此處只鎖「契約」——鏡像順序、能力檢查、禁用來源、錯誤彙總。
// 真實可用性（HTTP 狀態碼）由 curl 另行驗證，不在此節假設。
const cdnBlock = html.match(/var TRANSFORMERS_CDNS\s*=\s*\[[\s\S]*?\];/);
check('index.html 宣告 TRANSFORMERS_CDNS 陣列', !!cdnBlock,
  cdnBlock ? '' : '找不到 var TRANSFORMERS_CDNS = [...];');
const cdnUrls = cdnBlock ? [...cdnBlock[0].matchAll(/https:\/\/[^'"\s]+/g)].map(m => m[0]) : [];
check('TRANSFORMERS_CDNS 恰有 3 個鏡像', cdnUrls.length === 3, `got ${cdnUrls.length}`);
check('鏡像順序為 jsDelivr -> unpkg -> Xenova',
  !!cdnUrls[0]?.includes('cdn.jsdelivr.net/npm/@huggingface/transformers') &&
  !!cdnUrls[1]?.includes('unpkg.com/@huggingface/transformers') &&
  !!cdnUrls[2]?.includes('cdn.jsdelivr.net/npm/@xenova/transformers'),
  cdnUrls.join(' | '));
check('三個鏡像皆為 https', cdnUrls.every(u => u.startsWith('https://')));
check('三個鏡像皆指向 transformers bundle 檔',
  cdnUrls.every(u => /transformers(\.min)?\.js$/.test(u)));

// 透明揭露殘餘風險：前兩條同屬 jsDelivr，三條 URL 只有兩個 CDN 營運者。
// 這不是缺陷，是「單點故障尚未完全消除」的誠實記錄；改動鏡像陣列時會同步檢查。
const cdnHosts = [...new Set(cdnUrls.map(u => new URL(u).hostname))];
check('【已知殘餘風險】三鏡像實際僅 2 個 CDN 營運者（jsDelivr 權重集中）',
  cdnHosts.length === 2, cdnHosts.join(', '));

check('存在 __tfLib 模組快取（避免每次初始化重複下載）',
  /var\s+__tfLib\s*=/.test(html));
check('存在 loadTransformersLib 函式',
  /async\s+function\s+loadTransformersLib\s*\(/.test(html));

// 能力檢查：HTTP 200 不代表模組 API 相容，必須驗 pipeline 確為 function。
const capChecks = (html.match(/typeof\s+\w+\.pipeline\s*===\s*['"]function['"]/g) || []).length;
check('對載入到的模組做 pipeline 能力檢查', capChecks >= 1, `count=${capChecks}`);
check('能力檢查不合格時不靜默採用（改為記錄並續下一個鏡像）',
  /errs\.push\([^)]*無\s*pipeline/.test(html));
check('全鏡像失敗時拋出彙總錯誤（而非只報最後一個）',
  /所有鏡像皆載入失敗/.test(html));

// 可執行程式不得使用 cdnjs；該網址只允許出現在註解中作為失效記錄。
const codeOnly = html
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const cdnjsInCode = (codeOnly.match(/cdnjs\.cloudflare\.com/g) || []).length;
check('可執行程式完全不含 cdnjs 網址（僅註解記錄失效來源）',
  cdnjsInCode === 0, `code hits=${cdnjsInCode}`);
check('失效來源仍留有註解記錄（可溯源，Traceable）',
  /cdnjs\.cloudflare\.com/.test(html));

// 已知行為分歧：@xenova/transformers 2.x 不支援 dtype（僅舊式 quantized），
// 而程式硬傳 dtype:'q8'。它靠 quantized 預設 true 僥倖命中同一個存在的檔名——
// 這是巧合不是契約。列為顯式斷言，使日後無聲退化會被看見。
check('【已知分歧】app 傳 dtype 而末位鏡像為不支援 dtype 的 Xenova 2.x（需持續監控）',
  /dtype\s*:\s*['"]q8['"]/.test(html) && !!cdnUrls[2]?.includes('@xenova/transformers@2.'),
  'dtype:q8 僅 @huggingface/transformers 3.x 認得');

// ---------- 輸出 ----------
console.log(results.join('\n'));
console.log(`\n=== 結果: ${pass} PASS / ${fail} FAIL ===`);

const summary = `OmniSub 驗證: ${pass} passed, ${fail} failed`;
console.log(summary);
window.close();
process.exit(fail > 0 ? 1 : 0);
