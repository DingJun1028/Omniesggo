$headers = @{ 'X-Auth-Token' = $env:ESGGO_RELAY_TOKEN }
try {
  $body = Invoke-RestMethod -Uri 'http://127.0.0.1:9999/result' -Method Get -Headers $headers | ConvertTo-Json -Depth 5 -Compress
  Write-Output $body
} catch {
  Write-Output "ERROR"
  Write-Output $_.Exception.Message
}
