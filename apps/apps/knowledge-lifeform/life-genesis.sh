#!/usr/bin/env bash
# life-genesis.sh — 永恆生命力核心引擎 (真實版, 無假 URL)
# 掃描 esggo git + vault → 觸發 evolution-engine → 寫 life-force-energy.json
set -euo pipefail
ROOT="C:/Project/esggo"
ENGINE="$ROOT/apps/evolution-engine"
VAULT="$ROOT/vault"
SYS="$VAULT/.system"
mkdir -p "$SYS"

echo "[life-genesis] 啟動生命力核心..."

# 1. 觸發自我進化引擎
cd "$ENGINE" && node evolve.mjs >/dev/null 2>&1 && echo "  ✓ 進化引擎閉環完成" || echo "  ✗ 進化引擎失敗"

# 2. 計算生命力指標 (git 健康 + vault 規模 + 進化經驗數)
EXP_COUNT=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$ENGINE/experiences.json','utf8')).length)}catch{console.log(0)}" 2>/dev/null || echo 0)
VAULT_NOTES=$(find "$VAULT" -name "*.md" 2>/dev/null | wc -l)
GIT_COMMITS=$(git -C "$ROOT" rev-list --count HEAD 2>/dev/null || echo 0)
RECENT_FIXES=$(git -C "$ROOT" log --oneline -30 2>/dev/null | grep -cE "fix|feat" || echo 0)

# 生命力能量 = 經驗累積 + vault 規模 + 近期產出 (歸一化 0-100)
ENERGY=$(node -e "const e=$EXP_COUNT,v=$VAULT_NOTES,f=$RECENT_FIXES;const raw=Math.min(100, e*2 + Math.min(v/50,50) + Math.min(f*2,30));console.log(raw.toFixed(1))" 2>/dev/null || echo 0)

cat > "$SYS/life-force-energy.json" <<JSON
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "energy": $ENERGY,
  "metrics": {
    "experiences": $EXP_COUNT,
    "vault_notes": $VAULT_NOTES,
    "git_commits": $GIT_COMMITS,
    "recent_fixes": $RECENT_FIXES
  },
  "status": "$([ "$(echo "$ENERGY > 50" | bc -l 2>/dev/null || echo 0)" = "1" ] && echo ALIVE || echo DORMANT)"
}
JSON
echo "  ✓ 生命力能量: $ENERGY / 100 ($([ "$(echo "$ENERGY > 50" | bc -l 2>/dev/null || echo 0)" = "1" ] && echo ALIVE || echo DORMANT))"
echo "[life-genesis] 完成 → $SYS/life-force-energy.json"
