import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 全域全端全量雙向 TS 架構終始矩陣
// 終 (canonical): esggo/shared/types.ts —— 所有型別在此一次性定義
// 始 (consumer): 各端 types/generated/esggo-shared.d.ts —— 僅消費、不可改
// 矩陣: 任一端改需求 → 回饋 canonical → 重跑本腳本 → 全端同步
// SRC 以 scripts/ 所在位置（monorepo 根）為基準，與 caller cwd 無關，確保任意 consumer 都能跑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'shared', 'types.ts');
const DEST = path.join(process.cwd(), 'types', 'generated', 'esggo-shared.d.ts');

const SRC_REL = path.relative(path.join(process.cwd(), 'types', 'generated'), SRC).replace(/\\/g, '/');

const LIC = `/* Auto-generated from \`esggo/shared/types.ts\` — do not edit. */\n`;

const map = [
  ['ESGKnowledgeBase', 'enum'],
  ['ARVOStage', 'enum'],
  ['SkillCategory', 'enum'],
  ['MasteryLevel', 'enum'],
  ['IKnowledgeRecord', 'interface'],
  ['IRAGResult', 'interface'],
  ['IARVOPlan', 'interface'],
  ['IAgentProfile', 'interface'],
  ['ISkillNode', 'interface'],
  ['IAwakeningResult', 'interface'],
  ['IHITLProposal', 'interface'],
  ['IServiceModule', 'interface'],
  ['IEsgMetric', 'interface'],
  ['IEvidenceRecord', 'interface'],
  ['IMaterialityTopic', 'interface'],
  ['ISupplyChainVendor', 'interface'],
  ['IUserProfile', 'interface'],
  ['ICommunityPost', 'interface'],
  ['IVillageMember', 'interface'],
  ['IOmniNote', 'interface'],
  ['IApiResult', 'interface'],
  // --- Universal Translator (萬能即時翻譯) Domain — 雙向 TS 矩陣新納入 ---
  ['TranslateEngine', 'enum'],
  ['LanguageCode', 'type'],
  ['ITranslateRequest', 'interface'],
  ['ITranslateResult', 'interface'],
  ['ISpeakPayload', 'interface'],
  ['ISseTranslationEvent', 'interface'],
  // --- STT → 雙語字幕 Domain (終始矩陣: 消費端 stt_client.mjs 依賴) ---
  ['BilingualPair', 'type'],
  ['ISpeechToSubtitleRequest', 'interface'],
  ['ISpeechToSubtitleResult', 'interface'],
  ['IOmniTypeMatrix', 'interface'],
  // --- 雙語字幕撥放器 · 三元一體 (Zoom 會議) 領域 ---
  ['PlayerSourceKind', 'type'],
  ['IPlayerSource', 'type'],
  ['IZoomMeeting', 'interface'],
  ['IPlayerState', 'interface'],
  // --- 第二大腦知識網 (Second Brain / Knowledge Garden) 領域 ---
  ['ISecondBrainNote', 'interface'],
  // --- OA-Team 雙蜂戰隊 60 領域契約 (蜂群 / 5T 驗算 / 靈魂產物) — 終始矩陣新納入 ---
  ['HiveSide', 'type'],
  ['ArrayKey', 'type'],
  ['ISoulAgent', 'interface'],
  ['IComponentCore', 'interface'],
  ['ISoulArtifact', 'interface'],
  ['ISwarmTask', 'interface'],
  ['SwarmTaskResult', 'type'],
  ['IOABMessage', 'interface'],
  ['I5TVerification', 'interface'],
  // --- OA-Team 缺口補齊 · 終始矩陣契約 (Gap Remediation Terminal-Origin Matrix) ---
  ['GapUnitKey', 'type'],
  ['GapRole', 'type'],
  ['GapHubKind', 'type'],
  ['IGapAgent', 'interface'],
  ['IGapPairing', 'interface'],
  ['IGapMatrixCoverage', 'interface'],
];

const content = fs.readFileSync(SRC, 'utf-8');
const lines = content.split('\n');

function findExportBlock(name, kind) {
  const head = 'export ' + kind + ' ' + name + '<';
  const headPlain = 'export ' + kind + ' ' + name + ' ';
  let start = -1;
  let braces = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (start === -1 && (l.startsWith(head) || l.startsWith(headPlain) || l.startsWith('export type ' + name + ' '))) {
      start = i;
      // type 別名 (union / 單行) 以分號結尾，不用大括號配對
      if (kind === 'type' && !l.includes('{')) {
        // 同一行已含 ';' 則直接回；否則繼續找到 ';'
        if (l.endsWith(';')) return lines.slice(start, i + 1).join('\n');
        continue;
      }
    }
    if (start !== -1) {
      if (kind === 'type' && !l.includes('{') && lines[start].trim().startsWith('export type') && l.endsWith(';')) {
        return lines.slice(start, i + 1).join('\n');
      }
      braces += (l.match(/{/g) || []).length;
      braces -= (l.match(/}/g) || []).length;
      if (braces <= 0) return lines.slice(start, i + 1).join('\n');
    }
  }
  return '';
}

const out = [];
const added = new Set();
for (const [name, kind] of map) {
  if (added.has(name)) continue;
  added.add(name);
  const block = findExportBlock(name, kind);
  if (block) out.push(block, '');
}

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, out.join('\n').trim() + '\n', 'utf-8');
console.log(`OK ${path.relative(process.cwd(), DEST)}`);
