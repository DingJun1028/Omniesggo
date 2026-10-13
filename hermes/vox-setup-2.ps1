$ErrorActionPreference = 'Continue'
$log = 'C:\Project\esggo-learning-center\.hermes\vox-setup-2.log'
$dest = 'C:\Users\dingj\vox-director'
$out = New-Object System.Collections.ArrayList
[void]$out.Add('=== SKILL.md FIRST 120 LINES ===')
[void]$out.Add((Get-Content -Path (Join-Path $dest 'SKILL.md') -TotalCount 120 | Out-String))
[void]$out.Add('=== COPY TO CLAUDE SKILLS ===')
$cs = 'C:\Users\dingj\.claude\skills\vox-director'
if (Test-Path $cs) {
  [void]$out.Add("claude skill dir ALREADY EXISTS: $cs")
} else {
  New-Item -ItemType Directory -Path $cs -Force | Out-Null
  Get-ChildItem $dest -Force | Where-Object { $_.Name -ne '.git' } | Copy-Item -Destination $cs -Recurse -Force
  [void]$out.Add('copied vox-director -> .claude\skills\vox-director (excluding .git)')
}
[void]$out.Add("claude skill dir now exists => $(Test-Path $cs)")
[void]$out.Add('=== ENV CHECK (existence only, no values) ===')
$u = [Environment]::GetEnvironmentVariable('ATLASCLOUD_API_KEY', 'User')
$m = [Environment]::GetEnvironmentVariable('ATLASCLOUD_API_KEY', 'Machine')
$p = $env:ATLASCLOUD_API_KEY
[void]$out.Add("ATLASCLOUD_API_KEY User-scope    => $(if ($u) {'SET'} else {'NOT SET'})")
[void]$out.Add("ATLASCLOUD_API_KEY Machine-scope => $(if ($m) {'SET'} else {'NOT SET'})")
[void]$out.Add("ATLASCLOUD_API_KEY current-process => $(if ($p) {'SET'} else {'NOT SET'})")
[void]$out.Add('=== BEATS.JSON FILES ===')
$b = Get-ChildItem -Path $dest -Recurse -Filter 'beats.json' -ErrorAction SilentlyContinue
if ($b) { foreach ($f in $b) { [void]$out.Add($f.FullName) } }
else { [void]$out.Add('no beats.json found') }
$out | Out-File -FilePath $log -Encoding utf8
Write-Output "SCRIPT2 DONE -> $log"
