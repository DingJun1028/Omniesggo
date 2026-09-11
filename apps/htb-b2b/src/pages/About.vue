<template>
  <div>
    <!-- Page Header -->
    <section class="section-sm bg-light" aria-labelledby="about-title">
      <div class="container">
        <h1 id="about-title">關於高科</h1>
        <p class="text-muted">專注於海門冬技術的研發與應用</p>
      </div>
    </section>

    <!-- Company Story -->
    <section class="section">
      <div class="container">
        <div class="grid grid-cols-2">
          <div>
            <h2>公司故事</h2>
            <p>
              高科生技成立於 2020 年，源自於對海洋資源永續利用的願景。
              我們相信，海洋中蘊藏的解決方案，能夠幫助畜牧業面對氣候變遷的挑戰。
            </p>
            <p>
              經過多年的研發，我們成功建立海門冬四分孢子體技術平台，
              從種源純化、陸基養殖到產品開發，形成完整的價值鏈。
            </p>
          </div>
          <div>
            <h3>核心能力</h3>
            <ul class="list-check">
              <li>海門冬種源純化與保存</li>
              <li>陸基封閉式養殖技術</li>
              <li>活性成分萃取與加工</li>
              <li>甲烷抑制效果驗證</li>
              <li>MRV 監測系統建置</li>
              <li>碳權開發諮詢</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission Vision -->
    <section class="section bg-light" aria-labelledby="mission-title">
      <div class="container">
        <div class="grid grid-cols-2">
          <div class="card">
            <div class="card-body">
              <h3>使命</h3>
              <p>運用海洋資源，協助畜牧業永續轉型，減緩氣候變遷。</p>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <h3>願景</h3>
              <p>成為全球領先的海洋生物技術公司，推動農業與環境的和諧共生。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="section" aria-labelledby="team-title">
      <div class="container">
        <div class="section-header">
          <h2 id="team-title">核心團隊</h2>
          <p>跨領域的專業團隊，涵蓋海洋生物、畜牧、資訊工程等領域</p>
        </div>
        <div class="grid grid-cols-3">
          <div class="card text-center">
            <div class="card-body">
              <div class="solution-card-icon">👨‍🔬</div>
              <h4>研發團隊</h4>
              <p>海洋生物、動物科學、營養專家</p>
            </div>
          </div>
          <div class="card text-center">
            <div class="card-body">
              <div class="solution-card-icon">💻</div>
              <h4>技術團隊</h4>
              <p>資訊工程、數據分析、AI 應用</p>
            </div>
          </div>
          <div class="card text-center">
            <div class="card-body">
              <div class="solution-card-icon">📊</div>
              <h4>業務團隊</h4>
              <p>市場開發、客戶服務、策略規劃</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Info -->
    <section class="section bg-dark text-white" aria-labelledby="contact-info-title">
      <div class="container text-center">
        <h2 id="contact-info-title" style="color: white;">聯絡我們</h2>
        <p style="opacity: 0.9;">
          如有合作洽詢或投資需求，歡迎與我們聯繫
        </p>
        <p style="opacity: 0.9;">
          info@hsu-kc.com | +886 2 1234 5678
        </p>
        <router-link to="/contact" class="btn btn-lg" style="background: white; color: var(--htb-coral-red);">
          填寫表單
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