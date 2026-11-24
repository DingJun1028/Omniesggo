import { pillars, activities, tasks, pillarMeta } from '../data/seed.js'

const HERO_IMG =
  'https://media.base44.com/images/public/6ac99323f1bb8a286918aefa/80b70b503_generated_5cdf8aba.jpg'
const STRIP_IMG =
  'https://media.base44.com/images/public/6ac99323f1bb8a286918aefa/23a3f76f7_generated_9c4b0e1b.jpg'

const ACT_ICON = { carbon: '🌱', esg: '📊', supply: '🔗', knowledge: '🧠' }

export default function Dashboard({ onNavigate }) {
  return (
    <div className="view">
      <div className="deck">
        <div className="hero">
          <img src={HERO_IMG} alt="" />
          <div className="scrim" />
          <div className="hb">
            <div className="eyebrow">Omniesggo · 萬能永續平台</div>
            <h1 className="vt">永續營運總覽</h1>
            <p className="vs">
              四大支柱即時狀態、近期活動與待辦，一頁掌握組織的永續進展。
            </p>
            <button className="btn" onClick={() => onNavigate('knowledge')}>
              探索知識庫 →
            </button>
          </div>
        </div>

        <section className="quad">
          {pillars.map((p) => (
            <button key={p.id} className="pc" onClick={() => onNavigate(p.id)}>
              <div className="pt">
                <span className="pk">{p.key}</span>
                <span className="pe">{p.en}</span>
              </div>
              <h3 className="pn">{p.name}</h3>
              <p className="pd">{p.desc}</p>
              <div className="pm">
                {p.metrics.slice(0, 2).map((m) => (
                  <div key={m.label} className="pmi">
                    <span className="pmv">{m.value}</span>
                    <span className="pml">{m.label}</span>
                  </div>
                ))}
              </div>
              <span className="pl">查看詳情 →</span>
            </button>
          ))}
        </section>
      </div>

      <svg className="sep" viewBox="0 0 1000 28" preserveAspectRatio="none">
        <path d="M0 14 C150 4 250 24 400 14 S650 4 800 14 S950 20 1000 14" fill="none" stroke="#22543d" strokeWidth="1.5" />
        <g fill="#22543d">
          <path d="M150 9 q8 -8 14 0 q-6 6 -14 0z" />
          <path d="M400 19 q8 -8 14 0 q-6 6 -14 0z" />
          <path d="M650 9 q8 -8 14 0 q-6 6 -14 0z" />
          <path d="M850 19 q8 -8 14 0 q-6 6 -14 0z" />
        </g>
        <circle cx="500" cy="14" r="4" fill="#84cc16" stroke="#22543d" strokeWidth="2" />
      </svg>

      <div className="lower">
        <section className="panel led">
          <div className="sh">
            <div className="eyebrow">即時動態</div>
            <h2 className="st">近期活動</h2>
          </div>
          <ul className="ul">
            {activities.map((a) => (
              <li key={a.id} className="ai">
                <span className="aic">{ACT_ICON[a.type] || '•'}</span>
                <div className="ab">
                  <p className="at">{a.text}</p>
                  <span className="am">{a.actor} · {a.time}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="strip">
            <img src={STRIP_IMG} alt="" />
          </div>
        </section>

        <section className="panel stack">
          <div className="sh">
            <div className="eyebrow">待辦事項</div>
            <h2 className="st">本週任務</h2>
          </div>
          <ul className="ul">
            {tasks.map((t) => (
              <li key={t.id} className="ti">
                <span className={`tn ${t.status === '進行中' ? 'd' : 'o'}`} />
                <div className="tb">
                  <p className="tl">{t.title}</p>
                  <div className="tm">
                    <span className="bd"><i />{pillarMeta[t.pillar]?.label || t.pillar}</span>
                    <span className="due">{t.due}</span>
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
