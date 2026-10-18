# ============================================================
# OmniLive 安全救援 — Windows 輔助字幕 (Live Captions) 即時抓取器
# 抓取 Windows 內建輔助字幕 (Win+C, LiveCaptions.exe) 的即時文字,
# 增量送去 OmniLive /api/speak → 雙語翻譯 → SSE 廣播,
# 與正常字幕同一視窗無縫呈現 (金黃=繁中 / 白色=英文, 等字級)。
# 覆蓋 Chrome 分頁音訊: 輔助字幕吃系統音訊, 含 Chrome 內任何影音。
# 零費用: 走 OmniLive 免費翻譯鏈 (gtx/mymemory), 不用任何付費 key。
#
# 用法 (在有輔助字幕視窗的電腦上執行):
#   powershell -ExecutionPolicy Bypass -File win-live-captions-grab.ps1 `
#     -ServerUrl http://<OmniLive主機>:8797 -ApiKey <host_key> -Room <房間ID>
#
# 5T: source_origin=win-live-captions; engine=speak-api (零費)
# ============================================================
param(
  [string]$ServerUrl = 'http://localhost:8797',
  [string]$ApiKey = '',
  [string]$Room = '',
  [string]$From = 'auto',          # 來源語: auto / zh-TW / en
  [string]$To = 'auto',            # 目標語: auto / zh-TW / en
  [int]$IntervalMs = 400,          # 輪詢輔助字幕視窗間隔
  [int]$MinNewChars = 3            # 新增文字門檻 (避免雜訊重送)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

function Find-LiveCaptionsElement {
  $procs = Get-Process -Name 'LiveCaptions' -ErrorAction SilentlyContinue
  if (-not $procs) { return $null }
  foreach ($p in $procs) {
    if ($p.MainWindowHandle -ne 0) {
      return [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
    }
  }
  return $null
}

function Get-CaptionText($root) {
  if (-not $root) { return '' }
  $lines = New-Object System.Collections.Generic.List[string]
  # 視窗名稱本身常含最新字幕
  if ($root.Current.Name) { $lines.Add($root.Current.Name) }
  # 找所有文字型控制項的 Name (輔助字幕把字幕放在文字元素)
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Text)
  $texts = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  foreach ($t in $texts) {
    $n = $t.Current.Name
    if ($n -and $n.Trim()) { $lines.Add($n) }
  }
  return ($lines | Select-Object -Unique) -join ' '
}

Write-Host "[rescue] OmniLive 輔助字幕抓取器 啟動"
Write-Host "[rescue] 伺服器: $ServerUrl  房間: $(if ($Room) { $Room } else { '(主視窗)' })"
Write-Host "[rescue] 請確保 Windows 輔助字幕已開啟 (快捷鍵 Win+C 或 設定 > 輔助功能 > 輔助字幕)"
Write-Host "[rescue] Ctrl+C 停止"

$lastSent = ''
$waitLogged = $false

while ($true) {
  try {
    $root = Find-LiveCaptionsElement
    if (-not $root) {
      if (-not $waitLogged) {
        Write-Host "[rescue] 未找到輔助字幕視窗 — 等待中 (Win+C 開啟後自動銜接)..."
        $waitLogged = $true
      }
      Start-Sleep -Milliseconds ([Math]::Max($IntervalMs, 1000))
      continue
    }
    $waitLogged = $false

    $text = Get-CaptionText $root
    if (-not $text -or -not $text.Trim()) { Start-Sleep -Milliseconds $IntervalMs; continue }

    # 增量判定: 新文字是否為上次已送文字的延伸 (輔助字幕會整句替換)
    $newPart = $text
    if ($lastSent -and $text.StartsWith($lastSent)) {
      $newPart = $text.Substring($lastSent.Length)
    } elseif ($lastSent -and $text.Contains($lastSent)) {
      $idx = $text.IndexOf($lastSent) + $lastSent.Length
      $newPart = $text.Substring($idx)
    }
    $newPart = $newPart.Trim()
    if ($newPart.Length -lt $MinNewChars) { Start-Sleep -Milliseconds $IntervalMs; continue }

    # 輔助字幕翻譯模式可能同時含中英行 → 只送整段, 由伺服器偵測語言配對
    $body = @{ text = $newPart; room = $Room; from = $From; to = $To } | ConvertTo-Json -Compress
    $headers = @{ 'content-type' = 'application/json' }
    if ($ApiKey) { $headers['x-omnilive-key'] = $ApiKey }

    $resp = Invoke-RestMethod -Method Post -Uri ($ServerUrl.TrimEnd('/') + '/api/speak') `
      -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 15

    if ($resp.source) {
      $t = if ($resp.target) { $resp.target } else { $resp.source }
      Write-Host ("[rescue] {0} => {1}" -f $newPart.Substring(0, [Math]::Min(36, $newPart.Length)), $t.Substring(0, [Math]::Min(36, $t.Length)))
      $lastSent = $text   # 記錄已送基準 (用完整視窗文字, 含可能的雙語行)
    }
  } catch {
    Write-Host "[rescue] 錯誤: $($_.Exception.Message)" -ForegroundColor Yellow
  }
  Start-Sleep -Milliseconds $IntervalMs
}
