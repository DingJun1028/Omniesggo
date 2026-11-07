# Omniesggo CI Monitor — 交接進度與後續步驟（HANDOFF）

> 2026-11-01 由 Vibe（claiming agent）建立。本文收錄目前進度與於電腦端完成剩餘步驟所需之一切資訊。

## 目前已完成

- PR #143 已 squash 合併 main（51ef2cc3a876f9a6b35ac581f1188ff025efc9a2）：`apps/vibe-ci-monitor` 專案落地。
- Workflow `omniesggo-ci-monitor`：輸入皆有預設（branch=`main`、owner=DingJun1028、repo=Omniesggo、workflows=12 個 main-push workflow 清單），回報每個 workflow 最新 run 之 status/conclusion/run_number/run_url/head_sha 與 `all_green` 整體判定（全部 completed 且 conclusion ∈ {success, skipped}）。
- 收錄的 12 個 workflow（PR #142 85a4ff0 main push 覆核確認）：ESG-GO CI/CD Pipeline、🌌 ESG GO Sacred Pipeline (CI/CD)、5T OmniCore Hyper-Awakened CI/CD Gatekeeper、TS Matrix 雙向驗證閘 (esggo)、test、SonarCloud Quality Gate、Schema Traceability、learning-center-ci、deploy-ghcr、Build & publish AI Station image、Deploy to Cloudflare、Deploy to Oracle VPS。
- Dockerfile 已過 SonarCloud Security Rating A（非 root 用戶 useradd appuser、內聯鎖定 mistralai-workflows==3.17.0 / pydantic==2.12.5、--only-binary=:all: 安裝）。

## 剩餘步驟（擇一路徑）

### 路徑 A：Managed deployment（當時組織額度滿 403，需先騰出）

1. 於 https://console.mistral.ai/workflows/deployments 刪除或停止一個既有部署以釋放額度。
2. 建立新部署，建議名稱 `omniesggo-ci-monitor`：
   - Repository：DingJun1028/Omniesggo（需 Mistral GitHub App 已安裝於此 repo：https://github.com/apps/mistralai）
   - Branch：`main`
   - Build directory：`apps/vibe-ci-monitor`
   - Dockerfile path：`apps/vibe-ci-monitor/Dockerfile`
3. 等待部署狀態 Active（worker 自動註冊 workflow）。

### 路徑 B：自架 worker（不佔 managed 額度）

```bash
mkdir -p ~/vibe-ci-monitor && cd ~/vibe-ci-monitor
curl -fsSLO https://raw.githubusercontent.com/DingJun1028/Omniesggo/main/apps/vibe-ci-monitor/ci_monitor.py
curl -fsSLO https://raw.githubusercontent.com/DingJun1028/Omniesggo/main/apps/vibe-ci-monitor/worker.py
uv add "mistralai-workflows==3.17.0" "pydantic==2.12.5"
MISTRAL_API_KEY=<Mistral API 金鑰> DEPLOYMENT_NAME=omniesggo-ci-monitor uv run python worker.py
```

- VPS 常駐建議 PM2 守護；MISTRAL_API_KEY 屬 Tier 2 禁存內容，請以 OTS 流程寫入 `.env.secrets`（600），明文勿入任何對話或文件。

## 部署上線後（兩路徑共通）

1. 首次執行驗證（Studio → Workflows → omniesggo-ci-monitor → Start Workflow，輸入留空用預設即可；或 API）：
   ```json
   {}
   ```
   預期輸出：`all_green: true`、`checked: 12`，12 個 workflow 各含 status/conclusion/run_url。
2. 建立排程（Studio → 該 workflow → Schedules，或 MCP create_workflow_schedule）：
   - 建議：每日 01:00 UTC（cron `0 1 * * *`，timezone UTC）
   - input：`{}`（用預設 12 workflow 清單）
3. 可選：綁定 workspace secret `GITHUB_TOKEN`（唯讀 public_repo）提高 GitHub API 額度；未綁定時使用匿名額度（60 req/hr/IP，每日一次排程足夠）。
4. 後續擴充候選：失敗自動回報 issue #91（需綁定具 issues:write 之 token，現為唯讀不寫入 GitHub）。

## 已知教訓（修復歷程，供後續維護參考）

1. Dockerfile 預設 root 用戶觸發 sonarcloud S6471（VULNERABILITY → Security Rating B → 品質閘 ERROR）。
2. Docker pip 分析器不解析 `-r requirements.lock` 引用，鎖定版本必須內聯於 RUN 行。
3. SonarCloud Automatic Analysis 會分析 Dockerfile 與 Python；新增任何非 TS 子目錄仍會被納入品質閘。
