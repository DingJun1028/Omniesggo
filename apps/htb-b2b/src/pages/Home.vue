<template>
  <div>
    <!-- Hero Section -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="container hero-content">
        <h1 id="hero-title" class="animate-fade-in">
          從海洋到牧場<br />
          打造低碳畜牧價值鏈
        </h1>
        <p class="animate-fade-in stagger-1">
          高科生技運用海門冬四分孢子體技術，協助畜牧業降低甲烷排放，
          創造可衡量的氣候價值與永續經濟
        </p>
        <div class="hero-actions animate-fade-in stagger-2">
          <router-link to="/solutions" class="btn btn-primary btn-lg">
            探索解決方案
          </router-link>
          <router-link to="/evidence" class="btn btn-outline btn-lg" style="border-color: white; color: white;">
            瀏覽證據
          </router-link>
        </div>
      </div>
    </section>

    <!-- Solutions Preview -->
    <section class="section" aria-labelledby="solutions-title">
      <div class="container">
        <div class="section-header">
          <h2 id="solutions-title">四類受眾解決方案</h2>
          <p>為不同產業族群提供客製化的甲烷減排方案</p>
        </div>
        <div class="grid grid-cols-4">
          <div class="card solution-card animate-fade-in stagger-1">
            <div class="solution-card-icon">🏭</div>
            <h3>牧場與酪農</h3>
            <p>減排服務與五步流程</p>
          </div>
          <div class="card solution-card animate-fade-in stagger-2">
            <div class="solution-card-icon">🥛</div>
            <h3>食品品牌</h3>
            <p>低碳主張與供應鏈</p>
          </div>
          <div class="card solution-card animate-fade-in stagger-3">
            <div class="solution-card-icon">📊</div>
            <h3>企業 Scope 3</h3>
            <p>MRV 與科學基礎目標</p>
          </div>
          <div class="card solution-card animate-fade-in stagger-4">
            <div class="solution-card-icon">🏛️</div>
            <h3>政府研究</h3>
            <p>示範場域與國際輸出</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology Overview -->
    <section class="section bg-light" aria-labelledby="tech-title">
      <div class="container">
        <div class="section-header">
          <h2 id="tech-title">核心技術與科學</h2>
          <p>海門冬四分孢子體技術的科學基礎與應用</p>
        </div>
        <div class="grid grid-cols-3">
          <div class="card tech-card">
            <h4>海門冬科學</h4>
            <p>物種鑑定、培養條件、活性機制</p>
          </div>
          <div class="card tech-card">
            <h4>種源養殖</h4>
            <p>純化保存、環境控制、配方優化</p>
          </div>
          <div class="card tech-card">
            <h4>保存與飼料化</h4>
            <p>活性保持、乾燥技術、品質管控</p>
          </div>
          <div class="card tech-card">
            <h4>MRV</h4>
            <p>監測、報告、查證系統</p>
          </div>
          <div class="card tech-card">
            <h4>Nuber</h4>
            <p>雲端平台、資料治理、即時監測</p>
          </div>
          <div class="card tech-card">
            <h4>法規合規</h4>
            <p>台灣、國際市場准入</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Evidence Preview -->
    <section class="section" aria-labelledby="evidence-title">
      <div class="container">
        <div class="section-header">
          <h2 id="evidence-title">五層證據階梯</h2>
          <p>透明呈現高科生技的研發證據與品質承諾</p>
        </div>
        <div class="grid grid-cols-5">
          <div class="card evidence-card">
            <span class="badge badge-warning">L1 原料</span>
            <h4>種源純化</h4>
            <p>批次檢驗、來源紀錄</p>
          </div>
          <div class="card evidence-card">
            <span class="badge badge-warning">L2 功效</span>
            <h4>體外/體內</h4>
            <p>試驗條件、統計分析</p>
          </div>
          <div class="card evidence-card">
            <span class="badge badge-warning">L3 農場</span>
            <h4>田間數據</h4>
            <p>基線量測、監測</p>
          </div>
          <div class="card evidence-card">
            <span class="badge badge-warning">L4 產品</span>
            <h4>LCA 追溯</h4>
            <p>生命週期、碳足跡</p>
          </div>
          <div class="card evidence-card">
            <span class="badge badge-warning">L5 碳資產</span>
            <h4>碳權開發</h4>
            <p>方法學、查驗證</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="section bg-dark text-white" aria-labelledby="stats-title">
      <div class="container">
        <div class="section-header">
          <h2 id="stats-title" style="color: white;">關鍵數據</h2>
        </div>
        <div class="grid grid-cols-4">
          <div class="stat-card">
            <div class="stat-value">3</div>
            <div class="stat-label">核心技術</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">5</div>
            <div class="stat-label">證據層級</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">4</div>
            <div class="stat-label">應用領域</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">100%</div>
            <div class="stat-label">可追溯</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.bg-light {
  background: var(--htb-gray-50);
}

.bg-dark {
  background: var(--htb-ink-gray);
}

.bg-dark .section-header h2,
.bg-dark .section-header p {
  color: white;
}

.stat-card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 2rem;
}

.stat-value {
  font-size: 3rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>