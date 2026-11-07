# 廖俊弘（DingJun）使用者檔案

## 基本資料
- **名稱**：廖俊弘（DingJun / Jun Hong）
- **電子郵件**：dingjunhong1028@gmail.com
- **GitHub**：DingJun1028
- **專案**：ESG-GO（Omniesggo）——ESG報表平台、雙語語音工具、30代理群架構
- **地區**：台灣台北（繁體中文母語）
- **語言偏好**：繁體中文（zh-hant）繁中溝通，總結維持繁體中文

## 興趣與技術背景
- 專注於 **ESG報告平台**、**雙語語音工具**、**多代理群架構**（30代理群）
- 採用 **5T格式** 提交（feat/fix/docs/… 風格）
- 具備 **多 AI 代理協同開發** 經驗（Devin、Jules、Kilo、Hermes）
- 偏好 **功能分支 PR**，squash 合併至 main
- 擁有 **Blender 插件** 安裝
- 使用 **Cloudflare、Supabase、Oracle VPS、Firebase** 等服務

## 溝通與工作風格
- **短報告為主**：報告篇幅要短，直接說明已完成項目與下一步
- **繁體中文**：所有溝通與摘要均使用繁體中文
- **功能分支 PR + squash 合併**：機器提交一律走功能分支 PR，squash 併入 main
- **硬編碼禁令**：禁止密碼與環境值進碼；TypeBox 為合約正本；密碼走 `.env*.local`
- **縮寫癮**：全形與半形需確認；常用縮寫：ESM=環境安全管理、AI-Agent=人工智慧代理、MECE=互斥且完全聚集
- **工程文化**：重視「實作」而非「描述」，論點有實際工具有證據即可

## 使用者偏好
- **功能分支 PR，不得直推 main**：squash 合併 main
- **硬編碼禁令**：fail-fast，禁止密碼與環境值入碼；TypeBox schema 為契約正本；密碼走 `.env*.local`（已被 `.gitignore` 忽略），`.env.local` 不得 commit
- **索引號**：`idx` 不可被簡化為 `id`（違規會被直接指出）
- **文件規範**：文件新增雙語（中文+英文），中文為主要顯示語言
- **CI/CD 欄位**：應附加 CI/CD 欄位（example: `Run tsc && vitest && pnpm build && pytest`）
- **Maintainance 模式**：唯當維護有明確目的時才進入，無明確目的不要強行進入

## 機器人協作偏好
- 技能文件格式規範（新增）
- **SKILL.md frontmatter 標準**：每個技能必須有 YAML frontmatter，至少含 `title`、`name`、`description`、`category`、`version`
- **目標**：52 個 skills/ 目錄中，統一 100% 符合前置標頭格式
- **版本格式**：採用 `1.0.0`、`1.1.0` 等標準版本號，不使用 `v1`、`vv1` 等非標準寫法
- **工具**：使用 `execute_code` + `patch` 批量檢查與修復
