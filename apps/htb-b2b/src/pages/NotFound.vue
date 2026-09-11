<template>
  <div class="min-h-screen flex items-center justify-center bg-sand-white">
    <div class="text-center max-w-md mx-auto px-4">
      <h1 class="text-9xl font-bold text-deep-sea mb-4">404</h1>
      <h2 class="text-2xl font-bold text-ink-gray mb-4">頁面未找到</h2>
      <p class="text-secondary mb-8">
        您存取的頁面不存在或已被移除。請檢查 URL 或返回首頁。
      </p>
      <a href="/" class="btn-primary">返回首頁</a>
    </div>
  </div>
</template>

<style scoped>
.bg-sand-white { background-color: #F4F1E8; }
.text-deep-sea { color: #073B4C; }
.text-ink-gray { color: #172A32; }
.text-secondary { color: #5F8463; }

.btn-primary {
  background-color: #C64B3C;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #a33b30;
  transform: translateY(-2px);
}
</style>