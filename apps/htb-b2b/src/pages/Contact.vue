<template>
  <div class="min-h-screen bg-sand-white py-20">
    <div class="container mx-auto px-4">
      <h1 class="text-4xl font-bold text-ink-gray mb-8">聯絡我們</h1>
      <p class="text-lg text-secondary mb-12">
        請填寫以下表單，我們將盡快回覆您
      </p>
      <form class="max-w-2xl mx-auto space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-ink-gray mb-2">姓名 *</label>
          <input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-gray mb-2">公司</label>
          <input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-gray mb-2">Email *</label>
          <input type="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-gray mb-2">洽詢類型</label>
          <select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent">
            <option>牧場與酪農</option>
            <option>食品品牌</option>
            <option>企業 Scope 3</option>
            <option>政府與研究</option>
            <option>投資人</option>
            <option>其他</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-gray mb-2">訊息 *</label>
          <textarea required rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent"></textarea>
        </div>
        <button type="submit" class="btn-primary w-full py-3">送出</button>
      </form>
    </div>
  </div>
</template>

<script setup>
function handleSubmit() {
  alert('表單已送出！我們將盡快與您聯繫。')
}
</script>

<style scoped>
.focus\:ring-ocean-cyan:focus {
  box-shadow: 0 0 0 3px rgba(21, 154, 156, 0.3);
}
</style>