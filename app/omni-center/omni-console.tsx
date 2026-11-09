'use client';

/**
 * universal-omni-console.tsx — 萬能中心「萬能函數」控制檯
 *
 * 直接呼叫 src/lib/esggo 的 omni() 萬能函數與 omniFn 函數庫，
 * 讓使用者在 UI 上體驗：建立組件 / 筆記 / 任務、執行已註冊函數、分派 OmniOne 案例。
 * 統一展示回傳的 OmniResult（id / hash / data）。
 */

import { useMemo, useState } from 'react';
import { Wand2, Play, Copy, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { persistOmniCase, persistConsoleSnapshot } from './universal-omni-console.actions';
import { omni, omniFn, createFiveTComponent, type OmniKind, type OmniResult, type CaseType, type ComponentEvidence, type OmniRequest } from '@lib/esggo';

const KINDS: { key: OmniKind; label: string; hint: string }[] = [
  { key: 'note', label: '筆記 Note', hint: '標題 + 內容' },
  { key: 'task', label: '任務 Task', hint: '標題 + 優先級' },
  { key: 'component', label: '組件 Component', hint: 'data + evidence (JSON)' },
  { key: 'fn', label: '函數 Fn', hint: '函數名稱 + args (JSON 陣列)' },
  { key: 'case', label: '案例 Case', hint: 'caseType + 輸入' },
];

const CASE_TYPES: CaseType[] = [
  'code_optimization',
  'documentation',
  'data_analysis',
  'esg_report',
  'ui_design',
  'architecture',
  'bug_fix',
  'general',
];

const PRIORITIES = ['high', 'medium', 'low'] as const;

function tryParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function UniversalOmniConsole() {
  const [kind, setKind] = useState<OmniKind>('note');
  const [title, setTitle] = useState('ESG 永續戰略');
  const [content, setContent] = useState('Q3 目標：完成碳排放基準年建立。');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('high');
  const [compData, setCompData] = useState('{\n  "metric": "carbon",\n  "value": 1200\n}');
  const [compEvidence, setCompEvidence] = useState(
    '{\n  "originCause": "手動上傳",\n  "processTrace": ["擷取", "驗算"],\n  "finalEffect": "已建立組件"\n}',
  );
  const [fnName, setFnName] = useState('esggo.genId');
  const [fnArgs, setFnArgs] = useState('["X"]');
  const [caseType, setCaseType] = useState<CaseType>('esg_report');
  const [result, setResult] = useState<OmniResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const registry = useMemo(() => omniFn.list(), []);

  const execute = async () => {
    setError(null);
    setResult(null);
    let req: OmniRequest = { kind: 'note', title, content };

    switch (kind) {
      case 'note':
        req = { kind: 'note', title, content };
        break;
      case 'task':
        req = { kind: 'task', title, priority };
        break;
      case 'component': {
        const d = tryParse(compData);
        const e = tryParse(compEvidence);
        if (!d.ok) return setError(`data 解析失敗：${d.error}`);
        if (!e.ok) return setError(`evidence 解析失敗：${e.error}`);
        req = { kind: 'component', data: d.value, evidence: e.value as ComponentEvidence };
        break;
      }
      case 'fn': {
        const a = tryParse(fnArgs);
        if (!a.ok) return setError(`args 解析失敗：${a.error}`);
        const args = Array.isArray(a.value) ? a.value : [a.value];
        req = { kind: 'fn', name: fnName, args };
        break;
      }
      case 'case':
        req = { kind: 'case', caseType, input: content };
        break;
      default:
        return setError('未知的 kind');
    }

    let localResult: OmniResult | null = null;
    try {
      localResult = omni(req);
      if (!localResult.ok) {
        setError(localResult.error);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    try {
      await persistOmniCase(localResult);
      await persistConsoleSnapshot(localResult, req, fnName);
    } catch {
      // Persist failure should not block UI result display.
    }

    setResult(localResult);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sealToVault = () => {
    setError(null);
    setResult(null);
    try {
      const comp = createFiveTComponent(
        { demo: '5T 元件', generatedAt: new Date().toISOString() },
        { actor: 'omni-console' },
      );
      setResult({ ok: true, kind: 'component', id: comp.uuid, data: comp, hash: (comp as any).hash, registered: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accentPurple text-white flex items-center justify-center text-lg">
          <Wand2 size={18} />
        </div>
        <div>
          <h2 className="font-['Montserrat',sans-serif] text-base font-bold text-accentPurple">
            萬能函數控制檯
          </h2>
          <div className="text-xs text-textSecondary">
            呼叫 omni() · 當前函數庫共 {omniFn.count()} 個函數
          </div>
        </div>
      </div>

      {/* Kind selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            title={k.hint}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${
              kind === k.key
                ? 'bg-accentPurple text-white'
                : 'bg-primary text-textSecondary hover:bg-borderColor/50'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Inputs */}
        <div className="bg-primary rounded-xl p-3 space-y-2.5">
          {(kind === 'note' || kind === 'task' || kind === 'case') && (
            <Field label="標題 / 輸入">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none"
                placeholder="標題"
              />
            </Field>
          )}

          {(kind === 'note' || kind === 'case') && (
            <Field label="內容">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none font-['Fira_Code',monospace]"
              />
            </Field>
          )}

          {kind === 'task' && (
            <Field label="優先級">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {kind === 'component' && (
            <>
              <Field label="data (JSON)">
                <textarea
                  value={compData}
                  onChange={(e) => setCompData(e.target.value)}
                  rows={4}
                  className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none font-['Fira_Code',monospace]"
                />
              </Field>
              <Field label="evidence (JSON)">
                <textarea
                  value={compEvidence}
                  onChange={(e) => setCompEvidence(e.target.value)}
                  rows={4}
                  className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none font-['Fira_Code',monospace]"
                />
              </Field>
            </>
          )}

          {kind === 'fn' && (
            <>
              <Field label="函數名稱">
                <input
                  value={fnName}
                  onChange={(e) => setFnName(e.target.value)}
                  className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none font-['Fira_Code',monospace]"
                  placeholder="esggo.xxx"
                />
              </Field>
              <Field label="args (JSON 陣列)">
                <textarea
                  value={fnArgs}
                  onChange={(e) => setFnArgs(e.target.value)}
                  rows={3}
                  className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none font-['Fira_Code',monospace]"
                />
              </Field>
            </>
          )}

          {kind === 'case' && (
            <Field label="caseType">
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value as CaseType)}
                className="w-full bg-secondary rounded-lg px-2.5 py-1.5 text-sm text-textPrimary border border-borderColor/50 focus:border-accentPurple focus:outline-none"
              >
                {CASE_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <button
            onClick={execute}
            className="w-full flex items-center justify-center gap-2 bg-accentPurple text-white font-semibold rounded-lg py-2 text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <Play size={16} /> 執行 omni()
          </button>

          <button
            onClick={sealToVault}
            className="w-full flex items-center justify-center gap-2 bg-accentGold text-white font-semibold rounded-lg py-2 text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <ShieldCheck size={16} /> 建立 5T 組件並寫入 Vault
          </button>

          {error && (
            <div className="flex items-start gap-1.5 text-xs text-accentRed bg-accentRed/10 rounded-lg px-2.5 py-2">
              <XCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result + registry */}
        <div className="space-y-3">
          <div className="bg-primary rounded-xl p-3 min-h-[160px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-textSecondary font-semibold tracking-wider">
                執行結果 OmniResult
              </span>
              {result && (
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1 text-xs text-textSecondary hover:text-accentPurple"
                >
                  {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  {copied ? '已複製' : '複製'}
                </button>
              )}
            </div>
            {result ? (
              <pre className="text-[11px] leading-relaxed text-textPrimary font-['Fira_Code',monospace] whitespace-pre-wrap break-words max-h-[280px] overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="text-xs text-textSecondary/70 py-6 text-center">
                選擇類型並執行，結果將顯示於此
              </div>
            )}
          </div>

          <div className="bg-primary rounded-xl p-3">
            <div className="text-xs text-textSecondary font-semibold tracking-wider mb-2">
              函數庫（點擊填入名稱）
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-auto">
              {registry.map((m) => (
                <button
                  key={m.name}
                  onClick={() => {
                    setKind('fn');
                    setFnName(m.name);
                  }}
                  title={`${m.description} (${m.category})`}
                  className="text-[11px] font-['Fira_Code',monospace] bg-secondary border border-borderColor/50 rounded-md px-2 py-1 text-textSecondary hover:text-accentPurple hover:border-accentPurple transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-textSecondary mb-1">{label}</span>
      {children}
    </label>
  );
}
