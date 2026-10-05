import Link from 'next/link';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Factory, Shield, Activity, Search, BrainCircuit, ChevronRight } from 'lucide-react';

interface ModuleSpec {
  id: string;
  title: string;
  medce: string;
  kpis: Array<{ label: string; value: string; unit: string }>;
  t5: { traceable: boolean; transparent: boolean; tangible: boolean; trustworthy: boolean; trackable: boolean };
}

function parseSpec(content: string): ModuleSpec {
  const frontmatter = content.match(/---\n([\s\S]*?)\n---/)?.[1] || '';
  const spec: Partial<ModuleSpec> = { kpis: [], t5: { traceable: true, transparent: true, tangible: true, trustworthy: true, trackable: true } };
  for (const line of frontmatter.split('\n')) {
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (key === 'id') spec.id = value;
    else if (key === 'title') spec.title = value;
    else if (key === 'medce') spec.medce = value;
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
  return spec as ModuleSpec;
}

const MEDCE_COLORS: Record<string, string> = { M: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', S: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', G: 'bg-blue-500/10 text-blue-400 border-blue-500/20', E: 'bg-amber-500/10 text-amber-400 border-amber-500/20', D: 'bg-violet-500/10 text-violet-400 border-violet-500/20', C: 'bg-rose-500/10 text-rose-400 border-rose-500/20', A: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
const MEDCE_GLOW: Record<string, string> = { M: 'rgba(6,182,212,0.15)', S: 'rgba(16,185,129,0.15)', G: 'rgba(59,130,246,0.15)', E: 'rgba(245,158,11,0.15)', D: 'rgba(139,92,246,0.15)', C: 'rgba(244,63,94,0.15)', A: 'rgba(20,184,166,0.15)' };
const MEDCE_NAMES: Record<string, string> = { M: '測量', S: '社會', G: '治理', E: '評估', D: '揭露', C: '合規', A: '參與' };
const T5_GATES = ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const;
const T5_COLORS = ['bg-cyan-400', 'bg-emerald-400', 'bg-amber-400', 'bg-violet-400', 'bg-sky-400'];

export default function OmniFactoryHub() {
  const specsDir = join(process.cwd(), 'apps', 'omni-factory', 'specs');
  let modules: ModuleSpec[] = [];
  
  if (existsSync(specsDir)) {
    const files = readdirSync(specsDir).filter(f => f.endsWith('.md'));
    modules = files.map(f => parseSpec(readFileSync(join(specsDir, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden p-6 md:p-10">
      {/* Ambient background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="border-b border-slate-800/60 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
                <Factory className="w-3 h-3 text-violet-400" />
                <span className="text-xs font-semibold text-violet-400 tracking-widest uppercase">OmniFactory</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                萬能工廠樞紐
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-base">
              P1–P7 MEDCE 流水線 · 5T 品質閘門全域檢視
            </p>
          </div>
          
          <div className="flex gap-4">
             <Link href="/omni" className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-all">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">返回 OmniCenter</span>
             </Link>
          </div>
        </header>

        {/* System Vitals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '載入模組', value: `${modules.length} Nodes`, icon: Activity, color: 'text-violet-400' },
            { label: '5T 守護', value: 'Active', icon: Shield, color: 'text-emerald-400' },
          ].map((stat, i) => (
             <div key={i} className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 backdrop-blur-sm">
                <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
                <div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="text-sm font-semibold text-slate-200">{stat.value}</div>
                </div>
             </div>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((mod) => (
            <Link key={mod.id} href={`/omni-factory/${mod.id.toLowerCase().replace('mod-', '')}`} className="group relative">
              <div 
                className="h-full flex flex-col bg-slate-900/40 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40"
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at top right, ${MEDCE_GLOW[mod.medce] || 'rgba(139,92,246,0.1)'}, transparent 60%)` }}
                />
                
                <div className="relative z-10 flex items-center justify-between mb-4">
                   <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${MEDCE_COLORS[mod.medce] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                     <span className="font-bold text-xs">{mod.medce}</span>
                     <span className="text-[10px] uppercase opacity-80">{MEDCE_NAMES[mod.medce] || '未知'}</span>
                   </div>
                   <span className="text-[10px] font-mono text-slate-500">{mod.id}</span>
                </div>
                
                <h3 className="text-base font-bold text-slate-200 mb-3 group-hover:text-white transition-colors">{mod.title}</h3>
                
                {mod.kpis.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 flex-grow">
                    {mod.kpis.slice(0, 3).map((kpi, i) => (
                      <span key={i} className="text-[10px] bg-slate-800/60 text-slate-300 px-2 py-1 rounded border border-slate-700/50">
                        {kpi.label}: <span className="font-medium text-slate-100">{kpi.value}{kpi.unit}</span>
                      </span>
                    ))}
                    {mod.kpis.length > 3 && (
                       <span className="text-[10px] text-slate-500 px-1 py-1">+{mod.kpis.length - 3}</span>
                    )}
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-slate-800/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-slate-400">5T Protocol Gates</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-violet-400 transition-colors group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex gap-1">
                    {T5_GATES.map((gate, i) => (
                      <div 
                        key={gate} 
                        className={`flex-1 h-1.5 rounded-full ${mod.t5[gate] ? T5_COLORS[i] : 'bg-slate-800'}`}
                        title={gate}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </Link>
          ))}
          
          {modules.length === 0 && (
             <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/20">
                <Factory className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
                <p className="text-slate-400 text-sm">尚未檢測到任何 P1-P7 MEDCE 規格書</p>
                <p className="text-slate-500 text-xs mt-1">請確認 apps/omni-factory/specs 目錄存在</p>
             </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

