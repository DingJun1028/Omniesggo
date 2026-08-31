#!/usr/bin/env node
/**
 * ftg-gen — 墾趣旅遊 FTG 網頁參數化生成 CLI
 * 用法:
 *   node ftg-gen.js --version 2.7 --theme stitch-dark --lang zh
 *   node ftg-gen.js --version 2.7 --theme light --lang en --out apps/ftg-2.7
 * 主題: stitch-dark | light | midjourney(預留)
 */
const fs = require('fs');
const path = require('path');
const { generateForTheme } = require('./fal-images');

const argv = process.argv.slice(2);
function getArg(name, def) {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
}
// 強化: CLI 層版本號白名單 (防路徑穿越 / HTML 注入)
function safeVer(v) { return /^[a-zA-Z0-9.\-]+$/.test(v) ? v : '2.7'; }
const version = safeVer(getArg('version', '2.7'));
const theme = getArg('theme', 'stitch-dark');
const lang = getArg('lang', 'zh');
const out = getArg('out', null);
const dir = out ? path.resolve(out) : path.resolve(__dirname, '..', 'ftg-' + version);

const THEMES = require('./themes.json');
const t = THEMES[theme] || THEMES['stitch-dark'];

const ZH = {
  kicker: 'SUSTAINABLE TRAVEL · EDITION ' + version,
  h1: '旅行，讓土地<br>更好一點。',
  lede: 'FTG ' + version + ' 是一份旅行設計手稿：少一點消費，多一點共創；把每一次出發，變成土地可以代收的禮物。',
  storyH: '從一片田地開始的旅行',
  storyB: '「墾」是翻土，「趣」是好奇。我們相信旅遊可以是雙向的：你帶走回憶，土地留下永續，社區獲得尊嚴。',
  tripsH: '三條慢慢走的路',
  impactH: '我們留下的正向痕跡',
  bookH: '說出你嚮往的旅程',
  bookB: '填寫下表，我們會在兩個工作天內回你一封手寫感的路線草圖。',
  nav: ['理念', '路線', '影響', '預訂'],
  trips: [
    { tag: 'STAY', h: '慢旅宿行', p: '住進百年三合院改造的民宿，清晨採茶、黃昏煮飯。' },
    { tag: 'ECO', h: '生態向導', p: '跟著保育員巡溪，認識蕨類與蛙類，聽森林呼吸。' },
    { tag: 'CRAFT', h: '手藝學徒', p: '竹編、藍染、醃漬——用雙手把地方記憶帶回家。' }
  ],
  stats: [
    { n: '82', s: '% 在地採購' }, { n: '46', s: '噸 年度減碳' },
    { n: '120', s: '位 社區夥伴' }, { n: '0', s: '一次性塑料' }
  ],
  submit: '送出詢問', placeholder: ['姓名 / 單位', 'you@example.com', '想體驗的主題，例如：一日藍染 + 慢食'],
  title: `墾趣旅遊 FTG ${version} — 旅行，讓土地更好一點`,
  footer: `© 2026 墾趣旅遊 · 永續深度旅遊設計`
};
const EN = {
  kicker: 'SUSTAINABLE TRAVEL · EDITION ' + version,
  h1: 'Travel that leaves<br>the land better.',
  lede: `FTG ${version} is a travel design draft: less consumption, more co-creation — every departure becomes a gift the land can receive.`,
  storyH: 'A journey that starts with a field',
  storyB: "'Keng' is to till, 'Chu' is curiosity. Travel can be mutual: you take memories, the land keeps sustainability, communities gain dignity.",
  tripsH: 'Three slow routes',
  impactH: 'The positive trace we leave',
  bookH: 'Tell us the trip you long for',
  bookB: 'Fill the form; within two working days we reply with a handwritten-feel route sketch.',
  nav: ['Story', 'Trips', 'Impact', 'Book'],
  trips: [
    { tag: 'STAY', h: 'Slow Stay', p: 'Stay in a century-old remodeled homestead; pick tea at dawn, cook at dusk.' },
    { tag: 'ECO', h: 'Eco Guide', p: 'Patrol streams with conservationists; learn ferns and frogs.' },
    { tag: 'CRAFT', h: 'Craft Apprentice', p: 'Bamboo weaving, indigo dyeing, pickling — carry memory home.' }
  ],
  stats: [
    { n: '82', s: '% local sourcing' }, { n: '46', s: 't CO₂ avoided / yr' },
    { n: '120', s: 'community partners' }, { n: '0', s: 'single-use plastic' }
  ],
  submit: 'Send inquiry', placeholder: ['Name / Org', 'you@example.com', 'Theme you want, e.g. indigo + slow food'],
  title: `FTG ${version} — Travel that leaves the land better`,
  footer: '© 2026 FTG Tours · Sustainable travel design'
};
const D = lang === 'en' ? EN : ZH;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const html = `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'zh-Hant'}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(D.title)}</title>
<meta name="description" content="${esc(D.lede)}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="styles.css?v=${version.replace('.', '')}a"/>
</head>
<body>
<nav class="nav" id="nav"><div class="container">
<a class="brand" href="#top">墾趣<span class="dot">·</span>FTG ${version}</a>
<div class="nav-links" id="navLinks">
<a href="#story">${D.nav[0]}</a><a href="#trips">${D.nav[1]}</a><a href="#impact">${D.nav[2]}</a><a href="#book">${D.nav[3]}</a>
<button class="lang-toggle" id="langToggle">${lang === 'zh' ? 'EN' : 'ZH'}</button>
</div></div></nav>

<header class="hero" id="top">
<div class="hero-bg" style="background-image:url('assets/hero.jpg')"></div>
<div class="container"><div class="hero-inner">
<span class="kicker">${esc(D.kicker)}</span>
<h1>${D.h1}</h1>
<p class="lede">${esc(D.lede)}</p>
<div class="hero-cta"><a class="btn btn-solid" href="#trips">${lang === 'zh' ? '看路線' : 'View trips'}</a><a class="btn btn-ghost" href="#impact">${lang === 'zh' ? '我們的影響' : 'Our impact'}</a></div>
</div></div><div class="scroll-hint">↓</div>
</header>

<section class="story" id="story"><div class="container narrow">
<span class="sec-no">01 — ${D.nav[0]}</span><h2>${esc(D.storyH)}</h2>
<p class="body">${esc(D.storyB)}</p>
</div></section>

<section class="trips" id="trips"><div class="container">
<span class="sec-no">02 — ${D.nav[1]}</span><h2>${esc(D.tripsH)}</h2>
<div class="trip-grid">
${D.trips.map((x, i) => `<article class="trip"><div class="trip-pic" style="background-image:url('assets/${['stay', 'eco', 'craft'][i]}.jpg')"></div><div class="trip-body"><span class="trip-tag">${x.tag}</span><h3>${esc(x.h)}</h3><p>${esc(x.p)}</p></div></article>`).join('\n')}
</div></div></section>

<section class="impact" id="impact"><div class="container narrow">
<span class="sec-no">03 — ${D.nav[2]}</span><h2>${esc(D.impactH)}</h2>
<div class="stat-grid">
${D.stats.map(s => `<div class="stat"><b data-count="${s.n}">${s.n}</b><span>${esc(s.s)}</span></div>`).join('\n')}
</div></div></section>

<section class="book" id="book"><div class="container narrow">
<span class="sec-no">04 — ${D.nav[3]}</span><h2>${esc(D.bookH)}</h2>
<p class="body">${esc(D.bookB)}</p>
<form class="form" onsubmit="return false;">
<input type="text" placeholder="${D.placeholder[0]}" required/>
<input type="email" placeholder="${D.placeholder[1]}" required/>
<textarea placeholder="${D.placeholder[2]}"></textarea>
<button class="btn btn-solid" type="submit">${esc(D.submit)}</button>
</form></div></section>

<footer class="foot"><div class="container">
<span class="brand">墾趣<span class="dot">·</span>FTG ${version}</span>
<span class="muted">${esc(D.footer)}</span></div></footer>
<script src="app.js"></script>
</body></html>`;

const css = `:root{--ink:${t.ink};--paper:${t.paper};--panel:${t.panel};--panel2:${t.panel2};--line:${t.line};--cream:${t.cream};--muted:${t.muted};--green:${t.green};--gold:${t.gold};--radius:${t.radius};--font-zh:'Noto Sans TC',system-ui,sans-serif;--font-en:'Space Grotesk','Noto Sans TC',sans-serif}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{background:var(--ink);color:var(--cream);font-family:var(--font-zh);line-height:1.7;-webkit-font-smoothing:antialiased}
.container{max-width:1120px;margin:0 auto;padding:0 28px}.container.narrow{max-width:760px}a{color:inherit;text-decoration:none}
.nav{position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(10px);background:rgba(14,21,18,.55);border-bottom:1px solid var(--line)}
.nav .container{display:flex;align-items:center;justify-content:space-between;height:68px}
.brand{font-family:var(--font-en);font-weight:700;font-size:19px}.brand .dot{color:var(--gold)}
.nav-links{display:flex;align-items:center;gap:26px}.nav-links a{font-size:14px;color:var(--muted);transition:color .2s}.nav-links a:hover{color:var(--cream)}
.lang-toggle{border:1px solid var(--line);background:transparent;color:var(--cream);border-radius:999px;padding:6px 14px;cursor:pointer;font-size:12px;font-family:var(--font-en)}
.hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:${t.heroOpacity};filter:saturate(1.05) brightness(.85)}
.hero-bg::after{content:'';position:absolute;inset:0;background:${t.heroAfter}}
.hero-inner{position:relative;z-index:1;max-width:680px;padding-top:80px}
.kicker{font-family:var(--font-en);font-size:12px;letter-spacing:3px;color:var(--gold);text-transform:uppercase}
.hero h1{font-size:clamp(38px,6vw,68px);line-height:1.08;font-weight:700;margin:18px 0 22px}
.lede{font-size:clamp(15px,1.8vw,18px);color:var(--muted);max-width:560px}
.hero-cta{display:flex;gap:14px;margin-top:34px;flex-wrap:wrap}
.btn{padding:13px 26px;border-radius:999px;font-size:14px;cursor:pointer;border:1px solid transparent;display:inline-block;transition:transform .15s,background .2s}
.btn-solid{background:var(--green);color:#0e1512}.btn-solid:hover{transform:translateY(-2px);background:var(--gold)}
.btn-ghost{border-color:var(--line);color:var(--cream)}.btn-ghost:hover{border-color:var(--green);color:var(--green)}
.scroll-hint{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);color:var(--muted);font-size:20px;animation:bob 2s infinite}
@keyframes bob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}
section{padding:clamp(80px,11vw,140px) 0}
.sec-no{font-family:var(--font-en);font-size:12px;letter-spacing:3px;color:var(--gold);text-transform:uppercase}
h2{font-size:clamp(28px,4vw,46px);font-weight:700;margin:14px 0 22px}
.body{font-size:clamp(15px,1.8vw,17px);color:var(--muted);max-width:620px}
.trip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:46px}
.trip{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;transition:transform .25s,border-color .2s}
.trip:hover{transform:translateY(-6px);border-color:var(--green)}
.trip-pic{height:200px;background-size:cover;background-position:center}.trip-body{padding:22px}
.trip-tag{font-family:var(--font-en);font-size:11px;letter-spacing:2px;color:var(--gold)}.trip-body h3{font-size:20px;margin:8px 0 10px}.trip-body p{font-size:14px;color:var(--muted)}
.impact{background:var(--panel)}.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:44px}
.stat{background:var(--panel2);border:1px solid var(--line);border-radius:var(--radius);padding:28px 22px;text-align:center}
.stat b{display:block;font-family:var(--font-en);font-size:clamp(30px,4vw,44px);font-weight:700;color:var(--green)}.stat span{font-size:13px;color:var(--muted)}
.form{display:flex;flex-direction:column;gap:14px;margin-top:34px;max-width:520px}
.form input,.form textarea{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;color:var(--cream);font-family:var(--font-zh);font-size:15px;resize:vertical}
.form input:focus,.form textarea:focus{outline:none;border-color:var(--green)}.form textarea{min-height:110px}.form .btn{align-self:flex-start}
.foot{border-top:1px solid var(--line);padding:34px 0}.foot .container{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}.foot .muted{color:var(--muted);font-size:13px}
section,.trip,.stat{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
section.in,.trip.in,.stat.in{opacity:1;transform:none}
@media (max-width:860px){.trip-grid{grid-template-columns:1fr}.stat-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:560px){.nav-links a:not(.lang-toggle){display:none}.stat-grid{grid-template-columns:1fr 1fr}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

const appjs = `(function(){'use strict';var lang='${lang}';var langBtn=document.getElementById('langToggle');
function applyLang(){if(!langBtn)return;langBtn.textContent=lang==='zh'?'EN':'ZH';}
if(langBtn)langBtn.addEventListener('click',function(){lang=lang==='zh'?'en':'zh';applyLang();});applyLang();
var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.15});
document.querySelectorAll('section,.trip,.stat').forEach(function(el){io.observe(el);});
function cnt(el){var t=parseInt(el.getAttribute('data-count'),10),c=0,s=Math.max(1,Math.round(t/40)),iv=setInterval(function(){c+=s;if(c>=t){c=t;clearInterval(iv);}el.textContent=c;},24);}
var sio=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){cnt(x.target);sio.unobserve(x.target);}});},{threshold:.5});
document.querySelectorAll('.stat b').forEach(function(el){sio.observe(el);});
var f=document.querySelector('.form');if(f)f.addEventListener('submit',function(e){e.preventDefault();var b=f.querySelector('button');if(b){var o=b.textContent;b.textContent=lang==='zh'?'已收到 ✓':'Received ✓';setTimeout(function(){b.textContent=o;},2200);}});
})();`;

const assetsDir = path.join(dir, 'assets');
fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), html);
fs.writeFileSync(path.join(dir, 'styles.css'), css);
fs.writeFileSync(path.join(dir, 'app.js'), appjs);

// 路徑 C: 圖像生成 — API 優先，本地回退
const localSrc = path.resolve(process.cwd(), 'apps/ftg-3.0/assets');
(async () => {
  const r = await generateForTheme(theme, assetsDir, localSrc);
  console.log('[ftg-gen] images source=' + r.source + (r.reason ? ' (' + r.reason + ')' : ''));
  console.log('[ftg-gen] generated ' + dir);
  console.log('[ftg-gen] version=' + version + ' theme=' + theme + ' lang=' + lang);
  console.log('[ftg-gen] files: index.html, styles.css, app.js, assets/*.jpg');
})();
