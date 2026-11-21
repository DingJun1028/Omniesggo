# source_origin: AI Station §12 / OA-Team Relay - cross-machine messaging
# AI Station Relay — Cross-Machine Messaging Guide (Hermes-aligned)

把 Hermes bot-mode 文獻中的 Desktop relay / `hermes peer` / Bots across
machines / Turning it off / CLI parity 概念，落地為 `apps/aistation/src/relay/`
的 §12 風格可驗證模組。

> 來源校對：本實作依據官方 `bot-mode` 文檔（2026-08）對齊，而非早期猜測的
> 泛型中繼器。實際 Hermes 模型：relay = Desktop 本身（自動傳播名冊）；
> 跨機 DM 走 `hermes peer`；停用是 `Settings → Plugins → Bots`。本模組在 Python
> 層復刻其 CLI 語意與「訊息原樣傳遞（file/stdin，不經 shell）」合約。

## Getting Started

```bash
cd apps/aistation
python -m pytest tests/test_relay.py -q   # 11 passed

# CLI parity (mirrors `hermes peer`)
python -m src.relay.cli peer add spark --url http://spark.lan:8377 --key <KEY>
python -m src.relay.cli peer list
python -m src.relay.cli peer dm spark --body "hello across machines"
python -m src.relay.cli broadcast --body "ping all bots"
python -m src.relay.cli off                # Turning it off
python -m src.relay.cli status
```

最小程式碼：

```python
from src.relay.peer import Peer, PeerRegistry
from src.relay.relay import Relay

reg = PeerRegistry()
reg.add(Peer(name="spark", url="http://spark.lan:8377", key="KEY"))
reg.add(Peer(name="beta",  url="http://beta.lan:8377",  key="KEY"))
relay = Relay(reg)

relay.peer_dm("spark", "hello\n")                  # hermes peer dm (verbatim body)
relay.peer_dm("spark", "hi", profile="researcher") # name/profile multiplexing
relay.broadcast("ping all bots")                   # Bots across machines
relay.turn_off()                                   # Turning it off
relay.peer_dm("spark", "x").reason  # -> offline (non-retryable)
```

## User Guide

- **Peer（連線機器）**：用 `name`/`url`/`key` 描述一臺連線的 Hermes 實例，對齊
  `hermes peer add <name> --url <url> --key <KEY>`。Peer 是不可變結構
  （Trustworthy），名冊以 name 為鍵（Trackable）。
- **Bot 發起 DM（peer_dm）**：對單一 peer 傳送點對點訊息（對應 `hermes peer dm`）。
  訊息本體**原樣傳遞**——對齊 Hermes 的 file/stdin 合約，絕不經 shell 解析。
- **跨機廣播（broadcast）**：便利性封裝——對名冊中所有 enabled peer 群發
  （對應 "Bots across machines" 中 Desktop relay 讓跨機 Bot 互傳的語意）。
- **關閉（turn_off / turn_on）**：對應 "Turning it off"。關閉後任何傳送立即回傳
  `OFFLINE` 型別失敗，且**標記為不可重試**。
- **狀態（status）**：回傳 `enabled`、`peer_count`、`peers` 清單，供監控使用。

## Developer Guide

### 5T 對齊

| 5T 原則 | 實作 |
|---|---|
| Traceable | 每次 `DeliveryResult` 含 `trace_id` |
| Trackable | `enabled` 旗標、name-keyed `PeerRegistry`、Dispatcher 嘗試次數 |
| Tangible | `DeliveryResult.retryable` 對外暴露，供 UI / n8n 排程決策 |
| Transparent | 失敗是 `str` enum `DeliveryReason`，可序列化、無不透明錯誤 |
| Trustworthy | Peer 為 frozen dataclass；`OFFLINE` 非可重試 |

### 與真實 Hermes 的差異（誠實註記）

1. 真實 relay 是 **Desktop app 本身**（自動傳播名冊）；本模組是 Python 層的
   模擬，用於 OA-Team 管線內的訊息路由與測試，**不是**替換 Desktop relay。
2. 真實 `hermes peer dm` 訊息從檔案/stdin 讀入；本模組 `peer_dm(name, body)`
   直接收字串，但保證 body **原樣**交給 Transport，不經任何 shell/模板處理。
3. 真實停用是 UI `Settings → Plugins → Bots`；本模組以 `turn_off()` 表達同語意。
4. 真實跨機傳送走 Desktop relay 自動路由；本模組 `broadcast()` 是顯式群發封裝。

### 後端傳輸（Transport）插拔

`Relay` 的傳輸邏輯與網路隔離：注入 `Transport` 實作即可切換通道。內建
`InMemoryTransport` 供測試與本地 relay；生產環境實作 `Transport.send()`
（HTTP 對 `peer.url` 帶 `peer.key` 認證 / WebSocket）即可上線，**無須改動
relay 邏輯**。注意：這是與真實 `hermes peer` 網路協定對齊的擴充點，本倉庫未
內含真實網路實作（不假造連線）。

### 重試語意

`Relay` 用 `Dispatcher` 包裹每次傳送：只有瞬時型 `DeliveryReason`
（`network_error` / `timeout` / `rate_limited` / `unknown`）會做指數退避重試；
永久型（`auth_failed` / `not_found` / `validation_error`）與 `offline` 一次即止。

## Reference

### `Peer` / `PeerRegistry`
- `Peer(name, url, key, enabled=True, **meta)`
- `PeerRegistry.add/get/remove(name)`、`list_names()`、`enabled_peers()`
- `Peer.peer_id` 屬性 == `name`（對齊 CLI 以 name 為鍵）

### `Relay`
- `Relay(registry, transport=None, max_retries=3)`
- `peer_dm(name, body, profile=None) -> DeliveryResult`
- `broadcast(body) -> Dict[name, DeliveryResult]`
- `turn_off()` / `turn_on()` / `enabled`
- `status() -> {"enabled", "peer_count", "peers"}`

### `DeliveryReason`（來自 `src/incremental/delivery.py`）
`success` · `network_error*` · `timeout*` · `rate_limited*` · `unknown*`
`auth_failed` · `not_found` · `validation_error` · `offline`
（標 * 者可重試）

### CLI（`src/relay/cli.py`）
`peer add <name> --url --key` · `peer list` · `peer dm <name> [/<profile>] --body`
`broadcast --body` · `off` · `status`
CLI 與函式庫共用同一份 `dispatch` 邏輯（CLI parity）。
