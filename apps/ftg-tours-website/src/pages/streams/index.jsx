import { Link } from 'react-router-dom';

const STREAMS = [
  { path: '/streams/awareness', icon: '🌱', name: '覺曉流', en: 'Awareness', color: 'emerald' },
  { path: '/streams/cohesion', icon: '🤝', name: '凝聚流', en: 'Cohesion', color: 'blue' },
  { path: '/streams/restoration', icon: '🌲', name: '復元流', en: 'Restoration', color: 'teal' },
  { path: '/streams/mutuality', icon: '👨‍👩‍👧', name: '共好流', en: 'Mutuality', color: 'orange' },
  { path: '/streams/memorial', icon: '📊', name: '留念流', en: 'Memorial', color: 'purple' },
  { path: '/streams/foundation', icon: '🏔️', name: '基礎流', en: 'Foundation', color: 'slate' },
];

export default function StreamsIndex() {
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
          <span className="section-label bg-white/10 border-white/20 text-gray-200 mb-4">Six Streams of ESG Journey</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">六流體系</h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            每一條流都是一條獨立的河，有起點有終點，有深度有節奏。
            企業可以只取一瓢飲，也可以讓六流匯聚成海。
          </p>
        </div>
      </section>

      {/* Streams Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STREAMS.map((s) => (
              <Link
                key={s.path}
                to={s.path}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all hover:border-ftg-orange/30"
              >
                <div className="text-5xl mb-4">{s.icon}</div>
                <h3 className="text-2xl font-bold text-ftg-forest mb-2">{s.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{s.en}</p>
                <span className="inline-flex items-center text-ftg-orange font-medium text-sm group-hover:gap-2 transition-all">
                  深入了解 →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Principle */}
      <section className="py-24 bg-ftg-sand">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-ftg-forest mb-8">流動法則</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            前流的「合」自然孕育後流的「起」。
            <br />
            當員工親手行動後，團隊開始凝聚；凝聚後需要修復能量；
            <br />
            修復後與家人分享；分享後留下紀錄；紀錄後深化下一次體驗。
          </p>
        </div>
      </section>
    </div>
  );
}
