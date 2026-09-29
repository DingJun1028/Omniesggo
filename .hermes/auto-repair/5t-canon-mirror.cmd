@echo off
REM 5t-canon-mirror.cmd — 把 5T-Canon 證書鏡像到 Obsidian vault
REM 從 C:\Project\esggo\.hermes\5t-canon\ → D:\Obsidian Vault\AI Research\5t-canon\
REM 每日 hermes cron 跑完 verify 後可手動或排程觸發

setlocal
set SRC=C:\Project\esggo\.hermes\5t-canon
set DST=D:\Obsidian Vault\AI Research\5t-canon

if not exist "%DST%" mkdir "%DST%"

echo [%date% %time%] 開始鏡像 5T-Canon 證書...
copy /Y "%SRC%\*.json" "%DST%\" >nul
copy /Y "%SRC%\MOC-5t-canon.md" "%DST%\" >nul

echo [%date% %time%] 完成
echo 鏡像目標: %DST%
dir /B "%DST%"
endlocal
