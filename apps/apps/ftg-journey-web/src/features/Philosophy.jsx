import { useState } from 'react';
import { motion } from 'framer-motion';

const STREAMS = [
  {
    id: 'awareness',
    name: '覺曉流',
    en: 'Awareness',
    icon: '🌱',
    color: 'from-emerald-500 to-emerald-700',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    mission: '讓 ESG 從抽象變具體',
    program: 'ESG 戶外團隊日',
    goal: '員工親身參與永續行動',
    memory: '第一次親手撿拾垃圾後的震撼',
    description: '當員工彎腰撿起第一片垃圾，ESG 不再是報告上的數字，而是「我親手做過的真實故事」。覺曉流讓永續意識從課本走進生命，從旁觀者變成參與者。',
  },
  {
    id: 'cohesion',
    name: '凝聚流',
    en: 'Cohesion',
    icon: '🤝',
    color: 'from-blue-500 to-blue-700',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    mission: '團隊在自然中重建信任',
    program: '高階主管共識營',
    goal: '組織對齊使命與文化',
    memory: '主管在山林間說出真心話的瞬間',
    description: '在遠離辦公室的山林裡，主管們脫下頭銜的盔甲，重新看見彼此。凝聚流不只是團隊建立，而是在自然場域中，讓信任從土壤裡慢慢長出來。',
  },
  {
    id: 'restoration',
    name: '復元流',
    en: 'Restoration',
    icon: '🌲',
    color: 'from-green-500 to-green-700',
    bgLight: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    mission: '身心在高壓後恢復',
    program: '員工身心平衡旅程',
    goal: '工作生活品質持續改善',
    memory: '第一次在森林中真正放下手機',
    description: '現代職場的速度，讓「休息」變成奢侈品。復元流不是逃避工作，而是學會真正的修復 — 在自然中找回呼吸的節奏，在靜默中重新聽見自己。',
  },
  {
    id: 'mutuality',
    name: '共好流',
    en: 'Mutuality',
    icon: '👨‍👩‍👧',
    color: 'from-amber-500 to-amber-700',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    mission: '企業關懷延伸至家庭',
    program: '企業家庭日',
    goal: '幸福企業與雇主品牌',
    memory: '孩子第一次和父母在自然中完成任務',
    description: '企業對員工的關懷，不應該在下班時鐘響起就結束。共好流邀請家人一起走進自然，讓「幸福企業」不只是口號，而是孩子記憶裡溫暖的週末。',
  },
  {
    id: 'memorial',
    name: '留念流',
    en: 'Memorial',
    icon: '📊',
    color: 'from-purple-500 to-purple-700',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    mission: '活動成果化為影響素材',
    program: 'ESG Impact Note',
    goal: '可量化、可分享的 ESG 故事',
    memory: '看見自己的行動被記錄成數字',
    description: '一趟旅程的價值，不應該在回程的遊覽車上就消散。留念流將每一次行動轉化為可量化的影響力報告，讓「我來過、我做過」成為可分享的證據。',
  },
  {
    id: 'foundation',
    name: '基礎流',
    en: 'Foundation',
    icon: '🏔️',
    color: 'from-slate-500 to-slate-700',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    mission: '一切的核心體驗載體',
    program: '企業員工旅遊',
    goal: '每次出行都有意義',
    memory: '每一次出遊都成為故事',
    description: '基礎流是其他五流的河床 — 沒有體驗的深度，其他流就無法流動。每一次出行，都應該成為值得說出來的故事，而不是「出去玩了一天」。',
  },
];

const PRINCIPLES = [
  { icon: '◯', title: '完整性', desc: '每一條流都有獨立的「起→承→轉→合」完整閉環' },
  { icon: '◉', title: '深刻性', desc: '每一條流都有獨特的「記憶錨點」與「情感高峰」' },
  { icon: '◎', title: '獨立性', desc: '企業可以只選擇一條流，不依賴其他流即可運作' },
  { icon: '◌', title: '流動性', desc: '前流的「合」自然孕育後流的「起」' },
  { icon: '◍', title: '升級性', desc: '每次重訪同一條流，都站在更高的 ESG 基準點上體驗更深' },
];

const FLOW_SEQUENCE = [
  { from: 'awareness', to: 'cohesion', label: '覺醒 → 凝聚' },
  { from: 'cohesion', to: 'restoration', label: '凝聚 → 復元' },
  { from: 'restoration', to: 'mutuality', label: '復元 → 共好' },
  { from: 'mutuality', to: 'memorial', label: '共好 → 留念' },
  { from: 'memorial', to: 'foundation', label: '留念 → 深化' },
];

export function Philosophy() {
  const [activeStream, setActiveStream] = useState(null);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            永續旅程 APP · 哲學核心
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            六流體系
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            每一條流都是一條獨立的河，<br />
            有起點有終點，有深度有節奏。<br />
            <span className="text-emerald-700 font-medium">企業可以只取一瓢飲，也可以讓六流匯聚成海。</span>
          </p>
        </motion.div>
      </section>

      {/* Six Streams Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">六流總覽</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STREAMS.map((stream, i) => (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border-2 ${stream.borderColor} ${stream.bgLight} p-6 cursor-pointer transition-all hover:shadow-lg ${
                activeStream === stream.id ? 'ring-2 ring-offset-2 ring-emerald-500' : ''
              }`}
              onClick={() => setActiveStream(activeStream === stream.id ? null : stream.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{stream.icon}</span>
                <div>
                  <h3 className={`text-lg font-bold ${stream.textColor}`}>{stream.name}</h3>
                  <span className="text-xs text-gray-500">{stream.en}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 font-medium mb-2">{stream.mission}</p>
              <p className="text-xs text-gray-500">{stream.description}</p>

              {activeStream === stream.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-200 space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">方案：</span>
                    <span className="font-medium text-gray-800">{stream.program}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">終態：</span>
                    <span className="font-medium text-gray-800">{stream.goal}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">記憶：</span>
                    <span className="font-medium text-gray-800 italic">「{stream.memory}」</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flow Sequence */}
      <section className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">流動關係</h2>
        <div className="flex flex-wrap justify-center items-center gap-4">
          {STREAMS.map((stream, i) => (
            <div key={stream.id} className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stream.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                {stream.icon}
              </div>
              {i < STREAMS.length - 1 && (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 mt-6 max-w-xl mx-auto">
          前流的「合」自然孕育後流的「起」。<br />
          當員工親手行動後，團隊開始凝聚；凝聚後需要修復能量；<br />
          修復後與家人分享；分享後留下紀錄；紀錄後深化下一次體驗。
        </p>
      </section>

      {/* Single Stream Depth Principles */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">單流深刻五原則</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm"
            >
              <div className="text-3xl text-emerald-600 mb-2">{p.icon}</div>
              <h4 className="font-bold text-gray-900 mb-1">{p.title}</h4>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Qi-Cheng-Zhuan-He */}
        <section className="bg-emerald-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">每流內在四段：起承轉合</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { phase: '起', name: '起源', desc: '需求對焦、意識喚醒' },
              { phase: '承', name: '承載', desc: '場域設計、安全準備' },
              { phase: '轉', name: '轉化', desc: '親手行動、深刻體驗' },
              { phase: '合', name: '合一', desc: '反思沉澱、行動承諾' },
            ].map((p, i) => (
              <div key={p.phase} className="relative">
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {p.phase}
                </div>
                <h4 className="font-bold text-emerald-800">{p.name}</h4>
                <p className="text-xs text-emerald-700 mt-1">{p.desc}</p>
                {i < 3 && (
                  <div className="absolute top-8 -right-2 text-emerald-400">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

      {/* Core Belief */}
      <section className="text-center py-8">
        <blockquote className="text-xl md:text-2xl font-medium text-gray-700 italic max-w-3xl mx-auto">
          「每一條流都是一條獨立的河，<br />
          有起點有終點，有深度有節奏。<br />
          <span className="text-emerald-700">企業可以只取一瓢飲，也可以讓六流匯聚成海。</span>」
        </blockquote>
      </section>
    </div>
  );
}
