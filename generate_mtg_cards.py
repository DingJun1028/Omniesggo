import os, json, re
from html import escape
repo = os.path.dirname(os.path.abspath(__file__))
reports = os.path.join(repo, 'reports')
img_paths = {
    f'{num:02d}': f'krea_krea-3_{num:02d}_20261103_144140_cb6a854b.png'
    for num in range(1, 61)
}
missing_images = [name for name in img_paths.values() if not os.path.isfile(os.path.join(reports, 'images', name))]
if missing_images:
    raise FileNotFoundError(f"Missing card portraits: {', '.join(missing_images)}")

with open(os.path.join(reports, 'agents_data.json'), encoding='utf-8') as f:
    agents = json.load(f)

# Build a sorted list of agents by number
agents.sort(key=lambda a: int(a['num']))

# Build HTML card blocks with MTG-style design
card_blocks = []
for a in agents:
    num = a['num']
    side = escape(str(a['side']), quote=True)
    name = escape(str(a['name']), quote=True)
    rname = escape(str(a['rname']), quote=True)
    first_job = escape(str(a['job'][0]), quote=True)
    color = '#0e1a2a' if side == '蜂王' else '#1a1408'
    border_color = '#2a4a6a' if side == '蜂王' else '#4a3a1a'
    gold_color = '#00e5ff' if side == '蜂王' else '#ffd700'
    text_color = '#eef4f9' if side == '蜂王' else '#1a1408'
    stat_colors = {'ATK':'#ffd700','DEF':'#00e5ff','SPD':'#b08a3a','INT':'#ff6b6b','SYN':'#4fc3f7','MEM':'#ffd700'}
    
    # Build abilities list
    abilities = a['abilities']
    abilities_html = '<br>'.join([f'<div class="ability">{escape(str(ab), quote=True)}</div>' for ab in abilities])
    
    # Build job list
    jobs = a['job']
    job_html = '<br>'.join([f'<div class="job">{escape(str(j), quote=True)}</div>' for j in jobs])
    
    card_blocks.append(f'''
<div class="card mtm">
  <div class="card-frame">
    <div class="card-header">
      <div class="card-faction">{side}<span class="faction-dot"></span></div>
      <div class="card-number">{num} / 60</div>
    </div>
    <div class="card-body">
      <div class="card-art">
        <img src="images/{img_paths[num]}" alt="{name} 畫像">
        <div class="card-art-overlay">
          <div class="card-name">{name}</div>
          <div class="card-abilities">{abilities_html}</div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-type">{rname}</div>
        <div class="card-subtype">{first_job}</div>
        <div class="stats-row">
          <div class="stat"><span class="lab">ATK</span><span class="fill {stat_colors['ATK']}" style="width:{a['stats']['ATK']*10}%">{a['stats']['ATK']}</span></div>
          <div class="stat"><span class="lab">DEF</span><span class="fill {stat_colors['DEF']}" style="width:{a['stats']['DEF']*10}%">{a['stats']['DEF']}</span></div>
          <div class="stat"><span class="lab">SPD</span><span class="fill {stat_colors['SPD']}" style="width:{a['stats']['SPD']*10}%">{a['stats']['SPD']}</span></div>
          <div class="stat"><span class="lab">INT</span><span class="fill {stat_colors['INT']}" style="width:{a['stats']['INT']*10}%">{a['stats']['INT']}</span></div>
          <div class="stat"><span class="lab">SYN</span><span class="fill {stat_colors['SYN']}" style="width:{a['stats']['SYN']*10}%">{a['stats']['SYN']}</span></div>
          <div class="stat"><span class="lab">MEM</span><span class="fill {stat_colors['MEM']}" style="width:{a['stats']['MEM']*10}%">{a['stats']['MEM']}</span></div>
        </div>
        <div class="card-text">{job_html}</div>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-toughness">{a['stats']['DEF']}</div>
      <div class="card-power">{a['stats']['ATK']}</div>
      <div class="card-side">{side}</div>
    </div>
  </div>
</div>''')

# Build the complete HTML
css = '''
:root{
  --bg:#0b101a; --card:#121826; --card2:#0f1520; --border:#2a3648;
  --fg:#eef4f9; --muted:#9fb3c8; --gold:#ffd700; --cyan:#00e5ff;
  --font:'Segoe UI', 'Noto Sans TC', 'Microsoft Jhenghei', 'Microsoft YaHei', sans-serif;
}
[data-theme="light"]{--bg:#f4f6f8;--card:#fff;--border:#c9d2dc;--fg:#1a2332;--muted:#5a6a7a;--gold:#b08a3a;}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:var(--bg);color:var(--fg);font-family:var(--font);min-height:100vh;overflow-x:hidden}
body{padding:0}
::selection{background:var(--gold);color:var(--bg)}
.wrap{max-width:1600px;margin:0 auto;padding:1.5rem 1.5rem 4rem}
.header{text-align:center;padding:2rem 0 1rem;border-bottom:2px solid var(--border)}
.header .kicker{font-size:.85rem;letter-spacing:.3em;color:var(--muted);text-transform:uppercase}
.header h1{font-size:2.2rem;letter-spacing:.04em;margin:.2rem 0 .3rem}
.header h1 .sub{font-size:.95rem;color:var(--muted);font-weight:400}
.header .meta{color:var(--muted);font-size:.85rem}
.select-wrapper{margin:0 auto;max-width:500px}
select{background:var(--card);color:var(--fg);border:1px solid var(--border);border-radius:10px;padding:.6rem 1rem;font-size:1rem;cursor:pointer}
select:focus{outline:2px solid var(--gold);border-color:transparent}
.filters{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;margin:.8rem 0}
.chip{padding:.45rem .16rem;font-size:.78rem;border-radius:.5rem;background:var(--card2);border:1px solid var(--border);color:var(--muted);cursor:pointer;text-transform:uppercase;letter-spacing:.04em}
.chip:hover{border-color:var(--gold);color:var(--fg)}
.chip.on{background:var(--gold);border-color:var(--gold);color:var(--bg)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.2rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:.2s}
.card:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(0,229,255,.15);border-color:var(--gold)}
.card-frame{border:2px solid var(--border);border-radius:6px;padding:8px;display:flex;flex-direction:column}
.card-header{display:flex;justify-content:space-between;align-items:center;padding:.3rem .5rem}
.card-faction{font-size:.65rem;font-weight:700;letter-spacing:.1em;color:var(--gold)}
.faction-dot{width:8px;height:8px;border-radius:50%;background:var(--cyan)}
.card-number{font-size:.7rem;color:var(--muted);font-family:'Segoe UI',monospace}
.card-body{display:flex;flex-direction:column}
.card-art{flex:1;position:relative;border-radius:4px;overflow:hidden;background:var(--card2);border:1px solid var(--border)}
.card-art img{width:100%;height:180px;object-fit:cover;border-radius:4px}
.card-art-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.3),rgba(0,0,0,.7));display:flex;flex-direction:column;justify-content:flex-end;padding:10px}
.card-name{font-size:1.1rem;font-weight:600;color:var(--gold);letter-spacing:.04em}
.card-abilities{font-size:.6rem;color:var(--fg);line-height:1.4;min-height:40px}
.card-info{padding:8px 10px;background:var(--card2);border-top:1px solid var(--border);flex:none}
.card-type{font-size:.85rem;font-weight:600;color:var(--fg);letter-spacing:.03em}
.card-subtype{font-size:.65rem;color:var(--muted);margin-top:.2rem;line-height:1.4}
.stats-row{display:flex;gap:.3rem;margin-top:.4rem}
.stat{flex:1;text-align:center}
.stat .lab{font-size:.5rem;color:var(--muted);letter-spacing:.05em}
.stat .fill{height:6px;border-radius:3px;display:block}
.card-text{font-size:.62rem;color:var(--muted);line-height:1.5;padding-top:.3rem}
.card-footer{display:flex;justify-content:space-between;align-items:center;background:var(--card);border-top:1px solid var(--border);padding:6px 10px}
.card-toughness{font-size:.7rem;font-weight:700;color:var(--cyan)}
.card-power{font-size:.7rem;font-weight:700;color:var(--gold)}
.card-side{font-size:.6rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
.foot{margin-top:.6rem;text-align:center;color:var(--muted);font-size:.7rem;letter-spacing:.06em}
.theme-toggle{position:fixed;top:.8rem;right:.8rem;z-index:50;background:var(--card);border:1px solid var(--border);border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--fg);transition:.2s}
.theme-toggle:hover{border-color:var(--gold);color:var(--gold)}
.theme-toggle .sun{display:none}
.theme-toggle .moon{display:block;font-size:1.3rem;line-height:1}
[data-theme="light"] .theme-toggle .sun{display:block}
[data-theme="light"] .theme-toggle .moon{display:none}
@media (max-width:900px){.grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}.card-art img{height:150px}}
@media print{.controls,.theme-toggle,.foot{display:none!important}.grid{grid-template-columns:repeat(2,1fr);gap:.8rem}}
'''

html = f'''<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>OmniAgent 萬能代理 · 60員軍團角色畫像</title><style>{css}</style></head><body>
<div class="theme-toggle" onclick="var t=document.body.getAttribute('data-theme');var lt=t==='light'?'':'light';document.body.setAttribute('data-theme',lt);this.querySelector('.moon').style.display=t==='light'?'none':'block';this.querySelector('.sun').style.display=t==='light'?'block':'none'"><span class="sun">☀️</span><span class="moon">🌙</span></div>
<div class="wrap">
<div class="header"><div class="kicker">OmniAgent 萬能代理 — 60員軍團角色畫像</div><h1>万能代理<br><span class="sub">MTG樣式集換卡 · 每卡一張完整英雄輯</span></h1><div class="meta">蜂王 OA-LOCAL (01-30) 暗系 Umbra · 蜂后 OA-VPS (31-60) 光系 Lumen · 5T 協定 / 結界六柱</div></div>
<div class="filters"><button class="chip on" data-f="all">全部</button><button class="chip" data-f="umbra">蜂王（暗系）</button><button class="chip" data-f="lumen">蜂后（光系）</button></div>
<div class="grid">{''.join(card_blocks)}</div>
<div class="foot">OmniAgent 萬能代理 · 60員軍團角色畫像（統合聖典）｜ 每卡塗鴉風格、甲胄金縷、赫爾墨斯使者系統</div></div>
</body></html>'''

# Write both versions
for name, content in [
    ('60員軍團角色畫像.html', html),
    ('60員軍團角色畫像_desktop.html', html),
]:
    path = os.path.join(reports, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"{name}: {len(content)} bytes, {content.count('<div class=\"card\">')} cards, {content.count('<div class=\"card-frame\">')} frames")
    print(f"  First card sample: {content[content.find('<div class=\"card mtm\">'):content.find('<div class=\"card mtm\">')+200]}")
    break  # only show main for now
