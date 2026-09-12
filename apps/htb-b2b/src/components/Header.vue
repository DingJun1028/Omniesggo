<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <!-- 品牌 Logo -->
      <a href="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4280BD] to-[#84C341] flex items-center justify-center text-white font-black text-xl shadow-sm">
          H
        </div>
        <div class="flex flex-col">
          <span class="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">
            高科生技
          </span>
          <span class="text-xs font-semibold text-[#4280BD] tracking-wider uppercase">
            Hi-Tek Biotech
          </span>
        </div>
      </a>

      <!-- 主導覽選單 -->
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-[#707070]">
        <a href="#solutions" class="hover:text-[#4280BD] transition">解決方案</a>
        <a href="#solution-flow" class="hover:text-[#4280BD] transition">技術流程</a>
        <a href="/evidence" class="hover:text-[#4280BD] transition">5T 證據庫</a>
        <a href="/about" class="hover:text-[#4280BD] transition">關於高科</a>
      </nav>

      <!-- 右側 CTA 按鈕 -->
      <div class="flex items-center gap-4">
        <a href="/contact" class="btn-brand-primary text-sm">
          商務洽詢
        </a>
      </div>
    </div>
  </header>
</template>

<script setup>
</script>