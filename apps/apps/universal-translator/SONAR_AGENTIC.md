# SonarQube CLI — Agentic Workflow 整合 (universal-translator)

將 SonarQube CLI 的 **agentic loop** 接入「萬能即時翻譯」開發週期。
適用條件：需具備 SonarQube Cloud 組織（啟用 agentic analysis）與 `SONAR_TOKEN`。

## 安裝（一次性）
```bash
# 全域安裝 SonarQube CLI
npm i -g sonarqube-cli        # 或依官網發行方式
sonar integrate hermes        # 掛載 secret-detect hook + MCP server + Vortex context
```

## 本專案預置指令 (package.json scripts)
| 指令 | 作用 |
| --- | --- |
| `pnpm sonar:analyze` | 對 staged 變更執行 `sonar analyze agentic --staged`（零幻覺靜態掃描） |
| `pnpm sonar:issues` | `sonar list issues --project universal-translator --format toon` 拉回問題清單 |
| `pnpm sonar:remediate` | `sonar remediate` 將合格問題送交修復代理 |

## 代理人迴圈（對齊 OA-Team 5T）
1. **編輯後**：`sonar analyze agentic` 自動跑（hook 觸發）→ 對齊 Traceable/Trackable。
2. **發 PR 前**：CI `sonar-agentic` job 以 `--staged` 掃描，失敗則阻擋 merge。
3. **長壽分支**：`sonar remediate` 週期性修補（Hunter/AI CodeFix）。

## 免費算立替代
未配置 Sonar 組織時，本專案以 `node --test test/*.test.mjs` + `tsc` 作為同等品質閘門（CI `ut-tests` job）。
Sonar 為**選用增強**，不影響既有零依賴驗證鏈。

## 自託 SonarQube CE（VPS，已實證 2026-08-11）
- VPS Docker: `/opt/sonarqube/docker-compose.yml`（postgres + sonarqube:community，對外 :19000）
- 啟動: `ssh ubuntu@161.118.248.180 "cd /opt/sonarqube && docker compose up -d"`
- token: `/opt/sonarqube/ut-token.txt`（權限 600）
- 掃描: `npx sonarqube-scanner -Dsonar.host.url=http://localhost:19000 -Dsonar.token=<token> -Dsonar.projectKey=universal-translator -Dsonar.sources=server.mjs,translate.mjs,stt_client.mjs`
- 結果: ANALYSIS SUCCESSFUL（3 檔，JS/TS 分析 + CPD + 依賴分析全過）
- **限制**: agentic 自動修復為 SonarCloud/Enterprise 付費功能，CE 版不含。依「只用免費算立」不啟用雲端 agentic；CI 以 `sonar-smoke` job（免費本地煙測）作永久守門。
