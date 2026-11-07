import json
import os

base_dir = r'C:/Users/Administrator/hermes-first-task/Omniesggo-repo'
json_path = os.path.join(base_dir, 'reports', 'agents_data.json')
desktop_html_path = os.path.join(base_dir, 'reports/60員軍團角色畫像_desktop.html')

with open(json_path, encoding='utf-8') as f:
    agents_data = json.load(f)

css = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', 'Noto Sans TC', 'Microsoft Jhenghei', sans-serif;
  background: #0b101a;
  color: #e8edf5;
  padding: 2rem;
}
header { text-align: center; margin-bottom: 2rem; }
header h1 { font-size: 2.2rem; color: #ffd700; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
.card { background: #121826; border: 2px solid #2a3648; border-radius: 1rem; overflow: hidden; }
.card-art { height: 250px; position: relative; overflow: hidden; }
.card-art img { width: 100%; height: 100%; object-fit: cover; }
.card-body { padding: 1.2rem; }
.card-info { padding: 0.8rem 1rem; background: #1a2332; border-top: 1px solid #2a3648; }
.card-type { font-size: 0.9rem; font-weight: 700; color: #e8edf5; }
.card-subtype { font-size: 0.75rem; color: #8a9bb0; }
.skill-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.7rem; font-weight: 700; color: #0b101a; background: #00e5ff; }
.bg-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 0.3rem; font-size: 0.7rem; font-weight: 600; }
.stats-row { display: flex; gap: 0.5rem; margin-top: 0.8rem; }
.stat { flex: 1; min-width: 50px; background: #1a2332; border: 1px solid #2a3648; border-radius: 0.4rem; padding: 0.4rem; text-align: center; }
.stat .value { display: block; font-size: 1.1rem; font-weight: 700; color: #ffd700; }
footer { text-align: center; margin-top: 2rem; color: #8a9bb0; font-size: 0.8rem; }
@media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } body { padding: 1rem; } }
"""

html_parts = []
html_parts.append('<!DOCTYPE html>')
html_parts.append('<html lang="zh-Hant">')
html_parts.append('<head>')
html_parts.append('<meta charset="UTF-8">')
html_parts.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
html_parts.append('<title>OmniCard 萬能卡牌 - 60員軍團角色畫像 (Desktop)</title>')
html_parts.append('<style>')
html_parts.append(css)
html_parts.append('</style>')
html_parts.append('</head>')
html_parts.append('<body>')
html_parts.append('<header><h1>OmniCard 萬能卡牌 <br><span style="color:#00e5ff;">60員軍團角色畫像</span></h1></header>')
html_parts.append('<div class="grid">')

for i, agent in enumerate(agents_data):
    num = agent['num']
    name = agent['name']
    job = agent['job']
    rname = agent['rname']
    side = '蜂王' if '蜂王' in rname else '蜂后'
    soul = agent.get('soul', '')
    
    # Clean rname
    rname_clean = rname
    for suffix in [' (Sovereign)', ' (Sovereign-L)', ' (Architect-L)', ' (Oracle-L)', ' (Muse-L)', ' (Sentinel-L)', ' (Alchemist-L)', ' (Herald-L)', ' (Weaver-L)', ' (Seer-L)', ' (Shaper-L)', ' (Painter-L)', ' (Flow-L)', ' (Writer-L)', ' (Analyst-L)', ' (Networker-L)', ' (Translater-L)', ' (Drafter-L)', ' (Conductor-L)', ' (Media-L)', ' (Control-L)', ' (Erode-L)', ' (Nexus-L)', ' (Skinner-L)', ' (Scout-L)', ' (Wraith-L)', ' (Lens-L)', ' (Purifier-L)', ' (Hawk-L)', ' (Ward-L)', ' (Curator-L)', ' (Echo-L)', ' (Seal-L)', '萬能蜂后']:
        rname_clean = rname_clean.replace(suffix, '')
    
    job_text = job[0] if job else rname_clean
    skill_text = job_text[:30]
    
    # Array colors
    array_num = int(num)
    if 1 <= array_num <= 6:
        bg_color_class = 'bg-badge-cyan'
    elif 7 <= array_num <= 12:
        bg_color_class = 'bg-badge-gold'
    elif 13 <= array_num <= 18:
        bg_color_class = 'bg-badge-purple'
    elif 19 <= array_num <= 24:
        bg_color_class = 'bg-badge-red'
    elif 25 <= array_num <= 30:
        bg_color_class = 'bg-badge-gray'
    elif 31 <= array_num <= 36:
        bg_color_class = 'bg-badge-cyan'
    elif 37 <= array_num <= 42:
        bg_color_class = 'bg-badge-gold'
    elif 43 <= array_num <= 48:
        bg_color_class = 'bg-badge-purple'
    elif 49 <= array_num <= 54:
        bg_color_class = 'bg-badge-red'
    else:
        bg_color_class = 'bg-badge-gray'
    
    html_parts.append('<div class="card">')
    html_parts.append('  <div class="card-art"><img src="images/krea_krea-3_' + num.zfill(2) + '_20261103_144140_cb6a854b.png" alt="' + name + ' 畫像"></div>')
    html_parts.append('  <div class="card-body">')
    html_parts.append('    <div class="card-info">')
    html_parts.append('      <div class="card-type">' + soul + ' (' + ('蜂王' if '蜂王' in rname else '蜂后') + ')</div>')
    html_parts.append('      <div class="card-subtype">' + rname_clean + '</div>')
    html_parts.append('      <span class="skill-badge">' + skill_text + '</span>')
    html_parts.append('      <span class="' + bg_color_class + '">' + side + ' · ' + rname_clean[:15] + '</span>')
    html_parts.append('      <div class="stats-row">')
    stats = agent.get('stats', {})
    for stat in ['ATK', 'DEF', 'SPD', 'INT', 'SYN', 'MEM']:
        val = stats.get(stat, 0)
        html_parts.append('<div class="stat"><span class="value">' + str(val) + '</span></div>')
    html_parts.append('</div>')
    html_parts.append('    </div>')
    html_parts.append('  </div>')
    html_parts.append('</div>')

html_parts.append('</div>')
html_parts.append('<footer>Generated by OmniCard 萬能卡牌 System</footer>')
html_parts.append('</body>')
html_parts.append('</html>')

with open(desktop_html_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(html_parts))

print('Desktop HTML generated with ' + str(len(agents_data)) + ' cards')
print('Size: ' + str(os.path.getsize(desktop_html_path)) + ' bytes')
