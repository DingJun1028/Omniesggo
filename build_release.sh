#!/usr/bin/env bash
# Agent Mesh 單一 CLI 執行檔打包腳本（可重複建置）
# 產出：C:/Project/esggo/_pyi/dist/esggo-agent-mesh.exe
# 用法：bash build_release.sh
set -euo pipefail

PY="${PY:-C:/Users/dingj/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe}"
SRC="${SRC:-C:/Project/esggo/ollama_model_tool.py}"
OUT_DIR="C:/Project/esggo/_pyi"

echo "▸ 建置用直譯器：$PY"
"$PY" --version
echo "▸ 進入點　　　：$SRC"

# 排除清單：僅需 stdlib + aiohttp。排除以下項目可省下 ~60% 打包體積，
# 皆為本工具未引用者（tkinter 約 5MB、IPython 測試套件、pip/setuptools 等）。
EXCLUDES=(
  tkinter PIL numpy pandas matplotlib scipy pytest
  setuptools pip pydoc doctest test unittest
  lib2to3 distutils IPython sqlite3.tests
)

EXCL_ARGS=()
for m in "${EXCLUDES[@]}"; do EXCL_ARGS+=(--exclude-module "$m"); done

echo "▸ 排除模組　　：${EXCLUDES[*]}"
echo "▸ 執行 PyInstaller（onefile）…"

"$PY" -m PyInstaller \
  --onefile --noconfirm --clean \
  --name esggo-agent-mesh \
  --distpath "$OUT_DIR/dist" \
  --workpath "$OUT_DIR/work" \
  --specpath "$OUT_DIR" \
  "${EXCL_ARGS[@]}" \
  "$SRC"

EXE="$OUT_DIR/dist/esggo-agent-mesh.exe"
echo ""
echo "▸ 產出完成："
ls -lh "$EXE" | awk '{print "  " $9 "  " $5}'
echo ""
echo "▸ 執行驗收：bash verify_release.sh"
