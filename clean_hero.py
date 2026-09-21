import re

p = r"C:\Project\esggo\docs\brand\htb-preview.html"
with open(p, "r", encoding="utf-8") as f:
    html = f.read()

# 定義 100% 潔淨純白版 Hero 橫幅
clean_hero = """
<section class="py-20 lg:py-32 bg-white text-center relative overflow-hidden border-b border-slate-100">
  <div class="max-w-5xl mx-auto px-4 relative z-10">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#84C341]/10 text-[#3C6E47] text-xs font-semibold mb-8 border border-[#84C341]/20">
      <span class="w-2 h-2 rounded-full bg-[#84C341] animate-pulse"></span>
      海門冬生物科技 × 畜牧甲烷減排 × 可驗證數據
    </div>
    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-8">
      讓畜牧減碳，<br />
      <span class="bg-gradient-to-r from-[#4280BD] to-[#84C341] bg-clip-text text-transparent">可發生、可驗證、可創價</span>
    </h1>
    <p class="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
      高科生技以海門冬陸基養殖與 MRV 數據技術為核心，協助牧場、乳肉品牌與食品供應鏈有效降低反芻動物甲烷排放，逐步建立可信賴的低碳產品、Scope 3 成果與氣候價值。
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="#solutions" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#84C341] hover:bg-[#72ad35] text-white font-bold text-base shadow-lg shadow-[#84C341]/20 transition flex items-center justify-center gap-2">
        探索甲烷減排方案 →
      </a>
      <a href="/evidence" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 shadow-sm transition">
        查看科學證據庫
      </a>
    </div>
  </div>
</section>
"""

# 用正則精確替換掉舊的暗黑/帶圖 Hero 區塊
html = re.sub(r'<section class="py-(?:20|24|32|36)[^"]*">[\s\S]*?</section>', clean_hero, html, count=1)

with open(p, "w", encoding="utf-8") as f:
    f.write(html)

print("HERO_PERFECTLY_CLEANED_TO_WHITE")