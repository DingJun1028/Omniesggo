import { Link } from 'react-router-dom';

export default function EsgImpactNote() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-ftg-forest overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ftg-forest via-ftg-forest/90 to-ftg-green/80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">ESG Impact Note</span>
          <h1 className="section-title text-white mt-4 mb-6">ESG Impact Note</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            活動成果報告與永續揭露，量化環境與社會影響力，支援 GRI/SASB 框架。
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ftg-forest mb-12 text-center">報告內容</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📊', title: '數據分析', desc: '參與人次、碳足跡、廢棄物量化' },
              { icon: '🌱', title: '環境貢獻', desc: '生態復育、碳抵銷、水資源' },
              { icon: '💬', title: '參與者回饋', desc: '滿意度、心得、行為改變' },
              { icon: '📋', title: 'GRI/SASB 對應', desc: '國際框架指標揭露' },
              { icon: '📄', title: 'PDF/PPT 匯出', desc: '一键產出專業報告' },
              { icon: '📣', title: '社群素材', desc: '活動照片、影片、分享圖' },
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
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">讓永續成果被看見</h2>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            了解更多 →
          </a>
        </div>
      </section>
    </div>
  );
}
