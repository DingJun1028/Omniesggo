<template>
  <section id="solutions" class="py-20 bg-[#F8FAFC]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F8E9] text-[#84C341] mb-4">
          受眾分流
        </div>
        <h2 class="text-3xl font-bold text-slate-900 mb-4">依您的組織角色，探索專屬合作路徑</h2>
        <p class="text-slate-600">不論您是牧場經營者、食品品牌方、永續採購主管或學研代表，皆能找到清晰的切入點。</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="item in audiences" :key="item.role" class="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-lg hover:border-[#4280BD] transition duration-300">
          <div>
            <div class="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 inline-block mb-3">
              {{ item.tag }}
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">{{ item.role }}</h3>
            <div class="text-xs text-slate-500 mb-2">【關鍵營運痛點】</div>
            <p class="text-sm text-slate-600 mb-4">{{ item.painPoint }}</p>
            <div class="text-xs text-slate-500 mb-2">【高科賦能服務】</div>
            <ul class="text-xs text-slate-700 space-y-1 mb-6">
              <li v-for="(srv, sIdx) in item.services" :key="sIdx" class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#84C341]"></span>
                {{ srv }}
              </li>
            </ul>
          </div>
          <a :href="item.ctaLink" class="w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold border border-[#4280BD] text-[#4280BD] hover:bg-[#4280BD] hover:text-white transition">
            {{ item.ctaText }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const audiences = [
  {
    role: '牧場與酪農',
    tag: '現場導入',
    painPoint: '擔心增加作業負擔、飼料適口性與動物採食表現。',
    services: ['現場餵飼可行性評估', '均一化海門冬添加劑供應', '採食量與增重健康監測'],
    ctaText: '申請牧場試點計畫',
    ctaLink: '/contact?role=farm'
  },
  {
    role: '乳肉食品品牌',
    tag: '產品差異化',
    painPoint: '面臨減碳目標壓力，擔憂原料不穩與漂綠信任風險。',
    services: ['低碳乳肉聯名授權', '生長與批次全流程溯源', 'LCA 產品碳足跡報告'],
    ctaText: '洽談低碳產品聯名',
    ctaLink: '/contact?role=brand'
  },
  {
    role: '企業 Scope 3',
    tag: '永續供應鏈',
    painPoint: '範疇三碳排盤查數據缺乏第三方查證與防重複計算。',
    services: ['供應鏈 Insetting 減量規劃', 'MRV 數位驗證數據包', '溫室氣體盤查查驗支援'],
    ctaText: '索取企業合作簡報',
    ctaLink: '/contact?role=scope3'
  },
  {
    role: '政府與研究機構',
    tag: '示範與方法學',
    painPoint: '缺乏在地化可複製場域與符合標準的減量方法學。',
    services: ['示範牧場聯合試驗設計', '海門冬陸基繁育技轉合作', '本土自主減量方法學研析'],
    ctaText: '提出學研示範提案',
    ctaLink: '/contact?role=research'
  }
]
</script>