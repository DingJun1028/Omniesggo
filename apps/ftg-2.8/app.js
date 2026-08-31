(function(){'use strict';var lang='en';var langBtn=document.getElementById('langToggle');
function applyLang(){if(!langBtn)return;langBtn.textContent=lang==='zh'?'EN':'ZH';}
if(langBtn)langBtn.addEventListener('click',function(){lang=lang==='zh'?'en':'zh';applyLang();});applyLang();
var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.15});
document.querySelectorAll('section,.trip,.stat').forEach(function(el){io.observe(el);});
function cnt(el){var t=parseInt(el.getAttribute('data-count'),10),c=0,s=Math.max(1,Math.round(t/40)),iv=setInterval(function(){c+=s;if(c>=t){c=t;clearInterval(iv);}el.textContent=c;},24);}
var sio=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){cnt(x.target);sio.unobserve(x.target);}});},{threshold:.5});
document.querySelectorAll('.stat b').forEach(function(el){sio.observe(el);});
var f=document.querySelector('.form');if(f)f.addEventListener('submit',function(e){e.preventDefault();var b=f.querySelector('button');if(b){var o=b.textContent;b.textContent=lang==='zh'?'已收到 ✓':'Received ✓';setTimeout(function(){b.textContent=o;},2200);}});
})();