@echo off
cd /d C:\Project\esggo\apps\universal-translator
set PORT=8788
node server.mjs > C:\Users\dingj\ut_run.log 2>&1
