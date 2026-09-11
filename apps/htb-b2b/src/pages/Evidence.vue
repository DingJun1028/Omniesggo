<template>
  <div>
    <!-- Page Header -->
    <section class="section-sm bg-light" aria-labelledby="evidence-title">
      <div class="container">
        <h1 id="evidence-title">證據中心</h1>
        <p class="text-muted">透明呈現高科生技的研發證據與品質承諾</p>
      </div>
    </section>

    <!-- Five Levels of Evidence -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>五層證據階梯</h2>
          <p>從原料到碳資產，每一層都有完整的證據支撐</p>
        </div>

        <!-- Level 1 -->
        <article class="card evidence-card">
          <div class="card-body">
            <div class="flex items-center gap-4">
              <span class="badge badge-warning">L1 原料</span>
              <h3>種源純化與品質檢驗</h3>
            </div>
            <p>每批次海門冬原料都經過嚴格的品質檢驗，確保種源純度與活性成分含量。</p>
            <ul class="list-check">
              <li>種源純化紀錄</li>
              <li>活性成分檢測報告</li>
              <li>重金屬與微生物檢驗</li>
              <li>批次追溯系統</li>
            </ul>
          </div>
        </article>

        <!-- Level 2 -->
        <article class="card evidence-card">
          <div class="card-body">
            <div class="flex items-center gap-4">
              <span class="badge badge-warning">L2 功效</span>
              <h3>體外/體內試驗</h3>
            </div>
            <p>透過嚴格的科學試驗，驗證海門冬對甲烷抑制的功效。</p>
            <ul class="list-check">
              <li>體外瘤胃發酵試驗</li>
              <li>體內動物試驗</li>
              <li>統計分析與再現性</li>
              <li>同儕審查發表</li>
            </ul>
          </div>
        </article>

        <!-- Level 3 -->
        <article class="card evidence-card">
          <div class="card-body">
            <div class="flex items-center gap-4">
              <span class="badge badge-warning">L3 農場</span>
              <h3>田間試驗數據</h3>
            </div>
            <p>在實際牧場環境中驗證海門冬產品的減排效果。</p>
            <ul class="list-check">
              <li>基線甲烷量測</li>
              <li>餵飼監測數據</li>
              <li>第三方查證程序</li>
              <li>動物健康評估</li>
            </ul>
          </div>
        </article>

        <!-- Level 4 -->
        <article class="card evidence-card">
          <div class="card-body">
            <div class="flex items-center gap-4">
              <span class="badge badge-warning">L4 產品</span>
              <h3>LCA 與追溯</h3>
            </div>
            <p>完整的生命週期評估與產品追溯系統。</p>
            <ul class="list-check">
              <li>生命週期評估（LCA）</li>
              <li>產品碳足跡計算</li>
              <li>供應鏈追溯</li>
              <li>產品品質認證</li>
            </ul>
          </div>
        </article>

        <!-- Level 5 -->
        <article class="card evidence-card">
          <div class="card-body">
            <div class="flex items-center gap-4">
              <span class="badge badge-warning">L5 碳資產</span>
              <h3>碳權開發</h3>
            </div>
            <p>協助客戶開發可交易的碳權資產。</p>
            <ul class="list-check">
              <li>減量方法學</li>
              <li>額外性論證</li>
              <li>監測計畫</li>
              <li>第三方查證與核發</li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- Quality Commitment -->
    <section class="section bg-light" aria-labelledby="quality-title">
      <div class="container">
        <div class="section-header">
          <h2 id="quality-title">品質承諾</h2>
        </div>
        <div class="grid grid-cols-3">
          <div class="card stat-card">
            <div class="stat-value">100%</div>
            <div class="stat-label">可追溯</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">5</div>
            <div class="stat-label">證據層級</div>
          </div>
          <div class="card stat-card">
            <div class="stat-value">3rd</div>
            <div class="stat-label">第三方查證</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.evidence-card {
  margin-bottom: 1.5rem;
}

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