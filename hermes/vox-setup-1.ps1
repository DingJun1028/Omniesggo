$ErrorActionPreference = 'Continue'
$log = 'C:\Project\esggo-learning-center\.hermes\vox-setup-1.log'
$out = New-Object System.Collections.ArrayList
[void]$out.Add('=== PART 1: TOOLS ===')
foreach ($t in @('git','ffmpeg','ffprobe','python','pip')) {
  $c = Get-Command $t -ErrorAction SilentlyContinue
  if ($c) { [void]$out.Add("$t => $($c.Source)") }
  else { [void]$out.Add("$t => NOT FOUND") }
}
[void]$out.Add('=== PART 1b: VERSIONS ===')
foreach ($t in @('git','ffmpeg','ffprobe','python','pip')) {
  $c = Get-Command $t -ErrorAction SilentlyContinue
  if ($c) {
    if ($t -eq 'ffmpeg' -or $t -eq 'ffprobe') { $v = (& $t -version 2>&1 | Select-Object -First 1) }
    elseif ($t -eq 'git') { $v = (& git --version 2>&1) }
    else { $v = (& $t --version 2>&1) }
    [void]$out.Add("$t : $v")
  }
}
[void]$out.Add('=== PART 2: CLONE ===')
$dest = 'C:\Users\dingj\vox-director'
if (Test-Path $dest) {
  [void]$out.Add("dest already exists: $dest")
} else {
  $r = git clone --depth 1 https://github.com/Alisa0808/vox-director.git $dest 2>&1
  [void]$out.Add('clone rc=' + $LASTEXITCODE)
  [void]$out.Add(($r | Out-String))
}
[void]$out.Add('=== PART 3: ROOT CONTENTS (dest) ===')
if (Test-Path $dest) {
  [void]$out.Add((Get-ChildItem $dest -Force | Select-Object Name, Mode | Format-Table -AutoSize | Out-String))
} else {
  [void]$out.Add('dest MISSING after clone')
}
[void]$out.Add('=== PART 4: REQUIRED FILES/DIRS ===')
foreach ($f in @('SKILL.md','SKILL.zh.md','AGENTS.md','scripts','references','examples')) {
  $p = Join-Path $dest $f
  [void]$out.Add("$f => $(Test-Path $p)")
}
$out | Out-File -FilePath $log -Encoding utf8
Write-Output "SCRIPT1 DONE -> $log"
