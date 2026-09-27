# ESGGO relay token
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$relayPort=9999
$token = $env:ESGGO_RELAY_TOKEN

function Status(){
  try{ (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$relayPort/status" -Headers @{ 'X-Auth-Token'=$token} -TimeoutSec 3).Content } catch { 'UNREACHABLE' }
}
function Cmd([string]$command){
  $id='cmd_'+[guid]::NewGuid().ToString('N').Substring(0,12)
  $body=@{ id=$id; command=$command; desc='local-ps1-cmd' } | ConvertTo-Json -Compress
  try{ 
    (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$relayPort/cmd" -Method POST -ContentType 'application/json' -Headers @{ 'X-Auth-Token'=$token} -Body $body -TimeoutSec 3).Content
  } catch { '{"error":"send_failed"}'}
}
'status=' + (Status)
'ping=' + (Cmd 'echo hello-from-ps1')
