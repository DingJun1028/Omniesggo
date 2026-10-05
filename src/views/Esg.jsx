import { pillars } from '../data/seed.js'
import { StatCard, SectionHeader } from '../components/ui.jsx'

const frameworks = [
  { name: 'GRI Standards', status: '已揭露', coverage: 96, note: '142 項指標' },
  { name: 'SASB', status: '已揭露', coverage: 91, note: '26 項指標' },
  { name: 'TCFD', status: '進行中', coverage: 78, note: '情境分析草稿' },
  { name: 'SBTi', status: '規劃中', coverage: 40, note: '目標設定中' },
]

export default function Esg() {
  const p = pillars.find((x) => x.id === 'esg')
  return (
    <div className="view">
      <div className="view-hero">
        <div>
          <div className="eyebrow">支柱二 · 永續報告</div>
          <h1 className="view-title">永續報告</h1>
          <p className="view-sub">{p.desc}</p>
        </div>
      </div>

      <div className="stat-grid">
        {p.metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} unit={m.unit} trend={p.trend} />
        ))}
      </div>

      <section className="panel">
        <SectionHeader eyebrow="揭露框架" title="合規進度" />
        <div className="framework-list">
          {frameworks.map((f) => (
            <div key={f.name} className="framework-row">
              <div className="framework-head">
                <span className="framework-name">{f.name}</span>
                <span className={`framework-status status-${f.status === '已揭露' ? 'ok' : 'warn'}`}>
                  {f.status}
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${f.coverage}%` }} />
              </div>
              <span className="framework-note">{f.note}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
