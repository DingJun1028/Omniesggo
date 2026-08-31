import { Link } from 'react-router-dom';

const STREAM = {
  icon: '🤝',
  name: '凝聚流',
  en: 'Cohesion',
  tagline: '團隊在自然中重建信任',
  quote: '在遠離辦公室的山林裡，主管們脫下頭銜的盔甲，重新看見彼此。凝聚流不只是團隊建立，而是在自然場域中，讓信任從土壤裡慢慢長出來。',
  solution: '高階主管共識營',
  endState: '組織對齊使命與文化',
  memory: '主管在山林間說出真心話的瞬間',
  phases: [
    { name: '起', title: '需求對焦', desc: 'CEO 發起 → 策略提問 → 共識營設計' },
    { name: '承', title: '場域設計', desc: '山林場地 → 安全準備 → 遠離辦公室' },
    { name: '轉', title: '深度對話', desc: 'Opportunity Map → 3 年 Roadmap → 共識記錄' },
    { name: '合', title: '行動承諾', desc: '公開宣誓 → 行動計畫 → 下次覆盤' },
  ],
  tools: ['Opportunity Map', '3 年策略路徑', '共識記錄'],
};

export default function CohesionStream() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/streams" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回六流總覽
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Cohesion Stream</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">{STREAM.icon} {STREAM.name}</h1>
          <p className="text-xl text-blue-100 mb-2">{STREAM.tagline}</p>
          <p className="text-lg text-gray-300 max-w-3xl">{STREAM.quote}</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="text-sm text-blue-600 font-medium mb-2">方案</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.solution}</div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="text-sm text-blue-600 font-medium mb-2">終態</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.endState}</div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="text-sm text-blue-600 font-medium mb-2">深刻記憶</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.memory}</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">起承轉合</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STREAM.phases.map((p, i) => (
              <div key={p.name} className="relative">
                <div className="text-6xl font-bold text-blue-100 mb-2">{p.name}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-3 text-blue-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">共識工具</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STREAM.tools.map((t) => (
              <div key={t} className="bg-white rounded-xl p-4 text-center border border-gray-200">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
