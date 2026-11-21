<template>
  <div>
    <!-- Page Header -->
    <section class="section-sm bg-light" aria-labelledby="solutions-title">
      <div class="container">
        <h1 id="solutions-title">解決方案</h1>
        <p class="text-muted">為不同產業族群提供客製化的甲烷減排方案</p>
      </div>
    </section>

    <!-- Solutions Grid -->
    <section class="section">
      <div class="container">
        <div class="grid grid-cols-2">
          <article class="card">
            <div class="card-body">
              <div class="solution-card-icon">🏭</div>
              <h3>牧場與酪農</h3>
              <p>現場減排服務、飼養管理、甲烷監測</p>
              <ul class="list-check">
                <li>甲烷排放基線量測</li>
                <li>客製化飼糧配方</li>
                <li>即時監測系統</li>
                <li>減量成效報告</li>
              </ul>
              <a href="/contact" class="btn btn-primary">了解更多</a>
            </div>
          </article>

          <article class="card">
            <div class="card-body">
              <div class="solution-card-icon">🥛</div>
              <h3>食品品牌</h3>
              <p>低碳主張、供應鏈追溯、品牌增值</p>
              <ul class="list-check">
                <li>低碳產品認證</li>
                <li>供應鏈碳足跡</li>
                <li>品牌永續故事</li>
                <li>消費者溝通</li>
              </ul>
              <a href="/contact" class="btn btn-primary">了解更多</a>
            </div>
          </article>

          <article class="card">
            <div class="card-body">
              <div class="solution-card-icon">📊</div>
              <h3>企業 Scope 3</h3>
              <p>價值鏈減量、ESG 申報、科學基礎目標</p>
              <ul class="list-check">
                <li>價值鏈碳排放盤查</li>
                <li>科學基礎減量目標</li>
                <li>ESG 報告支援</li>
                <li>碳權開發諮詢</li>
              </ul>
              <a href="/contact" class="btn btn-primary">了解更多</a>
            </div>
          </article>

          <article class="card">
            <div class="card-body">
              <div class="solution-card-icon">🏛️</div>
              <h3>政府與研究</h3>
              <p>政策示範、產學合作、國際輸出</p>
              <ul class="list-check">
                <li>政策示範場域</li>
                <li>產學合作計畫</li>
                <li>國際技術輸出</li>
                <li>方法學開發</li>
              </ul>
              <a href="/contact" class="btn btn-primary">了解更多</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section bg-primary text-white text-center">
      <div class="container">
        <h2 style="color: white;">準備開始您的低碳轉型？</h2>
        <p style="opacity: 0.9;">聯繫我們，獲取客製化解決方案</p>
        <router-link to="/contact" class="btn btn-lg" style="background: white; color: var(--htb-coral-red);">
          聯絡我們
        </router-link>
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
</style>