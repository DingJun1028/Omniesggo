# ============================================
# 每日安全掃描腳本（Windows 排程任務）
# 掃描真實機密值、檢查權限、掃描 git 歷史
# 執行時間: 每日 08:00
# ============================================
$ErrorActionPreference = "Stop"

Write-Host "🔍 開始每日安全掃描..." -ForegroundColor Yellow

# 1. 掃描真實機密值
Write-Host "`n[1/4] 掃描真實機密值..."
$secretPatterns = @("your_actual_", "sk-ant-", "gsk_", "mstrl_")
$found = $false
$files = Get-ChildItem -Recurse -Include *.env*, *.sh, *.js, *.ts, *.py, *.md, *.yaml, *.yml, .env* 2>$null | Where-Object { $_.FullName -notlike "*\$env:ProgramFiles*" }

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($pattern in $secretPatterns) {
                if ($content -match $pattern) {
                    Write-Host "  ⚠️  發現機密值:$file" -ForegroundColor Red
                    $found = $true
                }
            }
        }
    } catch { }
}

if (-not $found) {
    Write-Host "  ✅ 確認：無真實機密值殘留" -ForegroundColor Green
}

# 2. 檢查文件權限
Write-Host "`n[2/4] 檢查機密檔案權限..."
$secretFiles = Get-ChildItem -Recurse -Path "secret-vault" -Include *.env -ErrorAction SilentlyContinue
$allGood = $true
foreach ($file in $secretFiles) {
    $mode = (Get-Item $file.FullName).Mode
    if ($mode -notmatch "^-rw-------") {
        Write-Host "  ⚠️  權限異常:$file.Mode" -ForegroundColor Yellow
        $allGood = $false
    }
}
if ($allGood) {
    Write-Host "  ✅ 權限正常" -ForegroundColor Green
}

# 3. 檢查 git 歷史
Write-Host "`n[3/4] 檢查 git 歷史..."
$gitHistory = git log --all -p 2>$null | Select-String -Pattern "api_key|password|secret|token" -CaseSensitive:$false | Select-Object -First 10
if ($gitHistory) {
    Write-Host "  ⚠️  發現 git 歷史機密值:" -ForegroundColor Yellow
    $gitHistory | ForEach-Object { Write-Host "  > $_" }
} else {
    Write-Host "  ✅ git 歷史無機密值" -ForegroundColor Green
}

# 4. 掃描 .git 目錄
Write-Host "`n[4/4] 檢查 .git 目錄安全..."
$gitIgnoreFiles = Get-ChildItem -Recurse -Path ".git" -Include ".env*" -ErrorAction SilentlyContinue
if ($gitIgnoreFiles) {
    Write-Host "  ⚠️  .git 目錄中發現 .env 檔案!" -ForegroundColor Red
    $gitIgnoreFiles | ForEach-Object { Write-Host "  > $_.FullName" }
} else {
    Write-Host "  ✅ .git 目錄安全" -ForegroundColor Green
}

# 總結
Write-Host "`n📋 掃描結束" -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "📅 掃描時間: $timestamp" -ForegroundColor Gray

# 記錄日誌
$logPath = "scripts\security-scan-$timestamp.log"
$logContent = @"
=== 日期: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") ===
[1/4] 機密值掃描: $(if ($found) { "⚠️  發現機密值" } else { "✅ 安全" })
[2/4] 權限掃描: $(if ($allGood) { "✅ 正常" } else { "⚠️  異常" })
[3/4] Git 歷史掃描: $(if ($gitHistory) { "⚠️  發現機密值" } else { "✅ 安全" })
[4/4] .git 目錄掃描: $(if ($gitIgnoreFiles) { "⚠️  發現 .env 檔案" } else { "✅ 安全" })
"@
$logContent | Out-File -FilePath $logPath -Encoding UTF8
Write-Host "📝 日誌已儲存: $logPath" -ForegroundColor Gray

# 如果發現問題，輸出警告
if ($found -or $gitHistory) {
    Write-Host "`n❌ 發現安全問題，請立即處理!" -ForegroundColor Red
    exit 1
}
