@echo off
chcp 65001 >nul
echo 關閉 Firebase Local Emulator Suite...

tasklist /FI "WINDOWTITLE eq Firebase*" 2>nul | find /I "Firebase" >nul
if not errorlevel 1 (
  echo 請直接關掉 Firebase Emulator Suite 的視窗
)

echo.
echo 若是由本批次檔啟動，已於結束時自動停止。
pause
