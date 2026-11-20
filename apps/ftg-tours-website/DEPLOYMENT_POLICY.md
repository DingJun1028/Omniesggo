# FTG 靜態站 VPS 部署策略備忘

本檔為部署線文件，不參與前端建置（純 Markdown，不影響 pnpm build 產物）。

## 部署可達性閘制（PR #315 起）

- 本站與上游 ESG GO 應用之 VPS 部署工作流（Deploy FTG Static Files、Deploy to Oracle VPS、deploy-deerflow-vps）均已前置 SSH reachability preflight：先以 tcp 22 探測 VPS，不可達時输出 reachable=false，後續 SSH 部署步驟以 if 條件跳過，job 保持綠燈，並以 ::warning:: 與執行摘要如實標示。
- 依據：VPS 對外不可達屬外部基礎設施狀態（issue #179 / #274 追蹤，OCI Console 範疇），不應以倉庫 CI 紅燈呈現；與 deploy.yml 假綠修復（PR #289）屬同一觀測性軸線——289 令內部失敗必現紅，315 令外部斷線不再偽裝為倉庫錯誤。
- deploy-oracle 之 notify job 於「部署成功且 VPS 不可達（reachable=false）」時印出明確跳過訊息，不再推播 Telegram [FAIL] 通知。

## VPS 復原後之作業

1. 於 OCI Console 查核執行個體（STOPPED 者先建 boot volume 備份再開機），並確認 Security List 22/80/443 開放。
2. 觸發 deploy-deerflow（dispatch-only）或等待下次符合路徑之 main 推送，部署線將自動恢復實部署。
3. 如需一次性復原驗證，可使用 fix/hermes-serve-recovery 分支之 hermes-recovery 工作流（dispatch）。

本檔亦作為 deploy 工作流 badge 刷新之觸發源：本檔位於 apps/ftg-tours-website/**，同時落於 deploy-ftg-static 與 deploy-oracle 之推送路徑。
