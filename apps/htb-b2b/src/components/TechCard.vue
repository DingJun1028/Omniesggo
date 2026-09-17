<template>
  <div class="card p-6 hover:shadow-lg transition-shadow">
    <div class="w-12 h-12 bg-tech-blue rounded-full flex items-center justify-center mb-3 text-white text-2xl">
      {{ icon }}
    </div>
    <h4 class="font-bold mb-2 text-primary">{{ title }}</h4>
    <p class="text-sm text-secondary">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  icon: {
    type: String,
    default: '⚙️'
  }
})
</script>

<style scoped>
.bg-tech-blue { background-color: var(--htb-tech-blue); }
</style>