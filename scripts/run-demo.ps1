$ErrorActionPreference = "Stop"
$env:DEMO_MODE = "true"

Write-Host "Starting AETHER web on http://localhost:3000"
Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $PSScriptRoot\..

Write-Host "Starting AETHER API on http://localhost:8000"
& python -m uvicorn app.main:app --app-dir "$PSScriptRoot\..\apps\api" --reload
