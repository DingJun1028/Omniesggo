import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface KpiData {
  label: string;
  value: string;
  unit: string;
}

interface ModuleSpec {
  id: string;
  title: string;
  medce: string;
  functions: string[];
  components: string[];
  theme: string;
  runes: string[];
  kpis: KpiData[];
  t5: { traceable: boolean; transparent: boolean; tangible: boolean; trustworthy: boolean; trackable: boolean };
  sections: string[];
  vaultRows: Array<{ item: string; standard: string; value: string }>;
}

function parseSpec(content: string): ModuleSpec {
  const frontmatter = content.match(/---\n([\s\S]*?)\n---/)?.[1] || '';
  const spec: Partial<ModuleSpec> = {
    kpis: [], functions: [], components: [], runes: [], sections: [], vaultRows: [],
    t5: { traceable: true, transparent: true, tangible: true, trustworthy: true, trackable: true },
  };
  for (const line of frontmatter.split('\n')) {
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (key === 'id') spec.id = value;
    else if (key === 'title') spec.title = value;
    else if (key === 'medce') spec.medce = value;
    else if (key === 'theme') spec.theme = value;
    else if (key === 'functions') spec.functions = value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (key === 'components') spec.components = value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (key === 'runes') spec.runes = value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const kpiMatch = content.match(/## KPI 指標\n([\s\S]*?)(?=\n##|$)/);
  if (kpiMatch) {
    for (const line of kpiMatch[1].split('\n')) {
      const m = line.match(/^- (.+?): ([\d.]+)\s*(.*)$/);
      if (m) spec.kpis!.push({ label: m[1], value: m[2], unit: m[3] || '' });
    }
  }
  const t5Match = content.match(/## 5T 品質狀態\n([\s\S]*?)(?=\n##|$)/);
  if (t5Match) {
    const t5Text = t5Match[1];
    spec.t5 = {
      traceable: t5Text.includes('溯源 Traceable: ✓'),
      transparent: t5Text.includes('透明 Transparent: ✓'),
      tangible: t5Text.includes('可量化 Tangible: ✓'),
      trustworthy: t5Text.includes('信任 Trustworthy: ✓'),
      trackable: t5Text.includes('可追蹤 Trackable: ✓'),
    };
  }
  const sectionMatch = content.match(/## 章節\n([\s\S]*?)(?=\n##|$)/);
  if (sectionMatch) {
    spec.sections = sectionMatch[1].split('\n').filter((l) => l.trim().startsWith('-')).map((l) => l.replace(/^-\s*/, '').trim());
  }
  const vaultMatch = content.match(/## 證據金庫\n([\s\S]*?)(?=\n##|$)/);
  if (vaultMatch) {
    for (const line of vaultMatch[1].split('\n')) {
      const m = line.match(/^- (.+?) \| (.+?) \| (.+)$/);
      if (m) spec.vaultRows!.push({ item: m[1], standard: m[2], value: m[3] });
    }
  }
  return spec as ModuleSpec;
}

const MEDCE_COLORS: Record<string, string> = { M: 'bg-cyan-500 text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.6)]', S: 'bg-emerald-500 text-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.6)]', G: 'bg-blue-500 text-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.6)]', E: 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.6)]', D: 'bg-purple-500 text-slate-900 shadow-[0_0_10px_rgba(168,85,247,0.6)]', C: 'bg-rose-500 text-slate-900 shadow-[0_0_10px_rgba(244,63,94,0.6)]', A: 'bg-teal-500 text-slate-900 shadow-[0_0_10px_rgba(20,184,166,0.6)]' };
const MEDCE_NAMES: Record<string, string> = { M: '測量', S: '社會', G: '治理', E: '評估', D: '揭露', C: '合規', A: '參與' };
const T5_COLORS = ['bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]', 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]', 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]', 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]', 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'];
const T5_NAMES = ['溯源', '透明', '可量化', '信任', '可追蹤'];

export default function OmniFactoryHub({ searchParams }: { searchParams: { medce?: string; q?: string } }) {
  let modules: ModuleSpec[] = [];
  try {
    const specsDir = join(process.cwd(), 'apps', 'omni-factory', 'specs');
    const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
    modules = files.map((f) => parseSpec(readFileSync(join(specsDir, f), 'utf8')));
  } catch (err) {
    console.error('Failed to read omni-factory specs:', err);
  }

  const filter = searchParams.medce || 'ALL';
  const search = searchParams.q || '';

  const filtered = modules.filter((m) => {
    if (filter !== 'ALL' && m.medce !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 flex flex-col">
      {/* 英雄區塊 (Hero Header) */}
      <header className="relative overflow-hidden pt-24 pb-16 px-6 text-center border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 animate-pulse tracking-tight drop-shadow-md mb-4">
          萬能工廠 OmniFactory
        </h1>
        <p className="relative z-10 text-sm md:text-base text-cyan-100/70 font-medium tracking-widest">
          {modules.length} 個模組 · P1–P7 流水線 · 5T 品質閘門
        </p>
      </header>

      {/* Filters */}
      <form method="GET" className="max-w-7xl mx-auto w-full px-6 pt-10">
        <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <input
            type="text"
            name="q"
            placeholder="搜尋模組..."
            defaultValue={search}
            className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2 rounded-xl transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            搜尋
          </button>
          <div className="w-full h-px bg-slate-800/60 my-1" />
          <div className="flex flex-wrap gap-2 w-full">
            <button type="submit" name="medce" value="ALL" className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors border ${filter === 'ALL' ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400'}`}>
              全部 ({modules.length})
            </button>
            {Object.entries(MEDCE_NAMES).map(([key, name]) => (
              <button key={key} type="submit" name="medce" value={key} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors border ${filter === key ? 'bg-slate-800 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400'}`}>
                {key} {name} ({modules.filter((m) => m.medce === key).length})
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Grid */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.sort((a, b) => a.id.localeCompare(b.id)).map((mod) => (
            <Link key={mod.id} href={`/omni-factory/${mod.id.toLowerCase().replace('mod-', '')}`} className="group block h-full">
              <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-500/40 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] overflow-hidden relative">
                
                {/* Top Edge Glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-3 mb-4">
                  <span className={`flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm tracking-wider ${MEDCE_COLORS[mod.medce] || 'bg-slate-700 text-slate-300'}`}>
                    {mod.medce}
                  </span>
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    {MEDCE_NAMES[mod.medce] || mod.medce}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-4 line-clamp-2">
                  {mod.title}
                </h3>
                
                {mod.kpis && mod.kpis.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {mod.kpis.slice(0, 2).map((kpi, i) => (
                      <span key={i} className="text-[11px] font-medium bg-slate-800 text-cyan-100/70 border border-slate-700 px-2 py-1 rounded-md">
                        {kpi.label}: <strong className="text-cyan-400">{kpi.value}</strong>{kpi.unit}
                      </span>
                    ))}
                    {mod.kpis.length > 2 && (
                      <span className="text-[11px] font-medium bg-slate-800/50 text-slate-500 px-2 py-1 rounded-md">
                        +{mod.kpis.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="mt-auto">
                  <div className="flex gap-2 mb-4">
                    {(['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const).map((gate, i) => (
                      <div 
                        key={gate} 
                        title={T5_NAMES[i]} 
                        className={`h-1.5 flex-1 rounded-full ${mod.t5[gate] ? T5_COLORS[i] : 'bg-slate-800'}`} 
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 tracking-wider">
                    {mod.id}
                  </div>
                </div>
                
              </div>
            </Link>
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-slate-900/20">
            沒有符合條件的模組
          </div>
        )}
      </main>
    </div>
  );
}
