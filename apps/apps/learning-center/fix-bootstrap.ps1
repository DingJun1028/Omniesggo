$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot 'cron-fix-logs\run.log'
function Log($m) { Add-Content -Path $log -Value $m }
try {
  Log '--- [step4] fix-bootstrap.ps1 ---'
  $root = 'C:\Project\esggo'
  $file = Join-Path $root 'vps\agent-bootstrap.mjs'
  if (-not (Test-Path $file)) { Log ('FATAL vps/agent-bootstrap.mjs not found at ' + $file); exit 2 }
  $enc = New-Object System.Text.UTF8Encoding($false)
  $txt = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
  $alreadyFixed = ($txt.Contains('async function collectHealth() {') -and $txt.Contains('await check('))
  if ($alreadyFixed) {
    Log '  bootstrap already fixed (async collectHealth + await check present) - skip transform'
  } else {
    $backup = Join-Path $root '_fix-backup-20260801'
    if (-not (Test-Path $backup)) { New-Item -ItemType Directory -Path $backup -Force | Out-Null }
    $bkDir = Join-Path $backup 'vps'
    if (-not (Test-Path $bkDir)) { New-Item -ItemType Directory -Path $bkDir -Force | Out-Null }
    try {
      Copy-Item -Path $file -Destination (Join-Path $bkDir 'agent-bootstrap.mjs') -Force -ErrorAction Stop
      Log '  [backup] vps/agent-bootstrap.mjs'
    } catch {
      Log ('  BACKUP FAILED for vps/agent-bootstrap.mjs - ABORTING transform: ' + $_.Exception.Message)
      Log '--- end fix-bootstrap ---'
      exit 3
    }
    $lines = $txt -split "`r?`n"
    $out = New-Object System.Collections.Generic.List[string]
    $changed = 0
    $i = 0
    $foundOldCheck = $false
    while ($i -lt $lines.Count) {
      $ln = $lines[$i]
      if ($ln -match 'function collectHealth\(\) \{') {
        $ln = $ln -replace 'function collectHealth\(\) \{', 'async function collectHealth() {'
        $changed++
      }
      if ($ln -match 'const check = \(name, port, path =') {
        $foundOldCheck = $true
        $out.Add("  const check = async (name, port, path = '/') => {")
        $out.Add("    try {")
        $out.Add('      const res = await fetch(`http://localhost:${port}${path}`, {')
        $out.Add("        method: 'GET',")
        $out.Add('        signal: AbortSignal.timeout(3000)')
        $out.Add("      });")
        $out.Add("      const status = res.status;")
        $out.Add("      services[name] = {")
        $out.Add("        status: status !== 0 ? 'running' : 'stopped',")
        $out.Add("        health: status >= 200 && status < 300 ? 'healthy' : 'unhealthy',")
        $out.Add("        port,")
        $out.Add("      };")
        $out.Add("    } catch (e) {")
        $out.Add("      services[name] = {")
        $out.Add("        status: 'stopped',")
        $out.Add("        health: 'unhealthy',")
        $out.Add("        port,")
        $out.Add("      };")
        $out.Add("    }")
        $out.Add("  };")
        $changed++
        $i++
        while ($i -lt $lines.Count -and $lines[$i] -notmatch "check\('esggo-core', 3000, '/'\);") { $i++ }
        continue
      }
      if ($ln -match "check\('esggo-core', 3000, '/'\);") {
        $ln = $ln -replace "check\('esggo-core', 3000, '/'\);", "await check('esggo-core', 3000, '/');"
        $changed++
      }
      if ($ln -match "check\('omniagent-gateway', 8642, '/status'\);") {
        $ln = $ln -replace "check\('omniagent-gateway', 8642, '/status'\);", "await check('omniagent-gateway', 8642, '/status');"
        $changed++
      }
      if ($ln -match 'const system = collectHealth\(\);') {
        $ln = $ln -replace 'const system = collectHealth\(\);', 'const system = await collectHealth();'
        $changed++
      }
      $out.Add($ln)
      $i++
    }
    if (-not $foundOldCheck) {
      Log '  WARNING: old "const check = (name, port, path =" pattern NOT found - dumping check-related lines:'
      $ctx = @($lines | Where-Object { $_ -match 'check\(' } | Select-Object -First 15)
      foreach ($c in $ctx) { Log ('    | ' + $c) }
    }
    $newTxt = [string]::Join("`n", $out)
    [System.IO.File]::WriteAllText($file, $newTxt, $enc)
    Log ('  [transformed] vps/agent-bootstrap.mjs (changes=' + $changed + ')')
  }
  # verify
  $v = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
  $execCurl = @(($v -split "`r?`n") | Where-Object { $_ -match 'execSync' -and $_ -match 'curl' })
  Log ('VERIFY execSync+curl lines remaining: ' + $execCurl.Count)
  foreach ($e in $execCurl) { Log ('    | ' + $e.Trim()) }
  Log ('VERIFY await check( count: ' + ([regex]::Matches($v, 'await check\(')).Count)
  Log ('VERIFY async function collectHealth: ' + ([regex]::Matches($v, 'async function collectHealth')).Count)
  Log ('VERIFY await collectHealth(): ' + ([regex]::Matches($v, 'await collectHealth\(\)')).Count)
  Log '--- end fix-bootstrap ---'
} catch {
  Log ('FIX-BOOTSTRAP ERROR: ' + $_.Exception.Message)
}
