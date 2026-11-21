/* ============================================================
 * 萬能藍圖中心 - 控制中樞儀表板邏輯 (index.html)
 * ============================================================ */
(function () {
  'use strict';

  const hub = new OmniBlueprintHub();

  // ---- 鑄造兩大藍圖 (對齊 .ts 實機驗證) ----
  const live = hub.createBlueprint(
    'LIVE_BROADCAST', '即時串流轉播', 'master@esggo.app',
    'https://api.esggo.app/stream/xxx', ['en', 'ja', 'zh-TW']
  );
  const liveProduct = hub.manifestToProduct(live);
  hub.pushBroadcastPayload(liveProduct, '永續報告書數據 ISO-14064-1 驗算已通過。', {
    en: 'Sustainability report data verified under ISO-14064-1.',
    ja: '持続可能性レポートデータは ISO-14064-1 に基づいて検証されました。'
  });

  const designated = hub.createBlueprint(
    'DESIGNATED_URL_BROADCAST', '主帳號 Email 翻譯共享廣播',
    'chief-strategy-officer@esggo.app', 'mailto:chief-strategy-officer@esggo.app', ['en', 'ja']
  );
  const designatedProduct = hub.manifestToProduct(designated);
  hub.pushBroadcastPayload(designatedProduct,
    '主帳號來信：請確認 5T 協議單一資料表之 Hash Lock 是否完全凍結。', {
    en: 'Host Email: Please confirm whether the Hash Lock of the 5T protocol single table is fully frozen.',
    ja: 'ホストメール：5Tプロトコル単一データテーブルのHash Lockが完全凍結されているか確認してください。'
  });

  // ---- 渲染：產品卡 ----
  const products = [liveProduct, designatedProduct];
  const pc = document.getElementById('product-cards');
  pc.innerHTML = products.map(p => `
    <div class="product">
      <div class="name">${p.productName}</div>
      <span class="type">${p.blueprintId.includes('DESIGNATED') ? 'DESIGNATED_URL_BROADCAST' : 'LIVE_BROADCAST'}</span>
      <span class="status">${p.status}</span>
      ${p.broadcastUrl ? `<div class="url">🔗 ${p.broadcastUrl}</div>` : ''}
      <div class="viewers">👁 在線閱聽：${p.activeViewers} ｜ 已推播：${p.payloadStream.length} 筆</div>
    </div>`).join('');

  // ---- 渲染：單一資料表 ----
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = hub.getUnifiedTable().map(r => `
    <tr>
      <td class="mono">${r.id.slice(0, 18)}…</td>
      <td>${r.entityType}</td>
      <td>${r.blueprintType}</td>
      <td>${r.hostEmail}</td>
      <td class="mono">${r.hashLock.slice(0, 16)}…</td>
    </tr>`).join('');

  document.getElementById('table-count').textContent = hub.getUnifiedTable().length;

  // ---- 5T 協議高亮 ----
  document.querySelectorAll('.t5').forEach(el => el.classList.add('on'));

  // ---- 頂欄 meta ----
  document.getElementById('meta-version').textContent = OBH_VERSION;
  document.getElementById('meta-time').textContent = new Date().toISOString().slice(11, 19);

  // ---- 模擬即時流 (live 產品持續推播) ----
  const samples = [
    { o: '碳盤查邊界已擴展至範疇三。', t: { en: 'Scope 3 added to inventory boundary.', ja: 'インベントリ境界にスコープ3を追加。' } },
    { o: '減量目標通過 SBTi 審核。', t: { en: 'Reduction target approved by SBTi.', ja: 'SBTiにより削減目標を承認。' } },
    { o: '供應鏈數據回收率達 92%。', t: { en: 'Supplier data coverage reached 92%.', ja: 'サプライヤーデータ網羅率92%達成。' } }
  ];
  let si = 0;
  const liveFeed = document.getElementById('live-feed');
  setInterval(() => {
    const s = samples[si % samples.length]; si++;
    hub.pushBroadcastPayload(liveProduct, s.o, s.t);
    const item = liveProduct.payloadStream[0];
    const div = document.createElement('div');
    div.className = 'packet';
    div.innerHTML = `
      <div class="origin">📡 ${item.originText}</div>
      <div class="tr"><span class="lang">EN</span>${item.translatedText.en}</div>
      <div class="tr"><span class="lang">JA</span>${item.translatedText.ja}</div>
      <div class="foot"><span>src: ${item.sourceOrigin}</span><span>hash: ${item.hash.slice(0, 12)}</span><span>${item.timestamp.slice(11, 19)}</span></div>`;
    liveFeed.prepend(div);
    if (liveFeed.children.length > 8) liveFeed.lastChild.remove();
    document.getElementById('live-count').textContent = liveProduct.payloadStream.length;
  }, 4000);
})();
