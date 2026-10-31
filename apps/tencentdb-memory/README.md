# TDAI 全域性映象本地部署

全域性三件套映象的本地拉起指令碼 —— `memory-core` + `memory-hub` + `proxy`，可各自獨立執行，也能一條命令全部啟動。

## 元件與埠

| 元件 | 容器名 | 映象（Docker Hub 公開） | 宿主機埠 | 用途 |
|---|---|---|---|---|
| **memory-core** | `tdai-memory-core` | [`agentmemory/memory-core`](https://hub.docker.com/r/agentmemory/memory-core) | `8420` | 核心 gateway，記憶讀寫、鑑權、skill/RAG 資料面 |
| **memory-hub**  | `tdai-memory-hub`  | [`agentmemory/memory-hub`](https://hub.docker.com/r/agentmemory/memory-hub)   | `8125` / `8424` | 管理面板 (Panel) + 知識服務 (Knowledge) 合併映象 |
| **proxy**       | `tdai-proxy`       | [`agentmemory/memory-proxy`](https://hub.docker.com/r/agentmemory/memory-proxy) | `8096` | LLM 請求轉發代理，coding agent 的 API 入口 |

> 三個映象都發布在 Docker Hub 的 [`agentmemory`](https://hub.docker.com/u/agentmemory) 名稱空間下，
> 多架構（`linux/amd64` + `linux/arm64`），公開可拉、無需登入。想固定版本時把 `.env` 里的 tag 從
> `:latest` 換成具體版本即可，例如 `:1.0.0-beta.1`。
>
> 騰訊內部同事也可以覆蓋到內網私倉 `mirrors.tencent.com/memory-team-control/` —— 見 `.env.example` 里
> 註釋掉的備選塊。

## 環境要求

- macOS / Linux
- Docker（Docker Desktop / colima / OrbStack 任一）
- `bash` 4+（macOS 自帶 3.2 也能跑）

## 快速開始

```bash
# 1) 準備 .env
cp .env.example .env

# 2) 編輯 .env，把兩組 LLM 引數填成真值
#    - MEMORY_LLM_*   → memory-core + memory-hub 內部用
#    - PROXY_UPSTREAM_* → proxy 轉發到的上游 LLM
$EDITOR .env

# 3) 干跑校驗（不啟動容器）
#    預設會同時校驗 LLM 通路 —— 提前驗證 API key/URL/模型名，避免起服務后才發現配錯
./verify.sh
# 不希望發外部請求（離線環境等）：./verify.sh --skip-llm

# 4) 一鍵拉起三件套
./start-all.sh
```

## LLM 通路預檢

`verify.sh` 預設會預檢兩組 LLM 通路（`--skip-llm` 關掉）：

- **OpenAI 相容協議**：`GET {base}/models`，只驗證 API key + URL，**不消耗任何 token**
- **Anthropic 協議**：`POST {base}/v1/messages` 發 `max_tokens=1` 的最小訊息，消耗 ≤ 10 token
- **memory 組** 與 **proxy 組** 獨立驗；若兩組配置完全相同，自動跳過重複檢查
- **容器已執行時**，額外從容器內 exec 一次 curl，驗證"容器 → LLM"的網路可達性（一些企業代理/DNS 隔離環境下宿主機可達但容器不可達）

失敗例子：

```
[error] memory 組 API key 無效（HTTP 401）：https://api.deepseek.com/v1/models
{"error":{"message":"Authentication Fails, Your api key: ****abcd is invalid",...}}
```

—— API key 錯、URL 錯、模型名錯都會在啟動前攔下，不會等到 wiki ingest / chat 時才 401。

啟動完成後：

- Panel UI：<http://localhost:8125/>
- Knowledge API：<http://localhost:8424/v3/>
- Knowledge Swagger：<http://localhost:8424/docs>
- Memory Gateway：<http://localhost:8420/>
- Proxy：<http://localhost:8096/>

## 兩組獨立引數

**這是指令碼設計的核心** —— memory 組和 proxy 組的 LLM 完全獨立，可以指向不同供應商 / 不同模型。

### memory 組（memory-core + memory-hub 使用）

核心記憶 embed/summarize、knowledge 的 wiki ingest / 總結走這組配置。

| 變數 | 說明 | 示例 |
|---|---|---|
| `MEMORY_LLM_BASE_URL` | OpenAI 兼容 base URL | `https://api.deepseek.com/v1` |
| `MEMORY_LLM_API_KEY` | 上述端點的 API Key | `sk-xxxxxxxx` |
| `MEMORY_LLM_MODEL` | 模型 ID | `deepseek-chat` |
| `MEMORY_LLM_PROTOCOL` | `openai` 或 `anthropic`，預設 `openai` | `openai` |

### proxy 組（proxy 使用）

proxy 接到使用者請求後轉發到這組端點。

| 變數 | 說明 | 示例 |
|---|---|---|
| `PROXY_UPSTREAM_URL` | 轉發目標 base URL | `https://api.deepseek.com/v1` |
| `PROXY_UPSTREAM_API_KEY` | 轉發用 API Key | `sk-xxxxxxxx` |
| `PROXY_UPSTREAM_MODEL` | 面向使用者的模型 ID | `deepseek-chat` |

> 兩組可以填相同值（都指向同一個 LLM），也可以完全不同：例如 memory 組用便宜模型做 embedding，proxy 組用強模型做主對話。

引數缺失時指令碼會**在啟動前一次性列出所有缺失項**並 `exit 1`，不會跑到一半才失敗。

## 內部憑據（生產環境必看）

三件套之間用 `MEMORY_CORE_GATEWAY_API_KEY` 互相認證，首次啟動還會通過
`init-admin` 建一個 `system_admin` 賬戶。為了**零配置本地體驗**，指令碼預設值是：

| 變數 | 預設值 | 用途 |
|---|---|---|
| `MEMORY_CORE_GATEWAY_API_KEY` | `local` | memory-hub / proxy → memory-core 的 Bearer |
| `MEMORY_CORE_ADMIN_USERNAME` | `admin` | 初始化的 system_admin 使用者名稱 |
| `MEMORY_CORE_ADMIN_USER_KEY` | `admin` | 該 admin 使用者的登入 key |

> 這三個預設值只適合個人本地跑通流程。**生產/聯調/公網暴露前必須替換成隨機長串**，
> 否則任何拿到埠的人都能拿到 system_admin 許可權。
>
> 在 `.env` 里取消對應三行的註釋並覆蓋即可（`_lib.sh` 會 `require_vars`
> 校驗其他必填項，但這三個變數因為有預設兜底，指令碼會在啟動時打 `[warn]` 提醒你換）。

## 獨立使用每個元件

三個指令碼可以單獨執行，方便除錯或只需要部分能力時：

```bash
./start-memory-core.sh       # 只跑核心 gateway（8420）
./start-memory-hub.sh   # 只跑面板 + 知識（8125 + 8424）；需要 MEMORY_LLM_* 引數
./start-proxy.sh        # 只跑 proxy（8096）；需要 PROXY_UPSTREAM_* 引數
```

依賴關係：

- **memory-core**：無外部依賴，可以獨立起
- **memory-hub**：能獨立啟動（LLM_MODE=custom 直連 LLM），但內部 knowledge 調 memory-core 做 RAG 時會失敗 → 建議 memory-core 先起
- **proxy**：能獨立啟動（cost-guard 不可用時自動降級 passthrough，直接轉發），但 auth / tdai memory / skill 注入需要 memory-core 才有效

任意元件缺失時指令碼會 `warn` 提醒但不阻塞。

## 資料持久化

- `tdai-memory-core-data`（named volume）→ memory-core 的 SQLite / 記憶資料
- `tdai-panel-data`（named volume）→ memory-hub 里 knowledge 的 SQLite / git clone / wiki 文件

`docker volume rm` 之前資料一直保留。改名可在 `.env` 里改 `MEMORY_CORE_VOLUME` / `PANEL_VOLUME`。

## 停止 / 清理

```bash
./stop-all.sh            # 停容器，保留 volume（下次啟動資料還在）
./stop-all.sh --purge    # 停容器 + 刪 volume + 刪網路（徹底清理）
```

## 查看日志

```bash
docker logs -f tdai-memory-core
docker logs -f tdai-memory-hub
docker logs -f tdai-proxy
```

memory-hub 內部有兩個進程（panel + knowledge），日誌分別在容器內 `/data/knowledge/logs/panel.log` 和 `.../knowledge.log`。

## 埠衝突

如果 `8125` / `8420` / `8424` / `8096` 與本地已有服務衝突，直接在 `.env` 改：

```bash
MEMORY_CORE_PORT=18420
PANEL_PORT=18125
KNOWLEDGE_PORT=18424
PROXY_PORT=18096
# knowledge 對外可達地址要跟著 KNOWLEDGE_PORT 走
KNOWLEDGE_PUBLIC_BASE_URL=http://host.docker.internal:18424/v3
```

## 使用 proxy 作為 coding agent 的 API base

以 Claude Code 為例：

```bash
export ANTHROPIC_BASE_URL=http://localhost:8096
export ANTHROPIC_API_KEY=any-string-if-auth-disabled
# 使用 openai 協議的客戶端類似：OPENAI_BASE_URL=http://localhost:8096/v1
```

Panel UI "客戶端接入地址" 卡片會自動拼上宿主機的 LAN IP + `PROXY_PORT`（例如
`http://192.168.1.100:8096/codebuddy/default`），別人的電腦複製過去就能直接連過來。
由 `MEMORY_HUB_PROXY_PUBLIC_URL`（未設時指令碼用 `hostname -I` / macOS `ipconfig getifaddr en0`
自動探測，探不到才回落 `localhost`）注入到 memory-hub 里的 `metadata-instances.json.proxy_endpoint`。
Panel 後端 → Kernel 的轉發不受此變數影響（始終走 `REMOTE_INSTANCE_URL` → memory-core:8420）。
自動探測的地址不對時（多網絡卡 / 公網域名 / 反代前置），在 `.env` 顯式設
`MEMORY_HUB_PROXY_PUBLIC_URL=http://<真值>:8096`。想讓 UI 卡片走老行為（回落到
gateway_endpoint）就把 `MEMORY_HUB_PROXY_PUBLIC_URL` 顯式設為空字串。

`proxy` 預設關閉 `auth` / `sessionInit` / `costGuard`（這些依賴內部服務），只做純轉發 + `tdai-memory` 上下文注入（injector 名稱，非容器名）。要開啟完整流水線，需要另行配置 —— 參見 `context_proxy/config.example.yaml`。

## 常見問題

**Q: `./start-all.sh` 卡在 wait_healthy？**
映象可能還在拉取。用 `docker pull <IMAGE>` 手動預拉一次再跑指令碼。

**Q: memory-hub 起來但 Panel 打不開？**

檢查 `.env` 里 `KNOWLEDGE_PUBLIC_BASE_URL` 是不是含 `/v3` —— 缺 `/v3` panel 會報錯。

**Q: proxy 轉發返回 401？**
`PROXY_UPSTREAM_API_KEY` 無效或 `PROXY_UPSTREAM_URL` 不匹配。用 `docker logs tdai-proxy` 看錯誤。

**Q: 如何在容器外訪問宿主機上其它服務（Ollama、Langfuse 等）？**
指令碼已預設 `--add-host=host.docker.internal:host-gateway`。容器內用 `http://host.docker.internal:<port>` 即可。
