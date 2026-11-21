"""
稽核「。」分布：區分註解 vs 使用者可見字串。

5T-Traceable: 輸出每個命中檔案:行號:字串內容，供人工逐條確認
"""
import io
import os
import re
import json

WEB = r"C:\Users\dingj\ftg-tours-website"
ROOTS = ["src"]

# 檔案類型
CODE_EXT = (".js", ".jsx")

# 使用者可見的容器：JSX text、字串常數、物件字串值
# 註解樣式
BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.S)
LINE_COMMENT = re.compile(r"//[^\n]*")

# 抓出中文字串（含可能的英文）
STR_LITERAL = re.compile(r"""(['"`])((?:\\.|(?!\1)[^\\])*?)\1""", re.S)

CJK = re.compile(r"[\u4e00-\u9fff]")
IDEO_FULL_STOP = "\u3002"

report = []
stats = {"code_files": 0, "comment_hits": 0, "visible_hits": 0, "cjk_visible_with_period": 0}

for root_dir in ROOTS:
    for dirpath, _dirs, files in os.walk(os.path.join(WEB, root_dir)):
        for fn in files:
            if not fn.endswith(CODE_EXT):
                continue
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, WEB).replace("\\", "/")
            raw = io.open(p, encoding="utf-8").read()
            stats["code_files"] += 1

            # 標記註解區間
            masked = list(raw)
            for m in BLOCK_COMMENT.finditer(raw):
                for i in range(m.start(), m.end()):
                    masked[i] = "\u0000"
            for m in LINE_COMMENT.finditer(raw):
                line_start = m.start()
                line_end = raw.find("\n", m.start())
                if line_end == -1:
                    line_end = len(raw)
                for i in range(line_start, line_end):
                    masked[i] = "\u0000"
            masked = "".join(masked)

            for m in STR_LITERAL.finditer(masked):
                content = m.group(2)
                if IDEO_FULL_STOP not in content:
                    continue
                # 定位行號（用原始檔）
                line_no = raw.count("\n", 0, m.start()) + 1
                has_cjk = bool(CJK.search(content))
                stats["visible_hits"] += 1
                if has_cjk:
                    stats["cjk_visible_with_period"] += 1
                report.append({
                    "file": rel,
                    "line": line_no,
                    "has_cjk": has_cjk,
                    "periods": content.count(IDEO_FULL_STOP),
                    "text": content.strip()[:200],
                })

# 註解中的命中（僅統計）
for root_dir in ROOTS:
    for dirpath, _dirs, files in os.walk(os.path.join(WEB, root_dir)):
        for fn in files:
            if not fn.endswith(CODE_EXT):
                continue
            p = os.path.join(dirpath, fn)
            raw = io.open(p, encoding="utf-8").read()
            for m in BLOCK_COMMENT.finditer(raw):
                if IDEO_FULL_STOP in m.group(0):
                    stats["comment_hits"] += 1
            for m in LINE_COMMENT.finditer(raw):
                if IDEO_FULL_STOP in m.group(0):
                    stats["comment_hits"] += 1

print(json.dumps(stats, ensure_ascii=False, indent=2))
print()
print("=== 使用者可見字串含「。」者 ===")
cjk = [r for r in report if r["has_cjk"]]
noncjk = [r for r in report if not r["has_cjk"]]
for r in cjk:
    print(f'{r["file"]}:{r["line"]}  [{r["periods"]}]  {r["text"]}')
print()
print(f"--- 中文命中: {len(cjk)} | 非中文命中: {len(noncjk)} ---")
for r in noncjk:
    print(f'{r["file"]}:{r["line"]}  [{r["periods"]}]  {r["text"]}')

with io.open(os.path.join(WEB, "scripts", ".period-audit.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print("\nsaved: scripts/.period-audit.json")
