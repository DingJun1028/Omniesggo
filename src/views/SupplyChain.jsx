import { pillars } from '../data/seed.js'
import { StatCard, SectionHeader } from '../components/ui.jsx'

const suppliers = [
  { id: 'A-042', name: '宏遠材料', risk: '高', score: 42, category: '原物料' },
  { id: 'B-117', name: '旭日電子', risk: '中', score: 68, category: '電子元件' },
  { id: 'C-203', name: '綠能物流', risk: '低', score: 88, category: '物流' },
  { id: 'D-051', name: '澄淨水務', risk: '低', score: 91, category: '水處理' },
  { id: 'E-330', name: '聯邦包材', risk: '中', score: 61, category: '包裝' },
]

export default function SupplyChain() {
  const p = pillars.find((x) => x.id === 'supply')
  return (
    <div className="view">
      <div className="view-hero">
        <div>
          <div className="eyebrow">支柱三 · 供應鏈</div>
          <h1 className="view-title">供應鏈</h1>
          <p className="view-sub">{p.desc}</p>
        </div>
      </div>

      <div className="stat-grid">
        {p.metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} unit={m.unit} trend={p.trend} />
        ))}
      </div>

      <section className="panel">
        <SectionHeader eyebrow="風險矩陣" title="供應商評鑑" />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>供應商</th>
                <th>類別</th>
                <th>評鑑分數</th>
                <th>風險等級</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="supplier-id">{s.id}</span> {s.name}
                  </td>
                  <td>{s.category}</td>
                  <td>
                    <div className="score-cell">
                      <span className="score-num">{s.score}</span>
                      <div className="bar-track bar-sm">
                        <div className="bar-fill" style={{ width: `${s.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`risk-pill risk-${s.risk}`}>{s.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
