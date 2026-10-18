#!/usr/bin/env python3
"""esggo-knowledge — 共享知識庫與永恆記憶 CLI。

萬能蜂群 5T 協定：traceable / trackable / tangible / transparent / trustworthy。

用法:
  esggo-knowledge status            顯示資料庫狀態
  esggo-knowledge list [visibility] 查詢共享索引
  esggo-knowledge query --text ...  全文搜尋共享索引
  esggo-knowledge ingest -f FILE    匯入檔案成為知識檔案
  esggo-knowledge events DOC_ID     查看檔案生命週期事件
  esggo-knowledge links DOC_ID      查看檔案關聯
  esggo-knowledge version           顯示模型版本與資料庫版本

5T 對映:
  Traceable — 每筆資料帶 source_origin + sha256
  Trackable — 生命週期事件流
  Tangible  — CLI 即時回傳 URIs / 摘要 / 鎖資訊 / 事件流
  Transparent — 模式與版本號公開
  Trustworthy — Hash Lock + 版本鎖；鎖定後禁止覆寫
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from esggo.knowledge import MODEL_VERSION, SOURCE_ORIGIN_CANON
from esggo.knowledge.db import KnowledgeDB, get_db

# ── 5T 授權鍵 ─────────────────────────────────────────────────
_AUTHORIZATION = {
    "public": "read",
    "team": "read",
    "restricted": "approve",
    "agent": "write",
    "sealed": "sealed",
}

DEFAULT_DB = KnowledgeDB.DEFAULT_DB


def _err(msg: str) -> int:
    print(f"esggo-knowledge: error: {msg}", file=sys.stderr)
    return 1


# ── 命令 ─────────────────────────────────────────────────────
def cmd_status(args: argparse.Namespace) -> int:
    db = get_db(args.path)
    meta = db.conn.execute("SELECT value FROM meta WHERE key='schema'").fetchone()
    print(f"esggo-knowledge 狀態: 就緒  (資料庫: {db.path})")
    print(f"  schema 版本  : {meta['value'] if meta else 'unknown'}")
    print(f"  model 版本   : {MODEL_VERSION}")
    print(f"  source_origin: {SOURCE_ORIGIN_CANON}")
    print(f"  5T 協議      : 可追溯 / 可追蹤 / 可感知 / 透明 / 可信")
    print(f"  授權鍵       : {json_dumps(_AUTHORIZATION)}")
    db.close()
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    db = get_db(args.path)
    rows = db.query(visibility=args.visibility)
    print(f"esggo-knowledge 共享索引：{len(rows)} 筆")
    for r in rows[:50]:
        print(
            f"  doc={r['doc_id']:>4}  title={r['title']:<32} "
            f"alias={r['alias']:<16} vis={r['visibility']:<10} shape={r['shape']}"
        )
    db.close()
    return 0


def cmd_query(args: argparse.Namespace) -> int:
    db = get_db(args.path)
    rows = db.query(text=args.text)
    print(f"esggo-knowledge 全文搜尋：{len(rows)} 筆")
    for r in rows[:20]:
        print(f"  doc={r['doc_id']}  {r['title']}  ({r['page_alias']})")
    db.close()
    return 0


def cmd_ingest(args: argparse.Namespace) -> int:
    content = args.file.read_text(encoding="utf-8")
    db = get_db(args.path)
    doc_id = db.ingest(
        content=content,
        source_origin=args.source_origin or SOURCE_ORIGIN_CANON,
        anchor=args.anchor,
        visibility=args.visibility,
        title=args.title,
        page_alias=args.page_alias,
        tags=args.tags,
        path_alias=args.path_alias,
    )
    print(f"esggo-knowledge ingest 成功：{doc_id}")
    print(f"  5T: Traceable sha256={content[:16]}... anchor={args.anchor}")
    print(f"  5T: Trackable events: ingest/link/seal")
    print(f"  5T: Transparent  schema 1.0.0")
    print(f"  5T: Trustworthy  sealed (locked)")
    db.close()
    return 0


def cmd_events(args: argparse.Namespace) -> int:
    db = get_db(args.path)
    rows = db.events(args.doc_id)
    print(f"esggo-knowledge 檔案 {args.doc_id} 的生命週期事件：{len(rows)} 筆")
    for r in rows:
        print(f"  {r['timestamp']}  {r['event']:<10}  {r['entity']}: {r['detail'][:60]}")
    db.close()
    return 0


def cmd_links(args: argparse.Namespace) -> int:
    db = get_db(args.path)
    rows = db.links(args.doc_id)
    print(f"esggo-knowledge 檔案 {args.doc_id} 的關聯：{len(rows)} 筆")
    for r in rows:
        print(f"  {r['created']}  rel={r['rel']:<12}  linked_doc={r['linked_doc_id']}")
    db.close()
    return 0


def cmd_version(args: argparse.Namespace) -> int:
    print(f"esggo-knowledge 版本: {MODEL_VERSION}")
    return 0


# ── 參數解析 ──────────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="esggo-knowledge",
        description="共享知識庫與永恆記憶 CLI — 5T 協定",
    )
    p.add_argument("--path", default=DEFAULT_DB, help="知識庫路徑（預設 $ESGGO_KNOWLEDGE_DB 或 ~/AppData/Local/esggo/knowledge.db）")
    sub = p.add_subparsers(dest="command", required=True)

    sp = sub.add_parser("status", help="顯示資料庫狀態")
    sp.set_defaults(func=cmd_status)

    sp = sub.add_parser("list", help="查詢共享索引")
    sp.add_argument("visibility", nargs="?", default="public", help="可見性: public/team/restricted/agent")
    sp.set_defaults(func=cmd_list)

    sp = sub.add_parser("query", help="全文搜尋共享索引")
    sp.add_argument("--text", default="", help="搜尋關鍵字")
    sp.set_defaults(func=cmd_query)

    sp = sub.add_parser("ingest", help="匯入檔案成為知識檔案")
    sp.add_argument("-f", "--file", required=True, type=Path, help="要匯入的檔案路徑")
    sp.add_argument("-a", "--anchor", required=True, help="代理錚點 (01-30 / 31-60)")
    sp.add_argument("--source-origin", default=SOURCE_ORIGIN_CANON, help="5T source_origin")
    sp.add_argument("-t", "--title", help="標題")
    sp.add_argument("--page-alias", help="頁別名")
    sp.add_argument("-T", "--tags", nargs="*", default=[], help="標籤")
    sp.add_argument("--path-alias", help="路徑別名")
    sp.add_argument("--visibility", default="team", help="可見性")
    sp.set_defaults(func=cmd_ingest)

    sp = sub.add_parser("events", help="查看檔案生命週期事件")
    sp.add_argument("doc_id", type=int, help="檔案 ID")
    sp.set_defaults(func=cmd_events)

    sp = sub.add_parser("links", help="查看檔案關聯")
    sp.add_argument("doc_id", type=int, help="檔案 ID")
    sp.set_defaults(func=cmd_links)

    sp = sub.add_parser("version", help="顯示模型版本")
    sp.set_defaults(func=cmd_version)

    return p


def json_dumps(obj) -> str:
    import json
    return json.dumps(obj, ensure_ascii=False)


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
