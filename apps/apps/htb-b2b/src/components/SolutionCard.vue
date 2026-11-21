<template>
  <div class="card p-6 hover:shadow-lg transition-shadow">
    <div class="text-3xl mb-3">{{ icon }}</div>
    <h4 class="font-bold mb-2 text-primary">{{ title }}</h4>
    <p class="text-sm text-secondary">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  icon: String,
  description: String
})
</script>