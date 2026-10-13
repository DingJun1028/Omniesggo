Write-Host '=== esggo-learning-center emulator env checker ==='
$check = @{ firebase = $false; node = $false; npm = $false; java = $false }
try {
  $check.firebase = & firebase --version 2>$null
} catch {}
try {
  $check.node = & node --version 2>$null
} catch {}
try {
  $check.npm = & npm --version 2>$null
} catch {}
try {
  $java = Get-Command java -ErrorAction SilentlyContinue
  if ($java) { $check.java = & java -version 2>&1 | Select-Object -First 1 }
} catch {}

$check.GetEnumerator() | ForEach-Object {
  $label = $_.Key
  $value = if ($_.Value) { $_.Value } else { 'NOT FOUND' }
  Write-Host "$label : $value"
}
