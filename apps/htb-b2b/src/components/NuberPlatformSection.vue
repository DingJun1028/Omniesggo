<template>
  <section id="nuber" class="py-24 bg-[#0E1B2E] text-white relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#4280BD]/20 text-[#5BA4D9] border border-[#4280BD]/30 mb-4">
          Nuber 數據協同平台 · Prototype
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold mb-4">讓減排可記錄、可查核、可追溯</h2>
        <p class="text-slate-400 text-sm sm:text-base">
          以海門冬原料批次、牧場餵飼、甲烷監測與產品流向為核心，使各方在嚴密權限下取得可信的減碳證明。
        </p>
      </div>

      <!-- 平台數據流動示意圖 -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
        <div v-for="(node, idx) in pipeline" :key="idx" class="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 flex flex-col justify-between">
          <div>
            <div class="text-[10px] font-bold text-[#84C341] uppercase tracking-wider mb-2">Node 0{{ idx + 1 }}</div>
            <h4 class="font-bold text-white text-base mb-2">{{ node.title }}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">{{ node.desc }}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#84C341]"></span>
            <span>{{ node.status }}</span>
          </div>
        </div>
      </div>

      <!-- 核心模組功能 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-slate-800/50 rounded-2xl p-7 border border-slate-700">
          <div class="w-10 h-10 rounded-xl bg-[#4280BD]/20 text-[#5BA4D9] flex items-center justify-center font-bold mb-4">M1</div>
          <h3 class="text-lg font-bold text-white mb-2">牧場數據資產化</h3>
          <p class="text-xs text-slate-400 leading-relaxed">提供牧場端直覺登錄介面，記錄牛隻群體編號、日糧配比與海門冬添加劑投餵紀錄。</p>
        </div>
        <div class="bg-slate-800/50 rounded-2xl p-7 border border-slate-700">
          <div class="w-10 h-10 rounded-xl bg-[#84C341]/20 text-[#84C341] flex items-center justify-center font-bold mb-4">M2</div>
          <h3 class="text-lg font-bold text-white mb-2">物聯網與 dMRV 驗算</h3>
          <p class="text-xs text-slate-400 leading-relaxed">對接現場連續式或批次式甲烷量測感測器，結合氣候條件演算法自動比對減排基線。</p>
        </div>
        <div class="bg-slate-800/50 rounded-2xl p-7 border border-slate-700">
          <div class="w-10 h-10 rounded-xl bg-[#C9A24B]/20 text-[#C9A24B] flex items-center justify-center font-bold mb-4">M3</div>
          <h3 class="text-lg font-bold text-white mb-2">可查驗數位護照與報告</h3>
          <p class="text-xs text-slate-400 leading-relaxed">對齊 VM0041 國際標準生成結構化查驗包，產出專屬二維條碼，支援食品品牌終端追溯。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const pipeline = [
  { title: '海門冬種苗批次', desc: '純化藻株編號、生長天數與活性成分檢驗碼', status: '批次品質溯源' },
  { title: '牧場餵飼投餵', desc: '現場飼餵劑量、混拌日糧紀錄與動物健康回饋', status: '現場數據鎖定' },
  { title: '甲烷減排量測', desc: 'IoT 感測數值、基線對比演算與異常數據標記', status: '5T 零幻覺驗算' },
  { title: '乳肉產品賦碼', desc: '串聯屠宰分割或生乳批次，產生產品數位履歷', status: '冷鏈流向追蹤' },
  { title: '氣候資產申報', desc: '導出 ISO 14064-1 與 Scope 3 可查核驗證報告', status: '防重複計算' }
]
</script>