# OA-Twins :: OA-Local ↔ OA-VPS 雙子實作

> 「30 個靈魂，同一個心核」——同一顆心核（5T/4可1不可/熵<0.1/零幻覺）在兩個身體上同時跳動：**OA-Local（本機）** 與 **OA-VPS（雲端源站）**。

## 架構

```
┌─────────────────────────────┐
│         OAB = OmniAgentBus   │   DomainEvent { id, source, sourceId, type, timestamp, tags, payload }
└─────────────────────────────┘
       ▲               ▲
       │               │
[OA-Local]        [OA-VPS]
 Hermes app        OCI ap-singapore-1
 esggo-hub         /opt/esggo · Docker 6/6
 localhost:8786    esggo.co (Cloudflare)
                   gateway 8642 / TencentDB 8420
```

## 貫徹始終的不成文規定（Constitutional Codex）

本實作每一支程式都內建以下規定（見 `oab/broker.py` 檔頭宣告 `CONSTITUTION`）：

1. **5T**：Traceable(_origin) / Trackable(journal+replay) / Tangible(可渲染) / Transparent(路由公開) / Trustworthy(不可變)  
2. **4可1不可**：可自理 / 可協作 / 可演化 / 可溯源；❌不可篡改（journal 無改寫接口）  
3. **熵控 < 0.1**：`bus.entropy()` 供健康判斷  
4. **零幻覺**：所有輸出皆源於真實事件 / 真實 HTTP 探測，無偽造  
5. **OmniTag 路由**：`platform:*` / `agent:*` / `squad:*` 前綴匹配

## 檔案

```
oa-twins/
├── oab/broker.py               # OAB 事件總線（雙子核心，純 stdlib）
├── bin/oa-twin-health.py       # 孿生健康檢查（真實 HTTP 探測）
├── deploy/oa-twin-vps-deploy.sh # VPS 端部署（複製+py_compile+systemd）
└── run-selftest.bat            # 一鍵自檢（broker self-test + 健康檢查）
```

## 在本機（OA-Local）執行

```powershell
cd C:\Project\esggo\oa-twins
python oab\broker.py --self-test          # 核心回歸：發布→訂閱→replay→不可篡改
python oab\broker.py --twin-test          # 雙子橋：雙向轉送 / 防回圈 / source 不變
python oab\broker.py --rotate-test        # 輪替 + 清退（用 tempdir，不碰正式 journal）
python bin\oa-twin-health.py --check both # 真實探測 VPS + 本機插件（異常回 1）
python oab\broker.py --heartbeat          # 持續心跳（Ctrl+C 停止）
```

或雙擊 `run-selftest.bat`（四段自檢，任一失敗即 `exit /b 1`）。

### 「OAB local 心跳中 (Ctrl+C 停止)」是什麼

那是 `--heartbeat` 模式的啟動訊息。這個行程每 `--interval` 秒（預設 5 秒）發一筆
`health.heartbeat` 事件到 journal，證明「這顆心核還在跳」。它本身不開 HTTP 埠，
所以**看不到 http://localhost 任何頁面是正常的**——要看的是 journal 檔案：

```bash
tail -1 oab/journal/local.oab.jsonl          # 最新一筆心跳
python oab/broker.py --stats                 # 印出統計後結束（不啟動心跳）
python bin/oa-twin-health.py --check journal # 只檢查 journal 真實大小/最後寫入
```

啟動後每 12 筆（預設每分鐘）會印一行真實狀態：`journal KB / 含封存 KB / rot / pruned / healthy`。

### journal 輪替（已加，不會再無限長大）

原本 journal 只增不減，實測已累積 **36MB / 74,000+ 行**。現在：

| 參數 | 預設 | 作用 |
|------|------|------|
| `--max-journal-bytes` | 32MB | 單檔超限即輪替（整份搬走另開新檔，**不重寫原檔**） |
| `--keep-archives` | 5 | 保留最近 N 份封存檔 |
| `--max-archive-bytes` | 256MB | 封存總量上限（僅靠「N 份」擋不住 32MB×N 膨脹） |

輪替 = `os.replace()` 整份搬走 + 另開新檔，符合「❌不可篡改」；清退只認
`<name>.<YYYYmmddTHHMMSS>[.N].jsonl` 單一檔名形狀，依 **mtime** 排序（名稱的 `.N`
後綴會破壞字典序，用字典序會誤刪最新封存檔）。

> ⚠ 已在跑的心跳是**舊程式載入在記憶體**，不會自動輪替。需 `Ctrl+C` 後重啟才生效。

## 部署到 OA-VPS（雲端端）

在 VPS 上：

```bash
cd /opt/esggo/oa-twins   # 或先 git clone / scp 本目錄上去
bash deploy/oa-twin-vps-deploy.sh /opt/esggo/oab
sudo cp /opt/esggo/oab/oa-twin-oab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now oa-twin-oab
systemctl status oa-twin-oab
```

## 雙向同步（OAB 連結）

`broker.py` 提供 `link_twins(a, b)`：兩端互相訂閱 `*`，**只轉送「原生於來源節點」的事件**
（`evt.source == src.bus` 才轉送），因此轉送而來的事件不會被回送 —— 不回圈、且不改寫
`source`。回歸測試：`python oab\broker.py --twin-test`。

## 真實驗證（2026-09-29 實測，非推定）

- `https://esggo.co/api/health` → **HTTP 200**，`status: ok`（VPS 應用存活）
- `https://esggo.co/api/healthz` → **HTTP 404**（此路徑不存在，非故障）
- `http://127.0.0.1:8786/api/health` → **連線被拒**（本機 hub 未啟動）
- `oab/journal/local.oab.jsonl` → 74,368 行 / 36.1MB（**已超 32MB 警戒線**）

→ `oa-twin-health.py --check all` 如實標 !! 並回傳碼 1。VPS 閘道 8042/8642/8420
本輪未探（SSH 驗證未獲授權，未重試），故不宣稱其狀態。

## 熵控與 4可1不可對照

| 規定 | 實作位置 |
|------|----------|
| 可自理 | broker 單節點 publish/subscribe 閉迴 |
| 可協作 | subscribe + link_twins 雙向橋 |
| 可演化 | replay() 可重播演化 |
| 可溯源 | journal + _origin 全生命週期 |
| 不可篡改 | journal 無改寫接口；事件 immutable |
