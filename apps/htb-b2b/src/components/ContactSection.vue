<template>
  <section id="contact" class="py-24 bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <span class="text-xs font-bold tracking-widest text-[#84C341] uppercase px-3 py-1 bg-[#F0F8E9] rounded-full">合作洽詢</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-3">啟動您的低碳畜牧協作</h2>
        <p class="text-slate-600 text-sm sm:text-base">告訴我們您的場域規模、產品或永續減量目標，團隊將於 24 小時內回覆評估。</p>
      </div>

      <div class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm">
        <!-- 成功態 -->
        <div v-if="submitted" class="text-center py-8" role="status">
          <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F0F8E9] flex items-center justify-center">
            <svg class="w-8 h-8 text-[#84C341]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">已收到您的洽詢申請</h3>
          <p class="text-slate-600 text-sm mb-6">高科生技商務團隊將於 24 小時內與您聯繫。若需加速，歡迎直接來信 <a href="mailto:info@hsu-kc.com" class="text-[#4280BD] underline">info@hsu-kc.com</a>。</p>
          <button type="button" @click="resetForm" class="text-sm font-semibold text-[#4280BD] hover:underline">再填寫一份洽詢</button>
        </div>

        <!-- 錯誤提示 -->
        <div v-else-if="errorMsg" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">您的合作身份</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                v-for="r in roles"
                :key="r.id"
                @click="selectedRole = r.id"
                :aria-pressed="selectedRole === r.id"
                :class="selectedRole === r.id ? 'bg-[#4280BD] text-white border-[#4280BD]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
                class="py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center min-h-[44px]"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="htb-contact-name" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">姓名 / 職稱</label>
              <input id="htb-contact-name" v-model="contactName" type="text" placeholder="例如：林經理" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD] focus:ring-2 focus:ring-[#4280BD]/20" required />
            </div>
            <div>
              <label for="htb-contact-company" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">組織 / 牧場 / 企業名稱</label>
              <input id="htb-contact-company" v-model="company" type="text" placeholder="例如：永續牧場股份有限公司" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD] focus:ring-2 focus:ring-[#4280BD]/20" required />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="htb-contact-email" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">公務 Email</label>
              <input id="htb-contact-email" v-model="email" type="email" placeholder="name@company.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD] focus:ring-2 focus:ring-[#4280BD]/20" required />
            </div>
            <div>
              <label for="htb-contact-phone" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">聯絡電話</label>
              <input id="htb-contact-phone" v-model="phone" type="tel" placeholder="+886 912 345 678" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD] focus:ring-2 focus:ring-[#4280BD]/20" />
            </div>
          </div>

          <div>
            <label for="htb-contact-message" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">合作需求描述</label>
            <textarea id="htb-contact-message" v-model="message" rows="4" placeholder="請簡述您的畜養頭數、產品合作想法或技術諮詢內容..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4280BD] focus:ring-2 focus:ring-[#4280BD]/20"></textarea>
          </div>

          <!-- 蜜罐欄位：真人不可見，機器人若填寫即靜默擋下 -->
          <div class="hidden" aria-hidden="true">
            <label for="htb-hp">請留空</label>
            <input id="htb-hp" v-model="hp" type="text" name="hp" tabindex="-1" autocomplete="off" />
          </div>

          <div class="text-xs text-slate-500 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#84C341]"></span>
            <span>送出即代表同意高科生技依個人資料保護法進行商務聯繫，資料將受到安全加密保護。</span>
          </div>

          <button type="submit" :disabled="submitting" class="btn-brand-primary w-full text-base !py-3.5 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <svg v-if="submitting" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            {{ submitting ? '送出中…' : '送出商務洽詢申請' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const roles = [
  { id: 'farm', label: '牧場與酪農' },
  { id: 'brand', label: '乳肉食品品牌' },
  { id: 'scope3', label: '企業 Scope 3' },
  { id: 'research', label: '政府與學研' }
]

const route = useRoute()
const selectedRole = ref('farm')
const contactName = ref('')
const company = ref('')
const email = ref('')
const phone = ref('')
const message = ref('')
const hp = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const r = route.query.role
  if (r && roles.some((x) => x.id === r)) selectedRole.value = r
})

function resetForm() {
  submitted.value = false
  errorMsg.value = ''
  contactName.value = ''
  company.value = ''
  email.value = ''
  phone.value = ''
  message.value = ''
}

async function handleSubmit() {
  if (submitting.value) return
  errorMsg.value = ''
  submitting.value = true
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: 'htb',
        contact_name: contactName.value.trim(),
        company: company.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        activity_type: selectedRole.value,
        message: message.value.trim(),
        hp: hp.value
      })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) {
      submitted.value = true
    } else {
      errorMsg.value = '送出失敗，請稍後再試，或直接來信 info@hsu-kc.com 與我們聯繫。'
    }
  } catch (e) {
    errorMsg.value = '網路連線異常，請檢查網路後再試，或直接來信 info@hsu-kc.com 與我們聯繫。'
  } finally {
    submitting.value = false
  }
}
</script>
