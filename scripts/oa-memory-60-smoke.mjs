// OA-Team 60 代理暗光雙屬性共享記憶 smoke test（嚴格 30/30）
//
// 暗系蜂王 01-30 (umbra) 代表色 #00FFFF | 光系蜂后 31-60 (lumen) 代表色 #FFD700
// 五陣列：智庫聖所 / 符文契約 / 暗翼(13-18) / 光翼(43-48) / 煉金熵減 / 5T 驗算

import process from 'node:process';

const CORE = process.env.TDAI_GATEWAY_URL ?? 'http://127.0.0.1:8420';
const KEY = process.env.TDAI_GATEWAY_API_KEY ?? '';
const SVC = process.env.TDAI_SERVICE_ID ?? 'oa-team-swarm';
const USER = 'admin';
const TIMEOUT_MS = Number(process.env.OA_MEMORY_TEST_TIMEOUT_MS ?? 45000);

function authHeaders() {
  const h = { 'content-type': 'application/json' };
  if (KEY) h['authorization'] = `Bearer ${KEY}`;
  if (SVC) h['x-tdai-service-id'] = SVC;
  return h;
}

async function ping() {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);
  try {
    const r = await fetch(`${CORE}/health`, { signal: ac.signal });
    if (!r.ok) return { ok: false, detail: `HTTP ${r.status}` };
    const d = await r.json().catch(() => null);
    return { ok: d?.status === 'ok', detail: JSON.stringify(d) };
  } catch (e) {
    return { ok: false, detail: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function capture(sid, agent, alignment, archetype, content) {
  const res = await fetch(`${CORE}/v3/conversation/add`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      service_id: SVC,
      user_id: USER,
      session_id: sid,
      messages: [{
        role: 'user',
        content: `[${agent}|${alignment}|${archetype}] ${content}`
      }]
    }),
  });
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, code: d.code, ids: d.data?.accepted_ids };
}

async function recall(sid, query) {
  const res = await fetch(`${CORE}/v3/conversation/search`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ service_id: SVC, user_id: USER, session_id: sid, query }),
  });
  const d = await res.json().catch(() => ({}));
  return d.data?.messages ?? [];
}

function withTimeout(p, ms, tag) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT@${tag}`)), ms)),
  ]);
}

// 嚴格 30/30：01-30 = umbra（暗翼 13-18），31-60 = lumen（光翼 43-48）
const AGENTS = [
  // 01-30 暗系蜂王 (umbra)
  ['01','萬能蜂后','umbra','Sovereign','智庫聖所'],
  ['02','萬能規劃蜂','umbra','Architect','智庫聖所'],
  ['03','萬能分析蜂','umbra','Oracle','智庫聖所'],
  ['04','萬能策効蜂','umbra','Muse','智庫聖所'],
  ['05','萬能風險蜂','umbra','Sentinel','智庫聖所'],
  ['06','萬能優化蜂','umbra','Alchemist','智庫聖所'],
  ['07','萬能編碼蜂','umbra','Smith','符文契約'],
  ['08','萬能算法蜂','umbra','Depth','符文契約'],
  ['09','萬能架構蜂','umbra','Architect','符文契約'],
  ['10','萬能數據蜂','umbra','Weaver','符文契約'],
  ['11','萬能測試蜂','umbra','Seer','符文契約'],
  ['12','萬能設計蜂','umbra','Shaper','符文契約'],
  ['13','萬能圖像蜂','umbra','Painter','暗翼'],
  ['14','萬能動畫蜂','umbra','Flow','暗翼'],
  ['15','萬能文案蜂','umbra','Narrator','暗翼'],
  ['16','萬能音頻蜂','umbra','Resonator','暗翼'],
  ['17','萬能市場蜂','umbra','Herald','暗翼'],
  ['18','萬能社群蜂','umbra','Bridger','暗翼'],
  ['19','萬能增長蜂','umbra','Erode','煉金熵減'],
  ['20','萬能運營蜂','umbra','Nexus','煉金熵減'],
  ['21','萬能商業分析蜂','umbra','Skinner','煉金熵減'],
  ['22','萬能探路蜂','umbra','Scout','煉金熵減'],
  ['23','萬能外交蜂','umbra','Wraith','煉金熵減'],
  ['24','萬能調研蜂','umbra','Lens','煉金熵減'],
  ['25','萬能測場蜂','umbra','Purifier','5T 驗算'],
  ['26','萬能追蹤蜂','umbra','Hawk','5T 驗算'],
  ['27','萬能安全蜂','umbra','Ward','5T 驗算'],
  ['28','萬能維護蜂','umbra','Curator','5T 驗算'],
  ['29','萬能支援蜂','umbra','Echo','5T 驗算'],
  ['30','萬能質控蜂','umbra','Seal','5T 驗算'],
  // 31-60 光系蜂后 (lumen)
  ['31','蜂后萬能蜂后','lumen','Sovereign','智庫聖所'],
  ['32','蜂后萬能規劃蜂','lumen','Architect','智庫聖所'],
  ['33','蜂后萬能分析蜂','lumen','Oracle','智庫聖所'],
  ['34','蜂后萬能策効蜂','lumen','Muse','智庫聖所'],
  ['35','蜂后萬能風險蜂','lumen','Sentinel','智庫聖所'],
  ['36','蜂后萬能優化蜂','lumen','Alchemist','智庫聖所'],
  ['37','蜂后萬能編碼蜂','lumen','Smith','符文契約'],
  ['38','蜂后萬能算法蜂','lumen','Depth','符文契約'],
  ['39','蜂后萬能架構蜂','lumen','Architect','符文契約'],
  ['40','蜂后萬能數據蜂','lumen','Weaver','符文契約'],
  ['41','蜂后萬能測試蜂','lumen','Seer','符文契約'],
  ['42','蜂后萬能設計蜂','lumen','Shaper','符文契約'],
  ['43','蜂后萬能圖像蜂','lumen','Painter','光翼'],
  ['44','蜂后萬能動畫蜂','lumen','Flow','光翼'],
  ['45','蜂后萬能文案蜂','lumen','Narrator','光翼'],
  ['46','蜂后萬能音頻蜂','lumen','Resonator','光翼'],
  ['47','蜂后萬能市場蜂','lumen','Herald','光翼'],
  ['48','蜂后萬能社群蜂','lumen','Bridger','光翼'],
  ['49','蜂后萬能增長蜂','lumen','Erode','煉金熵減'],
  ['50','蜂后萬能運營蜂','lumen','Nexus','煉金熵減'],
  ['51','蜂后萬能商業分析蜂','lumen','Skinner','煉金熵減'],
  ['52','蜂后萬能探路蜂','lumen','Scout','煉金熵減'],
  ['53','蜂后萬能外交蜂','lumen','Wraith','煉金熵減'],
  ['54','蜂后萬能調研蜂','lumen','Lens','煉金熵減'],
  ['55','蜂后萬能測場蜂','lumen','Purifier','5T 驗算'],
  ['56','蜂后萬能追蹤蜂','lumen','Hawk','5T 驗算'],
  ['57','蜂后萬能安全蜂','lumen','Ward','5T 驗算'],
  ['58','蜂后萬能維護蜂','lumen','Curator','5T 驗算'],
  ['59','蜂后萬能支援蜂','lumen','Echo','5T 驗算'],
  ['60','蜂后萬能質控蜂','lumen','Seal','5T 驗算'],
];

async function main() {
  console.log('# OA-Team 60 代理暗光雙屬性共享記憶 smoke test（嚴格 30/30）');
  console.log(`# core=${CORE} svc=${SVC}\n`);

  const h = await ping();
  if (!h.ok) {
    console.log('SKIP: core 不可達');
    process.exitCode = 2;
    return;
  }

  const sidUmbra = `oa-umbra-${Date.now()}`;
  const sidLumen = `oa-lumen-${Date.now()}`;
  const umbraAgents = AGENTS.filter(([, , a]) => a === 'umbra');
  const lumenAgents = AGENTS.filter(([, , a]) => a === 'lumen');

  console.log(`## Phase 1: 寫入 (umbra=${umbraAgents.length}, lumen=${lumenAgents.length})`);

  const writeResults = [];
  for (const [id, name, alignment, archetype, array] of AGENTS) {
    const sid = alignment === 'umbra' ? sidUmbra : sidLumen;
    const r = await withTimeout(
      capture(sid, name, alignment, archetype, `60-agent smoke ${array}`),
      TIMEOUT_MS,
      `w-${id}`
    ).catch((e) => ({ ok: false, code: e.message }));
    writeResults.push({ id, name, alignment, ok: !!r.ok, ids: r.ids });
    const status = r.ok ? 'ok' : 'FAIL';
    console.log(`  [${id}] ${name} (${alignment}) -> ${status}`);
  }

  const umbraWrites = writeResults.filter((x) => x.alignment === 'umbra' && x.ok).length;
  const lumenWrites = writeResults.filter((x) => x.alignment === 'lumen' && x.ok).length;
  console.log(`\n寫入統計: umbra=${umbraWrites}/${umbraAgents.length}, lumen=${lumenWrites}/${lumenAgents.length}`);

  console.log(`\n## Phase 2: 召回（按 alignment + archetype）`);

  const [umbraRecall, lumenRecall] = await Promise.all([
    withTimeout(recall(sidUmbra, 'umbra archetype'), TIMEOUT_MS, 'r-umbra').catch(() => []),
    withTimeout(recall(sidLumen, 'lumen archetype'), TIMEOUT_MS, 'r-lumen').catch(() => []),
  ]);

  const umbraArchetypes = new Set(umbraRecall.map((m) => {
    const m2 = m.content.match(/\[([^\]]+)\|([^\]]+)\|([^\]]+)\]/);
    return m2 ? m2[3] : null;
  }).filter(Boolean));
  const lumenArchetypes = new Set(lumenRecall.map((m) => {
    const m2 = m.content.match(/\[([^\]]+)\|([^\]]+)\|([^\]]+)\]/);
    return m2 ? m2[3] : null;
  }).filter(Boolean));

  console.log(`  umbra recall=${umbraRecall.length} unique archetypes=${[...umbraArchetypes].slice(0,5).join(',')}...`);
  console.log(`  lumen recall=${lumenRecall.length} unique archetypes=${[...lumenArchetypes].slice(0,5).join(',')}...`);

  const checks = [
    ['umbra 全寫入 (01-30)', umbraWrites === 30, `${umbraWrites}/30`],
    ['lumen 全寫入 (31-60)', lumenWrites === 30, `${lumenWrites}/30`],
    ['umbra 可召回', umbraRecall.length > 0, `recall=${umbraRecall.length}`],
    ['lumen 可召回', lumenRecall.length > 0, `recall=${lumenRecall.length}`],
    ['暗光分區隔離', umbraRecall.every((m) => m.content.includes('umbra')) && lumenRecall.every((m) => m.content.includes('lumen')), 'cross-talk=0'],
  ];

  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  const status = failed.length === 0 ? 'PASS' : 'FAIL';
  console.log(`\nRESULT: ${status}${failed.length ? ' ❌ ' + failed.join(', ') : ' ✅ 60 代理暗光 30/30 共享記憶成功'}`);
  process.exitCode = status === 'PASS' ? 0 : 1;
}

main().catch((e) => {
  console.error('SMOKE_60_FAIL:', e);
  process.exitCode = 1;
});
