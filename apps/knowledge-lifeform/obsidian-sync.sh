#!/usr/bin/env bash
# obsidian-sync.sh — 把 evolution-engine 經驗鏡像成 vault 筆記 (5T frontmatter)
set -euo pipefail
ENGINE="C:/Project/esggo/apps/evolution-engine"
VAULT="C:/Project/esggo/vault/Agents/context"
mkdir -p "$VAULT"
node -e "
const fs=require('fs');
const exps=JSON.parse(fs.readFileSync('$ENGINE/experiences.json','utf8'));
for(const e of exps.slice(-5)){
  const fn='\$VAULT/EXP-${e.theme}.md';
  const md='---\ntype: experience\ntag: '+e.tag+'\nsource: '+e.source+'\ncreated: '+e.created_at+'\n---\n\n# '+e.theme+'\n\n'+e.lesson+'\n';
  fs.writeFileSync(fn,md);
}
console.log('✓ 鏡像 '+Math.min(5,exps.length)+' 條經驗到 vault');
"
