$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🎙️ ESG-GO 萬能即時翻譯 · 懸浮雙語字幕平台啟動程序" -ForegroundColor Yellow
Write-Host "  純免費算力架構 · 5T 雙向回譯驗證 · Faster-Whisper + Edge-TTS" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path ".venv")) {
    Write-Host "[1/3] 建立 Python 虛擬環境 (.venv)..." -ForegroundColor Magenta
    python -m venv .venv
}

Write-Host "[2/3] 啟動虛擬環境並安裝套件..." -ForegroundColor Magenta
& ".\.venv\Scripts\Activate.ps1"
pip install -r requirements.txt --quiet --disable-pip-version-check

Write-Host "[3/3] 啟動即時字幕伺服器 (http://localhost:8765)..." -ForegroundColor Green
Start-Process "http://localhost:8765"
python server.py
