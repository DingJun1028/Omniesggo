import { pillars } from '../data/seed.js'
import { StatCard, SectionHeader } from '../components/ui.jsx'

export default function Carbon() {
  const p = pillars.find((x) => x.id === 'carbon')
  return (
    <div className="view">
      <div className="view-hero">
        <div>
          <div className="eyebrow">支柱一 · 碳盤查</div>
          <h1 className="view-title">碳盤查</h1>
          <p className="view-sub">{p.desc}</p>
        </div>
      </div>

      <div className="stat-grid">
        {p.metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} unit={m.unit} trend={p.trend} />
        ))}
      </div>

      <section className="panel">
        <SectionHeader eyebrow="排放結構" title="範疇分布" />
        <div className="bar-chart">
          {p.metrics.map((m) => {
            const max = Math.max(...p.metrics.map((x) => parseFloat(x.value)))
            const pct = (parseFloat(m.value) / max) * 100
            return (
              <div key={m.label} className="bar-row">
                <span className="bar-label">{m.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="bar-value">{m.value} {m.unit}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="下一步" title="建議行動" />
        <ul className="action-list">
          <li>完成範疇二排放數據驗證，確認電力排放係數版本。</li>
          <li>啟動範疇三供應商資料收集，目標覆蓋率 90%。</li>
          <li>設定 2030 減量路徑，對齊科學基礎減量目標（SBTi）。</li>
        </ul>
      </section>
    </div>
  )
}
