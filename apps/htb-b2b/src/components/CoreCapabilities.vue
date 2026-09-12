<template>
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF3FA] text-[#4280BD] mb-4">
          技術護城河
        </div>
        <h2 class="text-3xl font-bold text-slate-900 mb-4">四大核心能力，支撐可規模化減碳</h2>
        <p class="text-slate-600">從前端種源生物技術到後端數據查驗，建立端到端的自主研發能量。</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="(item, idx) in capabilities" :key="idx" class="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-[#84C341] transition duration-300 flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4280BD] to-[#84C341] text-white flex items-center justify-center font-bold text-lg mb-6 shadow-md">
              {{ idx + 1 }}
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ item.title }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-6">{{ item.desc }}</p>
          </div>
          <div class="text-xs font-semibold text-[#4280BD] flex items-center gap-1">
            <span>了解科研細節</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const capabilities = [
  {
    title: '種源與陸基養殖',
    desc: '建立海門冬種源純化、環境控制與四季穩定生產能力，徹底擺脫季節性野生採集與品質大幅波動。'
  },
  {
    title: '保存與飼料化',
    desc: '專利保活乾燥與均一化製程，保護海藻天然活性化合物，使原料符合現代牧場機械化精準餵飼需求。'
  },
  {
    title: '減排試驗與導入',
    desc: '依動物品種與現場飼養系統量身設計試驗，清楚揭露劑量邊界與適口性表現，確保零動物健康負面影響。'
  },
  {
    title: 'MRV 與數據治理',
    desc: '記錄基線、投餵劑量、現場甲烷監測與乳肉批次履歷，防範重複計算，為 Scope 3 與碳資產提供鐵證。'
  }
]
</script>