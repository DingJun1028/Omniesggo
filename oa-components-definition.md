# OA-* 四大組件完全定義與集成架構

> 本文件統一 OA 體系四個核心組件的定義與交互邊界。
> 狀態：OA-Local / OA-VPS / OA-Team 為「已證實定義」；
> OAB 於 2026-08-02 由使用者確認 = **OmniAgentBus（跨代理事件總線）**，以下為正式規格。

---

## 1. OA-Local（本機運算與監控層）

### 定義（已證實）
使用者本機（Windows 桌面）上的 Hermes 生態：
- **Hermes 桌面 app**：本機監控、插件、⌘K palette
- **esggo-hub 本機插件**：`desktop-plugins/esggo-hub/plugin.js` + 本機 Python 後端
  （`plugins/esggo-hub/dashboard/plugin_api.py`，掛載於本機 gateway `/api/plugins/esggo-hub/`），
  讀本機 git/檔案狀態，監控 `C:/Project/esggo-learning-center`
- **本機 gateway**：預設 `localhost:8786`
- **用途**：個人監控、本機開發、桌面 UI 控制

### 邊界
- 資料僅本機，不暴露公網
- 經 OAB（OmniAgentBus）與 OA-VPS 交換事件

---

## 2. OA-VPS（雲端源站層）

### 定義（已證實）
OCI ap-singapore-1，`161.118.248.180`（private `10.0.0.73`），Ubuntu 24.04 aarch64，
`/opt/esggo`，Docker 6/6 healthy，Node v22.23.1。
- **Docker 容器**：web / api / Hermes gateway / TencentDB Agent Memory（8420）等
- **TencentDB Agent Memory**：跨機記憶備援（gateway 8420）
- **用途**：生產運算、多人存取、源站部署

### 邊界
- 對外公網經 Cloudflare Tunnel / nginx
- 運算核心，agent 執行的主要場所

---

## 3. OA-Team（萬能代理協作層）

### 定義（已證實）
30 人萬能蜂群（OA-Team 30 Swarm），見 `soul.md` 與 `oa-team-swarm` skill：
- 5 階段 MECE 分工（環境/收集/分析/報告/協調），30 個專精代理
- 5T 協議（Task / Team / Trust / Time / Transfer）+ 4可1不可狀態機
- Hermes Agent delegation（`agents-cli swarm start --agents=30`）
- 最佳實踐覺結界（自動繼承至子代理）

### 邊界
- 是「協調邏輯層」，不是基礎設施
- 可運行於 OA-Local 或 OA-VPS（由部署配置決定），自身不含硬體
- 透過 OAB 發布/訂閱蜂群事件（跨組通訊頻道即建立在 Bus 之上）

---

## 4. OAB = OmniAgentBus（跨代理事件總線）★正式定義

> 2026-08-02 使用者確認：OAB 即 OmniAgentBus。
> 對齊依據：soul.md 第 12.1.1 EventBus 模式 + oa-team-swarm 第 11 節 OmniTag 路由系統。

### 4.1 定位
OAB 是 OA 體系的**事件骨幹（event backbone）**，串聯 OA-Local、OA-VPS、OA-Team 三者：
- 讓 30 蜂群、本機監控、VPS 運算之間以**發布/訂閱**方式解耦通訊
- 取代點對點呼叫，避免 Local/VPS 拓撲變動時改動上層邏輯
- 所有事件攜帶 5T 溯源標籤，可被 OmniTag 路由規則自動分發

### 4.2 事件契約（DomainEvent）
```typescript
interface DomainEvent<T = unknown> {
  id: string;            // Traceable: generateTraceableId(source)
  source: 'oa-local' | 'oa-vps' | 'oa-team';
  sourceId: string;      // 具體代理/容器/插件實例
  type: string;          // 例如 'agent.done' | 'health.check' | 'entropy.tick'
  timestamp: number;     // Time
  tags: OmniTag[];       // 路由依據（見 4.4）
  payload: Readonly<T>;  // Trustworthy: Object.freeze()
}
```

### 4.3 傳輸與部署
| 通道 | 用途 | 協議 |
|------|------|------|
| 本機內部 | OA-Local 內插件↔gateway | WebSocket (localhost:8786) |
| Local↔VPS | 跨機事件 | Cloudflare Tunnel 加密通道 / SSH 轉發 |
| 蜂群內部 | OA-Team 30 代理 | 進程內 event emitter / Redis pub-sub |
| 持久化 | 事件流水 + 重播 | TencentDB Agent Memory (8420) 或 Redis Stream |

### 4.4 OmniTag 路由（來自 oa-team-swarm 第 11 節）
事件依 tags 自動路由：
| Tag 組合 | 路由目標 |
|----------|----------|
| `agent:01-06` + `squad:智庫聖所` | Hindsight / 記憶召回 |
| `agent:07-12` + `squad:符文契約` | API / TypeScript / ZKP 修復 |
| `agent:13-18` + `squad:光之羽翼` | 部署 / cron / 自動化 |
| `agent:19-24` + `squad:煉金熵減` | 重構 / lint / entropy |
| `agent:25-30` + `squad:5T驗算` | ISO / Hash Lock / 稽核 |
| `platform:vps` | OA-VPS 消費者 |
| `platform:esggo` | OA-Local 消費者 |
| `best-practice:結界` | 全部自動 inheriting |

### 4.5 通訊頻道（來自 soul.md 第 4 章，建立在 Bus 之上）
- **萊群廣播**（Broadcast）：蜂后發布全局公告 → 所有訂閱者
- **組內私語**（Unit）：每組專屬頻道
- **雙向橋樑**（Bridge）：配對組間直接通訊
- **專案工作室**（Studio）：臨時專案協作頻道
- **知識花園**（Knowledge）：共享學習資源頻道

### 4.6 參考實作骨架（設計，未部署）
```python
# oab/broker.py — 極簡 OmniAgentBus 骨幹（概念驗證）
import asyncio, json, uuid, time
from typing import Any

class OmniAgentBus:
    def __init__(self):
        self._subs = {}  # topic -> set(handler)

    def publish(self, source: str, source_id: str, etype: str,
                tags: list, payload: Any):
        evt = {
            "id": str(uuid.uuid4()),          # Traceable
            "source": source,
            "sourceId": source_id,
            "type": etype,
            "timestamp": int(time.time() * 1000),
            "tags": tags,
            "payload": payload,               # 呼叫方應先 Object.freeze
        }
        for topic, handlers in self._subs.items():
            if self._match(topic, evt["tags"]):
                for h in handlers:
                    asyncio.create_task(h(evt))
        return evt["id"]

    def subscribe(self, topic: str, handler):
        self._subs.setdefault(topic, set()).add(handler)

    def _match(self, topic: str, tags: list) -> bool:
        # 簡易前綴匹配：topic 'agent:07' 命中 tag 'agent:07-12'
        return any(t.startswith(topic) for t in tags)
```

---

## 5. 集成拓撲（四組件交互）

```
                         ┌─────────────────────────────┐
                         │   OAB = OmniAgentBus        │
                         │   (事件骨幹 / 發布訂閱)        │
                         └─────────────────────────────┘
                            │      │      │
            ┌───────────────┘      │      └───────────────┐
            ▼                      ▼                      ▼
      [OA-Local]            [OA-Team 30 蜂群]         [OA-VPS]
  Hermes桌面app/esggo-hub   5階段MECE/5T協議        OCI 161.118.248.180
  本機gateway:8786          agents-cli swarm        Docker 6/6 / TencentDB:8420
            │                      │                      │
            └──────────────────────┴──────────────────────┘
                           │
                           ▼
                   [外部] Cloudflare Edge / Firebase (ftg.esggo.co)
```

### 資料/事件流向
1. OA-Local 監控本機 → 發 `platform:esggo` 事件上 Bus → OA-VPS 訂閱並寫入 TencentDB Memory
2. OA-Team 蜂群任務完成 → 發 `agent:NN` + `squad:*` 事件 → Bus 依 OmniTag 路由給對應消費者
3. OA-VPS 重運算產出 → 發 `platform:vps` 事件 → OA-Local 訂閱並於桌面 UI 呈現
4. 所有事件經 Bus 持久化（8420），支援離線重播與 5T 稽核

---

## 6. 部署狀態（誠實標示）

| 組件 | 狀態 | 說明 |
|------|------|------|
| OA-Local | ✅ 就緒 | esggo-hub 本機插件 + gateway 已在用 |
| OA-VPS | ✅ 就緒 | Docker 6/6 healthy，TencentDB Memory:8420 運行中 |
| OA-Team | 🔄 定義完整 | swarm 角色/協議已定義，實際 `swarm start` 待授權執行 |
| OAB (OmniAgentBus) | 📐 規格定稿 | 本文件為正式定義；broker 實作骨架待落地部署 |

> 本 session 無 terminal/SSH 執行通道，OAB broker 的實際部署（VPS 上跑 broker、Local 接 Tunnel）
> 需使用者執行或明確授權以 computer_use 於本機 PowerShell 打字操作。
