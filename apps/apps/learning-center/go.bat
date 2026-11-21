@echo off
setlocal
set "LOGDIR=%~dp0cron-fix-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set "LOG=%LOGDIR%\run.log"
echo ===== ESG-GO fix cron run %DATE% %TIME% ===== > "%LOG%"
hostname >> "%LOG%" 2>&1
whoami >> "%LOG%" 2>&1
cd /d C:\Project\esggo >> "%LOG%" 2>&1
echo [step1] pwd=%CD% >> "%LOG%"
git --version >> "%LOG%" 2>&1
if errorlevel 1 goto :nogit
git rev-parse --is-inside-work-tree >> "%LOG%" 2>&1
if errorlevel 1 goto :nogit
echo --- git remote get-url origin --- >> "%LOG%"
git remote get-url origin >> "%LOG%" 2>&1
echo --- git status --short --branch --- >> "%LOG%"
git status --short --branch >> "%LOG%" 2>&1
echo --- git rev-parse --short HEAD --- >> "%LOG%"
git rev-parse --short HEAD >> "%LOG%" 2>&1
goto :dosteps
:nogit
echo FATAL: git unavailable or C:\Project\esggo is not a git repo >> "%LOG%"
echo === DONE === >> "%LOG%"
goto :eof
:dosteps
echo [step2+3] running fix-imports.ps1 >> "%LOG%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-imports.ps1" > "%LOGDIR%\ps-imports.out.log" 2>&1
echo [step4] running fix-bootstrap.ps1 >> "%LOG%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-bootstrap.ps1" > "%LOGDIR%\ps-bootstrap.out.log" 2>&1
echo [step5] running fix-build.ps1 >> "%LOG%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-build.ps1" > "%LOGDIR%\ps-build.out.log" 2>&1
echo [step6] final git diff/status >> "%LOG%"
echo --- git diff --stat --- >> "%LOG%"
git diff --stat >> "%LOG%" 2>&1
echo --- git status --short --branch --- >> "%LOG%"
git status --short --branch >> "%LOG%" 2>&1
echo --- backup dir listing --- >> "%LOG%"
dir /s /b _fix-backup-20260801 >> "%LOG%" 2>&1
echo === DONE === >> "%LOG%"
goto :eof
