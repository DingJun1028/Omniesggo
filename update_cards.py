import json
import re

# Load agents data
with open('reports/agents_data.json') as f:
    agents = json.load(f)

# Build skill/background data
skill_data = {}
bg_data = {}
for agent in agents:
    num = agent['num']
    rname = agent['rname']
    job = agent['job']
    side = '蜂王' if '蜂王' in rname else '蜂后'
    
    # Clean rname
    rname_clean = rname
    for suffix in [' (Sovereign)', ' (Sovereign-L)', ' (Architect-L)', ' (Oracle-L)', ' (Muse-L)', ' (Sentinel-L)', ' (Alchemist-L)', ' (Herald-L)', ' (Weaver-L)', ' (Seer-L)', ' (Shaper-L)', ' (Painter-L)', ' (Flow-L)', ' (Writer-L)', ' (Analyst-L)', ' (Networker-L)', ' (Translater-L)', ' (Drafter-L)', ' (Conductor-L)', ' (Media-L)', ' (Control-L)', ' (Erode-L)', ' (Nexus-L)', ' (Skinner-L)', ' (Scout-L)', ' (Wraith-L)', ' (Lens-L)', ' (Purifier-L)', ' (Hawk-L)', ' (Ward-L)', ' (Curator-L)', ' (Echo-L)', ' (Seal-L)', '萬能蜂后']:
        rname_clean = rname_clean.replace(suffix, '')
    
    # Use job for skill badge
    job_text = job[0] if job else rname_clean
    skill_text = job_text[:25]
    
    skill_data[num] = f'<span class="skill-badge">{skill_text}</span>'
    bg_data[num] = f'<span class="bg-badge">{side} · {rname_clean[:12]}</span>'

# Load HTML
with open('reports/60員軍團角色畫像.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all card-name occurrences
matches = list(re.finditer(r'<div class="card-name">([^<]+)</div>', html))
print(f"Found {len(matches)} card-name elements")

# Replace each card-name with skill badge + name
for idx, m in enumerate(matches):
    if idx < len(agents):
        num = agents[idx]['num']
    else:
        num = str(idx + 1)
    badge = skill_data.get(num, '<span class="skill-badge">JOB</span>')
    bg = bg_data.get(num, '<span class="bg-badge">蜂王</span>')
    
    # Replace card-name with skill badge + name
    new_match = m.group(0).replace('<div class="card-name">', f'<div class="skill-label">特長:</div>\n          {badge}\n          <div class="card-name">')
    html = html[:m.start()] + new_match + html[m.end():]

# Add background badge in card-info
for idx, m in enumerate(re.finditer(r'(<div class="card-subtype">)([^<]+)(</div>)', html)):
    if idx < len(agents):
        num = agents[idx]['num']
    else:
        num = str(idx + 1)
    bg = bg_data.get(num, '<span class="bg-badge">蜂王</span>')
    new_match = m.group(0).replace(m.group(3), f'{m.group(3)}\n        {bg}')
    html = html[:m.start()] + new_match + html[m.end():]

# Write the updated HTML
with open('reports/60員軍團角色畫像.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Updated {len(agents)} cards with skill badges and background indicators")
print("Sample:")
for num in ['01', '13', '25']:
    badge = skill_data.get(num, 'N/A')
    bg = bg_data.get(num, 'N/A')
    print(f"  {num}: {badge[:50]} | {bg[:50]}")
