@echo off
REM OA-Twins :: one-click self-test (OA-Local)
REM ASCII-only on purpose: cmd.exe mis-parses UTF-8 CJK in .bat files.
REM Real output only claims success. Exit 1 on any anomaly.
cd /d "%~dp0"

echo === OA-Twins self-test 1/4: broker core ===
python oab\broker.py --self-test
if errorlevel 1 goto :fail

echo.
echo === OA-Twins self-test 2/4: twin bridge ===
python oab\broker.py --twin-test
if errorlevel 1 goto :fail

echo.
echo === OA-Twins self-test 3/4: journal rotation + prune ===
python oab\broker.py --rotate-test
if errorlevel 1 goto :fail

echo.
echo === OA-Twins self-test 4/4: twin health probe (both) ===
python bin\oa-twin-health.py --check both
if errorlevel 1 goto :fail

echo.
echo === ALL PASS (entropy ^< 0.1) ===  [OA-Local] ^<-^-> [OA-VPS] AWAKE
exit /b 0

:fail
echo.
echo !! ANOMALY -- see the !! markers above.
exit /b 1
