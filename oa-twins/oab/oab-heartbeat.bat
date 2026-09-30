@echo off
REM OA-Twins :: local OAB heartbeat (Ctrl+C to stop)
REM ASCII-only on purpose: cmd.exe mis-parses UTF-8 CJK in .bat files.
REM Journal: rotate at 32MB, keep 5 archives, 256MB archive budget.
cd /d "%~dp0"
python broker.py --bus local --instance oa-local --store "%~dp0journal" --heartbeat
