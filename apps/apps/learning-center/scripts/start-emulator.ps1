$javaRoot = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" | Where-Object { $_.DisplayName -like "*Zulu*JDK 17*" } | Select-Object -First 1).InstallLocation
if (-not $javaRoot -or -not (Test-Path "$javaRoot\bin\java.exe")) {
  $fallback = "C:\Program Files (x86)\Zulu\zulu-17-amd64"
  if (Test-Path "$fallback\bin\java.exe") { $javaRoot = $fallback }
}
if (-not $javaRoot -or -not (Test-Path "$javaRoot\bin\java.exe")) {
  Write-Error "找不到 Zulu JDK 17，請先確認是否安裝完成，或手動設定 \$env:JAVA_HOME"
  exit 1
}
$env:JAVA_HOME = $javaRoot
$env:Path = "$javaRoot\bin;$env:Path"

Write-Host "使用 Java: $javaRoot"
java -version 2>&1 | ForEach-Object { Write-Host $_ }

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot

if (-not (Test-Path "emulator-data")) { New-Item -ItemType Directory -Name "emulator-data" | Out-Null }

firebase emulators:start --import emulator-data --export-on-exit emulator-data
Pop-Location
