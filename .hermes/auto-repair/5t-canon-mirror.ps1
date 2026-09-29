# 5t-canon-mirror.ps1 — PowerShell 版本(更好支援 unicode)
$SRC = "C:\Project\esggo\.hermes\5t-canon"
$DST = "D:\Obsidian Vault\AI Research\5t-canon"

if (-not (Test-Path $DST)) { New-Item -ItemType Directory -Path $DST | Out-Null }

Get-ChildItem "$SRC\*.json" | ForEach-Object {
    Copy-Item $_.FullName -Destination $DST -Force
}
if (Test-Path "$SRC\MOC-5t-canon.md") {
    Copy-Item "$SRC\MOC-5t-canon.md" -Destination $DST -Force
}

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 5T-Canon 鏡像完成 → $DST"
Get-ChildItem $DST | Format-Table Name, Length
