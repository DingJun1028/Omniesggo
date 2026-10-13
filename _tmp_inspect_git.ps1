$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot 'inspect_git.log'
"=== GIT INSPECT @ $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File $log -Encoding utf8
Set-Location 'C:\Project\esggo'
"--- git status ---" | Out-File $log -Append -Encoding utf8
git status | Out-File $log -Append -Encoding utf8
"--- git fetch --all --prune ---" | Out-File $log -Append -Encoding utf8
git fetch --all --prune 2>&1 | Out-File $log -Append -Encoding utf8
"--- local branches ---" | Out-File $log -Append -Encoding utf8
git --no-pager branch | Out-File $log -Append -Encoding utf8
"--- remote branches (all) ---" | Out-File $log -Append -Encoding utf8
git --no-pager branch -r | Out-File $log -Append -Encoding utf8
"--- branches merged into origin/main ---" | Out-File $log -Append -Encoding utf8
git --no-pager branch -r --merged origin/main | Out-File $log -Append -Encoding utf8
"--- branches NOT merged into origin/main ---" | Out-File $log -Append -Encoding utf8
git --no-pager branch -r --no-merged origin/main | Out-File $log -Append -Encoding utf8
"--- soul.md present in repo? ---" | Out-File $log -Append -Encoding utf8
(Test-Path 'C:\Project\esggo\soul.md') | Out-File $log -Append -Encoding utf8
"--- oa-components-definition.md present in repo? ---" | Out-File $log -Append -Encoding utf8
(Test-Path 'C:\Project\esggo\oa-components-definition.md') | Out-File $log -Append -Encoding utf8
"DONE_OK" | Out-File $log -Append -Encoding utf8
