// FTG 2.0 — 互動腳本 (設計原型)
function handleSubmit(e) {
  e.preventDefault();
  const msg = document.getElementById('form-msg');
  msg.textContent = '✓ 已收到你的嚮往，旅行設計師將於 48 小時內聯繫你！';
  e.target.reset();
  return false;
}

// 滾動進場動畫（IntersectionObserver）
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.style.opacity = '1';
      en.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.card, .feat, .stat, .step').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  io.observe(el);
});

// 年份自動更新（footer 如有需要）
console.log('[FTG 2.0] 設計原型已載入 — 墾趣旅遊 · 永續深度旅遊');
