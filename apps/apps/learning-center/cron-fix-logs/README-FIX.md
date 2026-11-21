# ESG-GO 修復腳本（PR #414 broken imports + PR #412 command injection）

排程日期：2026-08-01
狀態：**腳本已備妥但尚未執行** — cron session 無 terminal、cua-driver session 死亡、8642 無可用認證 HTTP 通道，無法自動執行。需手動或重啟桌面 App 後由下次 cron 執行。

## 手動執行方式（本機 Windows PowerShell / cmd，任選其一）

### 方式 A：一鍵執行（推薦）
```bat
cmd /c "C:\Project\esggo-learning-center\go.bat"
```
go.bat 依序執行：
1. step1 探查：git remote get-url origin、git status --short --branch、HEAD
2. step2+3 修復 7 個 route 檔的 '@/lib/' alias（先備份到 C:\Project\esggo\_fix-backup-20260801\）
3. step4 修復 vps/agent-bootstrap.mjs（async collectHealth + 原生 fetch 取代 curl execSync）
4. step5 執行 build（pnpm build，15 分鐘上限）
5. step6 輸出 git diff --stat 與最終 git status

log 寫入 `C:\Project\esggo-learning-center\cron-fix-logs\`：
- run.log（主流程）
- ps-imports.out.log / ps-bootstrap.out.log / ps-build.out.log
- build.log / build.log.err

### 方式 B：手動逐步驟（PowerShell）
```powershell
cd C:\Project\esggo
# 1. 備份
New-Item -ItemType Directory -Force _fix-backup-20260801 | Out-Null
Get-ChildItem app\api -Recurse -Filter route.ts | Where-Object { Select-String -Path $_.FullName -Pattern '@/lib/' -SimpleMatch -Quiet } | ForEach-Object {
  $rel = $_.FullName.Substring((Get-Location).Path.Length).TrimStart('\')
  $dest = Join-Path (Join-Path (Get-Location) '_fix-backup-20260801') $rel
  New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
  Copy-Item $_.FullName $dest -Force
}
Copy-Item vps\agent-bootstrap.mjs _fix-backup-20260801\vps\agent-bootstrap.mjs -Force -ErrorAction SilentlyContinue
# 2. alias 修復（7 route 檔、11 處）— Git Bash 或 WSL：
#   grep -rl "@/lib/" app/api --include="route.ts" | xargs sed -i "s|from '@/lib/|from '@lib/|g; s|from \"@/lib/|from \"@lib/|g"
# 3. bootstrap 修復（PR #412）— 直接執行本目錄的 fix-bootstrap.ps1：
#   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Project\esggo-learning-center\fix-bootstrap.ps1"
# 4. build
node --version
pnpm build   # 或 npm run build
```

## 驗證指標
- `grep -rn "@/lib/" app/api --include="route.ts"` → 0 matches
- bootstrap：execSync+curl 行數 = 0；`await check(` 出現 2 次；`async function collectHealth` 1 次；`await collectHealth()` 1 次
- build exit code = 0
