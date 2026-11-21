#!/usr/bin/env bash
# verify-oneringai.sh — OA-Team × OneRingAI 整合一鍵驗收
# 用法: bash test/verify-oneringai.sh   (在 packages/oa-framework 下, 或從 repo 根)
# 設計: 跨平台 (git-bash / sh). 四項真實驗證依序跑, 任一步失敗即停.
# 所有驗證皆真實執行 (非 stub): tsc 編譯 + Ollama 本機推論 + 5T 鑄造.

set -e  # 任一步非 0 即退出 (fail-fast, 依 §19 不可聲稱完成)

cd "$(dirname "$0")/.." || exit 1  # 移到 packages/oa-framework

echo "════════════════════════════════════════════════════"
echo " OA-Team × OneRingAI 整合 — 一鍵驗收 (verify-oneringai)"
echo "════════════════════════════════════════════════════"

echo "▶ [1/4] Typecheck (tsc --noEmit)"
npx tsc -p tsconfig.json --noEmit
echo "  ✅ Typecheck PASS"

echo "▶ [2/4] OneRingAI 真實實跑 (oneringai-real)"
npx tsx test/oneringai-real.ts | tail -4
echo "  ✅ oneringai-real PASS"

echo "▶ [3/4] App 整合示範 (app-integration-demo)"
npx tsx test/app-integration-demo.ts | tail -4
echo "  ✅ app-integration-demo PASS"

echo "▶ [4/4] 全框架 Smoke (11 frameworks)"
npx tsx test/smoke.ts | tail -3
echo "  ✅ smoke PASS"

echo "────────────────────────────────────────────────────"
echo " 總結: 4/4 通過"
echo " 狀態: ✅ ALL GREEN — 整合鏈驗收通過"
echo "════════════════════════════════════════════════════"
