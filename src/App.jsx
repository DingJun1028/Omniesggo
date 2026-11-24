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
      <aside className="side">
        <div className="brand">
          <div className="mark">O</div>
          <div className="bt">
            <span className="bn">Omniesggo</span>
            <span className="bs">萬能永續平台</span>
          </div>
        </div>

        <nav className="nav">
          <div className="nl">四大支柱</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`ni ${route === n.id ? 'on' : ''}`}
              onClick={() => setRoute(n.id)}
            >
              <span className="ic">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="foot">
          <div className="fc">
            <span className="fd" />
            <div>
              <div className="ft">系統運作中</div>
              <div className="fs">AI 標籤引擎 · 即時</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="tt">Omniesggo</div>
          <div className="tr">
            <span className="badge-mvp">MVP</span>
            <div className="av">林</div>
          </div>
        </header>
        <div className="content">{renderView()}</div>
      </main>
    </div>
  )
}
