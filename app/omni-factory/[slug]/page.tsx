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

export default function ModuleDetail({ params }: { params: { slug: string } }) {
  const specsDir = join(process.cwd(), 'apps', 'omni-factory', 'specs');
  const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));

  // Find the matching spec
  const targetId = 'MOD-' + params.slug.toUpperCase();
  const file = files.find((f) => {
    const content = readFileSync(join(specsDir, f), 'utf8');
    return content.includes(`id: ${targetId}`);
  });

  if (!file) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>404</h1>
          <p>找不到模組：{params.slug}</p>
          <Link href="/omni-factory" style={{ color: '#009EB0' }}>返回萬能工廠</Link>
        </div>
      </div>
    );
  }

  const spec = parseSpec(readFileSync(join(specsDir, file), 'utf8'));
  const t5Entries = Object.entries(spec.t5);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #003262, #009EB0)', padding: '32px' }}>
        <Link href="/omni-factory" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>← 返回萬能工廠</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 8, background: MEDCE_COLORS[spec.medce] || '#64748B', color: '#FFF', fontWeight: 700, fontSize: 18 }}>{spec.medce}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#FFF' }}>{spec.title}</h1>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{MEDCE_NAMES[spec.medce]} · {spec.id}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
        {/* 5T Quality Gate */}
        <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>5T 品質閘門</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {t5Entries.map(([gate, passed], i) => (
              <div key={gate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: passed ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${passed ? '#BBF7D0' : '#FECACA'}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: T5_COLORS[i] }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: passed ? '#166534' : '#991B1B' }}>{T5_NAMES[i]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12 }}>{passed ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* KPI Cards */}
        {spec.kpis.length > 0 && (
          <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>KPI 指標</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {spec.kpis.map((kpi, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{kpi.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>
                    {kpi.value}<span style={{ fontSize: 14, fontWeight: 400, color: '#64748B', marginLeft: 4 }}>{kpi.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vault */}
        {spec.vaultRows.length > 0 && (
          <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>證據金庫</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>項目</th>
                  <th style={{ padding: '8px 12px' }}>標準</th>
                  <th style={{ padding: '8px 12px' }}>數值</th>
                </tr>
              </thead>
              <tbody>
                {spec.vaultRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 12px' }}>{row.item}</td>
                    <td style={{ padding: '8px 12px', color: '#64748B' }}>{row.standard}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Sections */}
        {spec.sections.length > 0 && (
          <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>章節</h2>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {spec.sections.map((s, i) => <li key={i} style={{ padding: '4px 0', color: '#374151' }}>{s}</li>)}
            </ul>
          </section>
        )}

        {/* Assembly Spec */}
        <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>組裝規格</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>函數</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {spec.functions.map((f, i) => <span key={i} style={{ fontSize: 12, background: '#EFF6FF', color: '#1E40AF', padding: '4px 8px', borderRadius: 4 }}>{f}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>元件</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {spec.components.map((c, i) => <span key={i} style={{ fontSize: 12, background: '#F0FDF4', color: '#166534', padding: '4px 8px', borderRadius: 4 }}>{c}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>符文</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {spec.runes.map((r, i) => <span key={i} style={{ fontSize: 12, background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: 4 }}>{r}</span>)}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
