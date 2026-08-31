import re, os
root = r'C:\Project\esggo\src'
pattern = re.compile(r"evidence:\s*\{\s*\n\s*originCause:\s*string;\s*\n\s*processTrace:\s*string\[\];\s*\n\s*finalEffect:\s*string;\s*\n", re.M)
files = []
for dirpath, _, filenames in os.walk(root):
    for fn in filenames:
        if not fn.endswith('.ts'):
            continue
        path = os.path.join(dirpath, fn)
        text = open(path, 'r', encoding='utf-8').read()
        if pattern.search(text):
            files.append(path)
print('\n'.join(files))
