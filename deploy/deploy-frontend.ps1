# Deploy frontend pe Azure Static Web Apps.
# Rulează: .\deploy\deploy-frontend.ps1 -Token "xxxx"
# Token: Azure Portal -> Static Web App -> Manage deployment token

param(
  [Parameter(Mandatory = $true)]
  [string]$Token
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Test-Path (Join-Path $root 'dist\index.html'))) {
  Write-Host 'Lipsește build-ul. Rulează: .\deploy\build-frontend.ps1'
  exit 1
}

Write-Host 'Deploy Static Web App...'
npx --yes @azure/static-web-apps-cli deploy ./dist --deployment-token $Token --env production
Write-Host ''
Write-Host 'Gata: https://ashy-mud-055a0ce03.1.azurestaticapps.net'
Write-Host ''
