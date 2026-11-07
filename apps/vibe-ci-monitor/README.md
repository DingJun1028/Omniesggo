# Omniesggo CI Monitor (Mistral AI Studio Workflow)

將 PR #142 main push 覆核（合併 commit 85a4ff0）所涵蓋的 12 個 CI workflow 收錄為 Vibe AI（Mistral Studio）workflow。

## Workflow：omniesggo-ci-monitor

輸入（皆有預設，可直接執行）：

- `branch`（預設 `main`）或 `sha`：查詢目標
- `owner`/`repo`（預設 DingJun1028/Omniesggo）
- `workflows`：預設為下列 12 個 workflow 名稱

收錄的 12 個 main-push workflow：

1. ESG-GO CI/CD Pipeline
2. 🌌 ESG GO Sacred Pipeline (CI/CD)
3. 5T OmniCore Hyper-Awakened CI/CD Gatekeeper
4. TS Matrix 雙向驗證閘 (esggo)
5. test
6. SonarCloud Quality Gate
7. Schema Traceability
8. learning-center-ci
9. deploy-ghcr
10. Build & publish AI Station image
11. Deploy to Cloudflare
12. Deploy to Oracle VPS

輸出：每個 workflow 最新 run 的 status/conclusion/run_number/run_url/head_sha，以及 `all_green` 整體判定（全部 completed 且 conclusion 為 success/skipped）。

## 部署

Managed deployment：

- build directory：`apps/vibe-ci-monitor`
- Dockerfile：`apps/vibe-ci-monitor/Dockerfile`
- 需 mistralai-workflows >= 3.10（service-account token 讀取）

可選：綁定 workspace secret `GITHUB_TOKEN`（唯讀 public_repo 即可）提高 GitHub API 額度；未綁定時使用匿名額度（60 req/hr/IP，低頻排程足夠）。

## 如實聲明

- 本專案為唯讀監控，不寫入 GitHub（不自動留言 issue #91；若未來要失敗自動回報，需綁定具 issues:write 權限之 token，屬後續擴充）。
- 在本沙箱無法執行 Python/uv，SDK 行為以 Mistral 官方文件（mistralai-workflows 3.x）為準，端到端以部署後首次執行驗證。
