import { pillars, activities, tasks } from '../data/seed.js'
import { StatCard, SectionHeader, PillarBadge, ActivityIcon } from '../components/ui.jsx'

export default function Dashboard({ onNavigate }) {
  return (
    <div className="view">
      <div className="view-hero">
        <div>
          <div className="eyebrow">Omniesggo · 萬能永續平台</div>
          <h1 className="view-title">永續營運總覽</h1>
          <p className="view-sub">
            四大支柱即時狀態、近期活動與待辦，一頁掌握組織的永續進展。
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('knowledge')}>
          探索知識庫 →
        </button>
      </div>

      <section className="pillar-grid">
        {pillars.map((p) => (
          <button
            key={p.id}
            className={`pillar-card pillar-${p.color}`}
            onClick={() => onNavigate(p.id)}
          >
            <div className="pillar-top">
              <span className="pillar-key">{p.key}</span>
              <span className="pillar-en">{p.en}</span>
            </div>
            <h3 className="pillar-name">{p.name}</h3>
            <p className="pillar-desc">{p.desc}</p>
            <div className="pillar-metrics">
              {p.metrics.slice(0, 2).map((m) => (
                <div key={m.label} className="pillar-metric">
                  <span className="pillar-metric-value">{m.value}</span>
                  <span className="pillar-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
            <span className="pillar-link">查看詳情 →</span>
          </button>
        ))}
      </section>

      <div className="dashboard-cols">
        <section className="panel">
          <SectionHeader eyebrow="即時動態" title="近期活動" />
          <ul className="activity-list">
            {activities.map((a) => (
              <li key={a.id} className="activity-item">
                <ActivityIcon type={a.type} />
                <div className="activity-body">
                  <p className="activity-text">{a.text}</p>
                  <span className="activity-meta">
                    {a.actor} · {a.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <SectionHeader eyebrow="待辦事項" title="本週任務" />
          <ul className="task-list">
            {tasks.map((t) => (
              <li key={t.id} className="task-item">
                <span className={`task-status task-${t.status === '進行中' ? 'doing' : 'todo'}`} />
                <div className="task-body">
                  <p className="task-title">{t.title}</p>
                  <div className="task-meta">
                    <PillarBadge id={t.pillar} />
                    <span className="task-due">{t.due}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
