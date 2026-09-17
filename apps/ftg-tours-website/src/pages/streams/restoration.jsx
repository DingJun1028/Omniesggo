import { Link } from 'react-router-dom';

const STREAM = {
  icon: '🌲',
  name: '復元流',
  en: 'Restoration',
  tagline: '身心在高壓後恢復',
  quote: '現代職場的速度，讓「休息」變成奢侈品。復元流不是逃避工作，而是學會真正的修復 — 在自然中找回呼吸的節奏，在靜默中重新聽見自己。',
  solution: '員工身心平衡旅程',
  endState: '工作生活品質持續改善',
  memory: '第一次在森林中真正放下手機',
  phases: [
    { name: '起', title: '需求診斷', desc: '壓力檢測 → 生活品質評估 → 個人化建議' },
    { name: '承', title: '場域設計', desc: '森林療癒場地 → 安全準備 → 遠離訊號' },
    { name: '轉', title: '深度體驗', desc: '正念練習 → 運動負荷 → 數位排毒' },
    { name: '合', title: '持續追蹤', desc: '30-day follow-up → 日記提醒 → 週期回顧' },
  ],
  tools: ['需求診斷問卷', '正念練習', '運動負荷分級', '數位排毒', '30-day 追蹤'],
};

export default function RestorationStream() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-teal-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/streams" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回六流總覽
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Restoration Stream</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">{STREAM.icon} {STREAM.name}</h1>
          <p className="text-xl text-teal-100 mb-2">{STREAM.tagline}</p>
          <p className="text-lg text-gray-300 max-w-3xl">{STREAM.quote}</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-teal-50 rounded-2xl p-6">
              <div className="text-sm text-teal-600 font-medium mb-2">方案</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.solution}</div>
            </div>
            <div className="bg-teal-50 rounded-2xl p-6">
              <div className="text-sm text-teal-600 font-medium mb-2">終態</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.endState}</div>
            </div>
            <div className="bg-teal-50 rounded-2xl p-6">
              <div className="text-sm text-teal-600 font-medium mb-2">深刻記憶</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.memory}</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">起承轉合</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STREAM.phases.map((p, i) => (
              <div key={p.name} className="relative">
                <div className="text-6xl font-bold text-teal-100 mb-2">{p.name}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-3 text-teal-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">復元工具</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
