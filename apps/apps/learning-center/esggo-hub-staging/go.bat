@echo off
cd /d "C:\Project\esggo-learning-center\esggo-hub-staging"
powershell -NoProfile -ExecutionPolicy Bypass -File "install.ps1" > install.log 2>&1
echo EXITCODE=%ERRORLEVEL% >> install.log
pause
