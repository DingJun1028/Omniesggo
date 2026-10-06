import re

with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we have multiSchema
if 'previewFeatures = ["multiSchema"]' not in content:
    content = content.replace(
        'provider = "prisma-client-js"',
        'provider = "prisma-client-js"\n  previewFeatures = ["multiSchema"]'
    )
if 'schemas  = ["public", "auth"]' not in content:
    content = content.replace(
        'url      = env("DATABASE_URL")',
        'url      = env("DATABASE_URL")\n  schemas  = ["public", "auth"]'
    )

# Safely add @@schema("public") at the end of each model and enum
# We'll use regex to match ^model <name> { ... } and ^enum <name> { ... }
# by looking for the matching closing brace that is at the start of a line.

lines = content.split('\n')
new_lines = []
in_block = False

for line in lines:
    if line.startswith('model ') or line.startswith('enum '):
        in_block = True
        new_lines.append(line)
    elif line == '}' and in_block:
        new_lines.append('  @@schema("public")')
        new_lines.append(line)
        in_block = False
    else:
        new_lines.append(line)

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Safely added @@schema(\"public\")")
