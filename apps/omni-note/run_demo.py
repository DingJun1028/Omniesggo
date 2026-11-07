#!/usr/bin/env python3
"""OmniNote 三向同步 demo — 電腦/手機/Hermes 三方 + 共享 hub。

實跑：建立 hub + 三端點 → 桌面新增→push → 手機 pull → Hermes 寫報告→push
      → 手機與桌面同時改同一筆 → 偵測衝突。全程 Python，無需 LLM。
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from omni_note.note import OmniNote
from omni_note.store import NoteStore
from omni_note.sync import SyncEngine
from omni_note.hermes_bridge import HermesBridge
from omni_note.ingest import SharedMemoryIngest


def hr(t: str) -> None:
    print("\n" + "=" * 64 + f"\n{t}\n" + "=" * 64)


def main() -> int:
    work = Path(__file__).resolve().parent / "_demo"
    for p in (work, work / "hub", work / "desktop", work / "phone", work / "hermes"):
        p.mkdir(parents=True, exist_ok=True)

    hub = NoteStore(work / "hub")
    engine = SyncEngine(hub)
    desktop = NoteStore(work / "desktop")
    phone = NoteStore(work / "phone")
    hermes_store = NoteStore(work / "hermes")
    bridge = HermesBridge(hub)

    hr("① 桌面新增兩筆筆記 → sync（push）")
    d1 = OmniNote(title="ESG 邊界議題", body="- 範圍 3 排放待補\n- 人權政策草稿", endpoint="desktop", tags=["esg"])
    d2 = OmniNote(title="供應鏈稽核清單", body="1. 供應商名單\n2. 審核日期", endpoint="desktop", tags=["audit"])
    desktop.save(d1); desktop.save(d2)
    for r in engine.sync("desktop", desktop):
        print(f"   {r.action:9} {r.note_id}  {r.detail}")

    hr("② 手機首次同步 → 拉取兩筆")
    for r in engine.sync("phone", phone):
        print(f"   {r.action:9} {r.note_id}  {r.detail}")
    print(f"   手機現有 {len(phone.list())} 筆：{[n.title for n in phone.list()]}")

    hr("③ Hermes 寫一份報告 → sync（push）")
    rep = bridge.write_report("OmniAgent 同步日誌", "本報告由 Hermes/OmniAgent 自動生成。\n- 端點：hermes", tags=["hermes"])
    for r in engine.sync("hermes", hermes_store):
        print(f"   {r.action:9} {r.note_id}  {r.detail}")
    print(f"   hub 現有 {len(hub.list())} 筆：{[n.title for n in hub.list()]}")

    hr("④ 手機與桌面同時修改『ESG 邊界議題』→ 衝突偵測")
    # 先讓手機同步到基準
    engine.sync("phone", phone)
    base_body = phone.load(d1.id).body
    # 手機改一版
    pm = phone.load(d1.id); assert pm is not None
    pm.body = base_body + "\n[手機] 補：範圍 3 數據來源=供應商回報"; phone.save(pm)
    # 桌面改另一版
    dm = desktop.load(d1.id); assert dm is not None
    dm.body = base_body + "\n[桌面] 補：範圍 3 數據來源=ERP 匯出"; desktop.save(dm)
    # 手機先 push（更新 hub + base）
    engine.sync("phone", phone)
    # 桌面再 sync → 與 hub 皆變 → 衝突
    for r in engine.sync("desktop", desktop):
        if r.note_id == d1.id:
            print(f"   {r.action:9} {r.note_id}  {r.detail}")

    hr("⑤ 衝突清單（待人工合併）")
    conflicts = [n for n in hub.list() if n.conflict]
    if conflicts:
        for n in conflicts:
            print(f"   ⚠ {n.title}  (id={n.id})")
    else:
        print("   無衝突")

    hr("⑥ 多代理共享記憶層 → OmniNote 彙整摘要")
    # 模擬 smart-ai-router SharedMemoryLayer 的 snapshot（多 agent 對同一 topic 的記憶）
    shared_mem = [
        {"topic": "範圍3排放", "agentId": "esg-analyst", "content": "範圍3 = 供應鏈上下游排放，待盤點", "tags": ["scope3"], "timestamp": datetime.now(timezone.utc).isoformat()},
        {"topic": "範圍3排放", "agentId": "audit-bot", "content": "供應商 A 已回報數據，B 待催", "tags": ["scope3", "supplier"], "timestamp": datetime.now(timezone.utc).isoformat()},
        {"topic": "人權政策", "agentId": "strategy-lead", "content": "政策草稿需納入申诉機制", "tags": ["human-rights"], "timestamp": datetime.now(timezone.utc).isoformat()},
    ]
    ingest = SharedMemoryIngest(hub)
    written = ingest.ingest(shared_mem, run_id="demo")
    for n in written:
        print(f"   寫入 {n.title}  (id={n.id}, origin={n.source_origin})")

    hr("⑦ 5T 對齊")
    print("   Traceable   : 每筆 source_origin = omninote://<endpoint>/<id>")
    print("   Trackable   : events.jsonl 記錄每次同步結果")
    print("   Tangible    : 每筆 .md 可讀、衝突標記可見")
    print("   Transparent : 同步邏輯全開源（本檔 + sync.py）")
    print("   Trustworthy : content_hash + base_hash 3-way merge 決定期權")
    print(f"\n   demo 產出於 {work}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
