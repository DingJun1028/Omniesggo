<template>
  <section id="insights" class="py-24 bg-white border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-16">
        <div>
          <span class="text-xs font-bold tracking-widest text-[#4280BD] uppercase px-3 py-1 bg-[#EBF3FA] rounded-full">洞察與觀點</span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-2">最新科研進展與氣候政策動態</h2>
          <p class="text-slate-600 text-sm sm:text-base">追蹤全球畜牧減碳前沿、方法學演進與商業化溢價實踐。</p>
        </div>
        <div class="mt-4 md:mt-0">
          <span class="text-xs font-bold text-slate-400">持續更新 · 每月精選</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <article v-for="(post, idx) in posts" :key="idx" class="rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-[#84C341] transition duration-300 flex flex-col justify-between">
          <div class="p-7">
            <div class="flex items-center justify-between text-xs mb-3">
              <span class="font-bold px-2.5 py-0.5 rounded-full" :class="post.tagClass">{{ post.category }}</span>
              <span class="text-slate-400 font-medium">{{ post.date }}</span>
            </div>
            <h3 class="font-bold text-slate-900 text-lg mb-3 leading-snug hover:text-[#4280BD] transition cursor-pointer">
              {{ post.title }}
            </h3>
            <p class="text-xs text-slate-600 leading-relaxed mb-6">
              {{ post.excerpt }}
            </p>
          </div>
          <div class="px-7 py-4 bg-[#F8FAFC] border-t border-slate-100 text-xs font-bold text-[#4280BD] flex items-center justify-between">
            <span>閱讀深度解析</span>
            <span>&rarr;</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const posts = [
  {
    category: '政策與方法學',
    tagClass: 'bg-[#EBF3FA] text-[#4280BD]',
    date: '2026 年 09 月',
    title: '全球甲烷承諾加速：台灣反芻動物自主減量方法學的前沿機會',
    excerpt: '探討國際 Verra VM0041 標準在亞熱帶飼養情境下的本地化調適，以及如何透過嚴密量測將甲烷減量轉化為合規減碳額度。'
  },
  {
    category: '科研機制解讀',
    tagClass: 'bg-[#F0F8E9] text-[#84C341]',
    date: '2026 年 08 月',
    title: '海門冬天然活性化合物如何阻斷瘤胃產甲烷菌生化途徑？',
    excerpt: '深入解析海藻代謝產物在瘤胃厭氧環境中抑制甲基輔酶 M 還原酶（MCR）的作用機制，以及維持動物消化生理平衡的關鍵配方。'
  },
  {
    category: '市場與供應鏈',
    tagClass: 'bg-amber-50 text-amber-700',
    date: '2026 年 08 月',
    title: '跨國食品品牌的 Scope 3 焦慮：低碳乳肉的溢價空間與品牌戰略',
    excerpt: '國際零售巨頭紛紛開展供應鏈 Insetting 減排。分析先行品牌如何藉由具溯源依據的低碳產品建立綠色護城河。'
  }
]
</script>