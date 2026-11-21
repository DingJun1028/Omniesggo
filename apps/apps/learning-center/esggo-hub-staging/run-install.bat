@echo off
REM esggo-hub 安裝包啟動器 — 雙擊即執行（不需手開 PowerShell）
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0install.ps1"
echo.
echo 若上方出現紅字錯誤，請把輸出貼給 Hermes 代理。
pause
