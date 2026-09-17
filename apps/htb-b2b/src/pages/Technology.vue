<template>
  <div>
    <!-- Page Header -->
    <section class="section-sm bg-light" aria-labelledby="tech-title">
      <div class="container">
        <h1 id="tech-title">核心技術</h1>
        <p class="text-muted">海門冬四分孢子體技術的科學基礎與應用</p>
      </div>
    </section>

    <!-- Technology Sections -->
    <section class="section">
      <div class="container">
        <div class="grid grid-cols-2">
          <!-- Tech Card 1 -->
          <article class="card">
            <div class="card-body">
              <span class="badge badge-secondary">科學基礎</span>
              <h3>海門冬科學</h3>
              <p>深入了解海門冬（Asparagopsis taxiformis）的生物學特性及其在甲烷抑制中的作用機制。</p>
              <ul class="list-check">
                <li>物種鑑定與純化</li>
                <li>培養條件優化</li>
                <li>活性成分分析</li>
                <li>安全性評估</li>
              </ul>
            </div>
          </article>

          <!-- Tech Card 2 -->
          <article class="card">
            <div class="card-body">
              <span class="badge badge-secondary">養殖技術</span>
              <h3>種源養殖</h3>
              <p>建立陸基封閉式養殖系統，確保海門冬種源的純化與品質穩定。</p>
              <ul class="list-check">
                <li>純化保存技術</li>
                <li>環境控制（溫度、鹽度、光照）</li>
                <li>配方優化</li>
                <li>規模化生產</li>
              </ul>
            </div>
          </article>

          <!-- Tech Card 3 -->
          <article class="card">
            <div class="card-body">
              <span class="badge badge-secondary">加工技術</span>
              <h3>保存與飼料化</h3>
              <p>開發先進的保存與加工技術，確保海門冬活性成分在飼料中的穩定性。</p>
              <ul class="list-check">
                <li>活性保持技術</li>
                <li>乾燥與製粒</li>
                <li>品質批次管控</li>
                <li>產品均一性</li>
              </ul>
            </div>
          </article>

          <!-- Tech Card 4 -->
          <article class="card">
            <div class="card-body">
              <span class="badge badge-secondary">監測系統</span>
              <h3>MRV 平台</h3>
              <p>監測（Monitoring）、報告（Reporting）、查證（Verification）數位化管理系統。</p>
              <ul class="list-check">
                <li>即時甲烷監測</li>
                <li>自動化數據蒐集</li>
                <li>第三方查證</li>
                <li>區塊鏈存證</li>
              </ul>
            </div>
          </article>

          <!-- Tech Card 5 -->
          <article class="card">
            <div class="card-body">
              <span class="badge badge-secondary">雲端平台</span>
              <h3>Nuber</h3>
              <p>雲端畜牧碳資產管理平台，整合資料治理、即時監測與分析。</p>
              <ul class="list-check">
                <li>資料視覺化</li>
                <li>AI 預測分析</li>
                <li>多角色權限</li>
                <li>API 整合</li>
              </ul>
            </div>
          </article>

          <!-- Tech Card 6 -->
          <article class="card">
            <div class="card-body">
              <span class="badge badge-secondary">合規認證</span>
              <h3>法規合規</h3>
              <p>符合台灣及國際市場法規要求，協助客戶完成產品註冊與認證。</p>
              <ul class="list-check">
                <li>台灣飼料添加劑法規</li>
                <li>國際市場准入</li>
                <li>產品安全評估</li>
                <li>環境風險評估</li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Timeline Section -->
    <section class="section bg-light" aria-labelledby="roadmap-title">
      <div class="container">
        <div class="section-header">
          <h2 id="roadmap-title">技術發展里程碑</h2>
        </div>
        <div class="timeline">
          <div class="timeline-item">
            <h4>2023</h4>
            <p>海門冬種源純化成功，開始陸基養殖試驗</p>
          </div>
          <div class="timeline-item">
            <h4>2024</h4>
            <p>完成體外試驗，證實甲烷抑制效果</p>
          </div>
          <div class="timeline-item">
            <h4>2025</h4>
            <p>啟動田間試驗，建立 MRV 系統</p>
          </div>
          <div class="timeline-item">
            <h4>2026</h4>
            <p>Nuber 平台上線，擴大商業應用</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.list-check {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.list-check li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: var(--htb-gray-600);
}

.list-check li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--htb-success);
  font-weight: bold;
}

.timeline {
  max-width: 600px;
  margin: 0 auto;
}
</style>