#!/usr/bin/env python3
"""
Notion XML -> Obsidian Markdown 轉換器
對齊 soul.md §15.5 增量輸出優化: 可重複使用, 避免逐頁手工.
輸入: Notion fetch 的 XML 文本 (stdin 或檔案)
輸出: Obsidian markdown (stdout)
"""
import sys, re

def clean_text(s: str) -> str:
    s = s.replace('\\n', '\n').replace('\\t', '  ')
    s = s.replace('\\\\"', '"')
    return s.strip()

def convert_table(block: str) -> str:
    """<table>...</table> -> markdown table"""
    rows = re.findall(r'<tr>(.*?)</tr>', block, re.S)
    out = []
    for i, row in enumerate(rows):
        cells = re.findall(r'<td>(.*?)</td>', row, re.S)
        cells = [clean_text(c) for c in cells]
        out.append('| ' + ' | '.join(cells) + ' |')
        if i == 0:
            out.append('| ' + ' | '.join(['---'] * len(cells)) + ' |')
    return '\n'.join(out)

def convert_callout(block: str) -> str:
    m = re.search(r'<callout[^>]*>(.*?)</callout>', block, re.S)
    if not m: return ''
    inner = m.group(1)
    # 移除內部巢狀 tag, 保留文字
    txt = re.sub(r'<[^>]+>', '', inner)
    return '> ' + clean_text(txt).replace('\n', '\n> ')

def convert_columns(block: str) -> str:
    # 簡化: 抽取 column 內文字, 用分隔線隔開
    cols = re.findall(r'<column[^>]*>(.*?)</column>', block, re.S)
    parts = []
    for c in cols:
        txt = re.sub(r'<[^>]+>', '\n', c)
        parts.append(clean_text(txt))
    return '\n\n---\n\n'.join(parts)

def convert_page(xml: str, title: str = '', source: str = '') -> str:
    # frontmatter
    fm = '---\n'
    if title: fm += f'title: {title}\n'
    fm += 'source: Notion\n'
    if source: fm += f'notion_id: {source}\n'
    fm += '---\n\n'

    # 抽取 <content> 區塊
    content = ''
    m = re.search(r'<content>(.*?)</content>', xml, re.S)
    if m:
        content = m.group(1)

    # 處理 tables
    content = re.sub(r'<table>.*?</table>', lambda x: convert_table(x.group(0)), content, flags=re.S)
    # callouts -> blockquote
    content = re.sub(r'<callout[^>]*>.*?</callout>', lambda x: convert_callout(x.group(0)), content, flags=re.S)
    # columns -> 分隔
    content = re.sub(r'<columns>.*?</columns>', lambda x: convert_columns(x.group(0)), content, flags=re.S)
    # 移除其餘 tag
    content = re.sub(r'<[^>]+>', '', content)
    content = clean_text(content)
    # 壓縮多餘空行
    content = re.sub(r'\n{3,}', '\n\n', content)
    return fm + content

if __name__ == '__main__':
    data = sys.stdin.read()
    # 取 title from <properties>
    tmatch = re.search(r'"title":"([^"]+)"', data)
    title = tmatch.group(1) if tmatch else ''
    smatch = re.search(r'"url":"https://app\.notion\.com/p/([0-9a-f-]+)', data)
    source = smatch.group(1) if smatch else ''
    print(convert_page(data, title, source))
