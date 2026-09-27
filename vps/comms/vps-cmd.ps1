# ESGGO VPS CMD wrapper
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$relay = '127.0.0.1'
$relayPort = 9999
$token = $env:ESGGO_RELAY_TOKEN
$path = split-path -Leaf $MyInvocation.MyCommand.Path

if($args.Count -eq 0){ Write-Host "Usage: $path <command>"; exit 1 }

$command = $args -join ' '
$id = 'cmd_'+[guid]::NewGuid().ToString('N').Substring(0,12)
$body = @{ id=$id; command=$command; desc="ps1-cmd" } | ConvertTo-Json -Compress

$r = Invoke-Rest -Uri "http://$relay`:$relayPort/cmd" -Method POST -ContentType 'application/json' -Headers @{ 'X-Auth-Token' = $token } -Body $body -ErrorAction SilentlyContinue
if($null -ne $r){ $r.Content } else { '{"error":"rest_failed"}' }
