<template>
  <section id="faq" class="py-24 bg-white border-t border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <span class="text-xs font-bold tracking-widest text-[#4280BD] uppercase px-3 py-1 bg-[#EBF3FA] rounded-full">常見疑慮解答</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-3">牧場與品牌最關心的關鍵問題</h2>
        <p class="text-slate-600 text-sm sm:text-base">以嚴謹科學數據與試驗事實，正面回應現場作業與品質疑慮。</p>
      </div>

      <div class="space-y-4">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="rounded-2xl border border-slate-200/80 overflow-hidden transition duration-200"
          :class="openIdx === idx ? 'border-[#84C341] bg-[#F8FAFC]' : 'bg-white'"
        >
          <button
            type="button"
            @click="toggle(idx)"
            class="w-full py-5 px-6 text-left flex items-center justify-between gap-4 focus:outline-none"
          >
            <span class="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-3">
              <span class="text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-[#4280BD]">Q{{ idx + 1 }}</span>
              {{ faq.q }}
            </span>
            <span
              class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 transition duration-200"
              :class="openIdx === idx ? 'rotate-180 bg-[#84C341] text-white' : 'bg-slate-100'"
            >
              &darr;
            </span>
          </button>

          <div v-show="openIdx === idx" class="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
            <p>{{ faq.a }}</p>
            <div v-if="faq.proof" class="mt-3 p-3 bg-white rounded-xl border border-slate-200/60 text-xs text-slate-500">
              <strong class="text-[#4280BD]">【5T 科學佐證】：</strong> {{ faq.proof }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const openIdx = ref(0)
const toggle = (idx) => {
  openIdx.value = openIdx.value === idx ? -1 : idx
}

const faqs = [
  {
    q: '海門冬是否會影響牛乳或牛肉的風味、口感與安全性？',
    a: '絕對不會。海門冬在反芻動物日糧中的添加比例極低（通常僅佔總乾物質 0.2% - 0.5%）。國內外多項體內餵飼試驗證實，此微量添加不會改變牛奶的風味性狀、乳脂肪與乳蛋白比例，肉品盲測亦無任何海藻異味或溴化合物殘留。',
    proof: '對照農業部水試所與合作大學體內消化試驗盲測評估報告。'
  },
  {
    q: '牧場現場餵飼海門冬添加劑，會大幅增加日常作業負擔嗎？',
    a: '不會增加額外負擔。高科生技研發專利保活乾燥與微油均一混合製程，原料呈標準化微粉顆粒，可直接導入牧場既有的 TMR（全混合日糧）攪拌機中與草料精料同步混拌，酪農日常操作無需改變既有流程。',
    proof: '現場日糧均一性變異係數 CV < 5%，符合自動化配料機標準。'
  },
  {
    q: '導入海門冬的成本如何分攤？牧場能獲得什麼經濟回報？',
    a: '我們採取「供應鏈共享價值」商模。高科協同下游乳品與肉品品牌以「低碳溢價（Green Premium）」向牧場收購原料乳肉；同時透過 Nuber 平台串聯大型食品企業 Scope 3 減碳採購與未來氣候資產分潤，使牧場成為實質受益方。',
    proof: '已與品牌夥伴建立試點回購合作意向書框架。'
  },
  {
    q: '高科生技的減排數據如何防範「漂綠（Greenwashing）」爭議？',
    a: '所有減碳數據皆遵守 5T 原則。我們嚴格參照國際權威 Verra VM0041 方法學，每批次均留存物聯網感測原始時間戳、採食量日誌與防篡改 Hash Lock，嚴禁「只餵飼一次即誇稱永久零排放」的虛構宣稱。',
    proof: 'dMRV 引擎產出之數據包具備第三方獨立查核（VVB）追蹤架構。'
  }
]
</script>