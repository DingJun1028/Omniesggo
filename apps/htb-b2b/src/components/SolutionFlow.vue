<template>
  <section id="solution-flow" class="py-20 bg-white border-y border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF3FA] text-[#4280BD] mb-4">
          端到端閉環
        </div>
        <h2 class="text-3xl font-bold text-slate-900 mb-4">從海門冬到氣候資產的五步路徑</h2>
        <p class="text-slate-600">將分散的科研技術整合成可驗證、可規模化的商業化減碳閉環。</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
        <div v-for="(step, idx) in steps" :key="idx" class="bg-[#F8FAFC] rounded-xl p-6 border border-slate-200 hover:border-[#84C341] transition duration-300 relative group">
          <div class="w-10 h-10 rounded-lg bg-[#EBF3FA] text-[#4280BD] font-bold flex items-center justify-center mb-4 group-hover:bg-[#84C341] group-hover:text-white transition">
            0{{ idx + 1 }}
          </div>
          <h3 class="font-bold text-slate-900 mb-2">{{ step.title }}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const steps = [
  { title: '陸基純化養殖', desc: '全天候環境控制與四分孢子體繁育，確保種源活性與產能穩定供應。' },
  { title: '保存與飼料化', desc: '常溫油浸與低溫保活製程，維持天然活性化合物，均一化批次配方。' },
  { title: '牧場餵飼監測', desc: '兼顧動物適口性與採食健康，現場物聯網非侵入式甲烷排放監測。' },
  { title: 'MRV 與數據追溯', desc: '對齊 VM0041 方法學，串聯生乳牛肉批次履歷，防範數據重複計算。' },
  { title: '低碳創價收益', desc: '產出可查證低碳產品、支援企業 Scope 3 減量申報與氣候資產化。' }
]
</script>