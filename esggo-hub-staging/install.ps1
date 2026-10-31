# install.ps1 — install / reinstall the ESGGO Hub Hermes desktop plugin.
#
# Run from a PowerShell prompt (the Hermes desktop app can be closed):
#   powershell -ExecutionPolicy Bypass -File "C:\Project\esggo-learning-center\esggo-hub-staging\install.ps1"
#
# What it does:
#   1. Copies plugin.js            -> <hermes home>/desktop-plugins/esggo-hub/plugin.js   (always)
#   2. Copies backend (if missing) -> <hermes home>/plugins/esggo-hub/dashboard/          (skip if present)
#   3. Merges "esggo-hub" into config plugins.enabled (never clobbers other plugins) as a
#      PROPER JSON ARRAY: ["esggo-hub"] (NOT the string "esggo-hub", which the gateway ignores).
#
# After running: restart the gateway (e.g. `hermes update --no-backup --yes`,
# or just restart the Hermes app) then Ctrl/Cmd+K -> "Reload desktop plugins".

param(
  [string]$HermesHome = "$env:LOCALAPPDATA\hermes",
  [switch]$ForceBackend
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$destPlugin = Join-Path $HermesHome 'desktop-plugins\esggo-hub'
$destApi    = Join-Path $HermesHome 'plugins\esggo-hub\dashboard'

New-Item -ItemType Directory -Force -Path $destPlugin | Out-Null
New-Item -ItemType Directory -Force -Path $destApi | Out-Null

# 1. Frontend — always overwrite (this is the reinstall target / bug fix).
Copy-Item (Join-Path $here 'plugin.js') (Join-Path $destPlugin 'plugin.js') -Force
Write-Host "[ok] plugin.js -> $destPlugin"

# 2. Backend — only if missing (or -ForceBackend), to avoid clobbering a custom one.
$apiDest = Join-Path $destApi 'plugin_api.py'
if ($ForceBackend -or -not (Test-Path $apiDest)) {
  Copy-Item (Join-Path $here 'backend\manifest.json') (Join-Path $destApi 'manifest.json') -Force
  Copy-Item (Join-Path $here 'backend\plugin_api.py') $apiDest -Force
  Write-Host "[ok] backend -> $destApi"
} else {
  Write-Host "[skip] backend already present at $apiDest (use -ForceBackend to overwrite)"
}

# 3. Enable plugin in config — merge, do not overwrite other enabled plugins.
#    CRITICAL: must be a JSON ARRAY, e.g. ["esggo-hub"]. A bare string "esggo-hub"
#    is silently ignored by the gateway (backend never mounts -> pane shows "後端未啟用").
try {
  $existing = @()
  $raw = & hermes config get plugins.enabled 2>$null
  if ($raw) {
    try {
      $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
      if ($parsed -is [System.Collections.IEnumerable] -and -not ($parsed -is [string])) {
        $existing = @($parsed)
      } elseif ($parsed -is [string] -and $parsed.Trim().Length -gt 0) {
        # Tolerate a previously-malformed string value by wrapping it.
        $existing = @($parsed.Trim())
      }
    } catch {
      # Not valid JSON — start fresh with esggo-hub only.
      $existing = @()
    }
  }

  # Drop empties, ensure esggo-hub present, de-dupe, preserve order.
  $merged = @()
  foreach ($item in $existing) {
    if ($item -and ($item -is [string]) -and $item.Trim().Length -gt 0 -and $merged -notcontains $item.Trim()) {
      $merged += $item.Trim()
    }
  }
  if ($merged -notcontains 'esggo-hub') { $merged += 'esggo-hub' }

  # Build a guaranteed-valid JSON array string (avoids ConvertTo-Json single-element bug).
  $json = '[' + (($merged | ForEach-Object { '"{0}"' -f $_ }) -join ',') + ']'
  & hermes config set plugins.enabled $json
  Write-Host "[ok] plugins.enabled = $json"
} catch {
  Write-Warning "Could not set plugins.enabled via hermes CLI: $_"
  Write-Host "Action needed: add 'esggo-hub' to plugins.enabled in config.yaml, then restart the gateway."
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1) Restart the gateway (e.g. 'hermes update --no-backup --yes' or restart the app)."
Write-Host "  2) Ctrl/Cmd+K -> 'Reload desktop plugins'."
Write-Host "  3) Verify: status-bar 'ESGGO' chip appears; right pane shows branch/commit; Cmd+K 'Open ESGGO Hub' opens the page."
