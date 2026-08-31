import { Link } from 'react-router-dom';

export default function ExecutiveRetreat() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/executive-retreat/高階主管共識-頁首橫幅.png" alt="高階主管共識營" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ftg-forest/90 via-ftg-forest/70 to-ftg-forest/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Executive Retreat</span>
          <h1 className="section-title text-white mt-4 mb-6">高階主管共識營</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            透過系統思考與深度對話，建立高阶主管間的共識與策略聯盟，重塑組織信任與願景。
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ftg-forest mb-12 text-center">共識營設計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🧭', title: '系統思考', desc: '全局視角分析組織挑戰與機會' },
              { icon: '🤝', title: '跨部門協作', desc: '打破本位主義，建立協作機制' },
              { icon: '🎯', title: '3年策略願景', desc: '共創中長期發展方向與目標' },
              { icon: '🌉', title: '信任重建', desc: '深度對話修復關係與信任' },
              { icon: '🏔️', title: '自然場域', desc: '遠離辦公環境，打開新視角' },
              { icon: '📜', title: '共識記錄', desc: '具體結論與行動方案追蹤' },
            ].map((f, i) => (
              <div key={i} className="card-elevated">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-ftg-forest mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-ftg-sand">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">打造高效共識團隊</h2>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            預約諮詢 →
          </a>
        </div>
      </section>
    </div>
  );
}
