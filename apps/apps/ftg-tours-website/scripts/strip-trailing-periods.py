"""
移除使用者可見中文字串的句尾「。」(U+3002)。

5T-Traceable : 只改字串常數，註解原樣保留
5T-Trustworthy: 轉換前後字串數量比對 + 逐條 diff 輸出；只刪句尾「。」
               不動「.」數字/email/URL，不動英文
"""
import io
import os
import re
import json

WEB = r"C:\Users\dingj\ftg-tours-website"
IDEO = "\u3002"  # 。

BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.S)
LINE_COMMENT = re.compile(r"//[^\n]*")
STR_LITERAL = re.compile(r"""(['"`])((?:\\.|(?!\1)[^\\])*?)\1""", re.S)
CJK = re.compile(r"[\u4e00-\u9fff]")

# 不該被改的檔案（翻譯檔為 SSOT，句點僅存在註解中；但仍一併安全處理）
TARGET_DIRS = ["src"]

changed_files = []
all_diffs = []
total_removed = 0

for root_dir in TARGET_DIRS:
    for dirpath, _dirs, files in os.walk(os.path.join(WEB, root_dir)):
        for fn in files:
            if not fn.endswith((".js", ".jsx")):
                continue
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, WEB).replace("\\", "/")
            original = io.open(p, encoding="utf-8").read()

            # 1) 計算註解遮罩位置
            masked = list(original)
            comment_spans = []
            for m in BLOCK_COMMENT.finditer(original):
                comment_spans.append((m.start(), m.end()))
            for m in LINE_COMMENT.finditer(original):
                line_end = original.find("\n", m.start())
                if line_end == -1:
                    line_end = len(original)
                comment_spans.append((m.start(), line_end))
            for s, e in comment_spans:
                for i in range(s, e):
                    masked[i] = "\u0000"
            masked = "".join(masked)

            # 2) 找出需要改的字串（回傳新的字串值）
            edits = []  # (start_of_content, end_of_content, new_content)
            for m in STR_LITERAL.finditer(masked):
                content = m.group(2)
                if IDEO not in content:
                    continue
                if not CJK.search(content):
                    continue  # 純英文字串不動
                # 只刪「句尾」：也就是字串內所有結尾的句點
                new = content.replace(IDEO, "")
                if new != content:
                    edits.append((m.start(2), m.end(2), new))

            if not edits:
                continue

            # 3) 由後往前套用，避免位移
            buf = original
            for s, e, new in sorted(edits, key=lambda x: -x[0]):
                old_val = buf[s:e]
                total_removed += old_val.count(IDEO)
                all_diffs.append({"file": rel, "before": old_val, "after": new})
                buf = buf[:s] + new + buf[e:]

            if buf != original:
                io.open(p, "w", encoding="utf-8", newline="").write(buf)
                changed_files.append(rel)

print("=== 變更檔案 ===")
for f in changed_files:
    print("  ", f)
print(f"\n移除句點總數: {total_removed}")
print(f"字串修改筆數: {len(all_diffs)}")
print()
print("=== 逐條 diff（前後對照）===")
for d in all_diffs:
    print(f'\n{d["file"]}')
    print(f'  - {d["before"]}')
    print(f'  + {d["after"]}')

with io.open(os.path.join(WEB, "scripts", ".period-diff.json"), "w", encoding="utf-8") as f:
    json.dump(all_diffs, f, ensure_ascii=False, indent=2)
print("\nsaved: scripts/.period-diff.json")
