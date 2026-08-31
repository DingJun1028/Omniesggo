import re, os
root = r'C:\Project\esggo\src'
pattern = re.compile(
    r"(evidence:\s*\{\s*\n\s*originCause:\s*string;\s*\n\s*processTrace:\s*string\[\];\s*\n\s*finalEffect:\s*string;)(\s*\n)"
)
count = 0
for dirpath, _, filenames in os.walk(root):
    for fn in filenames:
        if not fn.endswith('.ts'):
            continue
        path = os.path.join(dirpath, fn)
        text = open(path, 'r', encoding='utf-8').read()
        new_text, n = pattern.subn(r"\1;\n    [key: string]: unknown;\2", text)
        if n:
            open(path, 'w', encoding='utf-8').write(new_text)
            count += n
            print(f"patched {path}")
print(f"patched {count} sites")
