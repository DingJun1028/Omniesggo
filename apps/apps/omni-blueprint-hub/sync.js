/* ============================================================
 * 萬能藍圖中心 - 指定轉播共享頁邏輯 (live-sync.html)
 * 讀取 URL ?token= 與 ?host= ，模擬「一台翻譯，全員共享」即時流
 * ============================================================ */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '5T-demo';
  const host = params.get('host') || 'lecturer-a@esggo.app';

  document.getElementById('sync-host').textContent = decodeURIComponent(host);
  document.getElementById('sync-token').textContent = token;

  const hub = new OmniBlueprintHub();
  const bp = hub.createBlueprint('DESIGNATED_URL_BROADCAST', '指定轉播共享頁', host, 'mailto:' + host, ['zh-TW', 'en', 'ja']);
  const product = hub.manifestToProduct(bp);

  const feed = document.getElementById('sync-feed');
  const viewersEl = document.getElementById('sync-viewers');

  // 模擬主帳號即時推播 (一台翻譯 → 全員共享)
  const stream = [
    { o: '各位學員午安，今天我們講解永續報告架構。', t: { 'zh-TW': '各位學員午安，今天我們講解永續報告架構。', en: 'Good afternoon. Today we cover the sustainability report structure.', ja: '皆様、こんにちは。今日はサステナビリティ報告書の構成を解説します。' } },
    { o: '第一支柱：5T 協議確保數據可溯源與不可篡改。', t: { 'zh-TW': '第一支柱：5T 協議確保數據可溯源與不可篡改。', en: 'Pillar 1: 5T protocol ensures traceable and tamper-proof data.', ja: '第1の柱：5Tプロトコルはデータの追跡可能性と改ざん防止を保証。' } },
    { o: '第二支柱：單一資料表收斂所有廣播日誌。', t: { 'zh-TW': '第二支柱：單一資料表收斂所有廣播日誌。', en: 'Pillar 2: single data table converges all broadcast logs.', ja: '第2の柱：単一データテーブルが全ブロードキャストログを集約。' } },
    { o: '現場提問：Hash Lock 如何驗證完整性？', t: { 'zh-TW': '現場提問：Hash Lock 如何驗證完整性？', en: 'Q: How does Hash Lock verify integrity?', ja: '質問：Hash Lock はどう整合性を検証しますか？' } }
  ];
  let i = 0;

  function push() {
    if (i >= stream.length) { i = 0; } // 循環演示
    const s = stream[i++];
    hub.pushBroadcastPayload(product, s.o, s.t);
    const item = product.payloadStream[0];
    const div = document.createElement('div');
    div.className = 'packet';
    div.innerHTML = `
      <div class="origin">🎙 ${item.originText}</div>
      <div class="tr"><span class="lang">EN</span>${item.translatedText.en}</div>
      <div class="tr"><span class="lang">JA</span>${item.translatedText.ja}</div>
      <div class="foot"><span>src: ${item.sourceOrigin}</span><span>hash: ${item.hash.slice(0, 12)}</span><span>${item.timestamp.slice(11, 19)}</span></div>`;
    feed.prepend(div);
    if (feed.children.length > 10) feed.lastChild.remove();
    // 模擬閱聽人數微動
    product.activeViewers = 1 + Math.floor(Math.random() * 24);
    viewersEl.textContent = product.activeViewers;
  }

  push();
  setInterval(push, 3500);
})();
