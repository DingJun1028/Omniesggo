<template>
  <div id="app">
    <!-- Skip Link for Accessibility -->
    <a href="#main-content" class="skip-link">跳至主要內容</a>

    <!-- Navigation -->
    <nav class="navbar" role="navigation" aria-label="主導覽">
      <div class="container navbar-inner">
        <router-link to="/" class="navbar-brand">
          <span class="text-primary">High-Tech</span> Seaweed
        </router-link>

        <button 
          class="navbar-toggle" 
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-expanded="mobileMenuOpen"
          aria-label="切換選單"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul class="navbar-nav" :class="{ 'is-open': mobileMenuOpen }">
          <li><router-link to="/" @click="mobileMenuOpen = false">首頁</router-link></li>
          <li><router-link to="/solutions" @click="mobileMenuOpen = false">解決方案</router-link></li>
          <li><router-link to="/technology" @click="mobileMenuOpen = false">技術</router-link></li>
          <li><router-link to="/evidence" @click="mobileMenuOpen = false">證據</router-link></li>
          <li><router-link to="/about" @click="mobileMenuOpen = false">關於</router-link></li>
          <li><router-link to="/contact" @click="mobileMenuOpen = false">聯絡</router-link></li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main id="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h4>High-Tech Seaweed</h4>
            <p style="color: var(--htb-gray-400); font-size: 0.875rem;">
              高科生技專注於海門冬四分孢子體技術的研發與應用，協助畜牧業降低甲烷排放。
            </p>
          </div>
          <div>
            <h4>解決方案</h4>
            <router-link to="/solutions">牧場與酪農</router-link>
            <router-link to="/solutions">食品品牌</router-link>
            <router-link to="/solutions">企業 Scope 3</router-link>
            <router-link to="/solutions">政府研究</router-link>
          </div>
          <div>
            <h4>技術與證據</h4>
            <router-link to="/technology">核心技術</router-link>
            <router-link to="/evidence">證據中心</router-link>
            <router-link to="/about">關於高科</router-link>
          </div>
          <div>
            <h4>聯絡方式</h4>
            <p style="color: var(--htb-gray-400); font-size: 0.875rem;">
              info@hsu-kc.com<br>
              +886 2 1234 5678
            </p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 高科生技股份有限公司. All rights reserved.</p>
          <p>5T 驗證通過 | Traceable • Trackable • Tangible • Transparent • Trustworthy</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.navbar-nav.is-open {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 72px;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  gap: 1rem;
}
</style>