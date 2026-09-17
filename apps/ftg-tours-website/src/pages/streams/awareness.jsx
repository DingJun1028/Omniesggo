import { Link } from 'react-router-dom';

const STREAM = {
  icon: '🌱',
  name: '覺曉流',
  en: 'Awareness',
  tagline: '讓 ESG 從抽象變具體',
  quote: '當員工彎腰撿起第一片垃圾，ESG 不再是報告上的數字，而是「我親手做過的真實故事」。覺曉流讓永續意識從課本走進生命，從旁觀者變成參與者。',
  solution: 'ESG 戶外團隊日',
  endState: '員工親身參與永續行動',
  memory: '第一次親手撿拾垃圾後的震撼',
  phases: [
    { name: '起', title: '需求對焦', desc: 'HR 發起 → App 建立 ESG 旅程 → 前測問卷' },
    { name: '承', title: '場域設計', desc: '安全檢查 → 裝備準備 → 路線發布' },
    { name: '轉', title: '戶外體驗', desc: '現場簽到 → Clean-up Walk → 碳足跡記錄 → 生態觀察' },
    { name: '合', title: '團隊收斂', desc: '小組反思 → 行動承諾 → Impact Note 自動生成' },
  ],
  tools: ['Clean-up Walk', '碳足跡記錄', '生態觀察', '地方支持', '水資源', '廢棄物減量'],
};

export default function AwarenessStream() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-emerald-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/streams" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回六流總覽
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Awareness Stream</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">{STREAM.icon} {STREAM.name}</h1>
          <p className="text-xl text-emerald-100 mb-2">{STREAM.tagline}</p>
          <p className="text-lg text-gray-300 max-w-3xl">{STREAM.quote}</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-emerald-50 rounded-2xl p-6">
              <div className="text-sm text-emerald-600 font-medium mb-2">方案</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.solution}</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-6">
              <div className="text-sm text-emerald-600 font-medium mb-2">終態</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.endState}</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-6">
              <div className="text-sm text-emerald-600 font-medium mb-2">深刻記憶</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.memory}</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">起承轉合</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STREAM.phases.map((p, i) => (
              <div key={p.name} className="relative">
                <div className="text-6xl font-bold text-emerald-100 mb-2">{p.name}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-3 text-emerald-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">現場工具</h2>
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
