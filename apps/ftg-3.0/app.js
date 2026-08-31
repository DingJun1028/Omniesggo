// FTG 3.0 — 互動腳本（升級版）
(function () {
  'use strict';

  // 1) 滾動進度條
  const progress = document.getElementById('scrollProgress');
  const nav = document.getElementById('nav');
  function onScroll() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    if (progress) progress.style.width = scrolled + '%';
    if (nav) nav.classList.toggle('scrolled', h.scrollTop > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2) 行動版選單
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // 3) 數字滾動動畫
  function animateNumber(el) {
    const target = parseFloat(el.getAttribute('data-target')) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // 4) Reveal + 數字 + bar 進場（IntersectionObserver）
  const reveals = document.querySelectorAll('.card, .feat, .stat, .step, .impact-card, .voice, .bar-row, .esg-card');
  reveals.forEach(function (el) { el.classList.add('reveal'); });

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      // 數字滾動
      const num = el.querySelector('.num, .impact-num');
      if (num && !num.dataset.done) { num.dataset.done = '1'; animateNumber(num); }
      // bar 動畫
      const bar = el.querySelector('.bar i');
      if (bar) { const w = bar.style.getPropertyValue('--w'); bar.style.width = w; }
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  reveals.forEach(function (el) { io.observe(el); });

  // 5) 中英語言切換
  const langBtn = document.getElementById('langToggle');
  let lang = 'zh';
  function applyLang() {
    document.querySelectorAll('[data-zh]').forEach(function (el) {
      const txt = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (txt != null) el.innerHTML = txt;
    });
    if (langBtn) langBtn.textContent = lang === 'zh' ? 'EN' : 'ZH';
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }
  function toggleLang() { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); }
  if (langBtn) langBtn.addEventListener('click', toggleLang);
  var langBtnMobile = document.getElementById('langToggleMobile');
  if (langBtnMobile) langBtnMobile.addEventListener('click', toggleLang);
  applyLang();

  // 6) 表單提交
  window.handleSubmit = function (e) {
    e.preventDefault();
    const msg = document.getElementById('form-msg');
    const ok = lang === 'zh' ? '✓ 已收到你的嚮往，旅行設計師將於 48 小時內聯繫你！' : '✓ Received! Our travel designer will reach you within 48 hours.';
    if (msg) msg.textContent = ok;
    e.target.reset();
    return false;
  };

  console.log('[FTG 3.0] 永續深度旅遊設計已載入 — 墾趣旅遊');
})();
