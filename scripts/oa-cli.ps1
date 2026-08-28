# source_origin: AI Station §9 - Windows native wrapper
<#
.SYNOPSIS
Windows-native wrapper for oa-cli manual viewer.

Examples:
  powershell -ExecutionPolicy Bypass -File .\scripts\oa-cli.ps1 manual 48 --local-only
  powershell -ExecutionPolicy Bypass -File .\scripts\oa-cli.ps1 manual 48 --view
#>

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ManualMd = Join-Path $RepoRoot "docs/manuals/48-omnifactory-manual.md"
$ManualHtml = Join-Path $RepoRoot "docs/manuals/48-html/index.html"

$Command = if ($args.Count -ge 1) { $args[0] } else { "" }
$ManualId = if ($args.Count -ge 2) { $args[1] } else { "" }

$Option = "help"
if ($args.Count -ge 3) {
  $Option = $args[2]
  if ($Option -like '--*') {
    $Option = $Option.Substring(1)
  }
}

if ($Command -ne "manual") {
  Write-Host "Usage: .\scripts\oa-cli.ps1 manual <id> [--view|--local-only]"
  exit 1
}

if ($ManualId -ne "48") {
  Write-Host "Only manual 48 is available locally."
  exit 1
}

switch ($Option) {
  "view" {
    if (Test-Path $ManualHtml) {
      Start-Process $ManualHtml | Out-Null
      Write-Host "[oa-cli] Open manual: $ManualHtml"
    } else {
      Write-Host "[oa-cli] Missing manual HTML: $ManualHtml"
      exit 1
    }
  }
  "local-only" {
    Write-Host "[oa-cli] local-only manual 48"
    Write-Host "HTML: $ManualHtml"
    Write-Host "MD: $ManualMd"
  }
  default {
    Write-Host "Usage: .\scripts\oa-cli.ps1 manual 48 --view|--local-only"
    exit 1
  }
}
