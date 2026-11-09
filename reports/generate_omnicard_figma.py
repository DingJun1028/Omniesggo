import json
import os
CLOSE_DIV = '</div>'
CLOSE_DIV_INDENT = '    </div>'
CLOSE_SPAN = '</span>'

# Use absolute path
base_dir = r'C:/Users/Administrator/hermes-first-task/Omniesggo-repo'
json_path = os.path.join(base_dir, 'reports', 'agents_data.json')
html_path = os.path.join(base_dir, 'reports', '60員軍團角色畫像.html')
desktop_html_path = os.path.join(base_dir, 'reports', '60員軍團角色畫像_desktop.html')

# Load agents data
with open(json_path, encoding='utf-8') as f:
    agents_data = json.load(f)

# Build data structures
skill_data = {}
agent_names = {}
for agent in agents_data:
    num = agent['num']
    rname = agent['rname']
    job = agent['job']
    side = '蜂王' if '蜂王' in rname else '蜂后'
    
    # Clean rname
    rname_clean = rname
    for suffix in [' (Sovereign)', ' (Sovereign-L)', ' (Architect-L)', ' (Oracle-L)', ' (Muse-L)', ' (Sentinel-L)', ' (Alchemist-L)', ' (Herald-L)', ' (Weaver-L)', ' (Seer-L)', ' (Shaper-L)', ' (Painter-L)', ' (Flow-L)', ' (Writer-L)', ' (Analyst-L)', ' (Networker-L)', ' (Translater-L)', ' (Drafter-L)', ' (Conductor-L)', ' (Media-L)', ' (Control-L)', ' (Erode-L)', ' (Nexus-L)', ' (Skinner-L)', ' (Scout-L)', ' (Wraith-L)', ' (Lens-L)', ' (Purifier-L)', ' (Hawk-L)', ' (Ward-L)', ' (Curator-L)', ' (Echo-L)', ' (Seal-L)', '萬能蜂后']:
        rname_clean = rname_clean.replace(suffix, '')
    
    job_text = job[0] if job else rname_clean
    skill_text = job_text[:30]
    
    skill_data[num] = '<span class="skill-badge">' + skill_text + CLOSE_SPAN
    agent_names[num] = agent['name']

# Generate clean HTML from scratch with Figma-style design
html_parts = []
html_parts.append('<!DOCTYPE html>')
html_parts.append('<html lang="zh-Hant">')
html_parts.append('<head>')
html_parts.append('<meta charset="UTF-8">')
html_parts.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
html_parts.append('<title>OmniCard 萬能卡牌 - 60員軍團角色畫像</title>')
html_parts.append('<style>')

# Figma-style CSS with refined design
css = """
:root {
  --bg: #0b101a;
  --card: #121826;
  --card2: #1a2332;
  --border: #2a3648;
  --border-gold: #ffd700;
  --accent: #00e5ff;
  --accent2: #ffd700;
  --fg: #e8edf5;
  --muted: #8a9bb0;
  --gold: #ffd700;
  --cyan: #00e5ff;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', 'Noto Sans TC', 'Microsoft Jhenghei', sans-serif;
  background: var(--bg);
  color: var(--fg);
  padding: 2rem;
  min-height: 100vh;
}

/* Header - Figma style */
header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

header h1 {
  font-size: 2.2rem;
  color: var(--accent2);
  margin-bottom: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

header h1 span {
  color: var(--accent);
}

header p {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 400;
}

/* Filter bar - Figma style */
.filter-bar {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.6rem 1.4rem;
  border: 2px solid var(--border);
  border-radius: 2rem;
  background: var(--card);
  color: var(--fg);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.filter-btn:hover {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--bg);
  transform: translateY(-2px);
}

.filter-btn.active {
  border-color: var(--accent2);
  background: var(--accent2);
  color: var(--bg);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.25);
}

/* Grid - Figma style */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.8rem;
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Card - Figma style */
.card {
  background: var(--card);
  border: 2px solid var(--border);
  border-radius: 1.2rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-8px) scale(1.01);
  border-color: var(--accent);
  box-shadow: 0 20px 40px rgba(0, 229, 255, 0.15), 0 8px 20px rgba(0, 0, 0, 0.3);
  border-width: 3px;
}

.card.mtm {
  border-color: var(--accent2);
}

.card.mtm:hover {
  border-color: var(--accent2);
  box-shadow: 0 20px 40px rgba(255, 215, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.3);
}

/* Card frame - Figma style */
.card-frame {
  position: relative;
  background: linear-gradient(145deg, #1a2332, #121826);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Card art - Figma style */
.card-art {
  position: relative;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(145deg, #1a2332, #0f1625);
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.8rem;
  transition: transform 0.3s ease;
}

.card:hover .card-art img {
  transform: scale(1.05);
}

/* Art overlay - Figma style */
.card-art-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
  padding: 1.2rem;
}

.skill-label {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent2);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.6rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.skill-badge {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--bg);
  background: var(--accent);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 229, 255, 0.3);
}

.card-name {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--accent2);
  text-align: center;
  margin-top: 0.8rem;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* Card body - Figma style */
.card-body {
  padding: 1.2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-info {
  padding: 0.9rem 1rem;
  background: var(--card2);
  border-top: 1px solid var(--border);
  margin-top: 0.8rem;
  flex: 1;
}

.card-type {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--fg);
  margin-bottom: 0.4rem;
  letter-spacing: 0.02em;
}

.card-subtype {
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 0.7rem;
}

/* Skill badges inline */
.skill-badge.inline {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--bg);
  margin-right: 0.4rem;
  margin-bottom: 0.5rem;
  background: var(--accent);
  box-shadow: 0 2px 6px rgba(0, 229, 255, 0.2);
}

/* BG badges - Figma style */
.bg-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--bg);
  margin-right: 0.3rem;
  margin-bottom: 0.4rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.bg-badge.olive { background: #6b8e23; }
.bg-badge.purple { background: #8a2be2; }
.bg-badge.red { background: #dc143c; }
.bg-badge.orange { background: #ffa500; }
.bg-badge.purple2 { background: #b8860b; }
.bg-badge.coral { background: #e07060; }
.bg-badge.cyan { background: #00bcd4; }
.bg-badge.gold2 { background: #d4af37; }
.bg-badge.slate { background: #90a4ae; }
.bg-badge.slate2 { background: #607d8b; }
.bg-badge.slate3 { background: #546e7a; }
.bg-badge.slate4 { background: #455a64; }
.bg-badge.darkblue { background: #1a237e; }
.bg-badge.lightblue { background: #0288d1; }
.bg-badge.teal { background: #00897b; }
.bg-badge.green { background: #4caf50; }
.bg-badge.amber { background: #ffb300; }
.bg-badge.brown { background: #795548; }
.bg-badge.blue { background: #2196f3; }
.bg-badge.indigo { background: #3f51b5; }
.bg-badge.turquoise { background: #00acc1; }
.bg-badge.magenta { background: #c2185b; }
.bg-badge.pink { background: #ec407a; }
.bg-badge.lime { background: #cddc39; }
.bg-badge.gray { background: #90a4ae; }
.bg-badge.navy { background: #37474f; }
.bg-badge.dark { background: #263238; }

/* Stats - Figma style */
.stats-row {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.7rem;
  flex-wrap: wrap;
}

.stat {
  flex: 1;
  min-width: 50px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  transition: all 0.2s;
}

.stat:hover {
  border-color: var(--accent);
  background: rgba(0, 229, 255, 0.05);
}

.stat .lab {
  display: block;
  font-size: 0.6rem;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat .value {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--accent2);
}

/* Card text - Figma style */
.card-text {
  margin-top: 0.7rem;
  padding: 0.7rem;
  background: var(--card2);
  border-radius: 0.5rem;
  font-size: 0.8rem;
  color: var(--fg);
  line-height: 1.6;
  font-style: italic;
  border-left: 3px solid var(--accent);
}

/* Card footer - Figma style */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1rem;
  background: var(--card2);
  border-top: 1px solid var(--border);
  margin-top: 0.6rem;
}

.card-toughness, .card-power {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--accent2);
  letter-spacing: 0.03em;
}

.card-side {
  font-size: 0.8rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  background: var(--card);
  padding: 0.2rem 0.6rem;
  border-radius: 0.3rem;
}

/* Figma-style badge pill */
.badge-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--bg);
  margin-right: 0.3rem;
  background: var(--accent);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Card number - Figma style */
.card-number {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--muted);
  background: var(--card);
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  border: 1px solid var(--border);
}

/* Footer - Figma style */
footer {
  text-align: center;
  margin-top: 3rem;
  color: var(--muted);
  font-size: 0.85rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

/* Figma-style back button */
.back-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  padding: 0.6rem 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--fg);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 100;
}

.back-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Responsive */
@media (max-width: 1000px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
  header h1 { font-size: 1.8rem; }
}

@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
  body { padding: 1rem; }
  header h1 { font-size: 1.5rem; }
  .card-art { height: 180px; }
}

/* Figma-style scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}
"""
html_parts.append(css)
html_parts.append('</style>')
html_parts.append('</head>')
html_parts.append('<body>')

# Header
html_parts.append('<header>')
html_parts.append('<h1>OmniCard 萬能卡牌 <br><span style="color:var(--accent);">60員軍團角色畫像</span></h1>')
html_parts.append('<p>MTG風格集換型卡牌 · 60員蜂群軍團 · Figma風格設計</p>')
html_parts.append('</header>')

# Filter bar
html_parts.append('<div class="filter-bar">')
html_parts.append('<button class="filter-btn">All</button>')
html_parts.append('<button class="filter-btn active">蜂王(Umbra)</button>')
html_parts.append('<button class="filter-btn">蜂后(Lumen)</button>')
html_parts.append(CLOSE_DIV)

# Grid
html_parts.append('<div class="grid">')

# Generate cards (60 agents in order)
for i, agent in enumerate(agents_data):
    num = agent['num']
    name = agent['name']
    job = agent['job']
    rname = agent['rname']
    side = '蜂王' if '蜂王' in rname else '蜂后'
    soul = agent.get('soul', '')
    
    # Clean rname for badge
    rname_clean = rname
    for suffix in [' (Sovereign)', ' (Sovereign-L)', ' (Architect-L)', ' (Oracle-L)', ' (Muse-L)', ' (Sentinel-L)', ' (Alchemist-L)', ' (Herald-L)', ' (Weaver-L)', ' (Seer-L)', ' (Shaper-L)', ' (Painter-L)', ' (Flow-L)', ' (Writer-L)', ' (Analyst-L)', ' (Networker-L)', ' (Translater-L)', ' (Drafter-L)', ' (Conductor-L)', ' (Media-L)', ' (Control-L)', ' (Erode-L)', ' (Nexus-L)', ' (Skinner-L)', ' (Scout-L)', ' (Wraith-L)', ' (Lens-L)', ' (Purifier-L)', ' (Hawk-L)', ' (Ward-L)', ' (Curator-L)', ' (Echo-L)', ' (Seal-L)', '萬能蜂后']:
        rname_clean = rname_clean.replace(suffix, '')
    
    job_text = job[0] if job else rname_clean
    skill_text = job_text[:30]
    
    # Array colors
    array_num = int(num)
    if 1 <= array_num <= 6:
        array_name = '智庫聖所'
        array_color = 'cyan'
    elif 7 <= array_num <= 12:
        array_name = '符文契約'
        array_color = 'gold'
    elif 13 <= array_num <= 18:
        array_name = '暗翼'
        array_color = 'purple'
    elif 19 <= array_num <= 24:
        array_name = '煉金熵減'
        array_color = 'red'
    elif 25 <= array_num <= 30:
        array_name = '5T驗算'
        array_color = 'gray'
    elif 31 <= array_num <= 36:
        array_name = '智庫聖所'
        array_color = 'cyan'
    elif 37 <= array_num <= 42:
        array_name = '符文契約'
        array_color = 'gold'
    elif 43 <= array_num <= 48:
        array_name = '光翼'
        array_color = 'purple'
    elif 49 <= array_num <= 54:
        array_name = '煉金熵減'
        array_color = 'red'
    else:
        array_name = '5T驗算'
        array_color = 'gray'
    
    bg_color_class = 'bg-badge-' + array_color
    
    html_parts.append('<div class="card mtm">')
    html_parts.append('  <div class="card-frame">')
    html_parts.append('    <div class="card-number">' + num + CLOSE_DIV)
    html_parts.append('    <div class="card-art">')
    html_parts.append('      <img src="images/krea_krea-3_' + num.zfill(2) + '_20261103_144140_cb6a854b.png" alt="' + name + ' 畫像">')
    html_parts.append('      <div class="card-art-overlay">')
    html_parts.append('        <div class="skill-label">特長:</div>')
    html_parts.append('        <span class="skill-badge">' + skill_text + CLOSE_SPAN)
    html_parts.append('        <div class="card-name">' + name + CLOSE_DIV)
    html_parts.append('      </div>')
    html_parts.append(CLOSE_DIV_INDENT)
    html_parts.append('    <div class="card-body">')
    html_parts.append('      <div class="card-info">')
    html_parts.append('        <div class="card-type">' + soul + ' (' + ('蜂王' if '蜂王' in rname else '蜂后') + ')</div>')
    html_parts.append('        <div class="card-subtype">' + rname_clean + CLOSE_DIV)
    html_parts.append('        <div style="margin-top:0.6rem;">')
    
    # Add skill badges inline
    if job:
        html_parts.append('<span class="skill-badge inline">' + skill_text + CLOSE_SPAN)
    
    html_parts.append(CLOSE_DIV)
    html_parts.append('        <span class="' + bg_color_class + '">' + side + ' · ' + rname_clean[:15] + CLOSE_SPAN)
    html_parts.append('        <span class="bg-badge">' + array_name + CLOSE_SPAN)
    html_parts.append('        <div class="stats-row">')
    
    # Add stats
    stats = agent.get('stats', {})
    stat_order = ['ATK', 'DEF', 'SPD', 'INT', 'SYN', 'MEM']
    for stat in stat_order:
        val = stats.get(stat, 0)
        html_parts.append('<div class="stat"><span class="lab">' + stat + '</span><span class="value">' + str(val) + '</span></div>')
    
    html_parts.append(CLOSE_DIV)
    html_parts.append('        <div class="card-text">' + soul + CLOSE_DIV)
    html_parts.append('      </div>')
    html_parts.append(CLOSE_DIV_INDENT)
    html_parts.append('    <div class="card-footer">')
    html_parts.append('      <div class="card-toughness">' + str(stats.get('DEF', 0)) + CLOSE_DIV)
    html_parts.append('      <div class="card-power">' + str(stats.get('ATK', 0)) + CLOSE_DIV)
    html_parts.append('      <div class="card-side">' + side + CLOSE_DIV)
    html_parts.append(CLOSE_DIV_INDENT)
    html_parts.append('  </div>')
    html_parts.append(CLOSE_DIV)

html_parts.append(CLOSE_DIV)  # grid
html_parts.append('<footer>Generated by OmniCard 萬能卡牌 System · 設計精美 · 符碼集換型卡牌</footer>')
html_parts.append('</body>')
html_parts.append('</html>')

# Write HTML
with open(html_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(html_parts))

print('Generated Figma-style HTML with ' + str(len(agents_data)) + ' cards')
print('File size: ' + str(os.path.getsize(html_path)) + ' bytes')
print('CSS lines: ' + str(len(css.split('\\n'))))
