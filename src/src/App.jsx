import { useState } from 'react'
import Dashboard from './views/Dashboard.jsx'
import Carbon from './views/Carbon.jsx'
import Esg from './views/Esg.jsx'
import SupplyChain from './views/SupplyChain.jsx'
import Knowledge from './views/Knowledge.jsx'

const NAV = [
  { id: 'dashboard', label: '總覽', icon: '◈' },
  { id: 'carbon', label: '碳盤查', icon: '🌱' },
  { id: 'esg', label: '永續報告', icon: '📊' },
  { id: 'supply', label: '供應鏈', icon: '🔗' },
  { id: 'knowledge', label: '知識庫', icon: '🧠' },
]

export default function App() {
  const [route, setRoute] = useState('dashboard')

  const renderView = () => {
    switch (route) {
      case 'carbon': return <Carbon />
      case 'esg': return <Esg />
      case 'supply': return <SupplyChain />
      case 'knowledge': return <Knowledge />
      default: return <Dashboard onNavigate={setRoute} />
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div className="brand-text">
            <span className="brand-name">Omniesggo</span>
            <span className="brand-sub">萬能永續平台</span>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">四大支柱</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${route === n.id ? 'is-active' : ''}`}
              onClick={() => setRoute(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="foot-card">
            <span className="foot-dot" />
            <div>
              <div className="foot-title">系統運作中</div>
              <div className="foot-sub">AI 標籤引擎 · 即時</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">Omniesggo</div>
          <div className="topbar-right">
            <span className="topbar-badge">MVP</span>
            <div className="avatar">林</div>
          </div>
        </header>
        <div className="content">{renderView()}</div>
      </main>
    </div>
  )
}
