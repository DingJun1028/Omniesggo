# ADR-005: ESGGO v5.0 生產環境部署與 CI/CD 策略

## 狀態 (Status)
**Accepted** (已批准並正式上線)
**日期**: 2026-06-29

## 決策背景 (Context)
在將 ESGGO v5.0 平臺 (具備全通之心與 L-Hub 自治代理集羣) 推升至正式環境時，我們面臨了以下技術挑戰：
1. **Pnpm 與 Node 版本衝突**：`pnpm 11.9.0` 強制要求 Node.js 22 才能執行，但預設的 GCP Cloud Run 容器映像檔環境為 Node 20。
2. **環境變數阻斷 (Environment Variable Blocking)**：在使用 `gcloud run deploy --source .` 發布源碼時，GCP 預設繼承了 `.gitignore`，這導致包含了建置期必要金鑰 (Firebase 等) 的 `.env` 檔案被丟棄，造成 Next.js 編譯期崩潰 (`auth/invalid-api-key`)。
3. **引擎依賴遺失**：為了極小化映像檔體積，我們在建置時使用了 `--prod`，這導致身處於 `devDependencies` 內的 `next` 引擎在最後的執行環境 (Runner) 中未被安裝，造成服務啟動失敗 (`sh: next: not found`)。

## 決策內容 (Decision)
為了達成「圓通無礙 (Seamless Unity)」的 5T 協議治理要求，並實現自動化持續交付，我們做出了以下決策：

1. **基礎映像檔升級**：將 `Dockerfile` 的基礎映像檔指定為 `node:22-alpine`，並透過 `corepack enable pnpm` 確保環境與套件管理器的一致性。
2. **自訂 GCP 忽略清單 (`.gcloudignore`)**：我們獨立建立了 `.gcloudignore` 檔案，明確將機密環境變數檔案 (如 `.env`, `.env.local`) 從忽略清單中排除，讓它們能被傳遞至安全的雲端構建環境，滿足 Next.js 靜態生成 (SSG) 期間所需的環境變數注入。
3. **多階段構建的相依性調整**：在 `Dockerfile` 的 Runner 階段，改為拷貝 `builder` 階段的 `node_modules`，以保留 `next` 執行引擎，徹底解決啟動崩潰問題。
4. **自動化 CI/CD (GitHub Actions)**：建立 `.github/workflows/deploy.yml`。藉由 GitHub Secrets 動態重組 `.env` 檔案並觸發部署，使得未來的原始碼推送能夠瞬間且安全地反映於生產環境，免除本地終端機部署的人為不確定性。

## 產出與影響 (Consequences)
### 正向影響 (Positive)
* **無縫顯化 (Seamless Manifestation)**：系統更新現在與 Git Push 高度綁定，符合「無作妙德」的自動化治理理念。
* **安全隔離**：開發環境與生產環境的金鑰正式分離，並轉由 GitHub Secrets 管理。
* **穩定性提升**：封裝好的 Docker Image 確保了運行環境 (Node.js 22 + Pnpm 11) 的絕對一致性。

### 需注意的後續行動 (Negative / Follow-up)
* 未來若有新增 `NEXT_PUBLIC_` 變數，必須同步更新至 GitHub Actions Secrets 以及 `deploy.yml` 腳本的重組區塊。
* 若後續流量增長，需於 Cloud Run 控制檯進一步調整 Autoscaling 與並發數量 (Concurrency)。
