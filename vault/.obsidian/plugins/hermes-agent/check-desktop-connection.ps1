$ErrorActionPreference = 'Stop'
$baseUrl = 'http://127.0.0.1:8642'
$gatewayEnv = Join-Path $HOME '.hermes/.env'

Write-Host "Hermes gateway: $baseUrl"
try {
  $health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 5
  Write-Host "Health: OK ($($health.status), version $($health.version))"
} catch {
  Write-Host "Health: FAILED - $($_.Exception.Message)"
  exit 2
}

$hasGatewayKey = $false
if (Test-Path $gatewayEnv) {
  $hasGatewayKey = [bool](Get-Content $gatewayEnv | Where-Object { $_ -match '^\s*API_SERVER_KEY\s*=' } | Select-Object -First 1)
}
Write-Host "Gateway API_SERVER_KEY configured: $hasGatewayKey"

$obsidianConfig = Join-Path $env:APPDATA 'Obsidian/obsidian.json'
if (-not (Test-Path $obsidianConfig)) {
  Write-Host 'Obsidian vault registry not found for this Windows user.'
  exit 3
}

$registry = Get-Content $obsidianConfig -Raw | ConvertFrom-Json
$foundPlugin = $false
foreach ($entry in $registry.vaults.PSObject.Properties) {
  $vaultPath = $entry.Value.path
  if (-not $vaultPath) { continue }
  $pluginDir = Join-Path $vaultPath '.obsidian/plugins/hermes-agent'
  if (-not (Test-Path $pluginDir)) { continue }
  $foundPlugin = $true
  $dataPath = Join-Path $pluginDir 'data.json'
  Write-Host "Plugin found in vault: $vaultPath"
  if (-not (Test-Path $dataPath)) {
    Write-Host 'Plugin settings file: missing (Obsidian may not have saved settings yet).'
    continue
  }
  try {
    $settings = Get-Content $dataPath -Raw | ConvertFrom-Json
    $url = if ($settings.baseUrl) { [string]$settings.baseUrl } else { 'http://127.0.0.1:8642 (default)' }
    Write-Host "Configured gateway URL: $url"
    Write-Host "Obsidian API key configured: $([bool]$settings.apiKey)"
    if ($settings.baseUrl -and $settings.baseUrl.TrimEnd('/') -ne $baseUrl) {
      Write-Host 'WARNING: This vault points to a different gateway URL.'
    }
  } catch {
    Write-Host 'Plugin settings file is not valid JSON.'
  }
}
if (-not $foundPlugin) {
  Write-Host 'Hermes Agent plugin was not found in any vault registered by this Obsidian profile.'
}
Write-Host ''
Write-Host 'If the plugin reports no key or /v1/models returns 401: open Obsidian Settings > Community plugins > Hermes Agent > Options, paste the active profile API_SERVER_KEY into the password field, and click Test connection. Do not save or share the key in this repository.'
