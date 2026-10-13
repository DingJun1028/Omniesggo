<#
.SYNOPSIS
  learning-center → esggo monorepo 合併腳本（方案 A：apps/learning-center 子應用，保留 Vite SPA）
  對應 MERGE-GAP-ANALYSIS.md 之 C1–C10 與 G1–G9。
.DESCRIPTION
  本腳本在「正常 session / 本機 PowerShell」執行（需網路 + git + pnpm@11.5.2）。
  執行前請備份；腳本對來源樹只讀，所有變更寫入 monorepo 的 apps/learning-center/。
.PARAMETER EsggoRepo
  esggo monorepo 本地路徑（含 shared/types.ts）。預設 ../esggo
.PARAMETER AppName
  子應用目錄名。預設 learning-center
.PARAMETER DryRun
  只印計畫不寫入。
.EXAMPLE
  .\scripts\merge-to-esggo.ps1 -EsggoRepo C:\Project\esggo -DryRun
#>
[CmdletBinding()]
param(
  [string]$EsggoRepo = '',
  [string]$AppName = 'learning-center',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
if (-not $EsggoRepo) {
  $EsggoRepo = Join-Path (Join-Path (Join-Path $PSScriptRoot '..') '..') 'esggo'
}
$src = Resolve-Path (Join-Path $PSScriptRoot '..')  # learning-center 根
$dest = Join-Path (Join-Path $EsggoRepo 'apps') $AppName

Write-Output "==> 來源: $src"
Write-Output "==> 目標: $dest"

# ---- 預檢 ----
if (-not (Test-Path (Join-Path (Join-Path $EsggoRepo 'shared') 'types.ts'))) {
  Write-Error "ABORT: esggo monorepo 缺少 shared/types.ts ($EsggoRepo)"
  exit 1
}
if ($DryRun) { Write-Output '[DryRun] 以下為將執行的步驟，未實際寫入：' }

# ---- C1: 建立 apps/learning-center 並複製（排除 .git/node_modules/dist/_backup*/.hermes/.vercel/.firebase） ----
$exclude = @('.git', 'node_modules', 'dist', 'dist-ssr', '_backup-20260731', '_backup*', '.hermes', '.vercel', '.firebase', 'emulator-data', 'test-reports', 'package-lock.json')
if (-not $DryRun) {
  if (Test-Path $dest) { Write-Error "ABORT: $dest 已存在，請先手動處理或改 AppName"; exit 1 }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $srcItems = Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name }
  foreach ($it in $srcItems) {
    Copy-Item -Path $it.FullName -Destination (Join-Path $dest $it.Name) -Recurse -Force
  }
  Write-Output "[C1] 複製完成 (排除: $($exclude -join ', '))"
}

# ---- G-9: 補 tsconfig.json ----
$tsconfig = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "esModuleInterop": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "types/generated", "scripts", "vite.config.js"]
}
'@
if (-not $DryRun) { Set-Content -Path (Join-Path $dest 'tsconfig.json') -Value $tsconfig -Encoding utf8; Write-Output '[G-9] tsconfig.json 已建立' }

# ---- C2/G-4: 修正 checker 的 SRC 路徑（新版位置 cwd=apps/learning-center → ../../shared/types.ts） ----
$checker = Join-Path (Join-Path $dest 'scripts') 'check-types-sync.js'
if (-not $DryRun -and (Test-Path $checker)) {
  (Get-Content $checker) -replace "path\.resolve\(process\.cwd\(\), '\.\.', 'esggo', 'shared', 'types\.ts'\)", "path.resolve(process.cwd(), '..', '..', 'shared', 'types.ts')" | Set-Content $checker -Encoding utf8
  Write-Output '[C2/G-4] check-types-sync.js SRC 改為 ../../shared/types.ts'
}

# ---- C3: package.json 加 packageManager、對齊 lucide、標註 React 19 ----
$pkgPath = Join-Path $dest 'package.json'
if (-not $DryRun -and (Test-Path $pkgPath)) {
  $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
  $pkg | Add-Member -NotePropertyName 'packageManager' -NotePropertyValue 'pnpm@11.5.2' -Force
  # lucide-react 位於 dependencies (非 devDependencies) — 兩處都安全處理
  if (-not $pkg.dependencies) { $pkg | Add-Member -NotePropertyName 'dependencies' -NotePropertyValue ([pscustomobject]@{}) -Force }
  if (-not $pkg.devDependencies) { $pkg | Add-Member -NotePropertyName 'devDependencies' -NotePropertyValue ([pscustomobject]@{}) -Force }
  if ($pkg.dependencies.lucideReact) {
    $pkg.dependencies.lucideReact = '^0.507.0'
  } elseif ($pkg.devDependencies.lucideReact) {
    $pkg.devDependencies.lucideReact = '^0.507.0'
  } else {
    $pkg.dependencies | Add-Member -NotePropertyName 'lucideReact' -NotePropertyValue '^0.507.0' -Force
  }
  $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath -Encoding utf8
  Write-Output '[C3] packageManager=pnpm@11.5.2, lucide-react→0.507.0（React 18→19 需手動升並驗證 vite build）'
}

# ---- G-8: 刪 package-lock.json / G-7: 刪 soul.md 空檔 ----
if (-not $DryRun) {
  Remove-Item (Join-Path $dest 'package-lock.json') -ErrorAction SilentlyContinue
  Remove-Item (Join-Path $dest 'soul.md') -ErrorAction SilentlyContinue
  Write-Output '[G-8] 刪 package-lock.json  [G-7] 刪 soul.md'
}

# ---- C4: 提示加 @supabase/supabase-js（monorepo 未含） ----
Write-Output '[C4] TODO: 在 monorepo 根或 apps/learning-center 加 `@supabase/supabase-js` 依賴（monorepo 現無此包）'

# ---- C5: functions/ 落點 ----
Write-Output '[C5] TODO: 決定 functions/ 放 apps/learning-center/functions/ 或頂層 functions/（現為 CJS, monorepo 用 ESM）'

# ---- C6: turbo.json 加 apps/learning-center 專屬 vite build task ----
Write-Output '[C6] TODO: 在 esggo/turbo.json 為 apps/learning-center 加 build task（走 vite 而非 next）'

# ---- C7: CI 搬移 check-types-sync ----
Write-Output '[C7] TODO: 將 apps/learning-center/.github/workflows/ci.yml 的 check-types-sync job 搬入 esggo/.github/workflows/'

# ---- C10: 驗證指令 ----
Write-Output ''
Write-Output '==> 合併後驗證（在 monorepo 根執行）:'
Write-Output "    cd $EsggoRepo"
Write-Output '    pnpm install'
Write-Output "    pnpm -F $AppName build        # vite build"
Write-Output "    pnpm -F $AppName check:types-sync   # 應輸出 TYPES_IN_SYNC"
Write-Output ''
Write-Output 'DONE: 自動步驟完成。剩餘 C4/C5/C6/C7 與 React19 升級為手動決策項（見 MERGE-GAP-ANALYSIS.md）。'
