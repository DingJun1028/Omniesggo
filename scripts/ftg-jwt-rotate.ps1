<#
.SYNOPSIS
  ftg-journey-server JWT 金鑰輪換 — Windows PowerShell 執行版

.DESCRIPTION
  包裝 scripts/ftg-jwt-rotate.sh。四階段：產生 → 更新 → 撤銷 → 記錄
  （omni-best-practice §6.2 Secrets 輪換）。

  本檔以 UTF-8 with BOM 儲存：Windows PowerShell 5.1 讀取無 BOM 檔案時會用
  系統 ANSI 編碼（繁中機器為 cp950）解讀，中文變亂碼並導致腳本無法解析。

  傳輸採 cmd 的位元組轉向（< file）而非 PowerShell 管線：管線會把 .NET 字串
  以 [Console]::OutputEncoding（此機器為 cp950）重新編碼，中文在送到遠端前
  就已損毀。

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File C:\Project\esggo\scripts\ftg-jwt-rotate.ps1

.NOTES
  輪換後舊 token 立即失效，線上登入 session 需重新登入。
#>
[CmdletBinding()]
param(
    [string]$SshHost = 'esggo-vps',
    [string]$KeyPath = "$env:USERPROFILE\.ssh\esggo_vps_fix"
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$shPath   = Join-Path $repoRoot 'scripts\ftg-jwt-rotate.sh'

if (-not (Test-Path -LiteralPath $shPath)) {
    Write-Host "找不到 $shPath" -ForegroundColor Red
    exit 1
}

# 以位元組讀入並驗證為合法 UTF-8，避免編碼問題在傳輸前就發生
$shBytes = [System.IO.File]::ReadAllBytes($shPath)
$utf8 = New-Object System.Text.UTF8Encoding($false, $true)
try {
    [void]$utf8.GetString($shBytes)
    Write-Host "[0/2] .sh 編碼檢查：合法 UTF-8（$($shBytes.Length) bytes）" -ForegroundColor Green
} catch {
    Write-Host "[0/2] .sh 編碼檢查：不是合法 UTF-8，中止" -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] 測試 SSH 連線 ..." -ForegroundColor Cyan
$useExplicitKey = $false

& ssh -o BatchMode=yes -o ConnectTimeout=15 $SshHost 'true' 2>$null
if ($LASTEXITCODE -ne 0) {
    if (Test-Path -LiteralPath $KeyPath) {
        Write-Host "  別名連線失敗，改用明確金鑰：$KeyPath" -ForegroundColor Yellow
        $useExplicitKey = $true
        & ssh -i $KeyPath -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15 $SshHost 'true' 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  SSH 仍無法連線。請先修復金鑰或網路。" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  SSH 失敗，且找不到金鑰 $KeyPath" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  OK: SSH 連線正常" -ForegroundColor Green

Write-Host "[2/2] 執行輪換（Start-Process 位元組轉向，遠端 bash -s）..." -ForegroundColor Cyan
Write-Host ""

# Start-Process -RedirectStandardInput 是位元組層級轉向，中文與換行原封不動。
# 不用管線（會被 [Console]::OutputEncoding 重新編碼成 cp950 而損毞），
# 也不用 cmd /c "… < file"（引號會被 PowerShell 二次轉義打亂）。
$spArgs = @('-tt')
if ($useExplicitKey) { $spArgs += @('-i', $KeyPath, '-o', 'IdentitiesOnly=yes') }
$spArgs += @($SshHost, 'sudo bash -s')

Write-Host "  遠端指令: ssh $($spArgs -join ' ') < ftg-jwt-rotate.sh" -ForegroundColor DarkGray
Write-Host ""

$proc = Start-Process -FilePath 'ssh.exe' `
    -ArgumentList $spArgs `
    -RedirectStandardInput $shPath `
    -NoNewWindow -Wait -PassThru
$code = $proc.ExitCode

Write-Host ""
if ($code -eq 0) {
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host " 輪換完成（exit=0）" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host " 後續請注意：" -ForegroundColor Yellow
    Write-Host "  1. 舊 token 已全部失效，線上使用者需重新登入"
    Write-Host "  2. git 歷史仍含明文金鑰，需另行決定是否清除"
    Write-Host "  3. oa-swarm 仍為 errored，與本次無關，須另行修復"
    Write-Host "  4. 請把本輪輸出貼回，以便完成 5T 驗證封口"
} else {
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host " 輪換失敗（exit=$code），服務維持原狀" -ForegroundColor Red
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host " 若 exit=0 但階段輸出異常，請貼回完整輸出再判斷。" -ForegroundColor Yellow
}
exit $code
