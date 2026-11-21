// ============================================================
// Diff Engine — Compare content versions & generate reports
// src/core/sonnar/diff-engine.ts
// ============================================================

export interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
  totalChanges: number;
  changePercent: number;
}

export interface RegulationDiff {
  regulationId: string;
  regulationName: string;
  oldVersion: string;
  newVersion: string;
  changes: DiffResult;
  esgImpact: {
    environmental: string[];
    social: string[];
    governance: string[];
  };
  timestamp: string;
}

export type DiffMode = 'word' | 'line' | 'char';

/**
 * Compare two texts and return unified diff
 */
export function diff(oldText: string, newText: string, mode: DiffMode = 'line'): DiffResult {
  const oldParts = splitText(oldText, mode);
  const newParts = splitText(newText, mode);
  
  const oldSet = new Set(oldParts);
  const newSet = new Set(newParts);
  
  const added = newParts.filter(p => !oldSet.has(p));
  const removed = oldParts.filter(p => !newSet.has(p));
  const unchanged = oldParts.filter(p => newSet.has(p));
  
  const totalItems = Math.max(oldParts.length, newParts.length, 1);
  
  return {
    added,
    removed,
    unchanged,
    totalChanges: added.length + removed.length,
    changePercent: Math.round(((added.length + removed.length) / totalItems) * 100),
  };
}

/**
 * Split text by mode
 */
function splitText(text: string, mode: DiffMode): string[] {
  switch (mode) {
    case 'line':
      return text.split(/\r?\n/).filter(l => l.trim());
    case 'word':
      return text.split(/\s+/).filter(w => w.trim());
    case 'char':
      return text.split('');
    default:
      return [text];
  }
}

/**
 * Generate unified diff format (GNU-style)
 */
export function unifiedDiff(oldText: string, newText: string, contextLines = 3): string {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  
  const result: string[] = [];
  result.push('--- old');
  result.push('+++ new');
  
  // Simple line-by-line comparison
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] ?? '';
    const newLine = newLines[i] ?? '';
    
    if (oldLine !== newLine) {
      if (i > 0) result.push(`@@ -${i + 1},${contextLines} +${i + 1},${contextLines} @@`);
      if (oldLine) result.push(`-${oldLine}`);
      if (newLine) result.push(`+${newLine}`);
    }
  }
  
  return result.join('\n');
}

/**
 * Compare regulation content and detect ESG-focused changes
 */
export function regulationDiff(
  oldContent: string,
  newContent: string,
  regulationName: string,
  regulationId: string
): RegulationDiff {
  const changes = diff(oldContent, newContent, 'line');
  
    const esgImpact = {
      environmental: extractESGChanges([...changes.added, ...changes.removed], 'environmental'),
      social: extractESGChanges([...changes.added, ...changes.removed], 'social'),
      governance: extractESGChanges([...changes.added, ...changes.removed], 'governance'),
    };
  
  return {
    regulationId,
    regulationName,
    oldVersion: oldContent.substring(0, 50),
    newVersion: newContent.substring(0, 50),
    changes,
    esgImpact,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Categorize changed lines by ESG pillar
 */
function extractESGChanges(lines: string[], pillar: 'environmental' | 'social' | 'governance'): string[] {
  const keywords: Record<string, string[]> = {
    environmental: ['碳排放', '溫室氣體', '能源', '水資源', '廢棄物', '污染', '氣候', 'carbon', 'emission', 'energy', 'GHG'],
    social: ['勞工', '性別', '人權', '健康', '安全', '薪酬', '訓練', 'labor', 'human rights', 'diversity'],
    governance: ['董事會', '薪酬', '貪腐', '風險', '稽覈', '吹哨', 'board', 'compensation', 'audit', 'risk'],
  };
  
  const hits: string[] = [];
  const kws = keywords[pillar] || [];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (kws.some(kw => lower.includes(kw.toLowerCase()))) {
      hits.push(line.trim().substring(0, 100));
    }
  }
  
  return hits;
}

/**
 * Summarize change for notification
 */
export function summarizeDiff(diff: RegulationDiff): string {
  const parts: string[] = [`${diff.regulationName} 有 ${diff.changes.totalChanges} 處變動`];
  
  if (diff.esgImpact.environmental.length > 0) {
    parts.push(`環境面: ${diff.esgImpact.environmental.length} 項`);
  }
  if (diff.esgImpact.social.length > 0) {
    parts.push(`社會面: ${diff.esgImpact.social.length} 項`);
  }
  if (diff.esgImpact.governance.length > 0) {
    parts.push(`治理面: ${diff.esgImpact.governance.length} 項`);
  }
  
  return parts.join(' | ');
}
