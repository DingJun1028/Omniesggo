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
    kpis: [],
    functions: [],
    components: [],
    runes: [],
    sections: [],
    vaultRows: [],
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
const T5_GATES = [
  { key: 'traceable', label: '溯源', color: '#3B82F6' },
  { key: 'transparent', label: '透明', color: '#22C55E' },
  { key: 'tangible', label: '可量化', color: '#F59E0B' },
  { key: 'trustworthy', label: '信任', color: '#8B5CF6' },
  { key: 'trackable', label: '可追蹤', color: '#06B6D4' },
] as const;

export default function ModulePage({ params }: { params: { slug: string } }) {
  const specsDir = join(process.cwd(), 'apps', 'omni-factory', 'specs');
  const files = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
  const allModules = files.map((f) => parseSpec(readFileSync(join(specsDir, f), 'utf8')));

  const module = allModules.find((m) => m.id.toLowerCase().replace('mod-', '') === params.slug);

  if (!module) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, color: '#94A3B8' }}>404</h1>
          <p style={{ color: '#64748B' }}>模組 {params.slug} 不存在</p>
          <Link href="/omni-factory" style={{ color: '#009EB0' }}>返回萬能工廠</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #003262, #009EB0)', padding: '40px 32px' }}>
        <Link href="/omni-factory" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none' }}>
          ← 返回萬能工廠
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: MEDCE_COLORS[module.medce] || '#64748B',
              color: '#FFF',
              fontWeight: 800,
              fontSize: 24,
            }}
          >
            {module.medce}
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#FFF' }}>{module.title}</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {MEDCE_NAMES[module.medce]} · {module.id}
            </p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {/* 5T Quality Gate */}
        <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>5T 品質閘門</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {T5_GATES.map((gate) => (
              <div
                key={gate.key}
                style={{
                  flex: '1 1 150px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: module.t5[gate.key as keyof typeof module.t5] ? `${gate.color}15` : '#F1F5F9',
                  border: `1px solid ${module.t5[gate.key as keyof typeof module.t5] ? gate.color : '#E2E8F0'}`,
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: module.t5[gate.key as keyof typeof module.t5] ? gate.color : '#CBD5E1' }} />
                <span style={{ fontWeight: 600, color: module.t5[gate.key as keyof typeof module.t5] ? gate.color : '#64748B' }}>
                  {gate.label}
                </span>
                <span style={{ fontSize: 12, color: module.t5[gate.key as keyof typeof module.t5] ? gate.color : '#94A3B8' }}>
                  {module.t5[gate.key as keyof typeof module.t5] ? '✓ 通過' : '未通過'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* KPI Cards */}
        {module.kpis && module.kpis.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>KPI 指標</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {module.kpis.map((kpi, i) => (
                <div key={i} style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
                  <div style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>{kpi.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#003262' }}>
                    {kpi.value}
                    {kpi.unit && <span style={{ fontSize: 14, fontWeight: 400, color: '#64748B', marginLeft: 4 }}>{kpi.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vault */}
        {module.vaultRows && module.vaultRows.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>證據金庫</h2>
            <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748B' }}>項目</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748B' }}>標準</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748B' }}>數值</th>
                  </tr>
                </thead>
                <tbody>
                  {module.vaultRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14 }}>{row.item}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748B' }}>{row.standard}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Sections */}
        {module.sections && module.sections.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>章節</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {module.sections.map((section, i) => (
                <div key={i} style={{ background: '#FFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: '16px 20px', fontSize: 15 }}>
                  {section}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assembly Spec */}
        <section style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>組裝規格</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>函數</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {module.functions?.map((f, i) => (
                  <span key={i} style={{ fontSize: 12, background: '#EFF6FF', color: '#1E40AF', padding: '4px 8px', borderRadius: 4 }}>{f}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>元件</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {module.components?.map((c, i) => (
                  <span key={i} style={{ fontSize: 12, background: '#F0FDF4', color: '#166534', padding: '4px 8px', borderRadius: 4 }}>{c}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>符文</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {module.runes?.map((r, i) => (
                  <span key={i} style={{ fontSize: 12, background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: 4 }}>{r}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
