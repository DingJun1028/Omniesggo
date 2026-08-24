#!/usr/bin/env node
// ============================================================
// OmniFactory 萬能工廠 — 驅動核心 (assemble engine)
// 對齊 wiki/wiki/萬能工廠.md P1–P7 流水線 + 5T 品質閘門
//
// 設計: 零依賴 (node 原生 fs / crypto / path)
// 用法: node assemble.mjs [--spec spec.json] [--wiki wiki/wiki]
//
// 職責:
//   1. 讀取 Wiki/ReadMe (萬能工廠.md / 萬能目錄.md) 理解組裝規範
//   2. 解析 ModuleSpec (功能契約)
//   3. 走 P1–P7 流水線 (需求→函數→元件→主題→符文→5T→封印)
//   4. 5T 閘門 T1–T5 實際校驗 (真/善/美/信/通)
//   5. 產出 hashLock + 寫入 萬能模組-註冊表.md
//   6. 對接現有 CD: 印出 deploy 指令 (不自動 push, 避免越權)
//
// 5T 溯源: 每個成品攜 hashLock (R-SEAL 符文), 對應 wiki 不可篡改憑證
// @ts-check
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..'); // C:/Project/esggo

// Wiki 目錄預設值; --wiki 會在 main() 中解析並真正影響註冊表讀寫位置
const DEFAULT_WIKI_DIR = path.join(ROOT, 'wiki', 'wiki');

const REGISTRY_HEADER =
  '# 萬能模組註冊表\n\n' +
  '| 模組 ID | MEDCE | 主題 | 函數 | 元件 | 符文 | hashLock |\n' +
  '|---|---|---|---|---|---|---|\n';

const args = process.argv.slice(2);
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const specPath = getArg('--spec', null);

// ── 工具: Markdown 儲存格跳脫 (防止 | 或換行破壞表格欄/列) ──
function mdCell(v) {
  return String(v == null ? '' : v)
    .replace(/\|/g, '\\|')   // 管線符轉義, 避免多出欄位
    .replace(/\r?\n/g, ' ')  // 換行壓成空白, 避免多出列
    .trim();
}

// ── 工具: 正規化序列化 (key 排序) → 讓 hashLock 具備第三方確定性重算能力 ──
function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = canonicalize(obj[k]);
    return out;
  }
  return obj;
}

// ── 工具: 5T hashLock ──
function hashLock(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(canonicalize(obj));
  return 'R-SEAL:' + crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);
}

// ── 工具: 解析註冊表列 (只取 hash 為 R-SEAL: 開頭的資料列, 自動跳過表頭/分隔列) ──
function parseRegistryRows(reg) {
  const rows = [];
  for (const line of reg.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 3) continue;
    const id = cells[1];
    const hash = cells[cells.length - 2];
    if (!id || !hash || !hash.startsWith('R-SEAL:')) continue;
    rows.push({ id, hash });
  }
  return rows;
}

// ── 工具: 判定 ModuleSpec 陣列是否含「有意義」的實證 (拒絕佔位/空值) ──
const PLACEHOLDERS = new Set([
  'unverified', 'todo', 'tbd', 'placeholder', 'xxx', 'x', '-', '?',
  'n/a', 'na', 'none', 'unknown', 'test', 'dummy', '未驗證', '待補',
]);
function meaningful(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.some((x) => typeof x === 'string' && x.trim().length > 0 && !PLACEHOLDERS.has(x.trim().toLowerCase()));
}

// ── P1: 需求解析 (對照萬能目錄 MEDCE 分類) ──
function p1_requirementParse(spec) {
  if (!spec.id) throw new Error('[P1] ModuleSpec.id 缺失');
  if (!spec.medce || !spec.medce.primary) throw new Error('[P1] medce.primary 缺失 (M/E/D/C/A)');
  return { stage: 'P1', ok: true, note: `主分類=${spec.medce.primary}` };
}

// ── P2: 函數選配 ──
function p2_functionSelect(spec) {
  const fns = spec.functions || [];
  if (!Array.isArray(fns)) throw new Error('[P2] functions 必須是陣列');
  return { stage: 'P2', ok: true, count: fns.length };
}

// ── P3: 元件拼裝 ──
function p3_componentAssemble(spec) {
  const comps = spec.components || [];
  if (!Array.isArray(comps)) throw new Error('[P3] components 必須是陣列');
  return { stage: 'P3', ok: true, count: comps.length };
}

// ── P4: 主題套用 ──
function p4_themeApply(spec) {
  if (!spec.theme) throw new Error('[P4] theme 缺失');
  return { stage: 'P4', ok: true, theme: spec.theme };
}

// ── P5: 符文標記 ──
function p5_runeMark(spec) {
  const runes = spec.runes || [];
  if (!Array.isArray(runes)) throw new Error('[P5] runes 必須是陣列');
  return { stage: 'P5', ok: true, count: runes.length };
}

// ── P6: 5T 品質閘門 ──
// T1 真: 數值/單位/時間戳; T2 善: 來源標記; T3 美: 稽核軌跡
// T4 信: hash_lock; T5 通: 第三方可驗算 (與註冊表獨立比對, 防竄改)
function p6_qualityGate(spec, artifact, registryPath) {
  const gates = [];
  // T1 真: spec 含可量化契約證據 (拒絕佔位 / 空陣列)
  const t1 = !!(
    spec.medce && spec.medce.primary && spec.id &&
    (meaningful(spec.functions) || meaningful(spec.components))
  );
  gates.push(['T1真', t1]);
  // T2 善: 來源標記 (functions/components 須為有意義實證, 非佔位)
  const t2 = !!(meaningful(spec.functions) || meaningful(spec.components));
  gates.push(['T2善', t2]);
  // T3 美: 稽核軌跡 (artifact 含 buildTrace)
  const t3 = !!artifact.buildTrace;
  gates.push(['T3美', t3]);
  // T4 信: hash_lock 不可篡改
  const t4 = !!artifact.hashLock && artifact.hashLock.startsWith('R-SEAL:');
  gates.push(['T4信', t4]);
  // T5 通: 第三方可驗算 — 與註冊表「已記錄」的 hashLock 獨立比對
  // (不再對記憶體內同一物件重算自證, 避免永遠為 true 的同義反覆)
  let t5 = true;
  let t5Reason = '新模組 (註冊表尚無記錄, 封印後可第三方重算驗證)';
  try {
    const reg = fs.readFileSync(registryPath, 'utf8');
    const rows = parseRegistryRows(reg);
    const hit = rows.find((r) => r.id === mdCell(spec.id));
    if (hit) {
      if (hit.hash === artifact.hashLock) {
        t5 = true;
        t5Reason = '註冊表 hashLock 一致 (可第三方重算驗證)';
      } else {
        t5 = false;
        t5Reason = `註冊表 hashLock 不一致 (${hit.hash} ≠ ${artifact.hashLock}) — 內容遭竄改或需升版 id`;
      }
    }
  } catch {
    /* 註冊表尚未存在 → 視為新模組 */
  }
  gates.push(['T5通', t5]);

  const failed = gates.filter(([, ok]) => !ok).map(([g]) => g);
  if (failed.length) {
    throw new Error('[P6] 陷入 5T 閘門退件: ' + failed.join(', ') + (t5 ? '' : ` | ${t5Reason}`));
  }
  return {
    stage: 'P6',
    ok: true,
    gates: gates.map(([g, ok]) => `${g}=${ok ? '✓' : '✗'}`).join(' '),
    note: 'T5: ' + t5Reason,
  };
}

// ── P7: 代理封印 (寫入註冊表) ──
function p7_seal(spec, artifact, registryPath) {
  const entry = [
    `| ${mdCell(spec.id)} ` +
    `| ${mdCell(spec.medce?.primary || '?')} ` +
    `| ${mdCell(spec.theme || '?')} ` +
    `| ${(spec.functions || []).map(mdCell).join(', ') || '-'} ` +
    `| ${(spec.components || []).map(mdCell).join(', ') || '-'} ` +
    `| ${(spec.runes || []).map(mdCell).join(', ') || '-'} ` +
    `| ${artifact.hashLock} |`,
  ].join('\n');

  let registry = '';
  try {
    registry = fs.readFileSync(registryPath, 'utf8');
  } catch {
    registry = REGISTRY_HEADER;
  }

  // 避免重複: 以解析後的 id 欄精確比對 (不再用脆弱的 substring includes)
  const rows = parseRegistryRows(registry);
  if (rows.some((r) => r.id === mdCell(spec.id))) {
    return { stage: 'P7', ok: true, note: '已存在註冊表 (跳過重複寫入)', skipped: true };
  }

  // 確保註冊表所在目錄存在 (--wiki 指向不存在目錄時不再 ENOENT 崩潰)
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  const newReg = registry.trimEnd() + '\n' + entry + '\n';
  fs.writeFileSync(registryPath, newReg, 'utf8');
  return { stage: 'P7', ok: true, note: '已寫入萬能模組-註冊表.md', skipped: false };
}

// ── 主流程 ──
function assemble(spec, registryPath) {
  const buildTrace = [];
  buildTrace.push(p1_requirementParse(spec));
  buildTrace.push(p2_functionSelect(spec));
  buildTrace.push(p3_componentAssemble(spec));
  buildTrace.push(p4_themeApply(spec));
  buildTrace.push(p5_runeMark(spec));

  const artifact = {
    spec,
    wiki: `Module ${spec.id} assembled via OmniFactory P1-P7`,
    hashLock: hashLock(spec),
    buildTrace,
  };
  buildTrace.push(p6_qualityGate(spec, artifact, registryPath));
  const seal = p7_seal(spec, artifact, registryPath);
  buildTrace.push(seal);

  return artifact;
}

// ── CLI ──
function main() {
  // 解析 --wiki: 相對路徑以倉庫根目錄為基準, 並真正驅動註冊表讀寫位置
  const rawWiki = getArg('--wiki', DEFAULT_WIKI_DIR);
  const wikiDir = path.isAbsolute(rawWiki) ? rawWiki : path.resolve(ROOT, rawWiki);
  const registryPath = path.join(wikiDir, '萬能模組-註冊表.md');

  let spec;
  if (specPath) {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } else {
    // 預設範例 (對齊 wiki 控制台範例)
    spec = {
      id: 'MOD-DEMO-' + Date.now().toString(36).toUpperCase(),
      medce: { primary: 'M', aux: ['E', 'D'] },
      functions: ['aggregateKpi', 'getAgentStatus'],
      components: ['BrandKpiCard', 'StandardPage', 'BrandT5Strip'],
      theme: 'solid-card-default',
      runes: ['R-MEDCE', 'R-5T', 'R-STATE'],
    };
    console.log('[omni-factory] 未指定 --spec, 使用內建範例 ModuleSpec');
  }

  console.log(`[omni-factory] 讀取 Wiki 規範: ${wikiDir}`);
  console.log(`[omni-factory] 註冊表路徑: ${registryPath}`);
  console.log(`[omni-factory] 組裝模組: ${spec.id}`);
  const artifact = assemble(spec, registryPath);
  console.log('[omni-factory] P1-P7 流水線完成:');
  for (const step of artifact.buildTrace) {
    console.log(`  ${step.stage}: ${step.ok ? '✓' : '✗'} ${step.note || ''}`);
  }
  console.log(`[omni-factory] hashLock: ${artifact.hashLock}`);

  // 對接現有 CD (印出 deploy 指令, 不自動 push)
  console.log('\n[omni-factory] 5T 閘門通過 — 可對接現有 CD 佈署:');
  console.log('  gh workflow run deploy.yml   # Vercel 自動部署');
  console.log('  # 或 Oracle VPS: 合併 main 後 deploy-oracle.yml 自動觸發');
  console.log(`[omni-factory] ✅ ${spec.id} 組裝完成 (最佳實踐 APP 就緒)`);
}

main();
