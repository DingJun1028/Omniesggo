<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between">
    <Header />

    <main class="py-16">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0F8E9] text-[#84C341] border border-[#84C341]/30 mb-4">
            個人資料保護
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            隱私權與數據規範
          </h1>
          <p class="text-slate-600 text-sm">
            最後更新：2026 年 10 月
          </p>
        </div>

        <div class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-3">一、蒐集目的與類別</h2>
            <p>高科生技（以下稱「本公司」）透過本站商務洽詢表單蒐集之個人資料，僅用於：商務合作聯繫、方案評估回覆、以及依個人資料保護法要求之必要通知。蒐集欄位包含姓名、所屬組織、公務 Email、聯絡電話與需求描述。</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-3">二、利用期間與對象</h2>
            <p>資料保存期間以完成本次洽詢往來及後續合作評估所需為限，未經您同意不會提供予無關之第三方，或用於與蒐集目的無關之用途。依法應保存或配合主管機關調閱者，不在此限。</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-3">三、您的權利</h2>
            <p>您得依個人資料保護法行使查詢、請求閱覽、製給複本、補充或更正、停止蒐集利用或刪除之權利。如需行使，請來信 <a href="mailto:info@hsu-kc.com" class="text-[#4280BD] underline">info@hsu-kc.com</a>，本公司將於 15 日內回覆。</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-3">四、資安措施</h2>
            <p>本站表單資料透過加密通道（HTTPS）傳輸，並存放於受存取控管之資料庫。本公司採用蜜罐欄位與驗證機制防制濫用，並持續監控異常存取。</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-3">五、Cookie 與第三方服務</h2>
            <p>本站不使用廣告追蹤 Cookie。防濫驗證（若啟用）可能由第三方服務處理驗證請求，其個資保護義務依該服務條款辦理。</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-3">六、聯絡窗口</h2>
            <p>隱私權相關疑慮請聯繫：<a href="mailto:info@hsu-kc.com" class="text-[#4280BD] underline">info@hsu-kc.com</a>。</p>
          </section>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
</script>
