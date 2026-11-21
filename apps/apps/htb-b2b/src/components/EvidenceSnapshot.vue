<template>
  <section class="py-20 bg-[#F8FAFC]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-16">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F8E9] text-[#84C341] mb-4">
            5T 證據中心
          </div>
          <h2 class="text-3xl font-bold text-slate-900 mb-2">科學證據快照：我們做到哪裡，就說到哪裡</h2>
          <p class="text-slate-600">公開透明的研究成果庫，杜絕誇大宣稱，嚴格區分體外、體內與場域數據。</p>
        </div>
        <a href="/evidence" class="mt-4 md:mt-0 text-sm font-semibold text-[#4280BD] hover:underline flex items-center gap-1">
          瀏覽完整證據庫 &rarr;
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(card, idx) in evidenceCards" :key="idx" class="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition duration-300">
          <div class="flex items-center justify-between mb-4">
            <span :class="card.badgeClass" class="text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {{ card.badgeText }}
            </span>
            <span class="text-xs text-slate-500">{{ card.year }}</span>
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-2 leading-snug">{{ card.title }}</h3>
          <p class="text-xs text-slate-600 mb-4">{{ card.condition }}</p>
          <div class="p-3 bg-[#F8FAFC] rounded-lg border border-slate-100 mb-4">
            <div class="text-xs text-slate-500 mb-1">主要試驗發現</div>
            <div class="text-sm font-semibold text-slate-800">{{ card.result }}</div>
          </div>
          <div class="text-xs text-slate-400">來源機構：{{ card.source }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const evidenceCards = [
  {
    badgeText: '政府技轉授權',
    badgeClass: 'bg-[#EBF3FA] text-[#4280BD]',
    year: '2024',
    title: '海門冬四分孢子體繁育生產技術',
    condition: '農業部水產試驗所專屬授權，建立陸基高密度循環水純化養殖。',
    result: '克服天然採集季節限制，實現全年種源保存與可控繁殖。',
    source: '農業部水產試驗所產學合作'
  },
  {
    badgeText: 'R2 實驗室驗證',
    badgeClass: 'bg-[#F0F8E9] text-[#84C341]',
    year: '2024',
    title: '人工養殖四分孢子體體外抑制試驗',
    condition: '模擬牛隻瘤胃厭氧發酵槽，添加 0.5% - 2.0% OM 海門冬萃取物。',
    result: '在特定試驗條件下，體外甲烷生成量顯著降低，抑制活性達標。',
    source: '國內公立研究型大學生物資源學院'
  },
  {
    badgeText: 'R3 動物試飼觀察',
    badgeClass: 'bg-amber-50 text-amber-700',
    year: '2025',
    title: '泌乳牛/肉牛體內餵飼採食量初步觀察',
    condition: '小群體日糧梯度添加試驗，評估適口性、反芻行為與糞便性狀。',
    result: '動物適口性良好，無拒食反應，泌乳及增重曲線保持正常區間。',
    source: '本土示範畜牧場聯合試驗'
  }
]
</script>