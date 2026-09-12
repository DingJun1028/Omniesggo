<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between">
    <Header />

    <main class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 頁面 Hero -->
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F8E9] text-[#84C341] border border-[#84C341]/30 mb-4">
            5T 治理 · 零幻覺驗算
          </div>
          <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            科學證據與研究成果中心
          </h1>
          <p class="text-slate-600 text-sm sm:text-base leading-relaxed">
            減排成果必須放回試驗條件中理解。我們依證據類型公開試驗設計、劑量條件、主要發現與邊界限制，嚴格區分體外試驗、動物試飼與場域量測。
          </p>
        </div>

        <!-- 類別篩選按鈕 -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="activeCategory = cat.id"
            :class="activeCategory === cat.id ? 'bg-[#4280BD] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- 結構化證據卡片網格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="(item, idx) in filteredItems"
            :key="idx"
            class="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:border-[#84C341] transition flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-4">
                <span :class="item.badgeStyle" class="text-xs font-bold px-2.5 py-1 rounded-full">
                  {{ item.badge }}
                </span>
                <span class="text-xs font-semibold text-slate-400">{{ item.year }}</span>
              </div>

              <h3 class="font-bold text-slate-900 text-lg mb-3 leading-snug">
                {{ item.title }}
              </h3>

              <div class="space-y-3 mb-6 text-xs text-slate-600">
                <div>
                  <span class="font-semibold text-slate-800">【試驗對象】：</span>
                  <span>{{ item.target }}</span>
                </div>
                <div>
                  <span class="font-semibold text-slate-800">【實驗條件】：</span>
                  <span>{{ item.condition }}</span>
                </div>
                <div class="p-3 bg-[#F8FAFC] rounded-xl border border-slate-100">
                  <div class="font-bold text-slate-800 text-[11px] mb-1">主要成果數據</div>
                  <div class="text-slate-700 leading-relaxed">{{ item.result }}</div>
                </div>
                <div class="text-slate-400 italic">
                  <span class="font-medium">限制說明：</span>
                  <span>{{ item.limitation }}</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>機構：{{ item.source }}</span>
              <span class="text-[#4280BD] font-semibold">{{ item.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'

const categories = [
  { id: 'all', name: '全部成果 (6)' },
  { id: 'transfer', name: '政府技轉 (1)' },
  { id: 'vitro', name: '體外抑制試驗 (2)' },
  { id: 'vivo', name: '動物體內試飼 (2)' },
  { id: 'methodology', name: '方法學與基地 (1)' }
]

const activeCategory = ref('all')

const items = [
  {
    category: 'transfer',
    badge: '政府技術移轉',
    badgeStyle: 'bg-[#EBF3FA] text-[#4280BD]',
    year: '2024',
    title: '海門冬四分孢子體繁育與量產技術',
    target: 'Asparagopsis taxiformis 在地純化品系',
    condition: '陸基循環水槽全天候環境控制，營養鹽與光照週期調控。',
    result: '建立自主繁育體系，突破季節性採集限制，實現四季可控生物量產能。',
    limitation: '產能規模仍受現有養殖槽體面積限制，正推進示範基地擴建。',
    source: '農業部水產試驗所',
    status: '正式專屬授權'
  },
  {
    category: 'vitro',
    badge: 'R2 實驗室驗證',
    badgeStyle: 'bg-[#F0F8E9] text-[#84C341]',
    year: '2024',
    title: '人工養殖四分孢子體體外瘤胃甲烷抑制活性',
    target: '瘤胃厭氧微生物群落模擬槽',
    condition: '添加 0.5%、1.0%、2.0% OM 海門冬粉末提取物，發酵 24/48 小時。',
    result: '在特定添加量下，體外發酵氣體中甲烷濃度顯著下降，抑制活性具顯著統計意義。',
    limitation: '體外模擬反應槽無法完全替代活體消化生理與日糧混合反應。',
    source: '國立大學生科實驗室',
    status: '試驗報告完成'
  },
  {
    category: 'vitro',
    badge: '同儕論文研究',
    badgeStyle: 'bg-[#F0F8E9] text-[#84C341]',
    year: '2025',
    title: '台灣海門冬天然活性化合物生成代謝體學研究',
    target: '不同光溫條件下之次級代謝產物 (溴仿及多酚)',
    condition: 'HPLC/GC-MS 質譜分析有效活性成分之儲存衰退曲線。',
    result: '確立低溫保活與常溫微膠囊封裝的最佳加工溫度區間。',
    limitation: '不同批次天然藻體之活性成分含量存在 ±10% 基礎變異。',
    source: '產學合作期刊論文',
    status: '已送審期刊'
  },
  {
    category: 'vivo',
    badge: 'R3 動物試飼初步',
    badgeStyle: 'bg-amber-50 text-amber-700',
    year: '2025',
    title: '泌乳牛日糧添加海門冬之適口性與採食行為觀察',
    target: '荷蘭乳牛 (Holstein) 小群體試驗組',
    condition: 'TMR 完全混合日糧梯度混合，連續監測採食量與反芻時間 28 天。',
    result: '牛隻無拒食現象，採食量與對照組無顯著差異，乳脂肪及乳蛋白正常。',
    limitation: '初期樣本數為小規模群體觀察，需進一步擴大為跨季試驗。',
    source: '示範牧場產學聯合',
    status: '第一階段完成'
  },
  {
    category: 'vivo',
    badge: 'R4 場域試點中',
    badgeStyle: 'bg-[#4280BD] text-white',
    year: '2026',
    title: '源興牛肉牛低甲烷示範計畫共同開發',
    target: '本土肥育肉牛群體',
    condition: '結合微氣候監測與連續式物聯網甲烷感測，對比歷史基線。',
    result: '現場持續量測中，初步數據展現穩定減排趨勢與正常日增重。',
    limitation: '示範計畫推進中，最終數值需待試驗週期結束由第三方查證。',
    source: '源興居生技聯合試驗',
    status: '試驗進行中'
  },
  {
    category: 'methodology',
    badge: '方法學與基地',
    badgeStyle: 'bg-[#C9A24B] text-white',
    year: '2026',
    title: '反芻動物腸道發酵甲烷減排方法學研析',
    target: '對齊 Verra VM0041 與台灣自主減量方案',
    condition: '建立基線測定標準、投餵證明與防重複計算審查清單。',
    result: '完成方法學適用性自我評估框架，為 Nuber 平台提供規則引擎。',
    limitation: '官方正式額度核發仍需主管機關查驗程序審查。',
    source: '善向永續 × 高科生技',
    status: '框架研擬中'
  }
]

const filteredItems = computed(() => {
  if (activeCategory.value === 'all') return items
  return items.filter(i => i.category === activeCategory.value)
})
</script>