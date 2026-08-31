import { Link } from 'react-router-dom';

export default function EsgTeamDay() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/esg-team-day/team day-頁首大橫幅.png" alt="ESG 戶外團隊日" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ftg-forest/90 via-ftg-forest/70 to-ftg-forest/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">ESG Team Day</span>
          <h1 className="section-title text-white mt-4 mb-6">ESG Outdoor Team Day</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            結合環境與社會共益的戶外團隊日，透過 Clean-up Walk 與生態教育，實踐企業永續承諾。
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ftg-forest mb-12 text-center">活動設計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🚶', title: 'Clean-up Walk', desc: '沿路清理環境，量化廢棄物數據' },
              { icon: '🌱', title: '生態教育', desc: '專業講師引導，認識在地生態' },
              { icon: '🤝', title: '團隊共創', desc: '協作完成永續挑戰任務' },
              { icon: '♻️', title: '友善環境行動', desc: '净灘、淨山、生態復育' },
              { icon: '📊', title: '碳足跡估算', desc: '計算並抵銷活動碳排' },
              { icon: '🏆', title: '永續授勳', desc: 'ESG 成果認證與分享' },
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
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">讓團隊日成為永續行動的起點</h2>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            預約諮詢 →
          </a>
        </div>
      </section>
    </div>
  );
}
