#!/usr/bin/env python3
"""Build zhtw.json: traditional-Chinese patch locale for VoxSpica."""
import json, sys
from zhconv import convert

src = sys.argv[1]
dst = sys.argv[2]
with open(src, 'r', encoding='utf-8') as f:
    data = json.load(f)
out = {}
for k, v in data.items():
    out[k] = convert(v, 'zh-tw') if isinstance(v, str) else v
# self-name for the picker (shown when UI runs in zhtw)
out['lang.zhtw'] = '繁體中文'
# keep recognition-language names consistent in traditional UI
out['lang.zh'] = '簡體中文'
# Taiwan wording polish on a few high-frequency keys
fixes = {
    'app.title': '{app} — 語音辨識',
    'label.lang': '辨識語言：',
    'btn.record': '從麥克風錄音',
    'btn.file': '轉錄檔案',
    'label.output_dir': '文字輸出資料夾：',
    'label.audio_file': '音訊檔案：',
    'history.kind_file': '檔案',
    'history.search': '搜尋文字或檔名',
    'status.saved': '已儲存：{path}',
    'status.copied': '文字已複製到剪貼簿',
    'menu.exit': '結束',
    'btn.save': '另存新檔…',
    'menu.save_as': '另存新檔…',
    'size.small': '小（約 50 MB）',
    'size.large': '大（約 1.8 GB）',
}
for k, v in fixes.items():
    if k in out:
        out[k] = v
with open(dst, 'w', encoding='utf-8', newline='\n') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'wrote {dst}: {len(out)} keys')
