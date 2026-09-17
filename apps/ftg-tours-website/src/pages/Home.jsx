import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ftg-forest via-ftg-forest/90 to-ftg-green/80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">ESG Outdoor Wellbeing Travel</span>
          <h1 className="section-title text-white mt-4 mb-6">墾趣旅遊 FTG TOURS</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/corporate-travel" className="px-8 py-3 rounded-full font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
              企業方案 →
            </a>
            <a href="/wellbeing-retreat" className="px-8 py-3 rounded-full font-semibold bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-all">
              身心平衡
            </a>
          </div>
        </div>
      </section>

      {/* Six Services */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label mb-4">Our Services</span>
            <h2 className="section-title text-ftg-forest mt-4 mb-6">六大企業方案</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { path: '/corporate-travel', icon: '✈️', title: '企業員工旅遊', desc: '客製化員工旅遊，凝聚團隊與永續行動' },
              { path: '/family-day', icon: '👨‍👩‍👧', title: '企業家庭日', desc: '親子共融的戶外健康家庭日活動' },
              { path: '/esg-team-day', icon: '🌱', title: 'ESG Outdoor Team Day', desc: '結合環境與社會共益的戶外團隊日' },
              { path: '/wellbeing-retreat', icon: '🧘', title: '員工身心平衡', desc: '森林療癒、正念練習、數位排毒' },
              { path: '/executive-retreat', icon: '🎯', title: '高階主管共識營', desc: '共識建立與策略 retreat' },
              { path: '/esg-impact-note', icon: '📊', title: 'ESG Impact Note', desc: '活動成果報告與永續揭露' },
            ].map((s, i) => (
              <Link key={i} to={s.path} className="card-elevated group hover:border-ftg-orange/30 transition-all">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-bold text-ftg-forest mb-2 group-hover:text-ftg-orange transition-colors">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
                <span className="inline-block mt-4 text-sm text-ftg-orange font-medium">了解更多 →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ftg-sand">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">準備好打造專屬的永續旅程了嗎？</h2>
          <p className="text-gray-600 mb-8">與我們討論您的需求，為企業與員工創造有意義的旅行體驗</p>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            免費諮詢 →
          </a>
        </div>
      </section>
    </div>
  );
}
