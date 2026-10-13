$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot 'cron-fix-logs\run.log'
function Log($m) { Add-Content -Path $log -Value $m }
try {
  Log '--- [step2+3] fix-imports.ps1 ---'
  $root = 'C:\Project\esggo'
  $backup = Join-Path $root '_fix-backup-20260801'
  $targets = @(Get-ChildItem -Path (Join-Path $root 'app\api') -Recurse -Filter 'route.ts' -File -ErrorAction SilentlyContinue | Where-Object {
    Select-String -Path $_.FullName -Pattern '@/lib/' -SimpleMatch -Quiet
  })
  Log ('route.ts files containing "@/lib/": ' + $targets.Count)
  if ($targets.Count -eq 0) { Log '  none found - alias already fixed or no matches' }
  foreach ($t in $targets) { Log ('  [target] ' + $t.FullName.Substring($root.Length).TrimStart('\')) }
  # step2: backup
  if ($targets.Count -gt 0) {
    if (-not (Test-Path $backup)) { New-Item -ItemType Directory -Path $backup -Force | Out-Null }
    foreach ($t in $targets) {
      $rel = $t.FullName.Substring($root.Length).TrimStart('\')
      $dest = Join-Path $backup $rel
      $dd = Split-Path $dest -Parent
      if (-not (Test-Path $dd)) { New-Item -ItemType Directory -Path $dd -Force | Out-Null }
      try {
        Copy-Item -Path $t.FullName -Destination $dest -Force -ErrorAction Stop
        Log ('  [backup] ' + $rel)
      } catch {
        Log ('  BACKUP FAILED for ' + $rel + ' - SKIPPING fix for this file: ' + $_.Exception.Message)
      }
    }
  }
  # step3: alias fix  (from '@/lib/' -> from '@lib/' ; from "@/lib/" -> from "@lib/")
  $changed = 0
  foreach ($t in $targets) {
    $txt = [System.IO.File]::ReadAllText($t.FullName, [System.Text.Encoding]::UTF8)
    $before = $txt
    $txt = $txt.Replace("from '@/lib/", "from '@lib/")
    $txt = $txt.Replace('from "@/lib/', 'from "@lib/')
    if ($txt -ne $before) {
      $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($t.FullName, $txt, $utf8NoBom)
      $changed++
      Log ('  [fixed] ' + $t.Name)
    } else {
      Log ('  [unchanged] ' + $t.Name)
    }
  }
  Log ('alias fix applied to files: ' + $changed)
  # verify
  $remaining = @(Get-ChildItem -Path (Join-Path $root 'app\api') -Recurse -Filter 'route.ts' -File -ErrorAction SilentlyContinue | Where-Object {
    Select-String -Path $_.FullName -Pattern '@/lib/' -SimpleMatch -Quiet
  })
  Log ('VERIFY remaining "@/lib/" in app/api route.ts: ' + $remaining.Count)
  foreach ($r in $remaining) { Log ('  STILL BROKEN: ' + $r.FullName) }
  Log '--- end fix-imports ---'
} catch {
  Log ('FIX-IMPORTS ERROR: ' + $_.Exception.Message)
}
