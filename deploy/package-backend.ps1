# Zip backend minimal pentru Azure Linux (fără React/Vite, fără script deploy custom).
# Rulează: .\deploy\package-backend.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$stage = Join-Path $root 'deploy-backend-staging'
$zip = Join-Path $root 'deploy-backend.zip'

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item -Path (Join-Path $root 'backend') -Destination (Join-Path $stage 'backend') -Recurse
Copy-Item -Path (Join-Path $root 'public') -Destination (Join-Path $stage 'public') -Recurse
Copy-Item -Path (Join-Path $root 'deploy\package.production.json') -Destination (Join-Path $stage 'package.json')

$db = Join-Path $stage 'backend\data\medicamente.db'
if (Test-Path $db) { Remove-Item $db -Force -ErrorAction SilentlyContinue }

$tar = Get-Command tar -ErrorAction SilentlyContinue
if (-not $tar) { Write-Error 'Lipsește tar.exe (Windows 10+).' }

Push-Location $stage
& tar -a -c -f $zip *
Pop-Location
Remove-Item $stage -Recurse -Force

$sizeMb = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host "Creat deploy-backend.zip ($sizeMb MB) - doar backend Express + mssql."
Write-Host ''
Write-Host 'INAINTE de upload, in Azure Portal -> App Service -> Environment variables:'
Write-Host '  SCM_DO_BUILD_DURING_DEPLOYMENT = true'
Write-Host '  ENABLE_ORYX_BUILD = true'
Write-Host '  Startup Command (General settings): npm start'
Write-Host ''
Write-Host 'Upload: https://medai-backend-gbazexfhdjdufxgk.scm.azurewebsites.net/ZipDeployUI'
Write-Host 'sau:    https://medai-backend-gbazexfhdjdufxgk-westus3-01.scm.azurewebsites.net/ZipDeployUI'
Write-Host ''
