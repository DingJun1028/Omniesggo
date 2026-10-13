$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot 'cron-fix-logs\run.log'
function Log($m) { Add-Content -Path $log -Value $m }
try {
  Log '--- [step5] fix-build.ps1 ---'
  $root = 'C:\Project\esggo'
  Set-Location $root
  $nodeV = & node --version 2>&1
  Log ('node --version: ' + $nodeV)
  if ($LASTEXITCODE -ne 0 -or -not $nodeV) {
    Log 'FATAL node not available'
    Log '--- end fix-build ---'
    exit 4
  }
  $pkg = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
  $bs = $pkg.scripts.build
  Log ('package.json scripts.build: ' + $bs)
  $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if ($pnpm) { Log ('pnpm --version: ' + (& pnpm --version 2>&1)) }
  if ($npm) { Log ('npm --version: ' + (& npm --version 2>&1)) }
  if (-not $pnpm -and -not $npm) { Log 'FATAL no pnpm/npm found'; Log '--- end fix-build ---'; exit 5 }
  $buildLog = Join-Path $PSScriptRoot 'cron-fix-logs\build.log'
  $errLog = $buildLog + '.err'
  if ($pnpm) {
    Log 'running: pnpm build (15 min cap) - output in cron-fix-logs\build.log'
    $p = Start-Process -FilePath 'pnpm' -ArgumentList @('build') -NoNewWindow -PassThru -RedirectStandardOutput $buildLog -RedirectStandardError $errLog
  } else {
    Log 'running: npm run build (15 min cap) - output in cron-fix-logs\build.log'
    $p = Start-Process -FilePath 'npm' -ArgumentList @('run','build') -NoNewWindow -PassThru -RedirectStandardOutput $buildLog -RedirectStandardError $errLog
  }
  if (-not $p.WaitForExit(900000)) {
    try { $p.Kill() } catch { Log ('  kill error: ' + $_.Exception.Message) }
    Log 'BUILD RESULT: TIMEOUT (killed after 15 min)'
  } else {
    Log ('BUILD RESULT: exit code = ' + $p.ExitCode)
  }
  Log '--- end fix-build ---'
} catch {
  Log ('FIX-BUILD ERROR: ' + $_.Exception.Message)
}
