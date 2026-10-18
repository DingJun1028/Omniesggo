"""OA-Team 30 萬能蜂群 代理註冊表（含雙蜂 60 代理）。

5T 對映:
  Traceable — 每代理含 source_origin / version / updated_at
  Trackable — 更新帶版本號與時間戳
  Tangible  — 代理 id / role / array / visibility 可直接被 CLI 查詢
  Transparent — 註冊表內容與來源標籤公開
  Trustworthy — 註冊表為 append-only；代理行用 hash_lock 封印

來源:
  soul.md §2 30 代理矩陣；OA-TEAM-60-MEMORY-MAPPING.md（31-60 雙蜂對應）
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

# 由 5T 驗證後才能改寫的索引鍵
SOURCE_ORIGIN_CANON = "soul.md::OA-Team-30-Matrix"


@dataclass(frozen=True)
class Agent:
    id: str
    name: str
    role: str
    array: str
    alignment: str          # umbra (01-30) | lumen (31-60)
    archetype: str
    visibility: str         # public | team | restricted | agent
    authorization: Literal['read', 'write', 'approve', 'sealed'] = 'read'
    source_origin: str = SOURCE_ORIGIN_CANON
    version: int = 1
    updated_at: str = ""

    def registry_payload(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "array": self.array,
            "alignment": self.alignment,
            "archetype": self.archetype,
            "visibility": self.visibility,
            "authorization": self.authorization,
            "source_origin": self.source_origin,
            "version": self.version,
            "updated_at": self.updated_at,
        }


# 31-60 雙蜂影像 —— 對照 OA-TEAM-60-MEMORY-MAPPING.md，與 01-30 共用同一 core
# 格式: (name, role, archetype, visibility, auth)
# 包含 01–30 (核心影像) + 31–60 (雙蜂影像)，總計 60 項
_DUAL_HIVE = {
    # ── 策略組核心 (01-06) ──
    "01": ("萬能蜂后", "萬能領導", "Sovereign", "restricted", "sealed"),
    "02": ("萬能規劃蜂", "長遠規劃", "Architect", "restricted", "sealed"),
    "03": ("萬能分析蜂", "數據挖掘", "Oracle", "team", "read"),
    "04": ("萬能策効蜂", "創意思維", "Muse", "team", "read"),
    "05": ("萬能風險蜂", "風險控制", "Sentinel", "team", "read"),
    "06": ("萬能優化蜂", "效率提升", "Alchemist", "agent", "write"),
    # ── 技術組核心 (07-12) ──
    "07": ("萬能編碼蜂", "全端開發", "Smith", "restricted", "sealed"),
    "08": ("萬能算法蜂", "機器學習", "Depth", "restricted", "sealed"),
    "09": ("萬能架構蜂", "雲端架構", "Architect", "restricted", "sealed"),
    "10": ("萬能數據蜂", "資料庫", "Weaver", "agent", "write"),
    "11": ("萬能測試蜂", "自動化測試", "Seer", "agent", "write"),
    "12": ("萬能設計蜂", "UI/UX", "Shaper", "team", "read"),
    # ── 創意組核心 (13-18) ──
    "13": ("萬能圖像蜂", "平面設計", "Painter", "team", "read"),
    "14": ("萬能動畫蜂", "動畫特效", "Flow", "team", "read"),
    "15": ("萬能文案蜂", "文案撰寫", "Narrator", "team", "read"),
    "16": ("萬能音頻蜂", "音樂製作", "Resonator", "team", "read"),
    "17": ("萬能市場蜂", "市場分析", "Herald", "team", "read"),
    "18": ("萬能社群蜂", "用戶管理", "Bridger", "team", "read"),
    # ── 營銷組核心 (19-24) ──
    "19": ("萬能增長蜂", "用戶增長", "Erode", "agent", "write"),
    "20": ("萬能運營蜂", "進度管理", "Nexus", "agent", "write"),
    "21": ("萬能商業分析蜂", "商業洞察", "Skinner", "team", "read"),
    "22": ("萬能探路蜂", "資源探索", "Scout", "team", "read"),
    "23": ("萬能外交蜂", "合作關係", "Wraith", "restricted", "approve"),
    "24": ("萬能調研蜂", "用戶研究", "Lens", "team", "read"),
    # ── 守衛組核心 (25-30) ──
    "25": ("萬能測場蜂", "現場測評", "Purifier", "team", "read"),
    "26": ("萬能追蹤蜂", "競品監控", "Hawk", "agent", "write"),
    "27": ("萬能安全蜂", "資安防護", "Ward", "restricted", "sealed"),
    "28": ("萬能維護蜂", "系統維護", "Curator", "agent", "write"),
    "29": ("萬能支援蜂", "技術支援", "Echo", "agent", "write"),
    "30": ("萬能質控蜂", "品質保障", "Seal", "restricted", "sealed"),
    # ── 策略組雙蜂 (31-36) ──
    "31": ("萬能蜂后", "萬能領導", "Sovereign", "restricted", "sealed"),
    "32": ("萬能規劃蜂", "長遠規劃", "Architect", "restricted", "sealed"),
    "33": ("萬能分析蜂", "數據挖掘", "Oracle", "team", "read"),
    "34": ("萬能策効蜂", "創意思維", "Muse", "team", "read"),
    "35": ("萬能風險蜂", "風險控制", "Sentinel", "team", "read"),
    "36": ("萬能優化蜂", "效率提升", "Alchemist", "agent", "write"),
    # ── 技術組雙蜂 (37-42) ──
    "37": ("萬能編碼蜂", "全端開發", "Smith", "restricted", "sealed"),
    "38": ("萬能算法蜂", "機器學習", "Depth", "restricted", "sealed"),
    "39": ("萬能架構蜂", "雲端架構", "Architect", "restricted", "sealed"),
    "40": ("萬能數據蜂", "資料庫", "Weaver", "agent", "write"),
    "41": ("萬能測試蜂", "自動化測試", "Seer", "agent", "write"),
    "42": ("萬能設計蜂", "UI/UX", "Shaper", "team", "read"),
    # ── 創意組雙蜂 (43-48) ──
    "43": ("萬能圖像蜂", "平面設計", "Painter", "team", "read"),
    "44": ("萬能動畫蜂", "動畫特效", "Flow", "team", "read"),
    "45": ("萬能文案蜂", "文案撰寫", "Narrator", "team", "read"),
    "46": ("萬能音頻蜂", "音樂製作", "Resonator", "team", "read"),
    "47": ("萬能市場蜂", "市場分析", "Herald", "team", "read"),
    "48": ("萬能社群蜂", "用戶管理", "Bridger", "team", "read"),
    # ── 營銷組雙蜂 (49-54) ──
    "49": ("萬能增長蜂", "用戶增長", "Erode", "agent", "write"),
    "50": ("萬能運營蜂", "進度管理", "Nexus", "agent", "write"),
    "51": ("萬能商業分析蜂", "商業洞察", "Skinner", "team", "read"),
    "52": ("萬能探路蜂", "資源探索", "Scout", "team", "read"),
    "53": ("萬能外交蜂", "合作關係", "Wraith", "restricted", "approve"),
    "54": ("萬能調研蜂", "用戶研究", "Lens", "team", "read"),
    # ── 守衛組雙蜂 (55-60) ──
    "55": ("萬能測場蜂", "現場測評", "Purifier", "team", "read"),
    "56": ("萬能追蹤蜂", "競品監控", "Hawk", "agent", "write"),
    "57": ("萬能安全蜂", "資安防護", "Ward", "restricted", "sealed"),
    "58": ("萬能維護蜂", "系統維護", "Curator", "agent", "write"),
    "59": ("萬能支援蜂", "技術支援", "Echo", "agent", "write"),
    "60": ("萬能質控蜂", "品質保障", "Seal", "restricted", "sealed"),
}

_STRATEGY = "策略組"
_TECH = "技術組"
_CREATIVE = "創意組"
_MARKET = "營銷組"
_GUARD = "守衛組"

_AGENTS: list[Agent] = []
_IDX = 0


def _fill(array: str, roles: list[tuple[str, str, str, str, str]]) -> None:
    global _IDX
    for name, role, archetype, visibility, auth in roles:
        _IDX += 1
        _AGENTS.append(
            Agent(
                id=f"{_IDX:02d}",
                name=name,
                role=role,
                array=array,
                alignment="umbra",
                archetype=archetype,
                visibility=visibility,
                authorization=auth,
            )
        )


_STRATEGY_ROLES = [
    ("萬能蜂后", "萬能領導", "Sovereign", "restricted", "sealed"),
    ("萬能規劃蜂", "長遠規劃", "Architect", "restricted", "sealed"),
    ("萬能分析蜂", "數據挖掘", "Oracle", "team", "read"),
    ("萬能策効蜂", "創意思維", "Muse", "team", "read"),
    ("萬能風險蜂", "風險控制", "Sentinel", "team", "read"),
    ("萬能優化蜂", "效率提升", "Alchemist", "agent", "write"),
]
_TECH_ROLES = [
    ("萬能編碼蜂", "全端開發", "Smith", "restricted", "sealed"),
    ("萬能算法蜂", "機器學習", "Depth", "restricted", "sealed"),
    ("萬能架構蜂", "雲端架構", "Architect", "restricted", "sealed"),
    ("萬能數據蜂", "資料庫", "Weaver", "agent", "write"),
    ("萬能測試蜂", "自動化測試", "Seer", "agent", "write"),
    ("萬能設計蜂", "UI/UX", "Shaper", "team", "read"),
]
_CREATIVE_ROLES = [
    ("萬能圖像蜂", "平面設計", "Painter", "team", "read"),
    ("萬能動畫蜂", "動畫特效", "Flow", "team", "read"),
    ("萬能文案蜂", "文案撰寫", "Narrator", "team", "read"),
    ("萬能音頻蜂", "音樂製作", "Resonator", "team", "read"),
    ("萬能市場蜂", "市場分析", "Herald", "team", "read"),
    ("萬能社群蜂", "用戶管理", "Bridger", "team", "read"),
]
_MARKET_ROLES = [
    ("萬能增長蜂", "用戶增長", "Erode", "agent", "write"),
    ("萬能運營蜂", "進度管理", "Nexus", "agent", "write"),
    ("萬能商業分析蜂", "商業洞察", "Skinner", "team", "read"),
    ("萬能探路蜂", "資源探索", "Scout", "team", "read"),
    ("萬能外交蜂", "合作關係", "Wraith", "restricted", "approve"),
    ("萬能調研蜂", "用戶研究", "Lens", "team", "read"),
]
_GUARD_ROLES = [
    ("萬能測場蜂", "現場測評", "Purifier", "team", "read"),
    ("萬能追蹤蜂", "競品監控", "Hawk", "agent", "write"),
    ("萬能安全蜂", "資安防護", "Ward", "restricted", "sealed"),
    ("萬能維護蜂", "系統維護", "Curator", "agent", "write"),
    ("萬能支援蜂", "技術支援", "Echo", "agent", "write"),
    ("萬能質控蜂", "品質保障", "Seal", "restricted", "sealed"),
]

_ARRAY_FOR_ID = {str(i): _STRATEGY for i in range(1, 7)}
_ARRAY_FOR_ID.update({str(i): _TECH for i in range(7, 13)})
_ARRAY_FOR_ID.update({str(i): _CREATIVE for i in range(13, 19)})
_ARRAY_FOR_ID.update({str(i): _MARKET for i in range(19, 25)})
_ARRAY_FOR_ID.update({str(i): _GUARD for i in range(25, 31)})
_ARRAY_FOR_ID.update({str(i): _STRATEGY for i in range(31, 37)})
_ARRAY_FOR_ID.update({str(i): _TECH for i in range(37, 43)})
_ARRAY_FOR_ID.update({str(i): _CREATIVE for i in range(43, 49)})
_ARRAY_FOR_ID.update({str(i): _MARKET for i in range(49, 55)})
_ARRAY_FOR_ID.update({str(i): _GUARD for i in range(55, 61)})


def _dual(idx: int, name: str, role: str, archetype: str, visibility: str, auth: str) -> None:
    global _IDX
    _IDX = idx
    _AGENTS.append(
        Agent(
            id=f"{idx:02d}",
            name=name,
            role=role,
            array=_ARRAY_FOR_ID[str(idx)],
            alignment="lumen",
            archetype=archetype,
            visibility=visibility,
            authorization=auth,
        )
    )


def build() -> list[Agent]:
    """建立 30 + 30 = 60 代理註冊表。"""
    global _IDX
    _IDX = 0
    _fill(_STRATEGY, _STRATEGY_ROLES)
    _fill(_TECH, _TECH_ROLES)
    _fill(_CREATIVE, _CREATIVE_ROLES)
    _fill(_MARKET, _MARKET_ROLES)
    _fill(_GUARD, _GUARD_ROLES)
    for i in range(31, 61):
        _dual(
            i,
            _DUAL_HIVE[str(i)][0],
            _DUAL_HIVE[str(i)][1],
            _DUAL_HIVE[str(i)][2],
            _DUAL_HIVE[str(i)][3],
            _DUAL_HIVE[str(i)][4],
        )
    return _AGENTS


def by_id(reg: list[Agent], agent_id: str) -> Agent | None:
    for a in reg:
        if a.id == agent_id:
            return a
    return None
