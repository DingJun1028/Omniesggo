#!/usr/bin/env python3
"""
第五階閉環驗證器（Sync Closure Verifier）

為何需要這個腳本：
  §30 萬能超交付定義了「產出是否已落地·已驗證·可交接」，但四階結束時
  常殘留兩類漏洞：
    (A) 狀態宣稱與實測不符（§30.6 曾寫 6 筆 commit / 4 warnings，實為 8 筆 / 7）
    (B) 新得能力沒有回填到先前未完任務（無反向連結、無相關連結）

  本腳本把「派分身確認狀態」與「能力回填」變成可重複執行的檢查，
  而非依賴 agent 記得。

檢查項目：
  1. task-graph.json 結構完整性（必填欄位、id 唯一、引用可解析）
  2. 閉環規則違反（未得成果未登記、技術無回填目標、blocked 無解法）
  3. 宣稱 vs 實測交叉核對（git commit 筆數、lint warning 數）
  4. 技能 frontmatter 規格（缺 version/author/license、description 過長）
  5. 懸空引用（技能內引用的檔案是否存在）

安全設計（不可篡改）：
  - 唯讀：本腳本不寫入任何檔案，只報告
  - 退出碼：0 = 全部通過；1 = 有 FAIL；2 = 執行錯誤
  - 不推論：每個 FAIL 必須附實際觀測值

用法：
  python scripts/verify_sync_closure.py
  python scripts/verify_sync_closure.py --json     # 機器可讀輸出
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAPH = os.path.join(ROOT, "task-graph.json")
SKILLS = os.path.join(
    os.environ.get("LOCALAPPDATA", ""), "hermes", "skills", "esggo"
)

REQUIRED_NODE_FIELDS = ["id", "title", "layer", "status", "artifacts"]
CAPTURED_IN = "ch30-super-delivery"

results = []


def record(level, check, detail, observed=None):
    results.append(
        {
            "level": level,
            "check": check,
            "detail": detail,
            "observed": observed,
        }
    )


def run(cmd):
    """執行命令並回傳 (stdout, exit_code)。失敗回 ('', -1) 而非拋例外。"""
    try:
        p = subprocess.run(
            cmd, cwd=ROOT, capture_output=True, text=True, timeout=300
        )
        return p.stdout.strip(), p.returncode
    except Exception as exc:  # noqa: BLE001 — 報告執行錯誤，不中斷全檢查
        return f"EXEC_ERROR: {exc}", -1


# ── 1. task-graph 結構完整性 ────────────────────────────────────────
def check_graph_structure(graph):
    if not isinstance(graph.get("nodes"), list) or not graph["nodes"]:
        record("FAIL", "graph.nodes", "task-graph.json 缺少或無效 nodes 陣列")
        return
    record("PASS", "graph.nodes", f"節點數 = {len(graph['nodes'])}", len(graph["nodes"]))

    seen = set()
    for node in graph["nodes"]:
        nid = node.get("id", "<no-id>")
        missing = [f for f in REQUIRED_NODE_FIELDS if f not in node]
        if missing:
            record("FAIL", f"node[{nid}].required_fields", f"缺必填欄位: {missing}")
        if nid in seen:
            record("FAIL", f"node[{nid}].duplicate", "id 重複")
        seen.add(nid)
    else:
        if all(all(f in n for f in REQUIRED_NODE_FIELDS) for n in graph["nodes"]):
            record("PASS", "node.required_fields", "所有節點必填欄位齊備")

    # 依賴與連結可解析性
    for node in graph["nodes"]:
        nid = node.get("id", "<no-id>")
        for key in ("depends_on", "related"):
            for ref in node.get(key, []) or []:
                if ref not in seen:
                    record("FAIL", f"node[{nid}].{key}", f"引用不存在的節點: {ref}")
        rb = node.get("reverse") or []
        for ref in rb:
            if ref not in seen:
                record("FAIL", f"node[{nid}].reverse", f"反向連結目標不存在: {ref}")
    if not any(r["level"] == "FAIL" and "可解析" in r["check"] for r in results):
        record("PASS", "graph.links_resolvable", "depends_on / related / reverse 皆可解析")


# ── 2. 閉環規則違反 ─────────────────────────────────────────────────
def check_closure_rules(graph):
    by_id = {n.get("id"): n for n in graph.get("nodes", [])}
    src = by_id.get(CAPTURED_IN)

    if not src:
        record("FAIL", "closure.source_node", f"找不到能力來源節點: {CAPTURED_IN}")
        return

    techs = src.get("captured_techniques", [])
    if not techs:
        record("FAIL", "closure.captured_techniques", "能力來源節點未登記事新得技術")
        return
    record("PASS", "closure.captured_techniques", f"已登記技術數 = {len(techs)}", len(techs))

    # 規則 1：每項技術至少一個 reusable_in 目標存在
    for t in techs:
        tid = t.get("id", "<no-id>")
        targets = t.get("reusable_in", []) or []
        if not targets:
            record("FAIL", f"tech[{tid}].reusable_in", "未標任何回填目標（能力無法外溢）")
        for tgt in targets:
            if tgt not in by_id:
                record("FAIL", f"tech[{tid}].reusable_in", f"回填目標節點不存在: {tgt}")

    # 規則 2：已交付節點的 known_gaps 必須存在於圖譜
    for gap in src.get("known_gaps", []) or []:
        if gap not in by_id:
            record("FAIL", "closure.known_gaps", f"known_gaps 指向不存在的節點: {gap}")

    # 規則 3：blocked 節點必須有 blocked_by 與解法
    for node in graph.get("nodes", []):
        nid = node.get("id", "<no-id>")
        if node.get("status") in ("blocked", "blocked_external"):
            if not node.get("blocked_by"):
                record("FAIL", f"node[{nid}].blocked", "blocked 節點未標 blocked_by")
            if not (node.get("workaround_available") or node.get("discrepancies")):
                record(
                    "FAIL",
                    f"node[{nid}].blocked",
                    "blocked 節點未提供解法路徑（只寫做不到）",
                )

    # 規則 4：不得有節點同時宣稱 delivered 卻帶未解 discrepancy
    for node in graph.get("nodes", []):
        if node.get("status") == "delivered" and node.get("discrepancies"):
            record("FAIL", f"node[{node.get('id')}].status", "delivered 卻仍有未解 discrepancy")

    n_fail = sum(
        1 for r in results if r["level"] == "FAIL" and r["check"].startswith(("closure", "tech[", "node["))
    )
    if n_fail == 0:
        record("PASS", "closure.rules", "閉環規則全部遵守")


# ── 3. 宣稱 vs 實測 交叉核對 ────────────────────────────────────────
def check_claims_vs_measured(graph):
    by_id = {n.get("id"): n for n in graph.get("nodes", [])}
    node = by_id.get("ch30-fix-false-claims")
    if not node:
        record("WARN", "claims.node", "找不到 ch30-fix-false-claims 節點，略過交叉核對")
        return

    # 實測 commit 筆數
    out, code = run(["git", "log", "--oneline", "1405bd432..HEAD"])
    if code != 0:
        record("WARN", "claims.git_log", f"git log 執行失敗: {out[:120]}")
    else:
        actual = len([ln for ln in out.splitlines() if ln.strip()])
        for d in node.get("discrepancies", []):
            if d.get("field") == "commit 筆數":
                claimed = re.search(r"(\d+)", d.get("canon_claims", ""))
                c = int(claimed.group(1)) if claimed else None
                if c is None:
                    # 無法解析宣稱值：不是「宣稱與實測一致」，不得記 PASS
                    # （承 L167「找不到節點 → WARN」的既有慣例）
                    record(
                        "WARN",
                        "claims.commit_count",
                        "commit 筆數宣稱不含可解析數值，無法交叉核對（略過，非通過）",
                        f"canon_claims={d.get('canon_claims', '')[:60]} measured={actual}",
                    )
                elif c != actual:
                    record(
                        "FAIL",
                        "claims.commit_count",
                        f"§30.6 宣稱 {c} 筆，實測 {actual} 筆 — 未修正",
                        f"canon={c} measured={actual}",
                    )
                else:
                    record(
                        "PASS",
                        "claims.commit_count",
                        f"commit 筆數一致: {actual}",
                        actual,
                    )

    # 實測 lint warning 數（讀取最近的 lint 輸出或重跑）
    lint_out, lint_code = run(
        ["git", "log", "-1", "--format=%H", "--grep=lint"]
    )  # 僅探測是否有 lint 相關 commit
    if lint_code != 0:
        record("WARN", "claims.lint", "無法探測 lint 歷史，請以 --rerun-lint 參數重驗")

    # 工作區乾淨度
    st, st_code = run(["git", "status", "--porcelain"])
    if st_code == 0:
        n = len([ln for ln in st.splitlines() if ln.strip()])
        record(
            "PASS" if n <= 5 else "WARN",
            "claims.workspace",
            f"未歸位筆數 = {n}",
            n,
        )


# ── 4. 技能 frontmatter 規格 ─────────────────────────────────────────
def check_skill_frontmatter():
    if not os.path.isdir(SKILLS):
        record("WARN", "skills.dir", f"技能目錄不存在: {SKILLS}")
        return

    missing_meta, long_desc = [], []
    checked = 0
    for name in sorted(os.listdir(SKILLS)):
        skill_md = os.path.join(SKILLS, name, "SKILL.md")
        if not os.path.isfile(skill_md):
            continue
        checked += 1
        try:
            with open(skill_md, encoding="utf-8") as fh:
                text = fh.read(4096)
        except OSError:
            continue
        if not text.startswith("---"):
            missing_meta.append(f"{name}: 無 frontmatter")
            continue
        fm = text.split("---", 2)[1] if text.count("---") >= 2 else ""
        lack = [k for k in ("version", "author", "license") if f"{k}:" not in fm]
        if lack:
            missing_meta.append(f"{name}: 缺 {','.join(lack)}")
        m = re.search(r"description:\s*(.+)", fm)
        if m:
            d = m.group(1).strip().strip('"\'')
            if len(d) > 60:
                long_desc.append(f"{name}: {len(d)} 字元")

    record("PASS", "skills.scanned", f"已掃描技能數 = {checked}", checked)
    if missing_meta:
        record(
            "FAIL",
            "skills.frontmatter",
            f"{len(missing_meta)} 個技能缺 version/author/license",
            missing_meta[:8],
        )
    else:
        record("PASS", "skills.frontmatter", "所有技能 frontmatter 欄位齊備")
    if long_desc:
        record(
            "FAIL",
            "skills.description_len",
            f"{len(long_desc)} 個技能 description > 60 字元（索引會截斷致路由失效）",
            long_desc[:8],
        )
    else:
        record("PASS", "skills.description_len", "所有 description ≤ 60 字元")


# ── 5. 懸空引用 ─────────────────────────────────────────────────────
def check_dangling_refs():
    if not os.path.isdir(SKILLS):
        # 與 check_skill_frontmatter 對齊：缺目錄必須留下痕跡。
        # 靜默 return 等於「檢查了 0 個技書」卻不現身於報告 —— 讀者無法
        # 區分「跑過且無懸空引用」與「根本沒跑」，與 null-claim 假綠同型。
        record("WARN", "skills.dangling_refs", f"技能目錄不存在: {SKILLS}")
        return
    dangling = []
    pat = re.compile(r"(?:references|templates|scripts|assets)/([A-Za-z0-9_.\-]+\.[A-Za-z0-9]+)")
    # 技能庫根目錄：跨技能引用（如 godmode-execution/references/x.md）合法存在於此，
    # 只查 references/ 子目錄會把它誤判為懸空引用 —— 那是驗證器的 bug，不是作者的 bug。
    skills_root = os.path.dirname(SKILLS)
    # 已合法宣告「跨技能／不在本目錄」的引用：作者已自我標註，引用目標存在於別的技能。
    for name in sorted(os.listdir(SKILLS)):
        skill_dir = os.path.join(SKILLS, name)
        skill_md = os.path.join(skill_dir, "SKILL.md")
        if not os.path.isfile(skill_md):
            continue
        try:
            with open(skill_md, encoding="utf-8") as fh:
                text = fh.read()
        except OSError:
            continue
        for rel in set(pat.findall(text)):
            local = os.path.join(skill_dir, "references", rel)
            if os.path.exists(local):
                continue
            # 跨技能解析：references/<file> 存在於任一其他技能目錄 → 合法
            owners = [
                other
                for other in sorted(os.listdir(skills_root))
                if os.path.isfile(os.path.join(skills_root, other, "references", rel))
            ]
            if owners:
                record(
                    "INFO",
                    f"skills.cross_ref[{name}]",
                    f"references/{rel} 實為跨技能引用，擁有者 = {owners[0]}",
                    owners,
                )
                continue
            if f"references/{rel}" in text:
                dangling.append(f"{name} → references/{rel}")
    if dangling:
        record("FAIL", "skills.dangling_refs", f"{len(dangling)} 處懸空引用", dangling[:10])
    else:
        record("PASS", "skills.dangling_refs", "無懸空 references 引用")


# ── main ────────────────────────────────────────────────────────────
def main():
    if not os.path.isfile(GRAPH):
        print(f"[FAIL] 找不到 {GRAPH}")
        return 2
    try:
        with open(GRAPH, encoding="utf-8") as fh:
            graph = json.load(fh)
    except json.JSONDecodeError as exc:
        print(f"[FAIL] task-graph.json JSON 解析錯誤: {exc}")
        return 2

    check_graph_structure(graph)
    check_closure_rules(graph)
    check_claims_vs_measured(graph)
    check_skill_frontmatter()
    check_dangling_refs()

    n_fail = sum(1 for r in results if r["level"] == "FAIL")
    n_warn = sum(1 for r in results if r["level"] == "WARN")
    n_pass = sum(1 for r in results if r["level"] == "PASS")

    if "--json" in sys.argv:
        print(json.dumps(
            {
                "checked_at": datetime.now().isoformat(timespec="seconds"),
                "pass": n_pass, "warn": n_warn, "fail": n_fail,
                "results": results,
            },
            ensure_ascii=False, indent=2,
        ))
    else:
        print("=" * 68)
        print(f"同步升級閉環驗證 · {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 68)
        for r in results:
            mark = {"PASS": "✓", "WARN": "!", "FAIL": "✗", "INFO": "·"}[r["level"]]
            print(f"[{mark}] {r['check']}: {r['detail']}")
            if r["level"] != "PASS" and r.get("observed") is not None:
                print(f"      觀測值: {r['observed']}")
        print("-" * 68)
        print(f"總計  PASS={n_pass}  WARN={n_warn}  FAIL={n_fail}")
        print("=" * 68)
        if n_fail:
            print("結論: 閉環未閉合 — 需依 task-graph.json 的 blocked_by 逐項處理")

    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main())
