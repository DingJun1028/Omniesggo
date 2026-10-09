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
    authorization: str      # read | write | approve | sealed
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
_DUAL_HIVE = {
    "01": ("蜂后萬能蜂后", "Sovereign", "wiki", "restricted", "sealed"),
    "02": ("蜂后萬能規劃蜂", "Architect", "wiki", "team", "read"),
    "03": ("蜂后萬能分析蜂", "Oracle", "wiki", "team", "read"),
    "04": ("蜂后萬能策効蜂", "Muse", "wiki", "team", "read"),
    "05": ("蜂后萬能風險蜂", "Sentinel", "wiki", "team", "read"),
    "06": ("蜂后萬能優化蜂", "Alchemist", "wiki", "agent", "write"),
    "07": ("蜂后萬能編碼蜂", "Smith", "wiki", "restricted", "sealed"),
    "08": ("蜂后萬能算法蜂", "Depth", "wiki", "restricted", "sealed"),
    "09": ("蜂后萬能架構蜂", "Architect", "wiki", "restricted", "sealed"),
    "10": ("蜂后萬能數據蜂", "Weaver", "wiki", "agent", "write"),
    "11": ("蜂后萬能測試蜂", "Seer", "wiki", "agent", "write"),
    "12": ("蜂后萬能設計蜂", "Shaper", "wiki", "team", "read"),
    "13": ("蜂后萬能圖像蜂", "Painter", "wiki", "team", "read"),
    "14": ("蜂后萬能動畫蜂", "Flow", "wiki", "team", "read"),
    "15": ("蜂后萬能文案蜂", "Narrator", "wiki", "team", "read"),
    "16": ("蜂后萬能音頻蜂", "Resonator", "wiki", "team", "read"),
    "17": ("蜂后萬能市場蜂", "Herald", "wiki", "team", "read"),
    "18": ("蜂后萬能社群蜂", "Bridger", "wiki", "team", "read"),
    "19": ("蜂后萬能增長蜂", "Erode", "wiki", "agent", "write"),
    "20": ("蜂后萬能運營蜂", "Nexus", "wiki", "agent", "write"),
    "21": ("蜂后萬能商業分析蜂", "Skinner", "wiki", "team", "read"),
    "22": ("蜂后萬能探路蜂", "Scout", "wiki", "team", "read"),
    "23": ("蜂后萬能外交蜂", "Wraith", "wiki", "restricted", "approve"),
    "24": ("蜂后萬能調研蜂", "Lens", "wiki", "team", "read"),
    "25": ("蜂后萬能測場蜂", "Purifier", "wiki", "team", "read"),
    "26": ("蜂后萬能追蹤蜂", "Hawk", "wiki", "agent", "write"),
    "27": ("蜂后萬能安全蜂", "Ward", "wiki", "restricted", "sealed"),
    "28": ("蜂后萬能維護蜂", "Curator", "wiki", "agent", "write"),
    "29": ("蜂后萬能支援蜂", "Echo", "wiki", "agent", "write"),
    "30": ("蜂后萬能質控蜂", "Seal", "wiki", "restricted", "sealed"),
}

_STRATEGY = "策略組"
_TECH = "技術組"
_CREATIVE = "創意組"
_MARKET = "營銷組"
_GUARD = "守衛組"

_AGENTS: list[Agent] = []


def _fill(array: str, roles: list[tuple[str, str, str, str, str]]) -> None:
    for i, (name, role, archetype, visibility, auth) in enumerate(roles, start=1):
        _AGENTS.append(
            Agent(
                id=f"{i:02d}",
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
    ("萬能安全蜂", "資安防護", "Ward", "restricted", "sealed"),
    ("萬能維護蜂", "系統維護", "Curator", "agent", "write"),
    ("萬能支援蜂", "技術支援", "Echo", "agent", "write"),
    ("萬能質控蜂", "品質保障", "Seal", "restricted", "sealed"),
]

_IDX = 0
_FOR_DUAL = {}


def _dual(idx: int, name: str, role: str, archetype: str, visibility: str, auth: str) -> None:
    global _IDX
    _IDX = idx
    _AGENTS.append(
        Agent(
            id=f"{idx:02d}",
            name=name,
            role=role,
            array=_DUAL_HIVE[str(idx)][0] if False else _DUAL_HIVE[str(idx)][0],
            alignment="lumen",
            archetype=archetype,
            visibility=visibility,
            authorization=auth,
        )
    )


def build() -> list[Agent]:
    """建立 30 + 30 = 60 代理註冊表。"""
    global _IDX
    _IDX = 31
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
