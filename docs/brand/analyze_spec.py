import re

with open(r"C:\Project\esggo\docs\brand\htb-spec-extracted.txt", "r", encoding="utf-8") as f:
    lines = [l.strip() for l in f if l.strip()]

print(f"Total lines: {len(lines)}")
# 尋找所有章節標題
headings = []
for i, line in enumerate(lines):
    if re.match(r"^(第[一二三四五六七八九十]+章|一、|二、|三、|四、|五、|六、|七、|八、|九、|十、|P[0-9]{2}|H[0-9]{2}|§|[0-9]+\.[0-9]+|[0-9]+、|[A-Z][0-9])", line):
        headings.append((i, line))

print(f"Found {len(headings)} headings. Sample first 30:")
for idx, h in headings[:30]:
    print(f"[{idx}] {h}")
