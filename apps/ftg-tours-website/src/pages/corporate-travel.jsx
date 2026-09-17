import { Link } from 'react-router-dom';

export default function CorporateTravel() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/corporate/hero-corporate.webp" alt="企業員工旅遊" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ftg-forest/90 via-ftg-forest/70 to-ftg-forest/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Corporate Travel</span>
          <h1 className="section-title text-white mt-4 mb-6">企業員工旅遊</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            客製化員工旅遊方案，結合永續理念與團隊凝聚，打造兼具深度與意義的企業出行。
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ftg-forest mb-12 text-center">方案內容</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🌍', title: '永續目的地', desc: '精選低碳足跡、支持在地經濟的旅遊目的地' },
              { icon: '🤝', title: '團隊凝聚活動', desc: '透過共同體驗強化跨部門連結與信任' },
              { icon: '♻️', title: '綠色旅行', desc: '低碳交通、環保住宿、在地飲食' },
              { icon: '📋', title: '安全檢查清單', desc: '裝備、健康、天氣全方位確認' },
              { icon: '📊', title: 'Impact 報告', desc: '量化永續影響力，支援 ESG 揭露' },
              { icon: '🎯', title: '客製化設計', desc: '依據企業文化與需求量身打造' },
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
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">為您的企業打造專屬旅程</h2>
          <p className="text-gray-600 mb-8">與我們討論需求，取得客製化方案與報價</p>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            預約諮詢 →
          </a>
        </div>
      </section>
    </div>
  );
}
