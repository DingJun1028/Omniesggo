import { Link } from 'react-router-dom';

export default function FamilyDay() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-ftg-forest overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ftg-forest via-ftg-forest/90 to-ftg-green/80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Family Day</span>
          <h1 className="section-title text-white mt-4 mb-6">企業家庭日</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            親子共融的戶外健康家庭日活動，讓員工與家人一同在自然中創造美好回憶。
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ftg-forest mb-12 text-center">活動內容</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🌳', title: '自然探索', desc: '親子生態觀察、自然手作體驗' },
              { icon: '🎨', title: '手作工作坊', desc: '在地素材手作、環保藝術創作' },
              { icon: '🏃', title: '健康活動', desc: '親子運動、趣味競賽、大地遊戲' },
              { icon: '🍽️', title: '在地餐食', desc: '支持在地小農、低碳飲食體驗' },
              { icon: '📸', title: '回憶紀錄', desc: '專業攝影、家庭合照、紀念品' },
              { icon: '🎪', title: '客製化設計', desc: '依據年齡層與需求量身規劃' },
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
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">打造難忘的家庭日</h2>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            預約諮詢 →
          </a>
        </div>
      </section>
    </div>
  );
}
