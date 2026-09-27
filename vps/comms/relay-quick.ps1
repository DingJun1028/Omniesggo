$headers = @{ 'X-Auth-Token' = $env:ESGGO_RELAY_TOKEN }
try {
  $r = Invoke-RestMethod -Uri 'http://127.0.0.1:9999/status' -Headers $headers -TimeoutSec 5
  Write-Host ('status=' + $r.relay + ' uptime=' + $r.uptime + ' queued=' + $r.commandsQueued + ' total=' + $r.commandsTotal + ' results=' + $r.resultsCount)
} catch {
  Write-Host ('ERR=' + $_)
}
