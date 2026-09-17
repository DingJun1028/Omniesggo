#!/usr/bin/env node
/**
 * Karpathy-Style Knowledge Stack — Reasoning Core
 * 
 * 掃描 Obsidian vault 全部筆記 → 送 LLM 深度推理 → 產出洞察寫回 vault
 * 
 * 用法:
 *   node scripts/karpathy-reasoning-core.mjs --mode daily|weekly|monthly
 * 
 * 環境變數:
 *   OLLAMA_URL    — Ollama endpoint (預設 http://127.0.0.1:11434)
 *   OLLAMA_MODEL  — 模型名稱 (預設 qwen2.5:14b)
 *   VAULT_PATH    — vault 路徑 (預設 C:/Project/esggo/vault)
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';

const ARGS = process.argv.slice(2);
const MODE = ARGS.find(a => a.startsWith('--mode='))?.split('=')[1] || 'daily';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const VAULT_PATH = process.env.VAULT_PATH || 'C:/Project/esggo/vault';
const MAX_NOTES = parseInt(process.env.MAX_NOTES || '20');
const MAX_CHARS_PER_NOTE = parseInt(process.env.MAX_CHARS_PER_NOTE || '1000');

// ─── 1. SCAN ───────────────────────────────────────────────

function scanVault(vaultPath) {
  const notes = [];
  const dirs = ['Agents/context', 'Agents/reasoning-core', 'Agents/briefing'];
  
  for (const dir of dirs) {
    const fullDir = join(vaultPath, dir);
    if (!existsSync(fullDir)) continue;
    
    const files = readdirSync(fullDir, { recursive: true });
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const filePath = join(fullDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);
      
      notes.push({
        path: relative(vaultPath, filePath),
        relativePath: file,
        dir: dir,
        frontmatter,
        content: content.slice(0, MAX_CHARS_PER_NOTE),
        wikilinks: extractWikilinks(content),
        tags: extractTags(content),
        modified: statSync(filePath).mtime
      });
    }
  }
  
  return notes.slice(0, MAX_NOTES);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const fm = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    fm[key] = val;
  }
  return fm;
}

function extractWikilinks(content) {
  const matches = content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  return [...new Set([...matches].map(m => m[1].trim()))];
}

function extractTags(content) {
  const matches = content.matchAll(/#([a-zA-Z0-9_-]+)/g);
  return [...new Set([...matches].map(m => m[1]))];
}

// ─── 2. REASON ─────────────────────────────────────────────

async function reasonWithOllama(notes, mode) {
  const prompt = buildPrompt(notes, mode);
  
  console.log(`[reasoning-core] 送 ${notes.length} 筆記進 ${OLLAMA_MODEL}...`);
  
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 512 }
      }),
      signal: controller.signal
    });
    clearTimeout(tid);
    
    if (!response.ok) {
      console.error(`[reasoning-core] Ollama 錯誤: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.response;
  } catch (err) {
    console.error(`[reasoning-core] 連線失敗: ${err.message}`);
    return null;
  }
}

function buildPrompt(notes, mode) {
  const notesSummary = notes.map(n => `
### ${n.relativePath}
- 路徑: ${n.path}
- 標籤: ${n.tags.join(', ') || '無'}
- 連結: ${n.wikilinks.join(', ') || '無'}
- 來源: ${n.frontmatter.source_origin || '未知'}
- 摘要: ${n.content.slice(0, 500)}...
`).join('\n');

  const modeInstructions = {
    daily: `你是 OA-Team 30 蜂群的「推理核心」。請分析以上筆記，產出：
1. 前日筆記變化摘要（新增/修改/刪除）
2. 跨域關聯洞察（哪些筆記應該互相連結？）
3. 行動建議（今天該優先處理什麼？）
4. 知識缺口（缺少什麼筆記？）`,
    weekly: `你是 OA-Team 30 蜂群的「推理核心」。請分析以上筆記，產出：
1. 本週知識圖譜演進（新結點/新連結/孤立結點）
2. 熵減指標（筆記品質/重複/過期狀況）
3. 跨筆記綜合（哪些主題可以合併或深化？）
4. 下週優先待辦`,
    monthly: `你是 OA-Team 30 蜂群的「推理核心」。請分析以上筆記，產出：
1. 全域知識重構（MOC 是否仍有效？需要哪些調整？）
2. 過期筆記淘汰清單（哪些已無參考價值？）
3. 新 MOC 建議（哪些主題需要專屬 Map of Content？）
4. 知識分身健康度（孵化/同步/召回指標）`
  };

  return `## 角色
${modeInstructions[mode] || modeInstructions.daily}

## 輸入筆記（共 ${notes.length} 篇）
${notesSummary}

## 輸出格式（Markdown）
請用繁體中文回應，結構清晰，使用 wikilink [[標題]] 標記跨筆記關聯。

---

`;
}

// ─── 3. WRITE ──────────────────────────────────────────────

function writeInsight(reasoning, mode, vaultPath) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  
  const subdir = {
    daily: 'daily-insights',
    weekly: 'weekly-synthesis',
    monthly: 'monthly-deep-dive'
  }[mode] || 'daily-insights';
  
  const filename = `${dateStr}-${mode}-insight.md`;
  const filepath = join(vaultPath, 'Agents/reasoning-core', subdir, filename);
  
  const frontmatter = `---
source_origin: karpathy-reasoning-core
created: ${dateStr}
modified: ${dateStr}
co_authors: [reasoning-core, oa-team-30]
lifecycle: draft
tags: [reasoning-core, ${mode}, insight]
access: public-research
mode: ${mode}
input_notes: ${scanVault(vaultPath).length}
---

`;
  
  writeFileSync(filepath, frontmatter + reasoning, 'utf-8');
  console.log(`[reasoning-core] 洞察已寫入: ${filepath}`);
  return filepath;
}

// ─── 4. MOC UPDATE ─────────────────────────────────────────

function updateMOC(newNotePath, vaultPath) {
  const mocPath = join(vaultPath, 'Agents/context/00-Index.md');
  if (!existsSync(mocPath)) return;
  
  let moc = readFileSync(mocPath, 'utf-8');
  const dateStr = new Date().toISOString().slice(0, 10);
  const relativePath = relative(join(vaultPath, 'Agents/context'), newNotePath);
  
  // 在「推理核心」段落加入新筆記
  const reasoningEntry = `- [[${relativePath}|${dateStr} 洞察]]`;
  
  if (!moc.includes('## 推理核心')) {
    moc += `\n## 推理核心\n${reasoningEntry}\n`;
  } else {
    moc = moc.replace(
      /## 推理核心\n/,
      `## 推理核心\n${reasoningEntry}\n`
    );
  }
  
  writeFileSync(mocPath, moc, 'utf-8');
  console.log(`[reasoning-core] MOC 已更新: ${mocPath}`);
}

// ─── MAIN ──────────────────────────────────────────────────

async function main() {
  console.log(`\n🧠 Karpathy-Style Knowledge Stack · Reasoning Core`);
  console.log(`   模式: ${MODE} | 模型: ${OLLAMA_MODEL} | Vault: ${VAULT_PATH}\n`);
  
  // 1. Scan
  console.log('[1/4] 掃描 vault...');
  const notes = scanVault(VAULT_PATH);
  console.log(`      找到 ${notes.length} 篇筆記`);
  
  if (notes.length === 0) {
    console.log('[reasoning-core] 無筆記可分析，結束。');
    return;
  }
  
  // 2. Reason
  console.log('[2/4] 深度推理中...');
  const reasoning = await reasonWithOllama(notes, MODE);
  
  if (!reasoning) {
    console.log('[reasoning-core] 推理失敗，改用本地摘要模式。');
    const fallback = generateFallbackSummary(notes, MODE);
    const filepath = writeInsight(fallback, MODE, VAULT_PATH);
    updateMOC(filepath, VAULT_PATH);
    return;
  }
  
  // 3. Write
  console.log('[3/4] 寫入洞察...');
  const filepath = writeInsight(reasoning, MODE, VAULT_PATH);
  
  // 4. MOC
  console.log('[4/4] 更新 MOC...');
  updateMOC(filepath, VAULT_PATH);
  
  console.log('\n✅ 推理核心完成！');
}

function generateFallbackSummary(notes, mode) {
  const dateStr = new Date().toISOString().slice(0, 10);
  return `# ${dateStr} ${mode} 洞察（本地摘要模式）

> ⚠️ Ollama 不可用，此為本地摘要非深度推理。

## 筆記統計
- 總筆記數: ${notes.length}
- 有 frontmatter: ${notes.filter(n => Object.keys(n.frontmatter).length > 0).length}
- 有 wikilink: ${notes.filter(n => n.wikilinks.length > 0).length}
- 有 tags: ${notes.filter(n => n.tags.length > 0).length}

## 標籤雲
${[...new Set(notes.flatMap(n => n.tags))].map(t => `#${t}`).join(' ')}

## 孤立筆記（無 wikilink）
${notes.filter(n => n.wikilinks.length === 0).map(n => `- [[${n.relativePath}]]`).join('\n') || '無'}

## 待辦
- [ ] 啟動 Ollama 以取得深度推理能力
- [ ] 為孤立筆記補充 wikilink
`;
}

main().catch(err => {
  console.error('[reasoning-core] 致命錯誤:', err);
  process.exit(1);
});
