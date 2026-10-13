# install.ps1 — install / reinstall the ESGGO Hub Hermes desktop plugin.
#
# Run from a PowerShell prompt (the Hermes desktop app can be closed):
#   powershell -ExecutionPolicy Bypass -File "C:\Project\esggo-learning-center\esggo-hub-staging\install.ps1"
#
# What it does:
#   1. Copies plugin.js            -> <hermes home>/desktop-plugins/esggo-hub/plugin.js   (always)
#   2. Copies backend (if missing) -> <hermes home>/plugins/esggo-hub/dashboard/          (skip if present)
#   3. Merges "esggo-hub" into config plugins.enabled (never clobbers other plugins).
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
try {
  $raw = & hermes config get plugins.enabled 2>$null
  try { $list = $raw | ConvertFrom-Json } catch { $list = @() }
  if ($list -is [string]) { $list = @($list) }
  if ($null -eq $list) { $list = @() }
  if ($list -notcontains 'esggo-hub') { $list = @($list) + 'esggo-hub' }
  $json = $list | ConvertTo-Json -Compress
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
