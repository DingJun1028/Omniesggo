# 🌅 ze awakening checklist — 永恆覺醒檢查清單
$ErrorActionPreference = 'Continue'
$checks = @(
  @{ Name = 'HEADER 標頭'; Path = '.env.example'; Check = 'exists' },
  @{ Name = 'LICENSE'; Path = 'LICENSE'; Check = 'exists' },
  @{ Name = 'AGENTS.md'; Path = 'AGENTS.md'; Check = 'exists' },
  @{ Name = 'TypeScript'; Path = 'tsconfig.json'; Check = 'exists' },
  @{ Name = 'Cloudflare 部署'; Path = 'dist/server/wrangler.json'; Check = 'exists' }
)
$ok = $true
foreach ($c in $checks) {
  $exists = Test-Path $c.Path
  if ($c.Check -eq 'exists') {
    if ($exists) { Write-Host "✅ $($c.Name)" -ForegroundColor Green }
    else { Write-Host "❌ $($c.Name)" -ForegroundColor Red; $ok = $false }
  }
}
if ($ok) { Write-Host "🎉 覺醒檢查全部通過。" -ForegroundColor Green }
exit $(if ($ok) { 0 } else { 1 })
