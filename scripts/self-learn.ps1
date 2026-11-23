# 🧠 ze self-learn — 萬能進化自我學習
# 使用方式：ze self-learn scan|draft|check|self-learn
param([string[]]$Actions = @('scan'))
$ErrorActionPreference = 'Continue'
foreach ($action in $Actions) {
  switch ($action) {
    'scan' { Write-Host '🔍 掃描未固化模式...' ; node scripts/self-learn-scan.mjs }
    'draft' { Write-Host '📝 產生教訓草稿...' ; node scripts/self-learn-draft.mjs }
    'check' { Write-Host '📊 檢查固化狀態...' ; node scripts/self-learn-check.mjs }
    'self-learn' { Write-Host '⟳ 執行完整自我學習循環：scan → draft → check' ; node scripts/self-learn-scan.mjs; node scripts/self-learn-draft.mjs; node scripts/self-learn-check.mjs }
    default { Write-Host "未知動作: $action" -ForegroundColor Yellow }
  }
}
