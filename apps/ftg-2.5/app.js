// FTG 2.5 — Stitch 風格互動（中英切換 + 滾動顯現 + 數字滾動）
(function () {
  'use strict';

  // 1) 中英切換
  var lang = 'zh';
  var langBtn = document.getElementById('langToggle');
  function applyLang() {
    document.querySelectorAll('[data-zh]').forEach(function (el) {
      el.innerHTML = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
    });
    if (langBtn) langBtn.textContent = lang === 'zh' ? 'EN' : 'ZH';
  }
  function toggleLang() { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); }
  if (langBtn) langBtn.addEventListener('click', toggleLang);
  applyLang();

  // 2) 滾動顯現
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('section, .trip, .stat').forEach(function (el) { io.observe(el); });

  // 3) 數字滾動
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var cur = 0, step = Math.max(1, Math.round(target / 40));
    var t = setInterval(function () {
      cur += step; if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 24);
  }
  var statIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animateCount(e.target); statIO.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat b').forEach(function (el) { statIO.observe(el); });

  // 4) 表單
  var form = document.querySelector('.form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button');
    if (btn) { var old = btn.textContent; btn.textContent = lang === 'zh' ? '已收到 ✓' : 'Received ✓'; setTimeout(function () { btn.textContent = old; }, 2200); }
  });
})();
