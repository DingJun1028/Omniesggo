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

const MEDCE_COLORS: Record<string, string> = { M: '#009EB0', S: '#10B981', G: '#3B82F6', E: '#F59E0B', D: '#8B5CF6', C: '#EF4444', A: '#06B6D4' };
const MEDCE_NAMES: Record<string, string> = { M: '測量', S: '社會', G: '治理', E: '評估', D: '揭露', C: '合規', A: '參與' };
const T5_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4'];
const T5_NAMES = ['溯源', '透明', '可量化', '信任', '可追蹤'];

export default function OmniFactoryHub({ searchParams }: { searchParams: { medce?: string; q?: string } }) {
  const specsDir = join(process.cwd(), 'apps', 'omni-factory', 'specs');
  const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
  const modules = files.map((f) => parseSpec(readFileSync(join(specsDir, f), 'utf8')));

  const filter = searchParams.medce || 'ALL';
  const search = searchParams.q || '';

  const filtered = modules.filter((m) => {
    if (filter !== 'ALL' && m.medce !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #003262, #009EB0)', padding: '40px 32px' }}>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#FFF' }}>萬能工廠 OmniFactory</h1>
        <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.8)' }}>{modules.length} 個模組 · P1–P7 流水線 · 5T 品質閘門</p>
      </header>

      {/* Filters */}
      <form method="GET" style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            name="q"
            placeholder="搜尋模組..."
            defaultValue={search}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', flex: 1, minWidth: 200 }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#003262', color: '#FFF', cursor: 'pointer', fontSize: 14 }}>搜尋</button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <button type="submit" name="medce" value="ALL" style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: filter === 'ALL' ? '#003262' : '#FFF', color: filter === 'ALL' ? '#FFF' : '#64748B', cursor: 'pointer', fontSize: 12 }}>全部 ({modules.length})</button>
            {Object.entries(MEDCE_NAMES).map(([key, name]) => (
              <button type="submit" name="medce" value={key} key={key} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: filter === key ? MEDCE_COLORS[key] : '#FFF', color: filter === key ? '#FFF' : '#64748B', cursor: 'pointer', fontSize: 12 }}>
                {key} {name} ({modules.filter((m) => m.medce === key).length})
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Grid */}
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.sort((a, b) => a.id.localeCompare(b.id)).map((mod) => (
            <Link key={mod.id} href={`/omni-factory/${mod.id.toLowerCase().replace('mod-', '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, height: '100%', boxSizing: 'border-box', transition: 'transform 0.15s, box-shadow 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: MEDCE_COLORS[mod.medce] || '#64748B', color: '#FFF', fontWeight: 700 }}>{mod.medce}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{MEDCE_NAMES[mod.medce] || mod.medce}</span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{mod.title}</h3>
                {mod.kpis && mod.kpis.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {mod.kpis.slice(0, 2).map((kpi, i) => (
                      <span key={i} style={{ fontSize: 12, background: '#F1F5F9', padding: '4px 8px', borderRadius: 4 }}>{kpi.label}: {kpi.value}{kpi.unit}</span>
                    ))}
                    {mod.kpis.length > 2 && <span style={{ fontSize: 12, color: '#94A3B8' }}>+{mod.kpis.length - 2}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 3 }}>
                  {(['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'] as const).map((gate, i) => (
                    <span key={gate} title={T5_NAMES[i]} style={{ width: 18, height: 4, borderRadius: 2, background: mod.t5[gate] ? T5_COLORS[i] : '#E2E8F0' }} />
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>{mod.id}</div>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>沒有符合條件的模組</p>}
      </main>
    </div>
  );
}
