/**
 * 無有奧義 # 符文技藝系統 — RuneEngine
 * 哲學: 無(無預設腳本) × 奧義(低機率頓悟) × 不息之藝(自演化)
 * 設計: 零外部依賴(Node 內建)、handler 真可執行、狀態持久化、5T 合規
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type RuneCategory = 'perception' | 'memory' | 'reasoning' | 'action' | 'communication' | 'safety' | 'learning';

export interface RuneDef {
  id: string;
  name: string;
  category: RuneCategory;
  atomic: boolean;
  description: string;
  /** composite 才有: DAG 步驟 */
  dag?: RuneStep[];
  source: 'seed' | 'enlightenment';
  createdAt: number;
  hashLock: string;
}

export interface RuneStep {
  rune: string;
  /** 輸入綁定: '$input' | '$prev' | '{step: <index>, path: <dot path>}' */
  inputFrom?: string;
  /** 條件: 前一步輸出的 dot-path 真值檢查 (條件分支) */
  whenPath?: string;
  /** 循環次數 (預設 1) */
  repeat?: number;
}

export interface ProficiencyRec {
  uses: number;
  successes: number;
  failures: number;
}

export type ProficiencyLevel = 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master' | 'Grandmaster';

export interface Enlightenment {
  id: string;
  name: string;
  tier: 'Epic' | 'Legendary' | 'Mythic';
  power: number;
  cooldownMinutes: number;
  energy: number;
  teachable: boolean;
  fromSignature: string;
  bornAt: number;
}

export const PROFICIENCY_THRESHOLDS: ReadonlyArray<{ level: ProficiencyLevel; min: number }> = Object.freeze([
  { level: 'Grandmaster', min: 1001 },
  { level: 'Master', min: 501 },
  { level: 'Expert', min: 101 },
  { level: 'Adept', min: 51 },
  { level: 'Apprentice', min: 11 },
  { level: 'Novice', min: 0 },
]);

export const ENLIGHTENMENT_BASE_RATE: Readonly<Record<ProficiencyLevel, number>> = Object.freeze({
  Novice: 0,
  Apprentice: 0,
  Adept: 0.0001,
  Expert: 0.001,
  Master: 0.005,
  Grandmaster: 0.01,
});

export const ENLIGHTENMENT_TIER_DISTRIBUTION: ReadonlyArray<{ tier: Enlightenment['tier']; p: number }> = Object.freeze([
  { tier: 'Epic', p: 0.9 },
  { tier: 'Legendary', p: 0.09 },
  { tier: 'Mythic', p: 0.01 },
]);

export const TIER_SPECS: Readonly<Record<Enlightenment['tier'], { power: number; cooldownMinutes: number; energy: number; teachable: boolean }>> = Object.freeze({
  Epic: { power: 200, cooldownMinutes: 10, energy: 20, teachable: true },
  Legendary: { power: 500, cooldownMinutes: 30, energy: 50, teachable: true },
  Mythic: { power: 1000, cooldownMinutes: 60, energy: 100, teachable: false },
});

export function proficiencyLevel(uses: number): ProficiencyLevel {
  for (const t of PROFICIENCY_THRESHOLDS) {
    if (uses >= t.min) return t.level;
  }
  return 'Novice';
}

const safeEval = (expr: string): number => {
  const s = String(expr ?? '').trim();
  if (!/^[\d\s+\-*/().,%]+$/.test(s) || s === '') throw new Error('unsafe arithmetic: ' + s);
  // eslint-disable-next-line no-new-func
  const v = Number(new Function(`return (${s.replace(/,/g, '')})`)());
  if (!Number.isFinite(v)) throw new Error('non-finite result');
  return v;
};

const dotGet = (obj: any, path: string): any => {
  if (!path) return obj;
  let cur = obj;
  for (const k of String(path).split('.')) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
};

const SECRET_RE = /(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{12,}/gi;
const RISK_TABLE: ReadonlyArray<[RegExp, number]> = Object.freeze([
  [/罰款|裁罰|违规|penalty/i, 40],
  [/訴訟|litigation|訴訟風險/i, 50],
  [/泄漏|breach|外洩/i, 60],
  [/高碳排|超標|exceed/i, 30],
  [/罰|違規|污染/i, 20],
]);

/** 原子符文庫 — handler 皆真執行(確定性, 無外部 LLM) */
export const SEED_RUNES: ReadonlyArray<Omit<RuneDef, 'hashLock' | 'createdAt'>> = Object.freeze([
  { id: 'text_length', name: '文本計量', category: 'perception', atomic: true, description: '回傳文字長度/詞數', source: 'seed' },
  { id: 'keyword_scan', name: '關鍵詞感知', category: 'perception', atomic: true, description: '掃描 keywords 陣列命中', source: 'seed' },
  { id: 'url_shape_check', name: '網址形狀感知', category: 'perception', atomic: true, description: '驗證 URL 形狀合法性', source: 'seed' },
  { id: 'json_store', name: '記憶存入', category: 'memory', atomic: true, description: 'ctx 記憶槽寫入', source: 'seed' },
  { id: 'json_recall', name: '記憶回憶', category: 'memory', atomic: true, description: '依 key 回憶', source: 'seed' },
  { id: 'merge_context', name: '情境整併', category: 'memory', atomic: true, description: '合併物件到上下文', source: 'seed' },
  { id: 'calc', name: '算式推理', category: 'reasoning', atomic: true, description: '安全算術求值 {expr}', source: 'seed' },
  { id: 'scope_calc', name: '碳排三範疇計算', category: 'reasoning', atomic: true, description: 'Scope1+2+3 合計', source: 'seed' },
  { id: 'priority_sort', name: '優先級排序', category: 'reasoning', atomic: true, description: '按 score 降冪排序', source: 'seed' },
  { id: 'threshold_gate', name: '門檻判定', category: 'reasoning', atomic: true, description: '{value} vs {threshold} 判定', source: 'seed' },
  { id: 'text_template', name: '文稿鑄造', category: 'action', atomic: true, description: '模板套用 {template}/{vars}', source: 'seed' },
  { id: 'csv_sum', name: '數列求和', category: 'action', atomic: true, description: 'values[] 求和/平均', source: 'seed' },
  { id: 'chart_svg', name: '圖表鑄造', category: 'action', atomic: true, description: 'bars[] → SVG 柱狀圖', source: 'seed' },
  { id: 'hash_identity', name: '鎖印鑄造', category: 'action', atomic: true, description: 'sha256 指紋', source: 'seed' },
  { id: 'format_report_section', name: '報告章節格式化', category: 'communication', atomic: true, description: '標題+段落成章', source: 'seed' },
  { id: 'format_email', name: '郵件格式化', category: 'communication', atomic: true, description: '主旨/內文成稿', source: 'seed' },
  { id: 'secret_scan', name: '機密過濾', category: 'safety', atomic: true, description: '掃描外洩機密樣式', source: 'seed' },
  { id: 'risk_score', name: '風險評分', category: 'safety', atomic: true, description: '關鍵詞風險表加分', source: 'seed' },
  { id: 'pii_mask', name: '隱私遮罩', category: 'safety', atomic: true, description: 'email/電話遮罩', source: 'seed' },
  { id: 'reflect_stats', name: '反思統計', category: 'learning', atomic: true, description: '輸入統計回饋', source: 'seed' },
  { id: 'combo_propose', name: '組合提案', category: 'learning', atomic: true, description: '依頻率提案下一個符文', source: 'seed' },
]);

function makeHashLock(def: Omit<RuneDef, 'hashLock'>): string {
  return createHash('sha256').update(JSON.stringify({ id: def.id, dag: def.dag, category: def.category })).digest('hex').slice(0, 16);
}

type Handler = (input: any, ctx: Record<string, any>) => any;

const HANDLERS: Record<string, Handler> = {
  text_length: (i) => {
    const t = typeof i === 'string' ? i : JSON.stringify(i ?? '');
    return { chars: t.length, words: t.trim() ? t.trim().split(/\s+/).length : 0 };
  },
  keyword_scan: (i) => {
    const text = String(i?.text ?? i ?? '').toLowerCase();
    const kws: string[] = i?.keywords ?? ['esg', '碳', '永續'];
    const hits = kws.filter((k) => text.includes(String(k).toLowerCase()));
    return { hits, score: hits.length / Math.max(1, kws.length) };
  },
  url_shape_check: (i) => {
    const u = String(typeof i === 'string' ? i : i?.url ?? '');
    try {
      const p = new URL(u);
      return { valid: true, protocol: p.protocol, host: p.host };
    } catch {
      return { valid: false };
    }
  },
  json_store: (i, ctx) => {
    const key = String(i?.key ?? 'default');
    ctx[key] = i?.value ?? i;
    return { stored: key };
  },
  json_recall: (i, ctx) => ({ value: ctx[String(i?.key ?? 'default')] ?? null }),
  merge_context: (i, ctx) => {
    Object.assign(ctx, typeof i === 'object' && i ? i : { value: i });
    return { merged: Object.keys(ctx).length };
  },
  calc: (i) => {
    const expr = typeof i === 'string' ? i : String(i?.expr ?? '');
    return { expr, value: safeEval(expr) };
  },
  scope_calc: (i) => {
    const s1 = Number(i?.scope1 ?? 0), s2 = Number(i?.scope2 ?? 0), s3 = Number(i?.scope3 ?? 0);
    const total = s1 + s2 + s3;
    return { scope1: s1, scope2: s2, scope3: s3, total, topContributor: total === 0 ? 'none' : s1 >= s2 && s1 >= s3 ? 'scope1' : s2 >= s3 ? 'scope2' : 'scope3' };
  },
  priority_sort: (i) => {
    const items: any[] = Array.isArray(i) ? i : Array.isArray(i?.items) ? i.items : [];
    return [...items].sort((a, b) => Number(b?.score ?? 0) - Number(a?.score ?? 0));
  },
  threshold_gate: (i) => {
    const v = Number(i?.value ?? i?.total ?? 0), t = Number(i?.threshold ?? 0);
    return { value: v, threshold: t, pass: v >= t, ratio: t === 0 ? Infinity : v / t };
  },
  text_template: (i) => {
    const tpl = String(i?.template ?? '{{text}}');
    const vars = i?.vars && typeof i.vars === 'object' ? i.vars : { text: typeof i === 'string' ? i : JSON.stringify(i ?? '') };
    const out = tpl.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, k) => String(dotGet(vars, k) ?? ''));
    return { text: out };
  },
  csv_sum: (i) => {
    const values: number[] = (Array.isArray(i) ? i : i?.values ?? []).map(Number).filter(Number.isFinite);
    const total = values.reduce((s, v) => s + v, 0);
    return { count: values.length, total, average: values.length ? total / values.length : 0 };
  },
  chart_svg: (i) => {
    const bars: Array<{ label: string; value: number }> = (Array.isArray(i) ? i : i?.bars ?? []).map((b: any) => ({ label: String(b?.label ?? ''), value: Number(b?.value ?? 0) }));
    const max = Math.max(1, ...bars.map((b) => b.value));
    const w = Math.max(80, bars.length * 40);
    const rects = bars.map((b, idx) => {
      const h = Math.round((b.value / max) * 80);
      return `<rect x="${idx * 40 + 5}" y="${100 - h}" width="30" height="${h}" fill="#2f9e44"/><text x="${idx * 40 + 20}" y="112" text-anchor="middle" font-size="9">${b.label}</text>`;
    }).join('');
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="120">${rects}</svg>`, count: bars.length };
  },
  hash_identity: (i) => ({ sha256: createHash('sha256').update(typeof i === 'string' ? i : JSON.stringify(i ?? '')).digest('hex') }),
  format_report_section: (i) => ({
    markdown: `## ${i?.title ?? '章節'}\n\n${i?.body ?? ''}\n\n_更新: ${new Date().toISOString()}_`,
  }),
  format_email: (i) => ({ subject: String(i?.subject ?? '(無主旨)'), body: `您好,\n\n${i?.body ?? ''}\n\n祝 工安` }),
  secret_scan: (i) => {
    const t = typeof i === 'string' ? i : JSON.stringify(i ?? '');
    const hits = t.match(SECRET_RE) ?? [];
    return { leaked: hits.length > 0, count: hits.length };
  },
  risk_score: (i) => {
    const t = typeof i === 'string' ? i : JSON.stringify(i ?? '');
    let score = 0;
    const matched: string[] = [];
    for (const [re, w] of RISK_TABLE) {
      if (re.test(t)) { score += w; matched.push(re.source); }
    }
    return { score: Math.min(100, score), level: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low', matched };
  },
  pii_mask: (i) => {
    const t = typeof i === 'string' ? i : JSON.stringify(i ?? '');
    const masked = t
      .replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g, '$1***$2')
      .replace(/(\+?\d[\d\s-]{6,}\d)/g, (m) => m.slice(0, 3) + '****' + m.slice(-2));
    return { masked };
  },
  reflect_stats: (i) => {
    const nums: number[] = (Array.isArray(i) ? i : i?.values ?? []).map(Number).filter(Number.isFinite);
    const total = nums.reduce((s, v) => s + v, 0);
    return { count: nums.length, total, max: nums.length ? Math.max(...nums) : 0, min: nums.length ? Math.min(...nums) : 0 };
  },
  combo_propose: (i) => {
    const recent: string[] = Array.isArray(i?.recent) ? i.recent : [];
    const freq = new Map<string, number>();
    for (let idx = 0; idx < recent.length - 1; idx++) {
      const pair = `${recent[idx]}→${recent[idx + 1]}`;
      freq.set(pair, (freq.get(pair) ?? 0) + 1);
    }
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([pair, n]) => ({ pair, n }));
    return { proposals: top };
  },
};

export interface RuneEngineOptions {
  statePath?: string;
  /** 注入亂數源(測試用) */
  random?: () => number;
}

export interface RunResult {
  ok: boolean;
  steps: Array<{ rune: string; output?: any; error?: string }>;
  finalOutput: any;
  proficiency: Record<string, ProficiencyRec>;
  enlightenment?: Enlightenment;
  signature?: string;
}

export class RuneEngine {
  private runes = new Map<string, RuneDef>();
  private prof = new Map<string, ProficiencyRec>();
  private comboProf = new Map<string, ProficiencyRec>();
  private odysseys: Enlightenment[] = [];
  private memory: Record<string, any> = {};
  private recentRunes: string[] = [];
  private statePath: string | null;
  private random: () => number;

  constructor(opts: RuneEngineOptions = {}) {
    this.statePath = opts.statePath ?? null;
    this.random = opts.random ?? Math.random;
    for (const r of SEED_RUNES) {
      const def: RuneDef = { ...r, createdAt: Date.now(), hashLock: '' };
      def.hashLock = makeHashLock(def);
      Object.freeze(def);
      this.runes.set(def.id, def);
    }
    this.load();
  }

  private load() {
    if (!this.statePath || !existsSync(this.statePath)) return;
    try {
      const s = JSON.parse(readFileSync(this.statePath, 'utf8'));
      for (const r of s.runes ?? []) {
        const def = r as RuneDef;
        if (!this.runes.has(def.id)) this.runes.set(def.id, Object.freeze(def));
      }
      for (const [k, v] of Object.entries(s.prof ?? {})) this.prof.set(k, v as ProficiencyRec);
      for (const [k, v] of Object.entries(s.comboProf ?? {})) this.comboProf.set(k, v as ProficiencyRec);
      this.odysseys = s.odysseys ?? [];
      this.memory = s.memory ?? {};
      this.recentRunes = s.recentRunes ?? [];
    } catch (e) {
      console.warn('[runes] state load failed', e);
    }
  }

  private save() {
    if (!this.statePath) return;
    try {
      mkdirSync(dirname(this.statePath), { recursive: true });
      writeFileSync(this.statePath, JSON.stringify({
        runes: [...this.runes.values()].filter((r) => r.source === 'enlightenment'),
        prof: Object.fromEntries(this.prof),
        comboProf: Object.fromEntries(this.comboProf),
        odysseys: this.odysseys,
        memory: this.memory,
        recentRunes: this.recentRunes.slice(-50),
      }, null, 2));
    } catch (e) {
      console.warn('[runes] state save failed', e);
    }
  }

  list(): RuneDef[] {
    return [...this.runes.values()];
  }

  get(id: string): RuneDef | undefined {
    return this.runes.get(id);
  }

  proficiencySnapshot(): Record<string, ProficiencyRec & { level: ProficiencyLevel }> {
    const out: Record<string, ProficiencyRec & { level: ProficiencyLevel }> = {};
    for (const [id, rec] of this.prof) out[id] = { ...rec, level: proficiencyLevel(rec.uses) };
    return out;
  }

  state() {
    const levels: Record<string, number> = {};
    for (const rec of this.prof.values()) {
      const lv = proficiencyLevel(rec.uses);
      levels[lv] = (levels[lv] ?? 0) + 1;
    }
    return {
      runeCount: this.runes.size,
      atomicCount: [...this.runes.values()].filter((r) => r.atomic).length,
      compositeCount: [...this.runes.values()].filter((r) => !r.atomic).length,
      odysseyCount: this.odysseys.length,
      odysseys: this.odysseys,
      levelDistribution: levels,
      recentRunes: this.recentRunes.slice(-20),
    };
  }

  private bump(recMap: Map<string, ProficiencyRec>, id: string, ok: boolean): ProficiencyRec {
    const rec = recMap.get(id) ?? { uses: 0, successes: 0, failures: 0 };
    rec.uses += 1;
    if (ok) rec.successes += 1;
    else rec.failures += 1;
    recMap.set(id, rec);
    return rec;
  }

  private async execStep(step: RuneStep, input: any, ctx: Record<string, any>): Promise<any> {
    const def = this.runes.get(step.rune);
    if (!def) throw new Error('unknown rune: ' + step.rune);
    if (!def.atomic) {
      if (!def.dag?.length) throw new Error('composite without dag: ' + def.id);
      return this.execDag(def.dag, input, ctx, 1);
    }
    const handler = HANDLERS[def.id];
    if (!handler) throw new Error('no handler: ' + def.id);
    return handler(input, ctx);
  }

  private async execDag(dag: RuneStep[], input: any, ctx: Record<string, any>, depth: number): Promise<any> {
    if (depth > 5) throw new Error('dag recursion depth exceeded');
    let prev: any = input;
    const outputs: any[] = [];
    for (const step of dag) {
      const repeats = Math.max(1, Math.min(100, Number(step.repeat ?? 1)));
      let stepOut: any;
      for (let r = 0; r < repeats; r++) {
        let src = input;
        if (step.inputFrom === '$prev') src = prev;
        else if (step.inputFrom && step.inputFrom.startsWith('step:')) {
          src = dotGet(outputs[Number(step.inputFrom.slice(5))] ?? null, step.inputFrom.split('|')[1] ?? '');
        }
        if (step.whenPath) {
          const gate = dotGet(prev, step.whenPath);
          if (!gate) { stepOut = { skipped: true, gate: false }; break; }
        }
        stepOut = await this.execStep(step, src, ctx);
        prev = stepOut;
      }
      outputs.push(stepOut);
    }
    return outputs[outputs.length - 1];
  }

  private comboSignature(dag: RuneStep[]): string {
    return dag.map((s) => s.rune).join('→');
  }

  private rollEnlightenment(signature: string, uses: number): Enlightenment | null {
    const level = proficiencyLevel(uses);
    const base = ENLIGHTENMENT_BASE_RATE[level];
    if (base <= 0) return null;
    const comboBonus = Math.min(0.01, uses * 0.00002);
    const rate = Math.min(0.02, base + comboBonus);
    if (this.random() >= rate) return null;
    let acc = 0;
    const roll = this.random();
    let tier: Enlightenment['tier'] = 'Epic';
    for (const t of ENLIGHTENMENT_TIER_DISTRIBUTION) {
      acc += t.p;
      if (roll < acc) { tier = t.tier; break; }
    }
    const spec = TIER_SPECS[tier];
    const seq = signature.split('→');
    const od: Enlightenment = {
      id: `odyssey_${Date.now()}_${Math.floor(this.random() * 1e6)}`,
      name: `奧義·${seq.slice(0, 3).join('-')}${tier === 'Mythic' ? '·神話' : tier === 'Legendary' ? '·傳說' : '·史詩'}`,
      tier,
      ...spec,
      fromSignature: signature,
      bornAt: Date.now(),
    };
    return od;
  }

  async run(spec: { rune?: string; dag?: RuneStep[]; input?: any }): Promise<RunResult> {
    const input = spec.input ?? {};
    const ctx = this.memory;
    const isCompositeSpec = Array.isArray(spec.dag) && spec.dag.length > 0;
    let steps: Array<{ rune: string; output?: any; error?: string }> = [];
    let ok = true;
    let finalOutput: any;
    let signature = '';
    const touched: string[] = [];

    try {
      if (isCompositeSpec) {
        signature = this.comboSignature(spec.dag!);
        finalOutput = await this.execDag(spec.dag!, input, ctx, 0);
        steps = spec.dag!.map((s) => ({ rune: s.rune }));
        for (const s of spec.dag!) touched.push(s.rune);
      } else if (spec.rune) {
        const def = this.runes.get(spec.rune);
        if (!def) throw new Error('unknown rune: ' + spec.rune);
        touched.push(def.id);
        if (def.atomic && HANDLERS[def.id]) {
          finalOutput = HANDLERS[def.id](input, ctx);
          steps = [{ rune: def.id, output: finalOutput }];
        } else if (def.dag) {
          signature = this.comboSignature(def.dag);
          finalOutput = await this.execDag(def.dag, input, ctx, 0);
          steps = def.dag.map((s) => ({ rune: s.rune }));
          for (const s of def.dag) touched.push(s.rune);
        } else {
          throw new Error('rune not executable: ' + def.id);
        }
      } else {
        throw new Error('spec needs rune or dag');
      }
    } catch (e) {
      ok = false;
      steps.push({ rune: spec.rune ?? '<dag>', error: String(e) });
      finalOutput = { error: String(e) };
    }

    for (const id of touched) this.bump(this.prof, id, ok);
    if (ok && signature) {
      const comboRec = this.bump(this.comboProf, signature, true);
      const od = this.rollEnlightenment(signature, comboRec.uses);
      if (od && !this.odysseys.some((x) => x.fromSignature === signature)) {
        const compDef: RuneDef = {
          id: od.id,
          name: od.name,
          category: 'learning',
          atomic: false,
          description: `頓悟自 [${signature}] ${od.tier} 威力${od.power}`,
          dag: spec.dag ?? this.runes.get(spec.rune ?? '')?.dag,
          source: 'enlightenment',
          createdAt: Date.now(),
          hashLock: '',
        };
        compDef.hashLock = makeHashLock(compDef);
        this.runes.set(od.id, Object.freeze(compDef));
        this.odysseys.push(od);
        this.save();
        const prof = this.proficiencySnapshot();
        return { ok, steps, finalOutput, proficiency: prof, enlightenment: od, signature };
      }
    }
    if (ok) this.recentRunes.push(...touched);
    this.save();
    return { ok, steps, finalOutput, proficiency: this.proficiencySnapshot(), signature: signature || undefined };
  }
}
