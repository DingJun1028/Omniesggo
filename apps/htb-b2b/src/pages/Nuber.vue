<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between">
    <Header />

    <main class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Nuber Hero -->
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#4280BD]/15 text-[#4280BD] border border-[#4280BD]/30 mb-4">
            Nuber Data Platform · Prototype
          </div>
          <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            畜牧甲烷減排與氣候資產協同平台
          </h1>
          <p class="text-slate-600 text-lg leading-relaxed">
            Nuber 讓海門冬投放、牧場餵飼、甲烷監測、乳肉產品與查驗證據在同一套嚴密資料邏輯下被記錄與追溯，使減排可發生、可驗證、可創價。
          </p>
        </div>

        <!-- 六大功能模組網格 -->
        <div class="mb-20">
          <div class="text-center mb-10">
            <span class="text-xs font-bold tracking-widest text-[#84C341] uppercase px-3 py-1 bg-[#F0F8E9] rounded-full">功能矩陣</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">六大核心數據模組</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="(m, idx) in modules" :key="idx" class="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:border-[#4280BD] transition">
              <div class="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#4280BD] font-black flex items-center justify-center mb-5">
                0{{ idx + 1 }}
              </div>
              <h3 class="text-lg font-bold text-slate-900 mb-2">{{ m.title }}</h3>
              <p class="text-xs text-slate-600 leading-relaxed mb-4">{{ m.desc }}</p>
              <div class="text-[11px] font-semibold text-[#84C341] flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#84C341]"></span>
                {{ m.feature }}
              </div>
            </div>
          </div>
        </div>

        <!-- 角色與權限架構 -->
        <div class="bg-[#0E1B2E] text-white rounded-3xl p-8 sm:p-12 mb-20">
          <div class="max-w-3xl mb-10">
            <span class="text-xs font-bold tracking-widest text-[#5BA4D9] uppercase px-3 py-1 bg-[#4280BD]/20 rounded-full">安全與治理</span>
            <h2 class="text-2xl sm:text-3xl font-bold mt-3 mb-2">多方參與者權限架構</h2>
            <p class="text-xs sm:text-sm text-slate-400">嚴密角色授權機制，保障牧場商業機密，同時賦予採購方與查驗機構可信數據透明度。</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div class="font-bold text-base text-[#84C341] mb-2">牧場 / 酪農戶</div>
              <p class="text-xs text-slate-300 mb-3">記錄自身群體編號、每日投餵量；享有即時採食量與健康指數儀表板。</p>
              <div class="text-[10px] text-slate-500">權限：自有牧場資料讀寫</div>
            </div>
            <div class="p-5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div class="font-bold text-base text-[#4280BD] mb-2">食品品牌買家</div>
              <p class="text-xs text-slate-300 mb-3">檢視所採購乳肉批次之溯源憑證、產品碳足跡 (LCA) 計算報告與宣稱許可。</p>
              <div class="text-[10px] text-slate-500">權限：採購批次溯源唯讀</div>
            </div>
            <div class="p-5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div class="font-bold text-base text-[#C9A24B] mb-2">第三方查驗機構</div>
              <p class="text-xs text-slate-300 mb-3">調閱不可篡改之餵飼日誌、感測器原始時間戳記與基線比對演算法歷程。</p>
              <div class="text-[10px] text-slate-500">權限：審計追蹤專屬視圖</div>
            </div>
            <div class="p-5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div class="font-bold text-base text-slate-300 mb-2">科研顧問網絡</div>
              <p class="text-xs text-slate-300 mb-3">調研去識別化之試飼群體適口性、氣候環境參數與甲烷排放相關性。</p>
              <div class="text-[10px] text-slate-500">權限：去識別化數據分析</div>
            </div>
          </div>
        </div>

        <!-- 招募試點 CTA -->
        <div class="text-center bg-white rounded-3xl p-10 border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <h3 class="text-2xl font-bold text-slate-900 mb-3">成為 Nuber 平台的首批試點夥伴</h3>
          <p class="text-slate-600 text-sm mb-8">
            我們現正招募示範牧場與先鋒食品品牌共同測試，提供全套海門冬原料與數據對接服務。
          </p>
          <a href="/contact?role=farm" class="btn-brand-primary !py-3 !px-8 text-base">
            申請參與先鋒試點計畫
          </a>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'

const modules = [
  {
    title: '牧場端作業管理',
    desc: '簡易直覺的給料操作記錄介面，支援現場手機或平板即時確認批次飼餵量。',
    feature: '支援離線暫存與自動同步'
  },
  {
    title: '海門冬原料批次溯源',
    desc: '標註陸基養殖批號、採收日期、活性成分檢驗數值與保存效期，保障投入品純度。',
    feature: '批次品質雙向防偽鏈結'
  },
  {
    title: '物聯網甲烷連續量測',
    desc: '無縫整合牛棚感測設備，過濾背景環境干擾，提供高頻率排放趨勢監控。',
    feature: '異常值自動告警與標記'
  },
  {
    title: 'dMRV 數據驗算引擎',
    desc: '內建 VM0041 國際方法學與本土演算法，自動計算動態基線與淨減排當量。',
    feature: '零幻覺客觀演算法架構'
  },
  {
    title: '低碳供應鏈賦碼追溯',
    desc: '為下游屠宰、分切或生乳加工批次生成唯一數位身分證，保障下游品牌宣稱權利。',
    feature: 'QR Code 終端消費者驗證'
  },
  {
    title: '碳盤查報告一鍵導出',
    desc: '自動產出符合 ISO 14064-1 及溫室氣體盤查標準的稽核資料包，省去繁複文書負擔。',
    feature: '支援 PDF / CSV 格式導出'
  }
]
</script>