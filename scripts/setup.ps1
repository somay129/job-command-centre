# ============================================================================
# Job Command Centre — one-shot setup AFTER `lemma auth login`.
#
# Builds the app, creates the org + pod, imports the bundle (which deploys the
# app as a no-build HTML app), and seeds the demo board. Idempotent.
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
#
# On lemma.work cloud the agents run on Lemma's system model — no API key needed.
# ============================================================================
$ErrorActionPreference = "Stop"
$env:PATH = "$env:USERPROFILE\.local\bin;$env:APPDATA\Python\Python314\Scripts;$env:PATH"
$root = Split-Path -Parent $PSScriptRoot      # the bundle dir (job-command-centre)
$pod = "job-command-centre"

function Step($m) { Write-Host "`n>>> $m" -ForegroundColor Cyan }

Step "Authenticated as:"
lemma auth status

Step "Building the app (app-src -> single-file html.html)"
Push-Location "$root\app-src"
if (-not (Test-Path node_modules)) { npm install --no-fund --no-audit }
npm run build
Copy-Item "dist\index.html" "$root\apps\command-centre\html.html" -Force
Pop-Location

Step "Ensuring an organization exists"
$orgs = (lemma --output json orgs list | ConvertFrom-Json).items
if ($orgs.Count -eq 0) { $org = lemma --output json orgs create "Keshav Singla" | ConvertFrom-Json } else { $org = $orgs[0] }
$env:LEMMA_ORG_ID = $org.id
Write-Host "    org: $($org.name) [$($org.id)]"

Step "Creating pod '$pod' (skips if it already exists)"
try { lemma pods create $pod --description "AI Job Application Command Centre" | Out-Null } catch { Write-Host "    (pod may already exist — continuing)" -ForegroundColor Yellow }
$env:LEMMA_POD_ID = ((lemma --output json pods list | ConvertFrom-Json).items | Where-Object { $_.name -eq $pod } | Select-Object -First 1).id
Write-Host "    pod: $pod [$env:LEMMA_POD_ID]"

Step "Validating, then importing the bundle"
lemma pods import "$root" --dry-run
lemma pods import "$root"

Step "Seeding the pod (profile file + demo pipeline)"
python "$root\seed\seed.py"

Step "Done. Your app:"
lemma apps get command-centre

Write-Host "`nNext:" -ForegroundColor Green
Write-Host "  - Open the app URL above (you're signed in -> the board renders)." -ForegroundColor Gray
Write-Host "  - Invite the judge from lemma.work -> pod Members -> ayush@gappy.ai (viewer)." -ForegroundColor Gray
Write-Host "  - Fill the Unstop form from SUBMISSION.md." -ForegroundColor Gray
