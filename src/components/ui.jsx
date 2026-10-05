import { pillars, activities, tasks, tags, documents, pillarMeta } from '../data/seed.js'

// Small shared UI atoms used across views.

export function PillarBadge({ id, size = 'sm' }) {
  const meta = pillarMeta[id] || { label: id, color: 'moss' }
  return (
    <span className={`badge badge-${meta.color} badge-${size}`}>
      <span className="badge-dot" />
      {meta.label}
    </span>
  )
}

export function StatCard({ label, value, unit, trend, accent }) {
  const up = trend >= 0
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className={`stat-trend ${up ? 'is-up' : 'is-down'}`}>
          {up ? '▲' : '▼'} {Math.abs(trend)}% 較上期
        </div>
      )}
    </div>
  )
}

export function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  )
}

export function TagChip({ name, active, onClick }) {
  return (
    <button
      className={`tag-chip ${active ? 'is-active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {name}
    </button>
  )
}

export function ActivityIcon({ type }) {
  const map = {
    carbon: '🌱',
    esg: '📊',
    supply: '🔗',
    knowledge: '🧠',
  }
  return <span className="activity-icon">{map[type] || '•'}</span>
}
