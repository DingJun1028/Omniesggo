#!/bin/sh
TARGET="/app/.next/server/chunks/_1ynmsv8._.js"
cp "$TARGET.bak" "$TARGET"

python3 << 'PYEOF'
with open('/app/.next/server/chunks/_1ynmsv8._.js', 'r') as f:
    content = f.read()

# Strategy: Replace the ioredis loader to read the actual source file and eval it
# This bypasses any module resolution
old_loader = 'async function d(){try{let e=await t.A(59679);return e.default||e}catch{return null}}'
new_loader = '''async function d(){try{
const fs=require("fs");
const path=require("path");
const modPath=path.join("/app/node_modules/ioredis/built/index.js");
const code=fs.readFileSync(modPath,"utf8");
const m={exports:{}};
const fn=new Function("exports","require","module","__filename","__dirname",code);
fn(m.exports,require,m,modPath,path.dirname(modPath));
return m.exports.default||m.exports;
}catch(e){console.warn("[Redis] Native load failed:",e.message);return null}}'''
content = content.replace(old_loader, new_loader)

old_ctor = ');let l=new t(s)'
new_ctor = ');let l=r.url?new t(r.url,s):new t(s)'
content = content.replace(old_ctor, new_ctor)

with open('/app/.next/server/chunks/_1ynmsv8._.js', 'w') as f:
    f.write(content)
print('Done')
PYEOF

grep -o 'fs.readFileSync' "$TARGET" | head -1
grep -o 'r.url?new t(r.url,s)' "$TARGET" | head -1
