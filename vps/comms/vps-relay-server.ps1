# ESGGO VPS Relay Server — serves /status /cmd /result
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$token = $env:ESGGO_RELAY_TOKEN
$port = 9999
$listener = $null

function Send([string]$data,[string]$type='text/plain'){
  try{ $response.Content } catch { '' }
}
function Read-Body([System.Net.HttpListenerRequest]$req){
  if($req.HasEntityBody){
    $sr = New-Object System.IO.StreamReader($req.InputStream, $req.ContentEncoding)
    return $sr.ReadToEnd()
  }
  return ''
}
function Respond([System.Net.HttpListenerResponse]$res,[int]$code,[string]$body,[string]$type='application/json'){
  $res.StatusCode = $code
  $res.ContentType = $type
  $buf = [System.Text.Encoding]::UTF8.GetBytes($body)
  $res.OutputStream.Write($buf,0,$buf.Length)
  $res.OutputStream.Close()
}

try {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://127.0.0.1:$port/")
  $listener.Start() | Out-Null
  Write-Host "ESGGO VPS Relay Server v2"
  Write-Host "Port: $port"
  Write-Host "Auth: $token"
  Write-Host "Listening on 127.0.0.1:$port"
  Write-Host "Endpoints: /status /cmd /result"
  while($true){
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $auth = $req.Headers['X-Auth-Token']
    if($auth -ne $token){ Respond $res 403 '{"error":"forbidden"}'; continue }
    $path = $req.Url.AbsolutePath
    switch($path){
      '/status' { Respond $res 200 (@{status='ok';ts=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json -Compress) }
      '/cmd' {
        if($req.HttpMethod -ne 'POST'){ Respond $res 405 '{"error":"method_not_allowed"}'; continue }
        $body = Read-Body $req
        Respond $res 200 (@{ status='queued'; id=((ConvertFrom-Json $body).id); command=((ConvertFrom-Json $body).command) } | ConvertTo-Json -Compress)
      }
      '/result' {
        if($req.HttpMethod -ne 'POST'){ Respond $res 405 '{"error":"method_not_allowed"}'; continue }
        $body = Read-Body $req
        $parsed = ConvertFrom-Json $body
        Write-Host ("RESULT from VPS (cmd: " + $parsed.id + ")`n  OUT: " + $parsed.stdout.Substring(0, [Math]::Max(0, $parsed.stdout.Length - 1)))
        Respond $res 200 '{"status":"ok"}'
      }
      default { Respond $res 404 '{"error":"not_found"}' }
    }
  }
} catch { Write-Error $_ } finally { if($listener -and $listener.IsListening){ $listener.Stop() } }
