#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OA-Twins 無雙隊進化量測器（singularity_progress.py）

依 docs/ARCH-SPEC-oa-twins-singularity.md §4 量測模型：
  - 可量測（結構層）：10 峰、暗光各 5、60 代理、每峰 6 代理 + 明確 5T 標籤覆蓋率
  - 不可量測（運行時層）：階段二至四一律 pending，不推測（5T-透明）
  - "T" 單字元佔位符不計入覆蓋（零幻覺驗算）

用法：
  python singularity_progress.py [--matrix PATH] [--json]

回傳碼：0=結構通過  1=結構異常  2=參數錯誤
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

CANON_5T = ("Traceable", "Trackable", "Tangible", "Transparent", "Trustworthy")
EXPECTED_PEAKS = 10
EXPECTED_HIVES = {"蜂王隊": 5, "蜂后隊": 5}
EXPECTED_AGENTS = 60
AGENTS_PER_PEAK = 6

PENDING_STAGES = [
    {
        "stage": "階段二 屬性互貫",
        "range": "30-60%",
        "required_evidence": "跨隊通道 CHANNEL_OPEN 比例探針",
    },
    {
        "stage": "階段三 認知合一",
        "range": "60-90%",
        "required_evidence": "共享記憶雙向同步延遲探針",
    },
    {
        "stage": "階段四 無雙誕生",
        "range": "90-100%",
        "required_evidence": "Unified Core 啟用證據",
    },
]

DEFAULT_MATRIX = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..", "esggo-omni-center", "oa-twins", "peak6_classification.json",
)


def default_matrix_path() -> str:
    return os.path.normpath(DEFAULT_MATRIX)


def parse_5t_tags(raw) -> dict:
    """解析單一代理的 5t 欄位。

    回傳 {"explicit": set(明確 5T 標籤), "placeholder": int(佔位符數), "unknown": int(其他值數)}
    "T" 單字元 = 佔位符（不可驗證，不計覆蓋）。
    """
    explicit = set()
    placeholder = 0
    unknown = 0
    if not isinstance(raw, (list, tuple)):
        return {"explicit": explicit, "placeholder": 0, "unknown": 1 if raw is not None else 0}
    for item in raw:
        if not isinstance(item, str):
            unknown += 1
        elif item == "T":
            placeholder += 1
        elif item in CANON_5T:
            explicit.add(item)
        else:
            unknown += 1
    return {"explicit": explicit, "placeholder": placeholder, "unknown": unknown}


def check_structure(data) -> dict:
    """結構校驗：峰數、暗光分佈、代理總數、每峰代理數。"""
    peaks = data.get("peaks", [])
    peaks_ok = isinstance(peaks, list) and len(peaks) == EXPECTED_PEAKS
    hive_counts = {}
    agent_total = 0
    per_peak_ok = True
    for p in peaks if isinstance(peaks, list) else []:
        hive = p.get("belong_hive")
        hive_counts[hive] = hive_counts.get(hive, 0) + 1
        agents = p.get("agents", [])
        agent_total += len(agents) if isinstance(agents, list) else 0
        if not isinstance(agents, list) or len(agents) != AGENTS_PER_PEAK:
            per_peak_ok = False
    hive_ok = all(hive_counts.get(h, 0) == n for h, n in EXPECTED_HIVES.items())
    agents_ok = agent_total == EXPECTED_AGENTS
    ok = bool(peaks_ok and hive_ok and agents_ok and per_peak_ok)
    return {
        "ok": ok,
        "peaks": len(peaks) if isinstance(peaks, list) else 0,
        "hive_counts": hive_counts,
        "agent_total": agent_total,
        "per_peak_agents_ok": per_peak_ok,
        "checks": {
            "peaks_10": peaks_ok,
            "hive_5_plus_5": hive_ok,
            "agents_60": agents_ok,
            "per_peak_6": per_peak_ok,
        },
    }


def measure_coverage(data) -> dict:
    """量測 60 代理的明確 5T 標籤覆蓋率。"""
    peaks = data.get("peaks", [])
    explicit_total = 0
    placeholder_total = 0
    unknown_total = 0
    agent_total = 0
    per_peak = []
    for p in peaks if isinstance(peaks, list) else []:
        peak_explicit = 0
        peak_placeholder = 0
        for ag in p.get("agents", []) if isinstance(p.get("agents", []), list) else []:
            agent_total += 1
            parsed = parse_5t_tags(ag.get("5t"))
            peak_explicit += len(parsed["explicit"])
            peak_placeholder += parsed["placeholder"]
            unknown_total += parsed["unknown"]
        explicit_total += peak_explicit
        placeholder_total += peak_placeholder
        per_peak.append({
            "peak_code": p.get("peak_code"),
            "peak_name": p.get("peak_name"),
            "explicit_tags": peak_explicit,
            "placeholders": peak_placeholder,
        })
    max_possible = agent_total * len(CANON_5T)
    coverage = (explicit_total / max_possible) if max_possible else 0.0
    return {
        "agents": agent_total,
        "explicit_tags": explicit_total,
        "placeholders": placeholder_total,
        "unknown": unknown_total,
        "max_possible": max_possible,
        "coverage": round(coverage, 4),
        "per_peak": per_peak,
    }


def derive_stage(structure: dict, coverage: dict) -> dict:
    """階段判定：僅階段一可量測；二至四 pending。"""
    structure_score = 100.0 if structure.get("ok") else 0.0
    coverage_score = coverage.get("coverage", 0.0) * 100.0
    stage1_progress = round(structure_score * 0.30 + coverage_score * 0.70, 1)
    if stage1_progress >= 100.0:
        stage1_state = "階段一可量測層滿分；二至四階段仍需運行時探針"
    elif stage1_progress >= 30.0:
        stage1_state = "階段一可量測門檻已達（≥30%）；二至四階段需運行時探針，不得宣稱進入"
    else:
        stage1_state = "階段一 進行中"
    return {
        "stage1_progress": stage1_progress,
        "stage1_state": stage1_state,
        "stage1_breakdown": {
            "structure_score": structure_score,
            "structure_weight": 0.30,
            "coverage_score": round(coverage_score, 1),
            "coverage_weight": 0.70,
        },
        "stages_2_to_4": PENDING_STAGES,
    }


def measure_structure_and_stage(data: dict) -> dict:
    """對記憶體內矩陣 dict 執行結構校驗 + 覆蓋率量測 + 階段判定（供測試與程式化呼叫）。"""
    structure = check_structure(data)
    coverage = measure_coverage(data)
    stage = derive_stage(structure, coverage)
    return {
        "structure": structure,
        "coverage_5t": coverage,
        "stage": stage,
        "ok": structure["ok"],
    }


def measure(matrix_path: str) -> dict:
    """主量測：讀矩陣、校驗結構、量覆蓋率、判階段。"""
    with open(matrix_path, "rb") as f:
        raw = f.read()
    data = json.loads(raw.decode("utf-8"))
    sha16 = hashlib.sha256(raw).hexdigest()[:16]
    structure = check_structure(data)
    coverage = measure_coverage(data)
    stage = derive_stage(structure, coverage)
    return {
        "tool": "oa-twins-singularity/singularity_progress",
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "matrix": os.path.abspath(matrix_path),
        "matrix_sha256_16": sha16,
        "structure": structure,
        "coverage_5t": coverage,
        "stage": stage,
        "ok": structure["ok"],
    }


def render_human(report: dict) -> str:
    lines = []
    lines.append("=== OA-Twins 無雙隊進化量測 ===")
    lines.append(f"  時間: {report['timestamp']}")
    lines.append(f"  矩陣: {report['matrix']}")
    lines.append(f"  矩陣 sha256(16): {report['matrix_sha256_16']}")
    s = report["structure"]
    flag = "OK" if s["ok"] else "!!"
    lines.append(f"  [{flag}] 結構: {s['peaks']} 峰 {s['agent_total']} 代理 "
                 f"暗光={s['hive_counts']} 每峰6={s['per_peak_agents_ok']}")
    c = report["coverage_5t"]
    lines.append(f"  5T 覆蓋率: {c['coverage']*100:.1f}% "
                 f"(明確 {c['explicit_tags']}/{c['max_possible']}, "
                 f"佔位符 {c['placeholders']}, 未知 {c['unknown']})")
    st = report["stage"]
    lines.append(f"  階段一進度: {st['stage1_progress']}% — {st['stage1_state']}")
    for p in st["stages_2_to_4"]:
        lines.append(f"  [⏸ pending] {p['stage']} ({p['range']}) — 需: {p['required_evidence']}")
    lines.append(f"  結果: {'通過' if report['ok'] else '結構異常'} (exit {0 if report['ok'] else 1})")
    return "\n".join(lines)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="OA-Twins 無雙隊進化量測器")
    parser.add_argument("--matrix", default=default_matrix_path(), help="peak6_classification.json 路徑")
    parser.add_argument("--json", action="store_true", help="JSON 輸出")
    args = parser.parse_args(argv)

    if not os.path.isfile(args.matrix):
        print(f"!! 找不到矩陣檔: {args.matrix}", file=sys.stderr)
        return 2
    try:
        report = measure(args.matrix)
    except (json.JSONDecodeError, OSError) as e:
        print(f"!! 矩陣讀取/解析失敗: {e}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(render_human(report))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
