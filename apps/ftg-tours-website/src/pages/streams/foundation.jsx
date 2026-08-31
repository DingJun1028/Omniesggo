import { Link } from 'react-router-dom';

const STREAM = {
  icon: '🏔️',
  name: '基礎流',
  en: 'Foundation',
  tagline: '一切的核心體驗載體',
  quote: '基礎流是其他五流的河床 — 沒有體驗的深度，其他流就無法流動。每一次出行，都應該成為值得說出來的故事，而不是「出去玩了一天」。',
  solution: '企業員工旅遊',
  endState: '每次出行都有意義',
  memory: '每一次出遊都成為故事',
  phases: [
    { name: '起', title: '需求對焦', desc: 'HR 發起 → 旅遊設計 → 目的地選擇' },
    { name: '承', title: '場域設計', desc: '行程規劃 → 安全準備 → 行前說明' },
    { name: '轉', title: '深度體驗', desc: '現場執行 → 安全檢查 → 知識學習' },
    { name: '合', title: '反思收斂', desc: '小組反思 → 行動承諾 → 分享傳播' },
  ],
  tools: ['安全檢查清單', '打包清單', '行程管理', '知識庫', 'GPS 簽到'],
};

export default function FoundationStream() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-slate-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/streams" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回六流總覽
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Foundation Stream</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">{STREAM.icon} {STREAM.name}</h1>
          <p className="text-xl text-slate-100 mb-2">{STREAM.tagline}</p>
          <p className="text-lg text-gray-300 max-w-3xl">{STREAM.quote}</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="text-sm text-slate-600 font-medium mb-2">方案</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.solution}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="text-sm text-slate-600 font-medium mb-2">終態</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.endState}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="text-sm text-slate-600 font-medium mb-2">深刻記憶</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.memory}</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">起承轉合</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STREAM.phases.map((p, i) => (
              <div key={p.name} className="relative">
                <div className="text-6xl font-bold text-slate-100 mb-2">{p.name}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-3 text-slate-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
