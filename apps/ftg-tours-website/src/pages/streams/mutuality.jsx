import { Link } from 'react-router-dom';

const STREAM = {
  icon: '👨‍👩‍👧',
  name: '共好流',
  en: 'Mutuality',
  tagline: '企業關懷延伸至家庭',
  quote: '企業對員工的關懷，不應該在下班時鐘響起就結束。共好流邀請家人一起走進自然，讓「幸福企業」不只是口號，而是孩子記憶裡溫暖的週末。',
  solution: '企業家庭日',
  endState: '幸福企業與雇主品牌',
  memory: '孩子第一次和父母在自然中完成任務',
  phases: [
    { name: '起', title: '需求對焦', desc: 'HR 發起 → 家庭日設計 → 親子任務卡' },
    { name: '承', title: '場域設計', desc: '親子友善場地 → 安全準備 → 家庭分組' },
    { name: '轉', title: '家庭體驗', desc: '親子任務 → 自然觀察 → 照片上傳' },
    { name: '合', title: '家庭收斂', desc: '家庭反思 → 分享展示 → 企業文化傳承' },
  ],
  tools: ['親子任務卡', '自然觀察記錄', '照片上傳', '團隊遊戲'],
};

export default function MutualityStream() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-700 to-orange-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/streams" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回六流總覽
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Mutuality Stream</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">{STREAM.icon} {STREAM.name}</h1>
          <p className="text-xl text-orange-100 mb-2">{STREAM.tagline}</p>
          <p className="text-lg text-gray-300 max-w-3xl">{STREAM.quote}</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-orange-50 rounded-2xl p-6">
              <div className="text-sm text-orange-600 font-medium mb-2">方案</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.solution}</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-6">
              <div className="text-sm text-orange-600 font-medium mb-2">終態</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.endState}</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-6">
              <div className="text-sm text-orange-600 font-medium mb-2">深刻記憶</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.memory}</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">起承轉合</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STREAM.phases.map((p, i) => (
              <div key={p.name} className="relative">
                <div className="text-6xl font-bold text-orange-100 mb-2">{p.name}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-3 text-orange-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
