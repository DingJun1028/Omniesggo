"""OmniNote — 萬能筆記：Obsidian 共享大腦 電腦/手機/Hermes 三向同步。

正典：docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md + soul.md §1.1 5T。
"""
from .note import OmniNote, content_hash, ENDPOINTS, Endpoint
from .store import NoteStore
from .sync import SyncEngine, SyncResult
from .hermes_bridge import HermesBridge
from .ingest import SharedMemoryIngest

__all__ = ["OmniNote", "content_hash", "ENDPOINTS", "Endpoint",
           "NoteStore", "SyncEngine", "SyncResult", "HermesBridge", "SharedMemoryIngest"]
__version__ = "0.2.0"
