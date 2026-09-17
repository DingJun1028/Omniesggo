#!/usr/bin/env python3
"""
verify_crew.py — OA-Team 30 蜂群結構驗證（相容扁平 id 清單格式）
對齊 soul.md §二 30 矩陣 / §三 協作流

支援格式：
  A) dict 陣列：agents = [{"id": "sage_01", "role": "...", "squad": "strategy"}, ...]
  B) flat 字串清單：agents = ["sage_01", "sage_02", ...]（squad 由 id 前綴隱式編碼）

用法：
  python verify_crew.py [crew.jsonc 路徑] [--strict]
"""
import json
import os
import re
import sys
from pathlib import Path

# id 前綴 → 陣列名稱對映（扁平格式解碼用）
PREFIX_MAP = {
    "sage": "strategy",
    "rune": "tech",
    "wing": "creative",
    "forge": "marketing",
    "verify": "guard",
}

SQUAD_NAMES = ["strategy", "tech", "creative", "marketing", "guard"]
EXPECTED_AGENTS = 30
EXPECTED_TASKS = 5


def strip_jsonc(text: str) -> str:
    """移除 JSON 註解（// 與 # 單行）"""
    lines = []
    for line in text.splitlines():
        # 簡易處理：移除 // 後的內容（不處理字串內的 //）
        cleaned = re.sub(r"//.*$", "", line)
        cleaned = re.sub(r"#.*$", "", cleaned)
        lines.append(cleaned)
    return "\n".join(lines)


def load_crew(path: str) -> dict:
    raw = Path(path).read_text(encoding="utf-8")
    return json.loads(strip_jsonc(raw))


def parse_agents(agents_raw) -> list[dict]:
    """統一輸出格式：[{"id": ..., "squad": ...}, ...]"""
    result = []
    if isinstance(agents_raw, list) and all(isinstance(a, str) for a in agents_raw):
        # 格式 B：扁平字串清單
        for aid in agents_raw:
            prefix = aid.split("_")[0] if "_" in aid else ""
            squad = PREFIX_MAP.get(prefix, "unknown")
            result.append({"id": aid, "squad": squad})
    elif isinstance(agents_raw, list) and all(isinstance(a, dict) for a in agents_raw):
        # 格式 A：dict 陣列
        for a in agents_raw:
            aid = a.get("id", a.get("name", "?"))
            squad = a.get("squad", a.get("role", "?"))
            result.append({"id": aid, "squad": squad})
    return result


def verify(path: str) -> bool:
    crew = load_crew(path)
    agents = parse_agents(crew.get("agents", []))
    tasks = crew.get("tasks", [])
    process = crew.get("process", "sequential")

    ok = True
    errors = []

    # 1. agent 數量
    if len(agents) != EXPECTED_AGENTS:
        errors.append(f"agent 數量錯誤：{len(agents)} ≠ {EXPECTED_AGENTS}")
        ok = False

    # 2. 5 陣列各 6 員
    squad_counts = {}
    for a in agents:
        squad_counts[a["squad"]] = squad_counts.get(a["squad"], 0) + 1
    for sq in SQUAD_NAMES:
        cnt = squad_counts.get(sq, 0)
        if cnt != 6:
            errors.append(f"陣列 {sq} 人數錯誤：{cnt} ≠ 6")
            ok = False

    # 3. task 數量
    if len(tasks) != EXPECTED_TASKS:
        errors.append(f"task 數量錯誤：{len(tasks)} ≠ {EXPECTED_TASKS}")
        ok = False

    # 4. process
    if process != "sequential":
        errors.append(f"process 非 sequential：{process}")
        ok = False

    # 輸出
    print(f"[verify_crew] 檔案: {path}")
    print(f"  agents: {len(agents)} / {EXPECTED_AGENTS}")
    print(f"  tasks:  {len(tasks)} / {EXPECTED_TASKS}")
    print(f"  process: {process}")
    print(f"  squad 分佈: {squad_counts}")
    if errors:
        print(f"  錯誤:")
        for e in errors:
            print(f"    - {e}")
    print(f"  結果: {'PASS' if ok else 'FAIL'}")
    return ok


def main():
    import argparse
    parser = argparse.ArgumentParser(description="OA-Team 30 蜂群結構驗證")
    parser.add_argument("path", nargs="?", default="oa-team-crewai/crew.jsonc",
                        help="crew.jsonc 路徑")
    parser.add_argument("--strict", action="store_true", help="嚴格模式：錯誤時 exit 1")
    args = parser.parse_args()

    if not os.path.exists(args.path):
        print(f"[verify_crew] 檔案不存在: {args.path}")
        sys.exit(1)

    result = verify(args.path)
    sys.exit(0 if result else 1 if args.strict else 0)


if __name__ == "__main__":
    main()
