# Vibe CLI 整合藍圖 — Omniesggo 代理工作流接入設計

> 狀態：設計提案（2026-10-30，Vibe 提出）；落地需使用者本機實裝後逐項驗證。
> 定位：將 Mistral Vibe CLI（Vibe Code 終端模式，含 vibe-acp）納入 12大萬能架構之 OA/OAB 命令鏈，作為可受監督的編碼代行者。
> 對齊：12大萬能架構（OA/OAB/OAG 三位一體）、De-Google 政策（PR #81）、代理共享知識公約（AGENT-SHARED-KNOWLEDGE.md）、5T Protocol（Traceable/Trustworthy：未驗證項如實標示）。

## 一、產品事實（官方文件核實，2026-10-30）

- 安裝（macOS/Linux 一行）：`curl -LsSf https://mistral.ai/vibe/install.sh | bash`；Windows 或手動：`uv tool install mistral-vibe`（需 Python 3.12+）。安裝後提供 `vibe` 與 `vibe-acp` 兩個命令。
- 介面：CLI（本機 checkout）、VS Code 擴充功能（Mistral Vibe）、Vibe Code Web（GitHub 遠端沙箱，免安裝）。
- 能力：讀寫檔案、shell（敏感動作須核准）、內建 web search 與 web fetch（請求核准）、開 PR。
- 憑證三途（優先序）：shell 環境變數 `MISTRAL_API_KEY` → `~/.vibe/.env` → OS keyring；`/status`、`/whoami` 可查作用中憑證與方案。
- 多供應商：config.toml 以 `[[providers]]`/`[[models]]` presets 支援任意 OpenAI 相容端點；可離線跑本地模型。
- 安全：首次於含 AGENTS.md 或 `.vibe/config.toml` 之專案會詢問是否信任資料夾（trusted folders）。
- 未驗證項（如實標示）：`vibe-acp` 之具體協議行為（ACP wire format、會話邊界）本倉庫尚未實測；整合設計中相關段落以「待實測」標注。

## 二、與 12大萬能架構之對位

| 架構角色 | Vibe CLI 對位 | 說明 |
| --- | --- | --- |
| OA（OmniAgent 自主代行） | 受監督編碼代行者 | 於本機 checkout 執行代辦、重構、測試修復、PR 準備；人在迴圈（approval gate）即 OAG 信任邊界之外部體現 |
| OAB（OmniAgentBus 事件中樞） | vibe-acp 程序介面（待實測） | 若 vibe-acp 提供可編排之 agent 程序協議，可作為 OAB 註冊之代理節點；未實測前僅列為候選路徑 |
| OAG（Gateway 信任邊界） | 本機核可 + trusted folders | 敏感 shell 命令逐一核准；AGENTS.md/本倉庫 soul.md 禁區規則由 trusted-folder 流程顯式承認 |
| OmniEvolution（熵減） | 重複工作委派 | 與 OA-TWINS Auto-Repair 互補：CLI 做本機重構與 PR 準備，CI auto-repair 做遠端修復 |

## 三、De-Google 政策相容性

- Vibe CLI 主路徑為 Mistral 自家託管模型，不涉 Google/Gemini/Firebase，與 PR #81 政策相容。
- 離線/私有路徑：config.toml provider preset 指向自架 Ollama（OpenAI 相容端點），可完全私有網路運行，對齊 OmniGateway 之 VPC 私有模型 fallback 順位精神。
- 禁區：不得為了 CLI 而引入任何 Google 系依賴或將金鑰寫入倉庫。

## 四、憑證與安全（對齊 OTS 交接工作流）

- `MISTRAL_API_KEY` 屬 Tier 2 禁存內容：永不寫入本倉庫、知識庫或對話明文；交付一律走 OneTimeSecret（scripts/ots-vault-handoff.ts，PR #103）。
- 存放位置：OS keyring 或 `~/.vibe/.env`（600）；CI 類自動化用途才考慮 GitHub Actions Secrets（唯寫）。長期憑證應排程輪替。
- 本倉庫 AGENTS.md 與 soul.md 禁區（版本堆疊、frozenZone）於 CLI 信任資料夾流程中顯式確認後生效。

## 五、落地步驟（建議順序，皆待使用者本機實測）

1. 本機安裝（一行 installer），`vibe --version` 驗證。
2. 於 Omniesggo checkout 目錄執行 `vibe`，瀏覽器登入（或 OTS 交付之 API key），完成 trusted-folder 確認。
3. 試運任務：讀取 docs/vault-canon/AGENT-SHARED-KNOWLEDGE.md 與 AGENTS.md 後回報理解（驗證上下文攝取）。
4. 委派一件低風險工作（文件勘誤或測試補齊），走既有 PR 流程：功能分支 → PR → CI Green Gate → squash 合併。
5. 實測 `vibe-acp`：確認其程序介面行為後，再決定是否接入 OAB 代理註冊表（更新 AGENT-SHARED-KNOWLEDGE.md 登錄）。

## 六、治理

- 本文件屬設計提案；第五節各步完成後應更新本文檔之驗證狀態，並於 AGENT-SHARED-KNOWLEDGE.md 登錄實況。
- 一切未經實測之描述以「待實測」標示，不得於其他文件引述為既成事實（5T：Traceable/Trustworthy）。
