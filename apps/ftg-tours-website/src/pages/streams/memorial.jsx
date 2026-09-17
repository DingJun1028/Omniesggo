import { Link } from 'react-router-dom';

const STREAM = {
  icon: '📊',
  name: '留念流',
  en: 'Memorial',
  tagline: '活動成果化為影響素材',
  quote: '一趟旅程的價值，不應該在回程的遊覽車上就消散。留念流將每一次行動轉化為可量化的影響力報告，讓「我來過、我做過」成為可分享的證據。',
  solution: 'ESG Impact Note',
  endState: '可量化、可分享的 ESG 故事',
  memory: '看見自己的行動被記錄成數字',
  phases: [
    { name: '起', title: '需求對焦', desc: 'ESG 目標設定 → 數據收集設計 → Impact Note 規劃' },
    { name: '承', title: '場域設計', desc: '數據收集工具 → GRI/SDGs 對應 → 視覺化模板' },
    { name: '轉', title: '數據收集', desc: '現場數據 → Impact Note 自動生成 → 圖表視覺化' },
    { name: '合', title: '分享傳播', desc: '報告發布 → 社群素材 → 年度累積' },
  ],
  tools: ['GRI 框架對應', 'SDGs 對應', '數據視覺化', 'Impact Note'],
};

export default function MemorialStream() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/streams" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors text-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回六流總覽
          </Link>
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Memorial Stream</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">{STREAM.icon} {STREAM.name}</h1>
          <p className="text-xl text-purple-100 mb-2">{STREAM.tagline}</p>
          <p className="text-lg text-gray-300 max-w-3xl">{STREAM.quote}</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-purple-50 rounded-2xl p-6">
              <div className="text-sm text-purple-600 font-medium mb-2">方案</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.solution}</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6">
              <div className="text-sm text-purple-600 font-medium mb-2">終態</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.endState}</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6">
              <div className="text-sm text-purple-600 font-medium mb-2">深刻記憶</div>
              <div className="text-xl font-bold text-gray-900">{STREAM.memory}</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">起承轉合</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STREAM.phases.map((p, i) => (
              <div key={p.name} className="relative">
                <div className="text-6xl font-bold text-purple-100 mb-2">{p.name}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 -right-3 text-purple-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
