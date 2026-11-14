import os, re

skills_dir = 'esggo-omni-center/skills/oa'
ext_pattern = re.compile(r'\.(md|py|json|yaml|yml|toml|sh|js|ts|tsx|jsx)$')

# Find all references to files that don't exist
for skill_dir in sorted(os.listdir(skills_dir)):
    skill_path = os.path.join(skills_dir, skill_dir, 'SKILL.md')
    if not os.path.exists(skill_path):
        continue
    with open(skill_path) as f:
        content = f.read()
    
    # Find all file references (paths starting with backtick, not URLs)
    refs = re.findall(r'`([^`]+)`', content)
    for ref in refs:
        if ref.startswith('http') or '://' in ref:
            continue
        if any(kw in ref for kw in ['http', '://', '//', '::', 'TODO', 'XXX', '<', '>']):
            continue
        if '/' in ref or '\\' in ref:
            full_path = os.path.join('/c/Project/esggo', ref)
            if not os.path.exists(full_path):
                print(f"{skill_dir}: MISSING {ref}")
