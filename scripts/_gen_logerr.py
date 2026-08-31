import re

raw = r'''<page><content>
2026-07-03T05:26:42.7550298Z ##[group]Run npx tsc --noEmit
2026-07-03T05:26:42.7550638Z [36;1mnpx tsc --noEmit[0m
2026-07-03T05:26:42.7569852Z shell: /usr/bin/bash -e {0}
2026-07-03T05:26:42.7570149Z env:
2026-07-03T05:26:42.7570425Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
2026-07-03T05:26:42.7570760Z ##[endgroup]
2026-07-03T05:26:50.2143404Z ##[error]app/omni-center/wuzuo-note-view.tsx(354,19): error TS17001: JSX elements cannot have multiple attributes with the same name.
2026-07-03T05:26:50.2662339Z ##[error]Process completed with exit code 2.
</content></page>'''

m = re.search(r'<content>(.*?)</content>', raw, re.S)
content = m.group(1)
content = re.sub(r'<[^>]+>', '', content)
content = content.replace('\\n','\n').replace('\\#','#').replace('\\[','[').replace('\\]',']').strip()
content = re.sub(r'\n{3,}','\n\n',content)

md = f"""---
title: 日誌錯誤
source: Notion
notion_id: 392ccd20-97d7-8035-80ca-d88e67997ac6
tags: [CI, 日誌, TS錯誤, 除錯]
---

# 日誌錯誤

```log
{content}
```

## 分析
- 錯誤類型: `TS17001: JSX elements cannot have multiple attributes with the same name`
- 位置: `app/omni-center/wuzuo-note-view.tsx` 第 354 行第 19 列
- 結果: `Process completed with exit code 2` (tsc --noEmit 失敗)
- 修復方向: 檢查該 JSX 元素是否有重複屬性名
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/日誌錯誤.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
