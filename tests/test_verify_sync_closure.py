"""
verify_sync_closure 的 commit 筆數交叉核對 — 雙向測試。

存在理由（2026-10-02）:
  修 B 之前，`canon_claims` 無法解析出數字時會落入 else 分支被記為 PASS，
  且訊息寫「commit 筆數一致: N」—— 沒有比對卻宣告一致（假綠）。
  本檔以 4 案例鎖定該行為，確保這道閘「有能力變紅」。

設計對照（技書：對照組必須有能力失敗）:
  以「宣稱 999 筆 vs 實測 N 筆」為負向案例。若閘已壞掉而無條件 PASS，
  該案例會變綠 → 測試失敗。答案得出：負向案例有效。
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERIFIER = ROOT / "scripts" / "verify_sync_closure.py"
GRAPH = ROOT / "task-graph.json"
NODE_ID = "ch30-fix-false-claims"


def _claim_field(node):
    """取出該節點的 commit 筆數 discrepancy 條目。"""
    for d in node.get("discrepancies", []):
        if d.get("field") == "commit 筆數":
            return d
    raise AssertionError(f"節點 {NODE_ID} 缺少 field='commit 筆數' 的 discrepancy")


def _with_claim(value):
    """在真實 repo 內暫時改寫 canon_claims，跑 verifier，還原。

    刻意不用複製目錄：verifier 的 git log 依賴 cwd 在 git repo 內，
    複製到 repo 外會讓 git log 失敗 → 整段檢查被略過 → 對照組無能力失敗。
    """
    original_bytes = GRAPH.read_bytes()
    graph = json.loads(original_bytes.decode("utf-8"))
    node = next(n for n in graph["nodes"] if n.get("id") == NODE_ID)
    target = _claim_field(node)
    assert "canon_claims" in target, "錨點未命中: canon_claims 欄位不存在"
    before = target["canon_claims"]
    target["canon_claims"] = value
    GRAPH.write_text(
        json.dumps(graph, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    try:
        proc = subprocess.run(
            [sys.executable, str(VERIFIER)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=300,
        )
    finally:
        GRAPH.write_bytes(original_bytes)
    line = next(
        (
            ln
            for ln in proc.stdout.splitlines()
            if "claims.commit_count" in ln
        ),
        "",
    )
    return proc.returncode, line, before


def _repo_wide_commit_count():
    anchor = subprocess.run(
        ["git", "cat-file", "-e", "1405bd432^{commit}"],
        cwd=str(ROOT),
        capture_output=True,
    )
    rev_range = "1405bd432..HEAD" if anchor.returncode == 0 else "HEAD"
    out = subprocess.run(
        ["git", "log", "--oneline", rev_range],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    return len([ln for ln in out.stdout.splitlines() if ln.strip()])


def test_verifier_file_exists():
    assert VERIFIER.is_file(), f"找不到驗證器: {VERIFIER}"


def test_claim_regex_parses_number():
    """錨點檢查: 正則必須真的能從 canon_claims 抽出數字。"""
    node = json.loads(GRAPH.read_text(encoding="utf-8"))["nodes"]
    node = next(n for n in node if n.get("id") == NODE_ID)
    claim = _claim_field(node)["canon_claims"]
    m = re.search(r"(\d+)", claim)
    assert m is not None, f"錨點失效: canon_claims={claim!r} 抽不出數字"


def test_mismatch_reports_fail():
    """負向: 宣稱遠大於實測 → 必須 FAIL（閘有能力報紅）。"""
    actual = _repo_wide_commit_count()
    assert actual > 0, "前置條件失效: 量不到任何 commit"
    rc, line, before = _with_claim("999 筆")
    assert "[✗]" in line, f"應 FAIL 卻未報紅: {line!r} (before={before!r})"
    assert rc == 1, f"rc 應為 1，實得 {rc}"
    assert "999" in line and str(actual) in line, f"觀測值應含宣稱與實測: {line!r}"


def test_claim_without_number_reports_warn_not_pass():
    """核心防護: 無法解析的宣稱值 → WARN，絕不可 PASS。

    這是 B 的修復目標。修前此例會印「commit 筆數一致」並回 rc=0（假綠）。
    """
    rc, line, before = _with_claim("已 squash，原始分解不可還原")
    assert line, "verifier 未輸出 claims.commit_count 行（檢查被略過？）"
    assert "[✓]" not in line, f"不得宣告通過: {line!r}"
    assert "[!]" in line, f"應記 WARN: {line!r}"
    assert "一致" not in line, f"不得出現『一致』字樣: {line!r}"


def test_matching_number_reports_pass():
    """正向: 宣稱等於實測 → 必須 PASS，且訊息帶實測值。"""
    actual = _repo_wide_commit_count()
    rc, line, before = _with_claim(f"{actual} 筆")
    assert "[✓]" in line, f"應 PASS: {line!r}"
    assert str(actual) in line, f"PASS 訊息應含實測值 {actual}: {line!r}"
    assert rc in (0, 1), f"rc 應為 0（無其他 FAIL），實得 {rc}"


def test_graph_restored_after_tests():
    """確認前四例都完整還原了 task-graph.json。"""
    raw = GRAPH.read_text(encoding="utf-8")
    node = next(
        n for n in json.loads(raw)["nodes"] if n.get("id") == NODE_ID
    )
    assert "canon_claims" in _claim_field(node), "還原後欄位應仍存在"


# ── 稽核發現：dangling-refs 閘在缺目錄時靜默消失（2026-10-03）────────
#
# 稽核其餘 verify_*.py 的「靜默略過」型態時發現 verify_sync_closure.py:
# 276-278 的不對稱防護：
#
#   check_skill_frontmatter():  if not isdir(SKILLS): record("WARN", ...); return
#   check_dangling_refs():      if not isdir(SKILLS): return        ← 靜默
#
# 為何是真缺陷：main() 只統計 level == "FAIL" 決定退出碼，WARN 不影響 rc。
# 於是技能目錄不存在時，dangling-refs 這道閘「檢查了 0 個技書」卻不留下
# 任何痕跡 —— 報告上看不出它根本沒跑。對照組 frontmatter 留了 WARN，
# 讀者會誤以為「只有 frontmatter 受影響，dangling-refs 大概也沒事」。
#
# 這與先前修掉的 null-claim 假綠同一類病：檢查未執行 ≡ 檢查通過。
# 修補方向：與 frontmatter 對齊，記 WARN 並指名路徑。
#
# 本組測試先證明現況（修補前）缺少這道閘的痕跡。


def _run_verifier_with_missing_skills_dir(tmp_path):
    """在 SKILLS 指向不存在目錄的條件下執行 verifier，回傳 (rc, stdout)。

    用 sys.executable 的絕對路徑；不可用 py launcher —— 改變 LOCALAPPDATA
    後 py 會誤判 runtime 回傳 "No runtime installed that matches 3.14"。

    防護：若直譯器／腳本沒跑起來必須立刻紅，否則空 stdout 會讓所有
    「不得出現 X」斷言為真 → 測試假綠。
    """
    missing = tmp_path / "definitely" / "not" / "here"
    assert not missing.exists()

    env = dict(os.environ)
    # LOCALAPPDATA 指向 tmp_path → SKILLS = tmp_path/hermes/skills/esggo（不存在）
    env["LOCALAPPDATA"] = str(tmp_path)
    proc = subprocess.run(
        [sys.executable, str(VERIFIER)],
        capture_output=True, text=True, encoding="utf-8", cwd=str(ROOT), env=env,
    )
    assert proc.stdout.strip(), (
        f"verifier 未產生任何輸出（rc={proc.returncode}）。\n"
        f"stderr={proc.stderr[:500]}"
    )
    return proc.returncode, proc.stdout


# 報告行的樣式：[✓] key: msg / [!] key: msg / [✗] key: msg
# 只認「報告行裡的檢查名」，不可用任意子字串比對 —— tmp_path 會把測試函式
# 名稱帶進技能目錄路徑（例如 .../test_dangling_refs_leaves_trac0/hermes/...），
# 任何 "dangling" in stdout 都會自我參照地為真 → 測試假綠。
def _check_lines(out, check_name):
    """取出報告中屬於 check_name 的結果行（僅限 [✓]/[!]/[✗] 開頭者）。"""
    import re as _re
    return [
        ln for ln in out.splitlines()
        if _re.match(r"^\[(?:✓|!|✗)\]\s+" + _re.escape(check_name) + r"(\s|:)", ln)
    ]


def test_dangling_refs_leaves_trace_when_skills_dir_missing(tmp_path):
    """RED：技能目錄不存在時，dangling-refs 閘必須留下自己的痕跡。

    現況（修補前）：`check_dangling_refs()` 靜默 return，報告中完全
    找不到 dangling-refs 的痕跡 —— 檢查沒跑卻與「跑過並通過」無異。
    """
    rc, out = _run_verifier_with_missing_skills_dir(tmp_path)

    assert _check_lines(out, "skills.dir"), f"應有技能目錄的 WARN 痕跡:\n{out}"

    # 關鍵：dangling 這道閘必須在報告中現身（不論 PASS 或 WARN）
    dangling_lines = _check_lines(out, "skills.dangling_refs")
    assert dangling_lines, (
        f"dangling-refs 閘在缺目錄時完全無痕跡（靜默 return，假綠）:\n"
        f"rc={rc}\n{out}"
    )
    # 且不得宣告通過 —— 檢查根本沒跑
    assert not any(ln.startswith("[✓]") for ln in dangling_lines), (
        f"檢查沒跑卻宣告通過（假綠）: {dangling_lines}"
    )


def test_dangling_refs_warn_mentions_dir_path(tmp_path):
    """dangling-refs 的 WARN 需指名技能目錄路徑，與 frontmatter 對齊。"""
    rc, out = _run_verifier_with_missing_skills_dir(tmp_path)
    dangling_warn = [ln for ln in _check_lines(out, "skills.dangling_refs") if ln.startswith("[!]")]
    assert dangling_warn, f"應有 dangling-refs 的 WARN 行:\n{out}"
    assert any("esggo" in ln for ln in dangling_warn), (
        f"WARN 應指名含 esggo 的技能目錄路徑:\n{dangling_warn}"
    )
