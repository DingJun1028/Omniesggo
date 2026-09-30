#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OAB (OmniAgentBus) — OA-Twins 事件總線 / 雙子核心 / 純 stdlib

═══════════════════════════════════════════════════════════════════════
CONSTITUTION — 貫徹始終的不成文規定
═══════════════════════════════════════════════════════════════════════
1. 5T：Traceable(_origin) / Trackable(journal+replay) / Tangible(可渲染)
        / Transparent(路由公開) / Trustworthy(不可變)
2. 4可1不可：可自理 / 可協作 / 可演化 / 可溯源；❌ 不可篡改
3. 熵控 < 0.1：bus.entropy() + journal 容量上限，兩者皆需健康
4. 零幻覺：所有輸出皆源於真實事件；health 失敗就報 !! 並回傳非零碼
5. OmniTag 路由：platform:* / agent:* / squad:* 前綴匹配
═══════════════════════════════════════════════════════════════════════
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
import time
import uuid
from typing import Any, Callable, Dict, Iterable, List, Optional, Set

HEARTBEAT_TAGS = ["platform:esggo", "agent:13", "squad:光之羽翼"]
DEFAULT_MAX_JOURNAL_BYTES = 32 * 1024 * 1024  # 32MB，預設每輪替
DEFAULT_KEEP_ARCHIVES = 5                      # 保留最近 N 輪替封存檔
DEFAULT_MAX_ARCHIVE_BYTES = 256 * 1024 * 1024  # 封存檔總量上限（避免無限長大）

# 已開啟的 journal 路徑（單寫者保護，見 OmniAgentBus.__init__）
_OPEN_JOURNALS: Set[str] = set()


def _fmt_size(n: int) -> str:
    """人類可讀大小（避免 2048 bytes 顯示成『0MB』）。"""
    if n < 1024:
        return f"{n}B"
    if n < 1048576:
        return f"{n / 1024:.0f}KB"
    return f"{n / 1048576:.0f}MB"


# ── DomainEvent ────────────────────────────────────────────────────────
class DomainEvent:
    """不可變事件物件。寫入後不可更改 —— 「不可篡改」的第一道閘。"""

    __slots__ = ("id", "source", "sourceId", "type", "timestamp", "tags", "payload", "_origin")

    def __init__(self, id: str, source: str, sourceId: str, typ: str,
                 timestamp: float, tags: List[str], payload: Dict[str, Any],
                 origin: Dict[str, Any]):
        object.__setattr__(self, "id", id)
        object.__setattr__(self, "source", source)
        object.__setattr__(self, "sourceId", sourceId)
        object.__setattr__(self, "type", typ)
        object.__setattr__(self, "timestamp", timestamp)
        object.__setattr__(self, "tags", tuple(tags))
        object.__setattr__(self, "payload", payload)
        object.__setattr__(self, "_origin", origin)

    def __setattr__(self, *a: Any) -> None:  # 凍結
        raise AttributeError("DomainEvent 不可變（4可1不可：❌不可篡改）")

    def to_dict(self) -> Dict[str, Any]:
        return {"id": self.id, "source": self.source, "sourceId": self.sourceId,
                "type": self.type, "timestamp": self.timestamp,
                "tags": list(self.tags), "payload": self.payload, "_origin": self._origin}

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "DomainEvent":
        return DomainEvent(d["id"], d["source"], d["sourceId"], d["type"],
                           d["timestamp"], d.get("tags", []), d.get("payload", {}),
                           d.get("_origin", {}))

    def match(self, pat: str) -> bool:
        if pat == "*":
            return True
        if pat.endswith("*"):
            return self.type.startswith(pat[:-1]) or any(
                t.startswith(pat[:-1]) for t in self.tags)
        return self.type == pat or pat in self.tags

    def __repr__(self) -> str:
        return f"<Event {self.type} src={self.source} tags={list(self.tags)}>"


# ── Bus ────────────────────────────────────────────────────────────────
class OmniAgentBus:
    """事件總線。單節點可自理；link() 跨節點可協作。"""

    def __init__(self, instance: str = "local", store: Optional[str] = None,
                 target_entropy: float = 0.1,
                 max_journal_bytes: int = DEFAULT_MAX_JOURNAL_BYTES,
                 keep_archives: int = DEFAULT_KEEP_ARCHIVES,
                 max_archive_bytes: int = DEFAULT_MAX_ARCHIVE_BYTES,
                 quiet: bool = False):
        self.instance = instance
        self.bus = instance                 # 事件 source 標記
        self.target_entropy = target_entropy
        self.max_journal_bytes = max_journal_bytes
        self.keep_archives = keep_archives
        self.max_archive_bytes = max_archive_bytes                          
        self.quiet = quiet
        self._sub: Dict[str, List[Callable]] = {}
        self._journal: List[DomainEvent] = []
        self.delivered = 0                  # Trackable：投遞計數
        self.dropped = 0                    # Trackable：無訂閱者而丟棄
        self.rotations = 0                  # Trackable：輪替次數
        self.pruned = 0                     # Trackable：清退的封存檔數
        self.started_at = time.time()
        self._path = None
        self._fh = None
        self._written = 0
        self._owns_journal = False
        if store:
            os.makedirs(store, exist_ok=True)
            self._path = os.path.join(store, f"{instance}.oab.jsonl")
            # 單寫者保護：同一 journal 同時只准一個 bus 實例。
            # 兩個實例各自持有檔案 handle 時，輪替的 os.replace 會撞上
            # Windows 的 WinError 32；在 Linux/POSIX 上更糟 —— replace 會
            # 成功，另一個 handle 繼續寫進「已被改名」的幽靈檔，資料分流、
            # journal_bytes 與實際內容對不上（split-brain）。
            key = os.path.abspath(self._path)
            if key in _OPEN_JOURNALS:
                raise RuntimeError(
                    f"journal 已被另一個 bus 實例開啟：{self._path}。"
                    f"請先 close() 前一個實例 —— 同一 journal 只允許單一寫者。")
            _OPEN_JOURNALS.add(key)
            self._owns_journal = True
            self._fh = open(self._path, "a", encoding="utf-8")
            if os.path.exists(self._path):
                self._written = os.path.getsize(self._path)

    # ── 可協作 ──────────────────────────────────────────────────────
    def subscribe(self, topic: str, handler: Callable) -> None:
        self._sub.setdefault(topic, []).append(handler)

    async def publish(self, source: str, typ: str, tags: Iterable[str],
                      payload: Dict[str, Any], sourceId: str = "twin") -> DomainEvent:
        evt = DomainEvent(
            id=uuid.uuid4().hex, source=source, sourceId=sourceId, typ=typ,
            timestamp=time.time() * 1000, tags=list(tags), payload=payload,
            origin={"source": source, "instance": self.instance, "pid": os.getpid(),
                    "wall": time.strftime("%Y-%m-%dT%H:%M:%S")})
        self._journal.append(evt)
        self._append(evt)

        handlers: List[Callable] = []
        for pat, hs in self._sub.items():
            if evt.match(pat):
                handlers.extend(hs)
        if not handlers:
            self.dropped += 1
        for h in handlers:
            self.delivered += 1
            try:
                r = h(evt)
                if asyncio.iscoroutine(r):
                    await r
            except Exception as exc:  # 不讓單一壞 handler 拖垮匯流排
                print(f"  ✗ handler 錯誤 [{typ}]: {exc}", file=sys.stderr)
        return evt

    # ── 可溯源：append-only journal ────────────────────────────────
    def _append(self, evt: DomainEvent) -> None:
        if not self._fh:
            return
        line = json.dumps(evt.to_dict(), ensure_ascii=False) + "\n"
        self._fh.write(line)
        self._fh.flush()
        self._written += len(line.encode("utf-8"))
        if self.max_journal_bytes and self._written >= self.max_journal_bytes:
            self._rotate()

    def _rotate(self) -> None:
        """輪替：整份搬走、另開新檔。原檔不重寫（❌不可篡改）。"""
        assert self._fh and self._path
        self._fh.close()
        stem, suffix = os.path.splitext(self._path)
        stamp = time.strftime("%Y%m%dT%H%M%S")
        archive = f"{stem}.{stamp}{suffix}"
        n = 1
        while os.path.exists(archive):
            archive = f"{stem}.{stamp}.{n}{suffix}"
            n += 1
        os.replace(self._path, archive)
        sealed_bytes = os.path.getsize(archive)
        self._fh = open(self._path, "a", encoding="utf-8")
        self._written = 0
        self.rotations += 1
        self._prune(stem, suffix, quiet=self.quiet)
        if not self.quiet:
            print(f"  ♻️ journal 已輪替 → {os.path.basename(archive)} "
                  f"(封存 {sealed_bytes} bytes)")

    def _prune(self, stem: str, suffix: str, quiet: bool = False) -> None:
        if self.keep_archives <= 0:
            return
        base = os.path.basename(stem)
        folder = os.path.dirname(self._path) or "."
        # 只認「base.TIMESTAMP[.N].ext」一種形狀，避免誤刪同目錄其他檔。
        # 樣式由 _archive_pattern() 單一出處（與 journal_bytes 共用）。
        pattern = self._archive_pattern()
        if pattern is None:
            return
        # 依 mtime 排序（名稱的 .N 後綴會破壞字典序，會誤刪最新封存檔）
        archives = sorted(
            (p for p in os.listdir(folder) if pattern.match(p)),
            key=lambda p: os.path.getmtime(os.path.join(folder, p)),
            reverse=True)
        # 雙重上限：先守「保留 N 份」，再守「封存總量不超 max_archive_bytes」
        # （僅靠 N 份無法阻止 32MB×N 的無上限膨脹）
        keep = self.keep_archives
        budget = self.max_archive_bytes
        total = 0
        survivors: List[str] = []
        for name in archives:
            if len(survivors) >= keep:
                break
            size = os.path.getsize(os.path.join(folder, name))
            if survivors and total + size > budget:
                break
            survivors.append(name)
            total += size
        for stale in archives:
            if stale in survivors:
                continue
            os.remove(os.path.join(folder, stale))
            self.pruned += 1
            if not quiet:
                print(f"  🗑️ 清退過期封存檔 {stale}")

    def _archive_pattern(self) -> "Optional[re.Pattern]":
        """封存檔名的唯一正則來源（_rotate / _prune / journal_bytes 共用）。

        教訓：journal_bytes 曾自行用「完整檔名 + 時間戳」組正則，而 _rotate 實際
        產生的是「去副檔名 + 時間戳 + 副檔名」—— 兩份各自維護的樣式漂移，讓
        36MB 封存檔不被計入，healthy 再次變成假綠。
        """
        if not self._path:
            return None
        folder = os.path.dirname(self._path) or "."
        stem, suffix = os.path.splitext(os.path.basename(self._path))
        return re.compile(
            re.escape(stem) + r"\.\d{8}T\d{6}(?:\.\d+)?" + re.escape(suffix) + r"\Z")

    def _archive_bytes(self) -> int:
        """僅封存檔的 bytes（不含現行檔）。"""
        pattern = self._archive_pattern()
        if not self._path or pattern is None:
            return 0
        folder = os.path.dirname(self._path) or "."
        return sum(os.path.getsize(os.path.join(folder, n))
                   for n in os.listdir(folder) if pattern.match(n))

    def journal_bytes(self) -> int:
        """journal 目前的真實 bytes（含封存檔），供 /health 真實回報。"""
        if not self._path:
            return 0
        total = os.path.getsize(self._path) if os.path.exists(self._path) else 0
        pattern = self._archive_pattern()
        if pattern is None:
            return total
        folder = os.path.dirname(self._path) or "."
        for name in os.listdir(folder):
            if pattern.match(name):
                total += os.path.getsize(os.path.join(folder, name))
        return total

    async def replay(self) -> List[DomainEvent]:
        return list(self._journal)

    def close(self) -> None:
        if self._fh:
            self._fh.close()
            self._fh = None
        if getattr(self, "_owns_journal", False) and self._path:
            _OPEN_JOURNALS.discard(os.path.abspath(self._path))
            self._owns_journal = False

    # ── 熵控 ────────────────────────────────────────────────────────
    def entropy(self) -> float:
        """同 topic 多重訂閱造成的路由重複度。
        ⚠ 單一訂閱者時恆為 0.0 —— 不可單獨當健康依據，須與 journal 容量併用。"""
        return sum(max(0, len(h) - 1) for h in self._sub.values())

    def stats(self) -> Dict[str, Any]:
        return {
            "instance": self.instance,
            "uptime_s": round(time.time() - self.started_at, 1),
            "events": len(self._journal),
            "delivered": self.delivered,
            "dropped": self.dropped,
            "topics": len(self._sub),
            "entropy": round(self.entropy(), 4),
            "entropy_target": self.target_entropy,
            # journal_bytes = 磁碟真值（現行檔）。⚠ 勿再填 _written：
            # 那是「本次開檔後寫入量」，輪替後歸零，會讓 /health 假綠。
            "journal_bytes": self.journal_bytes() - self._archive_bytes(),
            "journal_total_bytes": self.journal_bytes(),
            "written_since_open": self._written,
            "journal_max_bytes": self.max_journal_bytes,
            "max_archive_bytes": self.max_archive_bytes,
            "rotations": self.rotations,
            "pruned_archives": self.pruned,
            "healthy": self.healthy,
        }

    @property
    def healthy(self) -> bool:
        """健康 = 熵達標 且 容量未爆。

        ⚠ 兩種容量要各拿自己的上限比：現行檔對 max_journal_bytes（輪替門檻），
        含封存總量對 max_archive_bytes（清退預算）。曾拿「含封存總量」去比
        「單檔門檻」，只要有 1 份封存就恆紅 —— 明明輪替正常運作卻長期報錯。
        """
        return (self.entropy() < self.target_entropy
                and self.journal_bytes() - self._archive_bytes() < self.max_journal_bytes
                and self.journal_bytes() < self.max_archive_bytes)


# ── 雙子橋 ────────────────────────────────────────────────────────────
def link_twins(a: OmniAgentBus, b: OmniAgentBus) -> None:
    """雙向橋：只轉送「原生於來源節點」的事件 → 不回圈、不改寫 source。"""
    def _make(src: OmniAgentBus, dst: OmniAgentBus) -> Callable:
        async def _relay(evt: DomainEvent) -> None:
            if evt.source != src.bus:      # 轉送而來的一律不回送
                return
            await dst.publish(src.bus, evt.type, evt.tags, evt.payload, evt.sourceId)
        return _relay

    a.subscribe("*", _make(a, b))
    b.subscribe("*", _make(b, a))


# ── 內建回歸自檢（零幻覺：真的跑過才算） ───────────────────────────────
async def self_test() -> None:
    bus = OmniAgentBus("test")
    got: List[DomainEvent] = []
    assert bus.entropy() == 0.0
    bus.subscribe("feature:*", got.append)
    bus.subscribe("platform:esggo", got.append)
    await bus.publish("test", "feature.a", ["platform:esggo", "agent:01"], {"n": 1})
    assert len(got) == 1, f"訂閱不符：{len(got)}"
    await bus.publish("test", "unrelated.b", ["squad:x"], {})
    assert len(got) == 1, "非匹配事件誤投遞"
    await bus.publish("test", "feature.b", ["platform:esggo"], {"n": 2})
    assert len(got) == 2
    assert len(await bus.replay()) == 3, "journal 條數錯誤"
    e0 = (await bus.replay())[0]
    assert e0._origin["source"] == "test" and e0.id
    try:
        e0.payload = {"tampered": True}
        raise SystemExit("❌ DomainEvent 竟可竄改")
    except AttributeError:
        pass
    print("  ✓ self-test 通過（訂閱/匹配/journal/不可篡改）")


async def twin_self_test() -> None:
    a, b = OmniAgentBus("oa-local"), OmniAgentBus("oa-vps")
    link_twins(a, b)
    await a.publish("oa-local", "demo.evt", ["platform:esggo"], {"from": "a"})
    await b.publish("oa-vps", "demo.evt", ["platform:vps"], {"from": "b"})
    ra, rb = await a.replay(), await b.replay()
    assert len(ra) == 2, f"a 應收 2（自身+轉送），實得 {len(ra)}"
    assert len(rb) == 2, f"b 應收 2（自身+轉送），實得 {len(rb)}"
    assert any(e._origin["source"] == "oa-vps" for e in ra), "a 未收到 oa-vps 事件"
    assert any(e._origin["source"] == "oa-local" for e in rb), "b 未收到 oa-local 事件"
    assert all(e.source != "oa-local" for e in ra if e._origin["source"] == "oa-vps"), "source 被改寫"
    print("  ✓ 雙子橋通過（雙向轉送 / 防回圈 / source 不可變）")


def rotate_self_test() -> None:
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        bus = OmniAgentBus("rot", store=d, max_journal_bytes=2048, keep_archives=2,
                           quiet=True)
        for i in range(200):
            bus._append(DomainEvent(uuid.uuid4().hex, "rot", "t", f"e{i}", time.time() * 1000,
                                    [], {"i": i, "pad": "x" * 120}, {}))
        bus.close()
        files = sorted(os.listdir(d))
        sealed = [f for f in files if f != "rot.oab.jsonl"]
        assert bus.rotations >= 5, f"輪替次數不足：{bus.rotations}"
        assert len(sealed) <= 2, f"封存檔未依 keep_archives 清退：{sealed}"
        assert os.path.getsize(os.path.join(d, "rot.oab.jsonl")) < 2048 * 2, "新檔未從零重啟"
        for f in sealed:  # 封存檔必須仍是完整可讀 JSONL
            with open(os.path.join(d, f), encoding="utf-8") as fh:
                for line in fh:
                    if line.strip():
                        json.loads(line)
        print(f"  ✓ 輪替通過（rotations={bus.rotations}, 封存={len(sealed)}, "
              f"pruned={bus.pruned}）")


async def field_shape_self_test() -> None:
    """守住 publish() 參數對齊 —— 必須跑「真正的 heartbeat 呼叫點」。

    教訓：heartbeat 曾多傳一個 "twin" 字面值，導致 type='twin'、tags 被逐字元
    迭代成 16 元素清單、payload/sourceId 整組錯位。
    ⚠ 第一版測試只驗「手動 publish 的正確用法」，完全沒觸及 heartbeat 那一行，
    所以 bug 存在時測試照樣全綠 —— 等於沒有防護。現直接跑 emit_heartbeat()。
    """
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        bus = OmniAgentBus("shape", store=d, quiet=True)
        try:
            await emit_heartbeat(bus, 1)
            evt = (await bus.replay())[0]
            # tags 內部存成 tuple；重點是「元素正確且未被逐字元拆開」
            assert evt.type == "health.heartbeat", f"type 錯位：{evt.type!r}"
            assert tuple(evt.tags) == tuple(HEARTBEAT_TAGS), f"tags 錯位：{evt.tags!r}"
            assert len(evt.tags) == 3, f"tags 被逐字元拆開：{len(evt.tags)} 個 → {evt.tags!r}"
            assert evt.sourceId == "twin", f"sourceId 錯位：{evt.sourceId!r}"
            assert evt.source == "shape", f"source 錯位：{evt.source!r}"
            for k in ("seq", "wall", "uptime_s", "entropy", "journal_bytes",
                      "journal_total_bytes", "delivered", "rotations", "healthy"):
                assert k in evt.payload, f"payload 缺 {k}：{sorted(evt.payload)}"
            assert evt.payload["seq"] == 1, f"payload 整組錯位：{evt.payload!r}"
        finally:
            bus.close()   # Windows 上不關檔handle會讓 tempdir 清理失敗

        # journal_bytes 必須是「真實磁碟 bytes（含封存）」，而非 _written 計數器。
        # 教訓：該方法曾被重複定義，後者覆蓋前者（回傳 _written），
        # 使 36MB 的真實用量被回報成 0 → healthy 恆綠。
        b2 = OmniAgentBus("shape", store=d, quiet=True)
        try:
            real = b2.journal_bytes()
            on_disk = os.path.getsize(os.path.join(d, "shape.oab.jsonl"))
            assert real == on_disk, f"journal_bytes={real} ≠ 磁碟 {on_disk}"

            # 含封存：先強制輪替產出封存檔，再確認 journal_bytes 把封存算進去。
            # 教訓：journal_bytes 曾因正則樣式漂移（完整檔名 vs 去副檔名）漏算封存，
            # 36MB 封存被當成 0 → healthy 假綠。
            b2._written = b2.max_journal_bytes     # 觸發下一筆就輪替
            await b2.publish("shape", "health.heartbeat", HEARTBEAT_TAGS, {"n": 2})
            archives = [f for f in os.listdir(d)
                        if b2._archive_pattern() and b2._archive_pattern().match(f)]
            assert archives, "輪替未產生封存檔（測試前提失敗）"
            expect = sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d)
                         if f.startswith("shape.oab") and f.endswith(".jsonl"))
            got = b2.journal_bytes()
            assert got == expect, f"journal_bytes={got} ≠ 含封存真值 {expect}"

            # healthy 語意：有封存時必須「綠」（輪替正常）。曾拿含封存總量去比
            # 單檔門檻，只要 1 份封存就恆紅。用極小單檔門檻逼出封存再驗綠燈。
            # 另開 tempdir：同一 journal 不准兩個 bus 同時寫（見單寫者保護）。
            with tempfile.TemporaryDirectory() as d3:
                b3 = OmniAgentBus("shape", store=d3, quiet=True, max_journal_bytes=1)
                try:
                    await b3.publish("shape", "health.heartbeat", HEARTBEAT_TAGS, {"n": 3})
                    b3._written = b3.max_journal_bytes
                    await b3.publish("shape", "health.heartbeat", HEARTBEAT_TAGS, {"n": 4})
                    assert b3.rotations >= 1, "測試前提失敗：未輪替"
                    assert b3.journal_bytes() > b3.max_journal_bytes, "測試前提失敗：總量未超單檔門檻"
                    assert b3.healthy is True, (
                        f"有封存時 healthy 應為 True（輪替正常），實得 {b3.healthy}")

                    # stats() 的 journal_bytes 必須是「磁碟真值」而非 _written 計數器。
                    # 開檔後再由外部handle追加一段（模擬他程式寫入/殘留資料），
                    # 計數器不會知道，磁碟真值會 —— 兩者才拉得開。
                    with open(os.path.join(d3, "shape.oab.jsonl"), "a", encoding="utf-8") as fh:
                        fh.write('{"type":"oob"}\n')
                    st = b3.stats()
                    live = os.path.getsize(os.path.join(d3, "shape.oab.jsonl"))
                    assert st["journal_bytes"] == live, (
                        f"stats.journal_bytes={st['journal_bytes']} ≠ 磁碟真值 {live}")
                    assert st["journal_bytes"] != st["written_since_open"], (
                        "journal_bytes 與計數器同值 → 本斷言無法區分，測試無效")

                    # 單寫者保護：第二個 bus 開同一 journal 必須被擋（否則 split-brain）
                    try:
                        OmniAgentBus("shape", store=d3, quiet=True)
                        raise AssertionError("第二個 bus 未被擋下 —— 單寫者保護失效")
                    except RuntimeError:
                        pass
                finally:
                    b3.close()
                # close 後應可重新開啟
                b3b = OmniAgentBus("shape", store=d3, quiet=True)
                b3b.close()
        finally:
            b2.close()
        print("  ✓ 欄位對齊通過（heartbeat 真實呼叫點 / tags 未被拆開 / "
              "journal_bytes=磁碟真值含封存）")


async def emit_heartbeat(bus: "OmniAgentBus", seq: int) -> None:
    """發一次心跳。抽出成函式是為了讓自檢能驗到「真正的呼叫點」。

    ⚠ 這裡的 publish() 參數順序曾被寫錯（多傳一個 "twin"），造成 type/tags/
    payload 整組錯位，而舊測試只驗「有收到事件」所以完全漏掉。改動此行前
    請先跑 --field-test。
    """
    s = bus.stats()
    await bus.publish(bus.bus, "health.heartbeat", HEARTBEAT_TAGS, {
        "seq": seq,
        "wall": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "uptime_s": s["uptime_s"],
        "entropy": s["entropy"],
        "journal_bytes": s["journal_bytes"],
        "journal_total_bytes": s["journal_total_bytes"],
        "delivered": s["delivered"],
        "rotations": s["rotations"],
        "pruned_archives": s["pruned_archives"],
        "healthy": s["healthy"],
    })
    return s


# ── CLI ────────────────────────────────────────────────────────────────
async def _amain() -> int:
    ap = argparse.ArgumentParser(description="OAB — OA-Twins 事件總線")
    ap.add_argument("--bus", default="local", help="匯流排名稱（= 事件 source）")
    ap.add_argument("--instance", default=None,
                    help="實例名（預設同 --bus）。⚠ 若填不同值會寫出「另一個」journal 檔名，"
                         "舊檔將被孤立且不再輪替 —— 除刻意分檔外請勿設定。")
    ap.add_argument("--store", default=None, help="journal 目錄")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--twin-test", action="store_true")
    ap.add_argument("--rotate-test", action="store_true", help="輪替/清退自檢（不碰正式 journal）")
    ap.add_argument("--field-test", action="store_true", help="欄位對齊自檢（不碰正式 journal）")
    ap.add_argument("--heartbeat", action="store_true", help="持續心跳")
    ap.add_argument("--count", type=int, default=0, help="心跳次數（0=無限）")
    ap.add_argument("--interval", type=float, default=5.0, help="心跳間隔秒（預設 5）")
    ap.add_argument("--stats", action="store_true", help="印出統計後結束")
    ap.add_argument("--max-journal-bytes", type=int, default=DEFAULT_MAX_JOURNAL_BYTES)
    ap.add_argument("--keep-archives", type=int, default=DEFAULT_KEEP_ARCHIVES)
    ap.add_argument("--max-archive-bytes", type=int, default=DEFAULT_MAX_ARCHIVE_BYTES)
    args = ap.parse_args()

    if args.self_test:
        await self_test()
    if args.twin_test:
        await twin_self_test()
    if args.rotate_test:
        rotate_self_test()
    if args.field_test:
        await field_shape_self_test()
    if args.self_test or args.twin_test or args.rotate_test or args.field_test:
        return 0

    bus = OmniAgentBus(args.instance or args.bus, store=args.store,
                       max_journal_bytes=args.max_journal_bytes,
                       keep_archives=args.keep_archives,
                       max_archive_bytes=args.max_archive_bytes)

    if args.stats:
        print(json.dumps(bus.stats(), ensure_ascii=False, indent=2))
        bus.close()
        return 0

    if args.heartbeat:
        print(f"OAB {bus.bus} 心跳中 (Ctrl+C 停止)")
        print(f"   journal={args.store or '（記憶體，不落地）'} | "
              f"輪替上限={_fmt_size(args.max_journal_bytes)} | "
              f"封存保留={args.keep_archives} 份/{_fmt_size(args.max_archive_bytes)}")
        seq = 0
        try:
            while args.count == 0 or seq < args.count:
                seq += 1
                s = await emit_heartbeat(bus, seq)
                if args.count and seq >= args.count:
                    break
                if seq % 12 == 0:   # 每分鐘報一次真實狀態
                    print(f"   #{seq} journal {s['journal_bytes'] // 1024}KB"
                          f" / {s['journal_total_bytes'] // 1024}KB (含封存) "
                          f"rot={s['rotations']} pruned={s['pruned_archives']} "
                          f"healthy={s['healthy']}")
                await asyncio.sleep(args.interval)
        except KeyboardInterrupt:
            print(f"\n停止。{json.dumps(bus.stats(), ensure_ascii=False)}")
        bus.close()
        return 0

    print("OAB 閒置中。用 --heartbeat / --self-test / --twin-test / --stats。")
    bus.close()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(_amain()))
    except KeyboardInterrupt:
        sys.exit(130)
