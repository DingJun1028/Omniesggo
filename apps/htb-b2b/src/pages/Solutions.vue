<template>
  <div class="min-h-screen bg-sand-white py-20">
    <div class="container mx-auto px-4">
      <h1 class="text-4xl font-bold text-ink-gray mb-8">解決方案</h1>
      <p class="text-lg text-secondary mb-12">
        為不同產業族群提供客製化的甲烷減排方案
      </p>
      <div class="grid md:grid-cols-2 gap-8">
        <SolutionCard 
          title="牧場與酪農"
          description="現場減排服務、飼養管理、甲烷監測"
        />
        <SolutionCard 
          title="食品品牌"
          description="低碳主張、供應鏈追溯、品牌增值"
        />
        <SolutionCard 
          title="企業 Scope 3"
          description="價值鏈減量、ESG 申報、科學基礎目標"
        />
        <SolutionCard 
          title="政府與研究"
          description="政策示範、產學合作、國際輸出"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import SolutionCard from '../components/SolutionCard.vue'
</script>