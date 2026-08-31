import { Link } from 'react-router-dom';

const IMAGES = {
  hero: '/images/wellbeing-retreat/員工身心平衡-頁首大橫幅.png',
  relax: '/images/wellbeing-retreat/旅程可以留下什麼-放鬆節奏.png',
  teamConnect: '/images/wellbeing-retreat/旅程可以留下什麼-團隊可更自交流.png',
  culture: '/images/wellbeing-retreat/旅程可以留下什麼-企業文化溫度.png',
  inspiration: '/images/wellbeing-retreat/旅程可以留下什麼-後續活動靈感.png',
  shareable: '/images/wellbeing-retreat/旅程可以留下什麼-可分享的活動素材.png',
  memories: '/images/wellbeing-retreat/旅程可以留下什麼-留下值得分享的回憶.png',
  energy: '/images/wellbeing-retreat/旅程可以留下什麼-恢復能量.png',
  calm: '/images/wellbeing-retreat/旅程可以留下什麼-自然中的安定感.png',
  naturalLink: '/images/wellbeing-retreat/旅程可以留下什麼-團隊更自然的連結.png',
  employeeMemory: '/images/wellbeing-retreat/旅程可以留下什麼-員工放鬆回憶.png',
};

const PILLARS = [
  {
    icon: '🌿',
    title: '森林療癒',
    desc: '在森林中開啟感官，透過五覺體驗與自然連結，降低壓力賀爾蒙，提升身心復元力。',
    tag: 'Nature Immersion',
  },
  {
    icon: '🧘',
    title: '正念練習',
    desc: '專業引導的正念冥想與呼吸練習，幫助員工在忙碌工作中找到內在平衡與專注。',
    tag: 'Mindfulness',
  },
  {
    icon: '🏃',
    title: '運動負荷分級',
    desc: '依據個人體能狀態分級設計活動強度，確保每位參與者都能在安全範圍內獲得最佳體驗。',
    tag: 'Adaptive Fitness',
  },
  {
    icon: '📵',
    title: '數位排毒',
    desc: '暫時放下手機與工作訊息，在自然中重新感受當下的真實與平靜。',
    tag: 'Digital Detox',
  },
  {
    icon: '🔄',
    title: '30-day Follow-up',
    desc: '旅程結束後持續追蹤與輔導，將體驗轉化為日常習慣，維持長期身心平衡。',
    tag: 'Sustained Wellness',
  },
];

const JOURNEY_FLOW = [
  { step: '01', title: '行前評估', desc: '壓力檢測、體能評估、個人需求了解', icon: '📋' },
  { step: '02', title: '遠離日常', desc: '驅車前往自然場域，漸斷數位連結', icon: '🚐' },
  { step: '03', title: '感官甦醒', desc: '森林浴、正念引導、大地連結', icon: '🌲' },
  { step: '04', title: '深度體驗', desc: '團體療癒活動、個人反思時間', icon: '🧘' },
  { step: '05', title: '能量整合', desc: '分享圈、行動承諾、回歸準備', icon: '🔗' },
  { step: '06', title: '持續追蹤', desc: '30天 follow-up、成效評估', icon: '📈' },
];

const OUTCOMES = [
  { img: IMAGES.relax, caption: '放鬆節奏' },
  { img: IMAGES.teamConnect, caption: '團隊可更自交流' },
  { img: IMAGES.culture, caption: '企業文化溫度' },
  { img: IMAGES.inspiration, caption: '後續活動靈感' },
  { img: IMAGES.shareable, caption: '可分享的活動素材' },
  { img: IMAGES.memories, caption: '留下值得分享的回憶' },
  { img: IMAGES.energy, caption: '恢復能量' },
  { img: IMAGES.calm, caption: '自然中的安定感' },
  { img: IMAGES.naturalLink, caption: '團隊更自然的連結' },
  { img: IMAGES.employeeMemory, caption: '員工放鬆回憶' },
];

export default function WellbeingRetreat() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.hero}
            alt="員工身心平衡旅程"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ftg-forest/90 via-ftg-forest/70 to-ftg-forest/40" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首頁
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Employee Wellbeing Retreat</span>
          <h1 className="section-title text-white mt-4 mb-6">員工身心平衡旅程</h1>
          <p className="section-subtitle text-gray-300 max-w-2xl">
            結合森林療癒、正念練習與數位排毒，為企業打造兼具深度與溫度的身心復元之旅。
            讓員工在自然中找回內在平衡，帶回可持續的職場能量。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#contact" className="px-8 py-3 rounded-full font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
              預約諮詢 →
            </a>
            <a href="#pillars" className="px-8 py-3 rounded-full font-semibold bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-all">
              了解方案
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-ftg-forest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '92%', label: '參與者壓力顯著降低' },
              { value: '87%', label: '團隊凝聚力提升' },
              { value: '95%', label: '願意推薦給同事' },
              { value: '30天', label: '持續追蹤輔導' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-ftg-orange mb-2">{s.value}</div>
                <div className="text-sm text-gray-300">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 Pillars */}
      <section id="pillars" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label mb-4">Five Pillars</span>
            <h2 className="section-title text-ftg-forest mt-4 mb-6">身心平衡五大支柱</h2>
            <p className="section-subtitle text-gray-600 max-w-2xl mx-auto">
              以科學為基礎、自然為場域，打造完整的身心復元系統
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PILLARS.map((p, i) => (
              <div key={i} className="card-elevated group hover:border-ftg-orange/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{p.icon}</span>
                  <span className="text-xs font-medium text-ftg-orange bg-ftg-orange/10 px-2 py-1 rounded-full">{p.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-ftg-forest mb-3">{p.title}</h3>
                <p className="text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Flow */}
      <section className="py-24 bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label mb-4">Journey Flow</span>
            <h2 className="section-title text-ftg-forest mt-4 mb-6">六階段完整旅程</h2>
            <p className="section-subtitle text-gray-600 max-w-2xl mx-auto">
              從行前評估到 30 天追蹤，每個環節都為深度復元而設計
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {JOURNEY_FLOW.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-ftg-forest text-white flex items-center justify-center text-lg font-bold">{s.step}</div>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h4 className="font-bold text-ftg-forest mb-2">{s.title}</h4>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes Gallery */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-label mb-4">Journey Outcomes</span>
            <h2 className="section-title text-ftg-forest mt-4 mb-6">旅程可以留下什麼</h2>
            <p className="section-subtitle text-gray-600 max-w-2xl mx-auto">
              不只是當下的感動，更是帶回職場與生活的持續能量
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {OUTCOMES.map((o, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl aspect-[3/4]">
                <img
                  src={o.img}
                  alt={o.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ftg-forest/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-medium">{o.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 bg-ftg-forest">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">為您的企業打造身心平衡之旅</h2>
          <p className="text-gray-300 mb-8 text-lg">
            客製化方案、專業引導團隊、完整的 30 天追蹤系統
          </p>
          <a
            href="https://journey.ftgtours.esggo.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg"
          >
            預約諮詢 →
          </a>
        </div>
      </section>
    </div>
  );
}
