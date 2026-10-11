# ============================================================
# VoxSpica × OmniLive 橋接器 / VoxSpica-to-OmniLive Bridge
# 本機 VoxSpica (VOSK 離線語音辨識) → OmniLive 即時雙語字幕
#
# 繁體中文優先: cn 模型輸出為簡體, 橋接自動轉繁體 (zhconv/OpenCC)。
# 零費用: 走 OmniLive 免費翻譯鏈, 不需任何付費金鑰。
#
# 用法 / Usage:
#   # 即時麥克風辨識 (預設) / Live mic:
#   powershell -ExecutionPolicy Bypass -File voxspica-bridge.ps1 `
#     -ServerUrl http://127.0.0.1:8797 -Room my-room -Lang cn
#   # 檔案轉錄推播 / File transcription:
#   powershell -ExecutionPolicy Bypass -File voxspica-bridge.ps1 `
#     -Mode file -AudioFile C:\path\meeting.wav -Lang en-us
#
# 語系 / Langs: cn (中文) | en-us (英文)
#   辨識模型與介面語系無關; VoxSpica 介面請在 config 設 ui_lang=zhtw (繁體中文)。
# ============================================================
param(
  [ValidateSet('mic', 'file')]
  [string]$Mode = 'mic',
  [string]$ServerUrl = 'http://127.0.0.1:8797',
  [string]$ApiKey = '',
  [string]$Room = '',
  [ValidateSet('cn', 'en-us')]
  [string]$Lang = 'cn',
  [string]$From = 'auto',
  [string]$To = 'auto',
  [string]$AudioFile = '',
  [string]$VoxSpicaExe = 'C:\opt\voxspica\app\VoxSpica.exe',
  [switch]$NoS2T
)

$ErrorActionPreference = 'Stop'
# UTF-8 I/O 安全 (繁中介面必要): 主控台輸出編碼 + 子程序 stdout 編碼
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try { [System.Environment]::SetEnvironmentVariable('PYTHONIOENCODING', 'utf-8', 'Process') } catch {}

function Write-Bilingual {
  param([string]$Zh, [string]$En, [string]$Color = 'Gray')
  Write-Host ("[voxspica] {0} / {1}" -f $Zh, $En) -ForegroundColor $Color
}

function ConvertToTraditional {
  param([string]$Text)
  if ($NoS2T -or $Lang -ne 'cn' -or -not $Text.Trim()) { return $Text }
  # 繁中介面核心步驟: VOSK cn 模型吐簡體, 這裡轉繁體 (zhconv, `pip install zhconv`)
  $tmpDir = Join-Path $env:TEMP 'voxspica-bridge'
  if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null }
  $inFile = Join-Path $tmpDir 's2t-in.txt'
  $outFile = Join-Path $tmpDir 's2t-out.txt'
    try {
    [System.IO.File]::WriteAllText($inFile, $Text, (New-Object System.Text.UTF8Encoding($false)))
    $py = 'from zhconv import convert
import sys
text = open(sys.argv[1], encoding="utf-8").read()
sys.stdout.reconfigure(encoding="utf-8")
open(sys.argv[2], "w", encoding="utf-8").write(convert(text, "zh-tw"))'
    $pyFile = Join-Path $tmpDir 's2t.py'
    [System.IO.File]::WriteAllText($pyFile, $py, (New-Object System.Text.UTF8Encoding($false)))
    Start-Process -FilePath 'python' -ArgumentList @($pyFile, $inFile, $outFile) -NoNewWindow -Wait -PassThru:$null | Out-Null
    $out = [System.IO.File]::ReadAllText($outFile, [System.Text.Encoding]::UTF8)
    if ($out.Trim()) { return $out.Trim() }
  } catch {
    Write-Host "[voxspica] 簡轉繁失敗 (缺 zhconv? `pip install zhconv`), 改用原文 / s2t failed, sending raw" -ForegroundColor Yellow
  }
  return $Text
}

function Send-ToOmniLive {
  param([string]$Text)
  $text = ConvertToTraditional -Text $Text
  if (-not $text.Trim()) { return }
  $body = @{ text = $text.Trim(); room = $Room; from = $From; to = $To } | ConvertTo-Json -Compress
  $headers = @{ 'content-type' = 'application/json' }
  if ($ApiKey) { $headers['x-omnilive-key'] = $ApiKey }
  try {
    $resp = Invoke-RestMethod -Method Post -Uri ($ServerUrl.TrimEnd('/') + '/api/speak') `
      -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 15
    if ($resp.source) {
      $t = if ($resp.target) { $resp.target } else { $resp.source }
      $src = $resp.source; if ($src.Length -gt 30) { $src = $src.Substring(0, 30) }
      if ($t.Length -gt 30) { $t = $t.Substring(0, 30) }
      Write-Host ("[voxspica] {0} => {1}" -f $src, $t) -ForegroundColor Green
    }
  } catch {
    Write-Host ("[voxspica] 傳送失敗 / send failed: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
  }
}

# ── 前置檢查 / Preconditions ─────────────────────────────
if (-not (Test-Path $VoxSpicaExe)) {
  Write-Bilingual "找不到 VoxSpica: $VoxSpicaExe" "VoxSpica executable not found" 'Red'
  exit 1
}
$uiLang = ''
try {
  $cfg = Get-Content "$env:USERPROFILE\.voxspica\config.json" -Raw -Encoding UTF8 | ConvertFrom-Json
  $uiLang = $cfg.ui_lang
} catch {}
Write-Bilingual "橋接器啟動 (模式: $Mode, 辨識語: $Lang)" "Bridge starting (mode: $Mode, recognition lang: $Lang)" 'Cyan'
Write-Bilingual "伺服器: $ServerUrl  房間: $(if ($Room) { $Room } else { '(主視窗/main)' })" "Server: $ServerUrl  Room: $(if ($Room) { $Room } else { '(main)' })"
if ($uiLang -ne 'zhtw') {
  Write-Bilingual "提示: VoxSpica 介面語系 = '$uiLang'; 繁體介面請設 ui_lang=zhtw" "hint: VoxSpica ui_lang='$uiLang'; set zhtw for 繁體中文 UI" 'DarkYellow'
}
Write-Bilingual "Ctrl+C 停止 / press Ctrl+C to stop" "Ctrl+C to stop" 'DarkGray'

if ($Mode -eq 'file') {
  if (-not $AudioFile -or -not (Test-Path $AudioFile)) {
    Write-Bilingual "找不到音訊檔: $AudioFile" "audio file not found" 'Red'
    exit 1
  }
  $psi = Start-Process -FilePath $VoxSpicaExe -ArgumentList @('file', $AudioFile, '--lang', $Lang, '--size', 'small') -Wait -PassThru -NoNewWindow
  # VoxSpica 會把轉錄存成 <basename>.txt 於 ~\.voxspica\, 逐行推播
  $outTxt = Join-Path "$env:USERPROFILE\.voxspica" ([System.IO.Path]::GetFileNameWithoutExtension($AudioFile) + '.txt')
  Start-Sleep -Seconds 1
  if (Test-Path $outTxt) {
    foreach ($line in Get-Content $outTxt -Encoding UTF8) {
      if ($line.Trim()) { Send-ToOmniLive -Text $line }
    }
    Write-Bilingual "檔案轉錄推播完成 / file transcription broadcast done" "done" 'Cyan'
  } else {
    Write-Bilingual "找不到轉錄輸出 (仍檢查上方 stdout 訊息)" "transcript output txt not found" 'Yellow'
  }
  exit 0
}

# ── mic 模式: 持續監聽 ──────────────────────────────────
$argList = @('mic', '--lang', $Lang, '--size', 'small')
$lastLen = 0
$stdoutBuf = New-Object System.Text.StringBuilder
$errFile = Join-Path $env:TEMP 'vs-bridge-mic.log'

$psiStd = Start-Process -FilePath $VoxSpicaExe -ArgumentList $argList -NoNewWindow -PassThru `
  -RedirectStandardOutput $errFile -RedirectStandardError "$errFile.err" -WindowStyle Hidden

try {
  while ($true) {
    if ($null -eq $psiStd -or $psiStd.HasExited) {
      Write-Bilingual "VoxSpica 已退出 / VoxSpica exited" "exited" 'Yellow'
      break
    }
    if (Test-Path $errFile) {
      $raw = [System.IO.File]::ReadAllText($errFile, [System.Text.Encoding]::UTF8)
      if ($raw.Length -gt $lastLen) {
        $fresh = $raw.Substring($lastLen)
        $lastLen = $raw.Length
        foreach ($line in ($fresh -split "`r?`n")) {
          $l = $line.Trim()
          if ($l -and $l.Length -ge 2 -and $l -notmatch '^Распозн|^Сохранено|^Готов|^Начина|^Откр') {
            Send-ToOmniLive -Text $l
          }
        }
      }
    }
    Start-Sleep -Milliseconds 600
  }
} finally {
  if ($psiStd -and -not $psiStd.HasExited) {
    Stop-Process -Id $psiStd.Id -Force -ErrorAction SilentlyContinue
  }
  Write-Bilingual "橋接器已停止 / bridge stopped" "stopped" 'DarkGray'
}
