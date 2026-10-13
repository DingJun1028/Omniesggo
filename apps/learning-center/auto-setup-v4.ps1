# ESG-GO 無礙圓通自動化腳本
# 版本: v4.0 (永續無限迭代版)
# 下載地址: 此檔案內容

# ===== 核心設定 =====
$TargetDir = "C:\Project\esggo"
$Version = "v4.0"

# ===== 步驟 1: 目錄初始化 =====
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}
Set-Location $TargetDir

# ===== 步驟 2: 建立 .env.example =====
@"
# ESG-SUNSHINE 環境變數
NEXT_PUBLIC_SUPABASE_URL=https://yhwfmavnhaivvgzeuklx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=esg-sunshine.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=esg-sunshine
NEXT_PUBLIC_APP_URL=https://esggo.vercel.app
"@ | Out-File -FilePath ".env.example" -Encoding UTF8

# ===== 步驟 3: 建立 README.md =====
@"
# ESG-GO 空間項目

## 📁 專案概述
這是 ESG-GO 永續自動化工作區域。

## 🔐 機密管理
- GitHub Secrets (推薦)
- GCP Secret Manager (備援)

## 🚀 快速開始
1. 複製 .env.example 為 .env
2. 填寫實際值
3. 設定機密

## 🔒 安全注意事項
⚠️ 請立即輪換暴露的機密！
"@ | Out-File -FilePath "README.md" -Encoding UTF8

# ===== 步驟 4: 設定 GitHub Secrets (若 gh CLI 已安裝) =====
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $Secrets = @(
        @{Name="NEXT_PUBLIC_SUPABASE_URL"; Value="https://yhwfmavnhaivvgzeuklx.supabase.co"},
        @{Name="NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"; Value="sb_publishable_a6BWUna2fFNZ3fba80ixiA_xgpxYl_e"},
        @{Name="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"; Value="esg-sunshine.firebaseapp.com"},
        @{Name="NEXT_PUBLIC_FIREBASE_PROJECT_ID"; Value="esg-sunshine"},
        @{Name="NEXT_PUBLIC_APP_URL"; Value="https://esggo.vercel.app"}
    )
    
    foreach ($secret in $Secrets) {
        gh secret set $secret.Name --body $secret.Value 2>$null
    }
}

# ===== 步驟 5: 記錄迭代 =====
$IterationLog = Join-Path $TargetDir "iteration-log.txt"
@"
========================================
迭代版本: $Version
時間: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
狀態: 成功
目標: $TargetDir
建立檔案: .env.example, README.md
========================================
"@ | Out-File -FilePath $IterationLog -Encoding UTF8 -Append

Write-Host "✅ ESG-GO 自動化腳本執行完成" -ForegroundColor Green
Write-Host "📂 目錄: $TargetDir" -ForegroundColor Gray
Write-Host "📝 請檢查建立的檔案" -ForegroundColor Gray