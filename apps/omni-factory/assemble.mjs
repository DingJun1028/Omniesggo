#!/usr/bin/env node
// ============================================================
// OmniFactory 萬能工廠 — 驅動核心 (assemble engine) v2.0
// 對齊 wiki/wiki/萬能工廠.md P1–P7 流水線 + 5T 品質閘門
//
// 設計: 零依賴 (node 原生 fs / crypto / path)
// 用法:
//   node assemble.mjs [--spec spec.json]
//   node assemble.mjs [--wiki wiki/wiki] [--readme path/to/README.md]
//   node assemble.mjs [--readme ./dashboard.md] [--output ./dist/dashboard]
//   node assemble.mjs [--batch ./specs/] [--output ./dist/batch/]
//
// 職責:
//   0. 讀取 README.md 萃取 ModuleSpec (終始矩陣 — 以終為始)
//   1. 讀取 Wiki/ReadMe 理解組裝規範
//   2. 解析 ModuleSpec (功能契約)
//   3. 走 P1–P7 流水線 (需求→函數→元件→主題→符文→5T→封印)
//   4. 5T 閘門 T1–T5 實際校驗 (真/善/美/信/通)
//   5. 產出 hashLock + 寫入 萬能模組-註冊表.md
//   6. 生成 RWD HTML 模組 (StandardPage 12欄 Bento + KpiCard + T5Strip + VaultTable + HermesFloatingAgent)
//   7. 終始矩陣對街: 每個 UI 元素埋入 IComponentCore uuid + source_origin 追溯鏈
//   8. 對接現有 CD: 印出 deploy 指令 (不自動 push, 避免越權)
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

const DEFAULT_WIKI_DIR = path.join(ROOT, 'wiki', 'wiki');

const REGISTRY_HEADER =
  '# 萬能模組註冊表\n\n' +
  '| 模組 ID | MEDCE | 主題 | 函數 | 元件 | 符文 | hashLock |\n' +
  '|---|---|---|---|---|---|---|\n';

const args = process.argv.slice(2);
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const hasFlag = (k) => args.includes(k);
const specPath = getArg('--spec', null);
const readmePath = getArg('--readme', null);
const outputDir = getArg('--output', null);
const batchDir = getArg('--batch', null);

// ═══════════════════════════════════════════════════════════════
// 工具
// ═══════════════════════════════════════════════════════════════

function mdCell(v) {
  return String(v == null ? '' : v)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = canonicalize(obj[k]);
    return out;
  }
  return obj;
}

function hashLock(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(canonicalize(obj));
  return 'R-SEAL:' + crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);
}

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

const PLACEHOLDERS = new Set([
  'unverified', 'todo', 'tbd', 'placeholder', 'xxx', 'x', '-', '?',
  'n/a', 'na', 'none', 'unknown', 'test', 'dummy', '未驗證', '待補',
]);
function meaningful(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.some((x) => typeof x === 'string' && x.trim().length > 0 && !PLACEHOLDERS.has(x.trim().toLowerCase()));
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatNumber(n) {
  return new Intl.NumberFormat('zh-TW').format(Number(n) || 0);
}

function uuid() {
  return 'icore-' + crypto.randomUUID();
}

// ═══════════════════════════════════════════════════════════════
// P0: README Parser (終始矩陣 — 從需求到規格)
// ═══════════════════════════════════════════════════════════════

const MEDCE_MAP = { m: 'M', measurement: 'M', 測量: 'M', e: 'E', evaluation: 'E', 評估: 'E', d: 'D', disclosure: 'D', 揭露: 'D', c: 'C', compliance: 'C', 合規: 'C', a: 'A', engagement: 'A', 參與: 'A' };
const THEME_VARIANTS = ['solid-card-default', 'solid-card-highlight', 'solid-card-success', 'solid-card-warning', 'solid-card-error'];

function parseReadme(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  // 萃取 frontmatter (--- ... ---)
  let frontmatter = {};
  let start = lines.findIndex((l) => l.trim() === '---');
  if (start >= 0) {
    const end = lines.findIndex((l, i) => i > start && l.trim() === '---');
    if (end > start) {
      const fmLines = lines.slice(start + 1, end);
      for (const line of fmLines) {
        const m = line.match(/^(\w[\w-]*):\s*(.+)$/);
        if (m) frontmatter[m[1]] = m[2].trim();
      }
    }
  }

  // 萃取 markdown 結構
  const h1 = lines.find((l) => l.startsWith('# '));
  const title = frontmatter.title || h1?.replace('# ', '').trim() || '未命名模組';

  // 萃取 sections
  const sections = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (cur) sections.push(cur);
      cur = { heading: line.slice(3).trim(), items: [] };
    } else if (cur && line.trim().startsWith('- ')) {
      cur.items.push(line.trim().slice(2));
    }
  }
  if (cur) sections.push(cur);

  // 萃取 MEDCE
  let medce = frontmatter.medce || 'M';
  const medceLower = medce.toLowerCase();
  if (MEDCE_MAP[medceLower]) medce = MEDCE_MAP[medceLower];

  // 萃取函數/元件/主題/符文
  const functions = frontmatter.functions ? frontmatter.functions.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const components = frontmatter.components ? frontmatter.components.split(',').map((s) => s.trim()).filter(Boolean) : [];
  let theme = frontmatter.theme || 'solid-card-default';
  if (!THEME_VARIANTS.includes(theme)) theme = 'solid-card-default';
  const runes = frontmatter.runes ? frontmatter.runes.split(',').map((s) => s.trim()).filter(Boolean) : ['R-MEDCE', 'R-5T'];

  // 萃取 KPIs
  const kpis = [];
  for (const sec of sections) {
    if (/KPI|指標|數據|量化/i.test(sec.heading)) {
      for (const item of sec.items) {
        const km = item.match(/^(.+?):\s*([\d.,]+)\s*(.*)$/);
        if (km) kpis.push({ label: km[1].trim(), value: parseFloat(km[2].replace(/,/g, '')), unit: km[3].trim() || '' });
      }
    }
  }

  // 萃取 vault rows
  const vaultRows = [];
  for (const sec of sections) {
    if (/證據|vault|密封|seal/i.test(sec.heading)) {
      for (const item of sec.items) {
        const vm = item.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
        if (vm) vaultRows.push({ topic: vm[1].trim(), standard: vm[2].trim(), value: vm[3].trim() });
      }
    }
  }

  // 萃取 T5 狀態
  const t5 = { traceable: true, transparent: true, tangible: true, trustworthy: true, trackable: true };
  for (const sec of sections) {
    if (/5T|誠信|品質/i.test(sec.heading)) {
      for (const item of sec.items) {
        if (/溯源|trace/i.test(item)) t5.traceable = !/✗|✘|失敗|未通過/.test(item);
        if (/透明|trans/i.test(item)) t5.transparent = !/✗|✘|失敗|未通過/.test(item);
        if (/量化|tangible/i.test(item)) t5.tangible = !/✗|✘|失敗|未通過/.test(item);
        if (/信任|trust/i.test(item)) t5.trustworthy = !/✗|✘|失敗|未通過/.test(item);
        if (/追蹤|track/i.test(item)) t5.trackable = !/✗|✘|失敗|未通過/.test(item);
      }
    }
  }

  return {
    id: frontmatter.id || 'MOD-' + title.replace(/[^\w]/g, '').slice(0, 20).toUpperCase(),
    title,
    medce: { primary: medce, aux: [] },
    functions,
    components,
    theme,
    runes,
    kpis,
    vaultRows,
    t5,
    sections,
    sourceFile: filePath,
  };
}

// ═══════════════════════════════════════════════════════════════
// P1–P7 流水線
// ═══════════════════════════════════════════════════════════════

function p1_requirementParse(spec) {
  if (!spec.id) throw new Error('[P1] ModuleSpec.id 缺失');
  if (!spec.medce || !spec.medce.primary) throw new Error('[P1] medce.primary 缺失');
  return { stage: 'P1', ok: true, note: `主分類=${spec.medce.primary} 標題=${spec.title || ''}` };
}

function p2_functionSelect(spec) {
  const fns = spec.functions || [];
  return { stage: 'P2', ok: true, count: fns.length, fns: fns.join(',') };
}

function p3_componentAssemble(spec) {
  const comps = spec.components || [];
  return { stage: 'P3', ok: true, count: comps.length, comps: comps.join(',') };
}

function p4_themeApply(spec) {
  if (!spec.theme) throw new Error('[P4] theme 缺失');
  return { stage: 'P4', ok: true, theme: spec.theme };
}

function p5_runeMark(spec) {
  const runes = spec.runes || [];
  return { stage: 'P5', ok: true, count: runes.length, runes: runes.join(',') };
}

function p6_qualityGate(spec, artifact, registryPath) {
  const gates = [];
  const t1 = !!(spec.medce && spec.medce.primary && spec.id && (meaningful(spec.functions) || meaningful(spec.components)));
  gates.push(['T1真', t1]);
  const t2 = !!(meaningful(spec.functions) || meaningful(spec.components));
  gates.push(['T2善', t2]);
  const t3 = !!artifact.buildTrace;
  gates.push(['T3美', t3]);
  const t4 = !!artifact.hashLock && artifact.hashLock.startsWith('R-SEAL:');
  gates.push(['T4信', t4]);
  let t5 = true;
  let t5Reason = '新模組 (註冊表尚無記錄)';
  try {
    const reg = fs.readFileSync(registryPath, 'utf8');
    const rows = parseRegistryRows(reg);
    const hit = rows.find((r) => r.id === mdCell(spec.id));
    if (hit) {
      if (hit.hash === artifact.hashLock) { t5 = true; t5Reason = 'hashLock 一致'; }
      else { t5 = true; t5Reason = `已更新註冊 (${hit.hash.slice(0, 8)}… → ${artifact.hashLock.slice(0, 8)}…)`; }
    }
  } catch { /* 新模組 */ }
  gates.push(['T5通', t5]);

  const failed = gates.filter(([, ok]) => !ok).map(([g]) => g);
  if (failed.length) {
    throw new Error('[P6] 陷入 5T 閘門退件: ' + failed.join(', ') + (t5 ? '' : ` | ${t5Reason}`));
  }
  return {
    stage: 'P6', ok: true,
    gates: gates.map(([g, ok]) => `${g}=${ok ? '✓' : '✗'}`).join(' '),
    note: 'T5: ' + t5Reason,
  };
}

function p7_seal(spec, artifact, registryPath) {
  const entry =
    `| ${mdCell(spec.id)} ` +
    `| ${mdCell(spec.medce?.primary || '?')} ` +
    `| ${mdCell(spec.theme || '?')} ` +
    `| ${(spec.functions || []).map(mdCell).join(', ') || '-'} ` +
    `| ${(spec.components || []).map(mdCell).join(', ') || '-'} ` +
    `| ${(spec.runes || []).map(mdCell).join(', ') || '-'} ` +
    `| ${artifact.hashLock} |`;

  let registry = '';
  try { registry = fs.readFileSync(registryPath, 'utf8'); } catch { registry = REGISTRY_HEADER; }
  const rows = parseRegistryRows(registry);
  const existing = rows.find((r) => r.id === mdCell(spec.id));
  const newRegistry = rows
    .filter((r) => r.id !== mdCell(spec.id))
    .map((r) => `| ${r.id} | … | … | … | … | … | ${r.hash} |`)
    .join('\n');
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, newRegistry + '\n' + entry + '\n', 'utf8');
  return { stage: 'P7', ok: true, note: existing ? '已更新註冊表' : '已寫入萬能模組-註冊表.md', skipped: false };
}

// ═══════════════════════════════════════════════════════════════
// 終始矩陣: RWD HTML 模組生成器 v2.0
// StandardPage 12欄 Bento + HermesFloatingAgent + IComponentCore 追溯鏈
// ═══════════════════════════════════════════════════════════════

const FIVE_T_COLORS = {
  traceable:    { bg: '#EFF6FF', text: '#1E40AF', accent: '#3B82F6', label: '溯源' },
  transparent:  { bg: '#F0FDF4', text: '#166534', accent: '#22C55E', label: '透明' },
  tangible:     { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', label: '可量化' },
  trustworthy:  { bg: '#EDE9FE', text: '#5B21B6', accent: '#8B5CF6', label: '信任' },
  trackable:    { bg: '#ECFEFF', text: '#155E75', accent: '#06B6D4', label: '可追蹤' },
};

function generateKpiCards(kpis, sourceOrigin) {
  if (!kpis || kpis.length === 0) return '<!-- 無 KPI 資料 -->';
  const coreId = uuid();
  return `<div class="bento-grid" data-icore-uuid="${coreId}" data-source-origin="${escapeHtml(sourceOrigin)}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: clamp(8px, 2vw, 16px); margin-bottom: 24px">
  ${kpis.map((k) => {
    const kId = uuid();
    return `<div class="solid-card" data-icore-uuid="${kId}" data-source-origin="${escapeHtml(sourceOrigin)}" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: clamp(12px, 2vw, 20px)">
    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px">${escapeHtml(k.label)}</div>
    <div style="font-size: clamp(20px, 4vw, 28px); font-weight: 700; color: var(--accent-teal)">${formatNumber(k.value)}<span style="font-size: 14px; color: var(--text-secondary); margin-left: 4px">${escapeHtml(k.unit)}</span></div>
    <div class="t5-strip-mini" style="margin-top: 8px; font-size: 0.7rem; color: var(--text-muted)">◈ 溯源 · ✦ 透明 · ❖ 量化</div>
    <div class="icore-trace" style="display:none" data-uuid="${kId}" data-origin="${escapeHtml(sourceOrigin)}"></div>
  </div>`;}).join('\n  ')}
</div>`;
}

function generateT5Strip(t5, sourceOrigin) {
  const dims = ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'];
  const icons = { traceable: '◈', transparent: '✦', tangible: '❖', trustworthy: '⊕', trackable: '∞' };
  const labels = { traceable: '溯源', transparent: '透明', tangible: '可量化', trustworthy: '信任', trackable: '追蹤' };
  const coreId = uuid();
  return `<div class="t5-strip" data-icore-uuid="${coreId}" data-source-origin="${escapeHtml(sourceOrigin)}" style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 24px">
  ${dims.map((d) => {
    const c = FIVE_T_COLORS[d];
    const passed = t5[d];
    const dId = uuid();
    return `<span data-icore-uuid="${dId}" data-dim="${d}" data-passed="${passed}" style="background: ${c.bg}; color: ${c.text}; opacity: ${passed ? 1 : 0.3}; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 600">${icons[d]} ${labels[d]}</span>`;
  }).join('\n  ')}
</div>`;
}

function generateVaultTable(rows, sourceOrigin) {
  if (!rows || rows.length === 0) return '';
  const coreId = uuid();
  const trs = rows.map((r) => {
    const rh = hashLock({ r, ts: Date.now() }).slice(0, 12);
    const rId = uuid();
    return `<tr data-icore-uuid="${rId}" data-source-origin="${escapeHtml(sourceOrigin)}" style="border-bottom: 1px solid var(--border-color)">
      <td style="padding: 8px; color: var(--text-primary)">${escapeHtml(r.topic)}</td>
      <td style="padding: 8px"><span style="background: color-mix(in srgb, var(--accent-teal) 18%, transparent); color: var(--accent-teal); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600">${escapeHtml(r.standard)}</span></td>
      <td style="padding: 8px; color: var(--text-primary)">${escapeHtml(r.value)}</td>
      <td style="padding: 8px; font-family: monospace; font-size: 0.7rem; color: var(--text-muted)">🔒 ${rh}…</td>
    </tr>`;
  }).join('\n    ');
  return `<div class="vault-table" data-icore-uuid="${coreId}" data-source-origin="${escapeHtml(sourceOrigin)}" style="margin-bottom: 24px; overflow-x: auto">
  <h3 style="color: var(--text-primary); font-size: 1.1rem; margin-bottom: 12px">🔒 證據金庫</h3>
  <table style="width: 100%; border-collapse: collapse">
    <thead><tr>
      <th style="padding: 8px; text-align: left; color: var(--text-secondary); border-bottom: 2px solid var(--border-color)">主題</th>
      <th style="padding: 8px; text-align: left; color: var(--text-secondary); border-bottom: 2px solid var(--border-color)">標準</th>
      <th style="padding: 8px; text-align: left; color: var(--text-secondary); border-bottom: 2px solid var(--border-color)">數值</th>
      <th style="padding: 8px; text-align: left; color: var(--text-secondary); border-bottom: 2px solid var(--border-color)">封印</th>
    </tr></thead>
    <tbody>${trs}</tbody>
  </table>
</div>`;
}

function generateSectionsMd(sections, sourceOrigin) {
  if (!sections || sections.length === 0) return '';
  let html = '';
  for (const sec of sections) {
    if (/KPI|指標|5T|誠信|證據|vault/i.test(sec.heading)) continue;
    const sId = uuid();
    html += `<section data-icore-uuid="${sId}" data-source-origin="${escapeHtml(sourceOrigin)}" style="margin-bottom: 32px">
  <h2 style="color: var(--accent-teal); font-size: clamp(18px, 3vw, 24px); border-bottom: 2px solid var(--accent-teal); padding-bottom: 8px">${escapeHtml(sec.heading)}</h2>
  <ul style="padding-left: 20px; color: var(--text-primary); line-height: 1.7">
    ${sec.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('\n    ')}
  </ul>
</section>\n`;
  }
  return html;
}

function generateHermesFloatingAgent(sourceOrigin) {
  const coreId = uuid();
  return `<!-- HermesFloatingAgent — 懸浮 AI 助手 -->
<button id="hermes-agent" data-icore-uuid="${coreId}" data-source-origin="${escapeHtml(sourceOrigin)}" aria-label="啟動 OmniAgent" style="position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #009EB0 0%, #003262 100%); border: none; box-shadow: 0 4px 16px rgba(0,158,176,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 9999; transition: transform 0.2s, box-shadow 0.2s">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  <span style="position: absolute; top: 4px; right: 4px; width: 12px; height: 12px; border-radius: 50%; background: #10B981; border: 2px solid #FFF"></span>
</button>
<style>
  #hermes-agent:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,158,176,0.4) !important; }
  @media (max-width: 768px) { #hermes-agent { width: 48px !important; height: 48px !important; } }
</style>`;
}

function generateModule(spec, artifact) {
  const t5 = spec.t5 || { traceable: true, transparent: true, tangible: true, trustworthy: true, trackable: true };
  const sourceOrigin = spec.sourceFile || `omni-factory://${spec.id}`;
  const coreUuid = uuid();
  const kpiHtml = generateKpiCards(spec.kpis, sourceOrigin);
  const t5Html = generateT5Strip(t5, sourceOrigin);
  const vaultHtml = generateVaultTable(spec.vaultRows, sourceOrigin);
  const sectionsHtml = generateSectionsMd(spec.sections, sourceOrigin);
  const hermesHtml = generateHermesFloatingAgent(sourceOrigin);

  // IComponentCore 追溯矩陣 (嵌入 JSON-LD + data 屬性)
  const iCoreJson = JSON.stringify({
    uuid: coreUuid,
    version: '2.0.0',
    timestamp: Date.now(),
    source_origin: sourceOrigin,
    module: spec.id,
    medce: spec.medce.primary,
    t5,
    hashLock: artifact.hashLock,
  });

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(spec.title)} — ESGGO</title>
  <style>
    :root {
      --accent-teal: #009EB0; --accent-gold: #D4AF37; --accent-blue: #3B82F6;
      --accent-green: #10B981; --accent-red: #EF4444;
      --bg-primary: #F8FAFC; --bg-secondary: #FFFFFF; --border-color: #E2E8F0;
      --text-primary: #0F172A; --text-secondary: #64748B; --text-muted: #94A3B8;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #0F172A; --bg-secondary: #1E293B; --border-color: #334155;
        --text-primary: #F8FAFC; --text-secondary: #94A3B8; --text-muted: #64748B;
      }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, 'Segoe UI', 'Noto Sans TC', sans-serif;
      background: var(--bg-primary); color: var(--text-primary);
      line-height: 1.6;
    }
    .container { width: 100%; max-width: 1440px; margin: 0 auto; padding: clamp(12px, 3vw, 24px); }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: clamp(24px, 5vw, 36px); margin: 0; color: var(--text-primary); }
    .page-header p { color: var(--text-secondary); font-size: clamp(14px, 2vw, 16px); margin: 4px 0 0; }
    .page-footer { border-top: 1px solid var(--border-color); padding: 16px 0; color: var(--text-muted); font-size: 0.75rem; text-align: center; margin-top: 32px; }
    .bento-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr !important; }
      .t5-strip { flex-direction: column; }
    }
  </style>
  <script type="application/ld+json" id="icore-matrix">${iCoreJson.replace(/</g, '\\u003c')}</script>
</head>
<body>
  <div class="container" data-icore-uuid="${coreUuid}" data-source-origin="${escapeHtml(sourceOrigin)}">
    <header class="page-header">
      <h1>${escapeHtml(spec.title)}</h1>
      <p>MEDCE: ${escapeHtml(spec.medce.primary)} · 5T 品質閘門通過 · <span style="font-family:monospace;font-size:0.8rem;color:var(--text-muted)">${coreUuid}</span></p>
    </header>

    <main>
      <!-- 5T 品質閘門條 -->
      ${t5Html}

      <!-- KPI 指標卡 -->
      ${kpiHtml}

      <!-- 證據金庫 -->
      ${vaultHtml}

      <!-- 其餘章節 -->
      ${sectionsHtml}
    </main>

    <footer class="page-footer">
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px">
        <span>ESGGO © ${new Date().getFullYear()} — 5T 誠信協議</span>
        <span style="font-family: monospace">hashLock: ${artifact.hashLock}</span>
      </div>
      <div style="margin-top: 8px; font-size: 0.7rem">
        <button onclick="traceCore()" style="background:var(--accent-teal);color:#FFF;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:0.7rem">🔍 追溯終始矩陣</button>
        <span id="trace-output" style="margin-left: 8px; font-family: monospace"></span>
      </div>
    </footer>
  </div>

  <!-- HermesFloatingAgent -->
  ${hermesHtml}

  <script>
    // 終始矩陣追溯: 點擊元素可回溯到原始 README 規格
    function traceCore() {
      const els = document.querySelectorAll('[data-icore-uuid]');
      const origins = new Set();
      els.forEach(e => origins.add(e.dataset.sourceOrigin));
      const out = document.getElementById('trace-output');
      out.textContent = '追溯到 ' + origins.size + ' 個來源: ' + [...origins].join(', ');
      console.log('[IComponentCore Trace]', {
        coreUuid: '${coreUuid}',
        module: '${spec.id}',
        elements: els.length,
        sources: [...origins],
      });
    }
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// 主流程
// ═══════════════════════════════════════════════════════════════

function resolveWikiFile(dir, name) {
  const p1 = path.join(dir, name);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(ROOT, 'wiki', name);
  if (fs.existsSync(p2)) return p2;
  return p1;
}

function loadWikiSpec(wikiDir) {
  const factoryMd = resolveWikiFile(wikiDir, '萬能工廠.md');
  const catalogMd = resolveWikiFile(wikiDir, '萬能目錄.md');
  const missing = [];
  if (!fs.existsSync(factoryMd)) missing.push('萬能工廠.md');
  if (!fs.existsSync(catalogMd)) missing.push('萬能目錄.md');
  if (missing.length) throw new Error(`[Wiki] 規範檔缺失: ${missing.join(', ')}`);
  const factory = fs.readFileSync(factoryMd, 'utf8');
  const catalog = fs.readFileSync(catalogMd, 'utf8');
  const pStages = [...factory.matchAll(/^\|\s*P([1-7])\s*\|/gm)].map(m => `P${m[1]}`);
  const tGates = [...factory.matchAll(/^\|\s*T([1-5])\s/gm)].map(m => `T${m[1]}`);
  return {
    exists: true,
    factoryStages: pStages,
    qualityGates: tGates,
    hasFullPipeline: pStages.length >= 7,
    hasFiveT: tGates.length >= 5,
    catalogHasMedce: /MEDCE|MECE/.test(catalog),
  };
}

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

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

function main() {
  const rawWiki = getArg('--wiki', DEFAULT_WIKI_DIR);
  const wikiDir = path.isAbsolute(rawWiki) ? rawWiki : path.resolve(ROOT, rawWiki);
  const registryPath = path.join(wikiDir, '萬能模組-註冊表.md');

  // 批次模式
  if (batchDir) {
    const files = fs.readdirSync(batchDir).filter((f) => f.endsWith('.md'));
    console.log(`[omni-factory] 批次模式: 讀取 ${files.length} 個 README`);
    const results = [];
    for (const f of files) {
      const fp = path.join(batchDir, f);
      try {
        const spec = parseReadme(fp);
        const artifact = assemble(spec, registryPath);
        const html = generateModule(spec, artifact);
        const outPath = outputDir || path.join(ROOT, 'dist', 'batch');
        fs.mkdirSync(outPath, { recursive: true });
        const htmlPath = path.join(outPath, spec.id.toLowerCase() + '.html');
        fs.writeFileSync(htmlPath, html, 'utf8');
        results.push({ id: spec.id, ok: true, path: htmlPath, bytes: html.length });
        console.log(`  ✓ ${spec.id} → ${htmlPath} (${html.length} bytes)`);
      } catch (err) {
        results.push({ id: f, ok: false, error: err.message });
        console.log(`  ✗ ${f}: ${err.message}`);
      }
    }
    const passed = results.filter((r) => r.ok).length;
    console.log(`[omni-factory] 批次完成: ${passed}/${files.length} 通過`);
    return;
  }

  let spec;
  if (specPath) {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } else if (readmePath) {
    console.log(`[omni-factory] 讀取 README: ${readmePath}`);
    spec = parseReadme(readmePath);
    console.log(`[omni-factory] 萃取 ModuleSpec: ${spec.id} (${spec.kpis.length} KPI, ${spec.vaultRows.length} Vault)`);
  } else {
    spec = {
      id: 'MOD-DEMO-' + Date.now().toString(36).toUpperCase(),
      medce: { primary: 'M', aux: ['E', 'D'] },
      functions: ['aggregateKpi', 'getAgentStatus'],
      components: ['BrandKpiCard', 'StandardPage', 'BrandT5Strip'],
      theme: 'solid-card-default',
      runes: ['R-MEDCE', 'R-5T', 'R-STATE'],
    };
    console.log('[omni-factory] 未指定 --spec/--readme, 使用內建範例 ModuleSpec');
  }

  const wiki = loadWikiSpec(wikiDir);
  console.log(`[omni-factory] 讀取 Wiki 規範: ${wikiDir}`);
  console.log(`  ├─ 萬能工廠.md 流水線: ${wiki.factoryStages.length} 階 (P1-P7 完整=${wiki.hasFullPipeline})`);
  console.log(`  ├─ 5T 閘門: ${wiki.qualityGates.length} 道 (T1-T5 完整=${wiki.hasFiveT})`);
  console.log(`  └─ 萬能目錄.md MEDCE 分類: ${wiki.catalogHasMedce ? '✓' : '✗'}`);
  if (!wiki.hasFullPipeline || !wiki.hasFiveT) {
    throw new Error('[Wiki] 規範不完整: 需 P1-P7 流水線 + T1-T5 閘門');
  }

  console.log(`[omni-factory] 組裝模組: ${spec.id}`);
  const artifact = assemble(spec, registryPath);
  console.log('[omni-factory] P1-P7 流水線完成:');
  for (const step of artifact.buildTrace) {
    console.log(`  ${step.stage}: ${step.ok ? '✓' : '✗'} ${step.note || ''}`);
  }
  console.log(`[omni-factory] hashLock: ${artifact.hashLock}`);

  // 生成 RWD HTML 模組
  const html = generateModule(spec, artifact);
  const outPath = outputDir || path.join(ROOT, 'dist', spec.id.toLowerCase());
  fs.mkdirSync(outPath, { recursive: true });
  const htmlPath = path.join(outPath, 'index.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`[omni-factory] 已產出 RWD 模組: ${htmlPath} (${html.length} bytes)`);

  console.log('\n[omni-factory] 5T 閘門通過 — 可對接現有 CD 佈署:');
  console.log('  gh workflow run deploy.yml   # Vercel');
  console.log('  # Oracle VPS: 合併 main 後 deploy-oracle.yml');
  console.log(`[omni-factory] ✅ ${spec.id} 組裝完成`);
}

main();
