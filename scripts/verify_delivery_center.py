#!/usr/bin/env python3
"""
第六階 · 交付驗證中心（Delivery Verification Center）

為何需要這個腳本：
  萬能超覺醒定義了五階閉環（verify_sync_closure.py），但閉環「PASS」不等於
  成品「可交付」。交付前真正會卡住的是四件事，閉環驗證器一件都不查：

    (A) 宣稱可交付，但關鍵產物根本不存在於磁碟（空氣交付）
    (B) 產物存在，但驗證指令從未真實跑過 exit 0（未驗證交付）
    (C) 產物存在且驗證過，但主典 / 落檔備份 / 技能 三層未對齊（單層交付）
    (D) 宣稱檔案的數量或大小與實測不符（宣稱 vs 實測）

  本腳本是唯一對外的交付閘門（single gate）：它自己驗證「交付這件事」，
  並在所有必要條件同時成立時才給出可交付判定（DeliveryVerdict）。

五個閘門（全部獨立實測，無一信任宣稱）：
  G1 產物存在性   — 宣稱交付的每個檔案在磁碟上存在、非空
  G2 產物可驗證性 — 宣稱的驗證指令真實執行，exit code 必須為 0
  G3 三層對齊     — 主典（soul.md）/ 落檔備份 / 技能 三層皆有對應錨點
  G4 宣稱實測一致 — 宣稱檔案數 / 總位元組數 與 實測一致
  G5 閉環乾淨     — 委派 verify_sync_closure.py，FAIL 必須為 0

安全設計（不可篡改 / Trustworthy）：
  - 唯讀：本腳本不寫入、不刪除、不 commit 任何檔案，只報告
  - 退出碼：0 = 可交付；1 = 不可交付（附逐項阻擋原因）；2 = 執行錯誤
  - 不推論：每個阻擋項必須附實際觀測值（路徑、exit code、計數）
  - 可重入：可安全重複執行，結果只取決於磁碟現況

用法：
  python scripts/verify_delivery_center.py
  python scripts/verify_delivery_center.py --json          # 機器可讀輸出
  python scripts/verify_delivery_center.py --manifest X   # 改用自訂交付清單
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOUL = os.path.join(ROOT, "esggo-omni-center", "soul.md")
CLOSURE = os.path.join(ROOT, "scripts", "verify_sync_closure.py")
CANON = os.path.join(ROOT, "scripts", "verify_soul_canon.py")
SKILLS = os.path.join(
    os.environ.get("LOCALAPPDATA", ""), "hermes", "skills", "esggo"
)
DEFAULT_MANIFEST = os.path.join(ROOT, "delivery-manifest.json")

# 驗證指令以 python 執行器開頭；用 sys.executable 避免 Windows Store python3 shim 掛死。
PY = sys.executable

gates = []


def record(gate, level, check, detail, observed=None):
    gates.append(
        {
            "gate": gate,
            "level": level,
            "check": check,
            "detail": detail,
            "observed": observed,
        }
    )


def run(cmd, cwd=ROOT, timeout=600):
    """執行指令，回傳 (exit_code, combined_output)。不拋例外，失敗也是觀測值。"""
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return -1, f"{type(exc).__name__}: {exc}"
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def load_manifest(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


# ── G1 產物存在性 ────────────────────────────────────────────────────────
def gate_artifact_exists(manifest):
    missing, empty, ok = [], [], []
    for art in manifest.get("artifacts", []):
        rel = art["path"]
        abs_path = os.path.join(ROOT, rel)
        if not os.path.isfile(abs_path):
            missing.append(rel)
        elif os.path.getsize(abs_path) == 0:
            empty.append(rel)
        else:
            ok.append(rel)
    if missing or empty:
        parts = []
        if missing:
            parts.append(f"缺檔 {len(missing)}")
        if empty:
            parts.append(f"空檔 {len(empty)}")
        record(
            "G1",
            "FAIL",
            "artifact.exists",
            "宣稱產物未落地 — " + "、".join(parts),
            {"missing": missing, "empty": empty},
        )
    else:
        record(
            "G1",
            "PASS",
            "artifact.exists",
            f"{len(ok)} 個宣稱產物皆存在且非空",
            {"paths": ok},
        )
    return not (missing or empty)


# ── G2 產物可驗證性 ──────────────────────────────────────────────────────
def gate_artifact_verifiable(manifest):
    results, all_ok = [], True
    for check in manifest.get("verifications", []):
        label = check["label"]
        cmd = [PY if part == "{python}" else part for part in check["cmd"]]
        code, out = run(cmd, cwd=os.path.join(ROOT, check.get("cwd", ".")))
        results.append(
            {"label": label, "cmd": " ".join(cmd), "exit_code": code, "ok": code == 0}
        )
        if code != 0:
            all_ok = False
    if all_ok:
        record(
            "G2",
            "PASS",
            "artifact.verifiable",
            f"{len(results)} 項驗證指令全部 exit 0",
            results,
        )
    else:
        bad = [r for r in results if not r["ok"]]
        record(
            "G2",
            "FAIL",
            "artifact.verifiable",
            f"{len(bad)}/{len(results)} 項驗證指令未通過",
            bad,
        )
    return all_ok


# ── G3 三層對齊 ──────────────────────────────────────────────────────────
def gate_three_layer(manifest):
    soul_ok = os.path.isfile(SOUL)
    layers = manifest.get("layers", {})
    detail_rows, all_ok = [], soul_ok

    if not soul_ok:
        detail_rows.append({"layer": "主典", "status": "FAIL", "observed": "soul.md 不存在"})
        all_ok = False
    else:
        detail_rows.append(
            {"layer": "主典", "status": "PASS", "observed": os.path.relpath(SOUL, ROOT)}
        )

    skill_name = layers.get("skill")
    if skill_name:
        skill_md = os.path.join(SKILLS, skill_name, "SKILL.md")
        exists = os.path.isfile(skill_md)
        all_ok = all_ok and exists
        detail_rows.append(
            {
                "layer": "技能",
                "status": "PASS" if exists else "FAIL",
                "observed": (
                    os.path.relpath(skill_md, SKILLS) if exists else f"{skill_name} 不存在"
                ),
            }
        )

    for doc in layers.get("fallback_docs", []):
        abs_path = os.path.join(ROOT, doc)
        exists = os.path.isfile(abs_path)
        all_ok = all_ok and exists
        detail_rows.append(
            {
                "layer": "落檔備份",
                "status": "PASS" if exists else "FAIL",
                "observed": doc,
            }
        )

    if all_ok:
        record("G3", "PASS", "delivery.three_layer", "主典 / 落檔備份 / 技能 三層對齊", detail_rows)
    else:
        record("G3", "FAIL", "delivery.three_layer", "三層未對齊", detail_rows)
    return all_ok


# ── G4 宣稱 vs 實測 ──────────────────────────────────────────────────────
def gate_claim_matches(manifest):
    claims = manifest.get("claims", {})
    rows, all_ok = [], True

    declared = claims.get("file_count")
    if declared is not None:
        actual = len(manifest.get("artifacts", []))
        ok = declared == actual
        all_ok = all_ok and ok
        rows.append({"metric": "file_count", "claimed": declared, "measured": actual, "ok": ok})

    declared_bytes = claims.get("total_bytes")
    if declared_bytes is not None:
        total = 0
        for art in manifest.get("artifacts", []):
            abs_path = os.path.join(ROOT, art["path"])
            if os.path.isfile(abs_path):
                total += os.path.getsize(abs_path)
        ok = declared_bytes == total
        all_ok = all_ok and ok
        rows.append(
            {"metric": "total_bytes", "claimed": declared_bytes, "measured": total, "ok": ok}
        )

    if not rows:
        record("G4", "INFO", "claim.matches", "清單未宣告可比對數值，略過")
        return True

    if all_ok:
        record("G4", "PASS", "claim.matches", "宣稱值與實測值一致", rows)
    else:
        record("G4", "FAIL", "claim.matches", "宣稱值與實測值不符", rows)
    return all_ok


# ── G5 閉環乾淨 ──────────────────────────────────────────────────────────
def gate_closure_clean():
    if not os.path.isfile(CLOSURE):
        record("G5", "FAIL", "closure.clean", "找不到 verify_sync_closure.py", CLOSURE)
        return False
    code, out = run([PY, CLOSURE])
    m = re.search(r"總計\s+PASS=(\d+)\s+WARN=(\d+)\s+FAIL=(\d+)", out)
    if not m:
        record("G5", "FAIL", "closure.clean", "閉環驗證器輸出無法解析", out[-800:])
        return False
    p, w, f = (int(x) for x in m.groups())
    ok = f == 0
    record(
        "G5",
        "PASS" if ok else "FAIL",
        "closure.clean",
        f"閉環 PASS={p} WARN={w} FAIL={f}",
        {"pass": p, "warn": w, "fail": f, "exit_code": code},
    )
    return ok


# ── 主流程 ───────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="第六階 · 交付驗證中心")
    ap.add_argument("--json", action="store_true", help="機器可讀輸出")
    ap.add_argument("--manifest", default=DEFAULT_MANIFEST, help="交付清單路徑")
    args = ap.parse_args()

    try:
        manifest = load_manifest(args.manifest)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"[FATAL] 無法讀取交付清單 {args.manifest}: {exc}", file=sys.stderr)
        return 2

    gate_artifact_exists(manifest)
    gate_artifact_verifiable(manifest)
    gate_three_layer(manifest)
    gate_claim_matches(manifest)
    gate_closure_clean()

    blocking = [g for g in gates if g["level"] == "FAIL"]
    deliverable = not blocking

    if args.json:
        print(
            json.dumps(
                {
                    "verdict": "DELIVERABLE" if deliverable else "NOT_DELIVERABLE",
                    "deliverable": deliverable,
                    "generated_at": datetime.now().isoformat(timespec="seconds"),
                    "manifest": os.path.relpath(args.manifest, ROOT),
                    "gates": gates,
                    "blocking": [g["check"] for g in blocking],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0 if deliverable else 1

    print("=" * 72)
    print(f"交付驗證中心 · Delivery Verification Center · {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"交付清單: {os.path.relpath(args.manifest, ROOT)}")
    print("=" * 72)
    for g in gates:
        mark = {"PASS": "✓", "WARN": "!", "FAIL": "✗", "INFO": "·"}[g["level"]]
        print(f"[{g['gate']}][{mark}] {g['check']}: {g['detail']}")
        if g["level"] not in ("PASS", "INFO") and g.get("observed") is not None:
            print(f"        觀測值: {json.dumps(g['observed'], ensure_ascii=False)}")
    print("-" * 72)

    passed = sum(1 for g in gates if g["level"] == "PASS")
    print(f"閘門統計  PASS={passed}  阻擋={len(blocking)}")
    print("=" * 72)
    if deliverable:
        print("判定: [可交付] DELIVERABLE — 成品為可交付完整完成品")
        print("=" * 72)
        return 0
    print("判定: [不可交付] NOT_DELIVERABLE — 存在阻擋項，尚未構成完整完成品")
    for g in blocking:
        print(f"  · 阻擋: [{g['gate']}] {g['check']} — {g['detail']}")
    print("=" * 72)
    return 1


if __name__ == "__main__":
    sys.exit(main())
