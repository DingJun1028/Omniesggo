@echo off
chcp 65001 >nul
echo 啟動 Firebase Local Emulator Suite（Firestore + UI）...

where firebase >nul 2>&1
if errorlevel 1 (
  echo [錯誤] 找不到 firebase 指令，請先 npm install -g firebase-tools
  pause
  exit /b 1
)

if not exist "emulator-data" mkdir "emulator-data"

firebase emulators:start --import emulator-data --export-on-exit emulator-data

pause
