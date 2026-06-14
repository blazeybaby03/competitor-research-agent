# CompeteIQ — Git setup & push to GitHub
# Run this once from the project folder.
# Windows Git Credential Manager will prompt for your GitHub login if needed.

Set-Location $PSScriptRoot

Write-Host "Cleaning up stale git lock..." -ForegroundColor Cyan
Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\config.lock" -ErrorAction SilentlyContinue

# Make sure *.zip is ignored
if (-not (Select-String -Path ".gitignore" -Pattern "\*\.zip" -Quiet)) {
    Add-Content ".gitignore" "`n*.zip"
    Write-Host "Added *.zip to .gitignore" -ForegroundColor Yellow
}

# Remove zip from index if it snuck in
git rm --cached "Competitor Research Agent.zip" 2>$null

# Stage everything
git add -A

Write-Host "`nFiles to be committed:" -ForegroundColor Cyan
git status --short

# Confirm .env.local is NOT staged
$envStaged = git ls-files --cached | Where-Object { $_ -match "\.env\.local" }
if ($envStaged) {
    Write-Host "`nERROR: .env.local is staged! Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "`n.env.local confirmed NOT staged" -ForegroundColor Green

# Commit
git commit -m "Security audit: fix trial credit, atomic competitor replace, billing copy, RLS hardening"

# Push
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "`nDone! Check https://github.com/blazeybaby03/competitor-research-agent" -ForegroundColor Green
