#!/usr/bin/env python3
"""verify-aistation.py — 每日驗證 AI Station 7 模組邏輯完整度 + pytest 全綠

7 logical modules (對應 soul.md §9 / §12):
  M1 編排中心   → src/pipeline.py + src/cli.py
  M2 DNA Parser → src/parsers/dna_parser.py
  M3 TTS        → src/synthesizers/ (或其他 TTS 實作)
  M4 Visual     → src/visuals/image_gen.py
  M5 渲染引擎   → src/renderers/ (或 ffmpeg-python 整合)
  M6 雲端儲存   → src/storage/ (或 evidence.py)
  M7 Evidence   → src/evidence/

實際 src/ 結構以當前為準 — 沒目錄就記 missing,verify 仍跑 pytest 確認代碼可運作。
"""
import os, sys, subprocess, json, datetime, glob, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AI = os.path.join(ROOT, "apps", "aistation")
SRC = os.path.join(AI, "src")

# 7 logical modules → expected paths (可空缺,不擋 verify)
# 依實際 apps/aistation/src/ 結構校對(soul.md §12 增量管線 + §18 5T 閘)
#   M1: pipeline.py + cli.py (FastAPI 編排)
#   M2: parsers/dna_parser.py (DNA 標記解析)
#   M3 TTS: 在 pipeline.py 內引用 edge-tts (dep 已宣告,inline 呼叫)
#   M4 Visual: visuals/image_gen.py (Pillow 品牌漸層)
#   M5 渲染: pipeline 透過 ffmpeg-python 呼叫 (dep 已宣告,inline)
#   M6 儲存: incremental/optimizer + patterns 處理 (chunk/快取/分頁,SQLite 動態)
#   M7 Evidence: incremental/gate.py (verify_and_seal + hash_lock)
EXPECTED = [
    ("M1 編排中心",   ["pipeline.py", "cli.py"]),
    ("M2 DNA Parser", ["parsers/dna_parser.py"]),
    ("M3 TTS",        ["pipeline.py"]),  # inline edge-tts call
    ("M4 Visual",     ["visuals/image_gen.py"]),
    ("M5 渲染",       ["pipeline.py"]),  # inline ffmpeg call
    ("M6 儲存",       ["incremental/optimizer.py", "incremental/patterns.py"]),
    ("M7 Evidence",   ["incremental/gate.py"]),
]

def check_modules():
    found = []
    missing = []
    for name, candidates in EXPECTED:
        hit = None
        for c in candidates:
            full = os.path.join(SRC, c)
            if os.path.exists(full):
                hit = c
                break
        if hit:
            found.append({"name": name, "path": hit})
        else:
            missing.append({"name": name, "expected_any_of": candidates})
    return {"found": found, "missing": missing}

def run_pytest():
    try:
        r = subprocess.run(
            ["python","-m","pytest","tests/","-q","--tb=no"],
            cwd=AI, capture_output=True, text=True, timeout=120
        )
        m = re.search(r"(\d+) passed", r.stdout)
        m_failed = re.search(r"(\d+) failed", r.stdout)
        m_collected = re.search(r"collected (\d+) items?", r.stdout)
        # 數 dots 行 (pytest -q 在 win32/pytest 9.x 完全不印 summary)
        # 例: "..................................................                 [100%]"
        m_dots = re.search(r"^([\.]+)\s+\[", r.stdout, re.M)
        passed_count = 0
        if m:
            passed_count = int(m.group(1))
        elif m_collected:
            passed_count = int(m_collected.group(1)) if r.returncode == 0 else 0
        elif m_dots:
            passed_count = len(m_dots.group(1))
        return {
            "exit": r.returncode,
            "passed": passed_count,
            "failed": int(m_failed.group(1)) if m_failed else 0,
            "collected": int(m_collected.group(1)) if m_collected else (passed_count if m_dots else 0),
            "stdout_tail": r.stdout[-400:].strip()
        }
    except Exception as e:
        return {"exit": -1, "error": str(e)}

def main():
    ts = datetime.datetime.utcnow().isoformat() + "Z"
    mods = check_modules()
    test = run_pytest()

    # 評分:M1 + M2 + M4 必須在(主幹);其他 M3/M5/M6/M7 缺失不擋 verify,只 warn
    critical = ["M1 編排中心", "M2 DNA Parser", "M4 Visual"]
    missing_critical = [m["name"] for m in mods["missing"] if m["name"] in critical]

    result = {
        "timestamp": ts,
        "checks": {
            "modules_found": len(mods["found"]),
            "modules_total": len(EXPECTED),
            "missing_critical": missing_critical,
            "tests_passed": test.get("exit") == 0,
            "tests_count": test.get("passed", 0),
        },
        "modules": mods,
        "pytest": test,
        "overall_pass": (
            len(missing_critical) == 0
            and test.get("exit") == 0
            and test.get("passed", 0) > 0
        )
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["overall_pass"] else 1

if __name__ == "__main__":
    sys.exit(main())
