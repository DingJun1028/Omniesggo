<template>
  <section id="contact" class="py-24 bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <span class="text-xs font-bold tracking-widest text-[#84C341] uppercase px-3 py-1 bg-[#F0F8E9] rounded-full">合作洽詢</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-3">啟動您的低碳畜牧協作</h2>
        <p class="text-slate-600 text-sm sm:text-base">告訴我們您的場域規模、產品或永續減量目標，團隊將於 24 小時內回覆評估。</p>
      </div>

      <div class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">您的合作身份</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                v-for="r in roles"
                :key="r.id"
                @click="selectedRole = r.id"
                :class="selectedRole === r.id ? 'bg-[#4280BD] text-white border-[#4280BD]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
                class="py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">姓名 / 職稱</label>
              <input type="text" placeholder="例如：林經理" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD]" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">組織 / 牧場 / 企業名稱</label>
              <input type="text" placeholder="例如：永續牧場股份有限公司" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD]" required />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">公務 Email</label>
              <input type="email" placeholder="name@company.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD]" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">聯絡電話</label>
              <input type="tel" placeholder="+886 912 345 678" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD]" required />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">合作需求描述</label>
            <textarea rows="4" placeholder="請簡述您的畜養頭數、產品合作想法或技術諮詢內容..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD]"></textarea>
          </div>

          <div class="text-xs text-slate-500 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#84C341]"></span>
            <span>送出即代表同意高科生技依個人資料保護法進行商務聯繫，資料將受到安全加密保護。</span>
          </div>

          <button type="submit" class="btn-brand-primary w-full text-base !py-3.5">
            送出商務洽詢申請
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const roles = [
  { id: 'farm', label: '牧場與酪農' },
  { id: 'brand', label: '乳肉食品品牌' },
  { id: 'scope3', label: '企業 Scope 3' },
  { id: 'research', label: '政府與學研' }
]

const selectedRole = ref('farm')

const handleSubmit = () => {
  alert('感謝您的洽詢！高科生技商務團隊將於 24 小時內與您聯繫。')
}
</script>