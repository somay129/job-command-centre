# ============================================================================
# Launch Docker Desktop, wait for the daemon, and start the local Lemma stack.
#   powershell -ExecutionPolicy Bypass -File scripts\start-stack.ps1
# ============================================================================
$ErrorActionPreference = "Stop"
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"

Write-Host ">>> Ensuring Docker Desktop is running..." -ForegroundColor Cyan
$exe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
if (-not $?) {
  if (Test-Path $exe) { Start-Process $exe }
  Write-Host "    waiting for the Docker daemon (up to 150s)..."
  $up = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 5
    docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($?) { $up = $true; break }
  }
  if (-not $up) { Write-Error "Docker daemon did not come up. Open Docker Desktop manually and retry."; exit 1 }
}
Write-Host "    Docker is up." -ForegroundColor Green

Write-Host ">>> Starting the Lemma stack..." -ForegroundColor Cyan
lemma-stack start
lemma-stack status

Write-Host "`nStack ready. App: http://127-0-0-1.sslip.io:3711  ·  API: http://127-0-0-1.sslip.io:8711" -ForegroundColor Green
Write-Host "Next: lemma auth login   (then scripts\setup.ps1)" -ForegroundColor Green
