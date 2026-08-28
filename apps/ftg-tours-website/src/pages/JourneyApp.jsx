import { Link } from 'react-router-dom';
import ContactSection from '../components/ContactSection';

export default function JourneyApp() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-ftg-forest overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ftg-forest via-ftg-forest/90 to-ftg-green/80" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">FTG Journey App</span>
          <h1 className="section-title text-white mt-4 mb-6">永續旅程管理平台</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            將每一趟永續旅行從規劃到影響力追蹤，完整數位化管理
          </p>
          <div className="mt-8 flex gap-4">
            <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener" className="px-8 py-3 rounded-full font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
              開啟 App →
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-ftg-forest mb-16 text-center">六大核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📋', title: '安全檢查清單', desc: '裝備、健康、天氣、安全須知，出團前全方位確認' },
              { icon: '🌱', title: 'ESG 任務追蹤', desc: 'Clean-up Walk、碳足跡、生態觀察、地方支持、水資源、廢棄物減量' },
              { icon: '📊', title: 'Impact Note 報告', desc: '自動產出 ESG 報告，支援 GRI/SASB 框架、PDF 匯出' },
              { icon: '👨‍👩‍👧', title: '親子任務卡', desc: '自然賓果、拍照挑戰、尋寶遊戲、手作體驗、在地美食' },
              { icon: '🧘', title: '身心健康追蹤', desc: '正念練習、運動負荷分級、數位排毒、30-day follow-up' },
              { icon: '🗺️', title: '共識營工具', desc: 'Opportunity Map 畫布、3 年 Roadmap、共識記錄' },
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

      {/* How it works */}
      <section className="py-24 bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-ftg-forest mb-16 text-center">使用流程</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: '建立旅程', desc: '選擇服務類型、設定日期與目的地' },
              { step: '02', title: '安全確認', desc: '完成安全檢查清單與裝備準備' },
              { step: '03', title: '執行追蹤', desc: '記錄 ESG 任務、筆記、照片' },
              { step: '04', title: '產出報告', desc: '自動生成 Impact Note 報告' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-ftg-forest text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h4 className="font-bold text-ftg-forest mb-2">{s.title}</h4>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">開始使用 FTG Journey App</h2>
          <p className="text-gray-600 mb-8">使用 Google 帳號登入，立即開始管理您的永續旅程</p>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-forest text-white hover:bg-ftg-green transition-all shadow-lg">
            立即開啟 →
          </a>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
