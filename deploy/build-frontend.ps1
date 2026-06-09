# Build frontend pentru producție.
# Rulează: .\deploy\build-frontend.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$env:VITE_API_BASE = 'https://medai-backend-gbazexfhdjdufxgk.westus3-01.azurewebsites.net'
Write-Host "VITE_API_BASE=$env:VITE_API_BASE"
npm run build
Write-Host ''
Write-Host 'Build gata în dist/. Deploy: .\deploy\deploy-frontend.ps1 -Token TOKEN'
Write-Host ''
