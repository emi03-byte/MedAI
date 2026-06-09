# Deploy manual: backend zip + build frontend (+ optional SWA deploy).
#   .\deploy\manual-deploy.ps1
#   .\deploy\manual-deploy.ps1 -SwDeployToken "token"

param([string]$SwDeployToken = '')

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host '=== 1/2 Backend zip ==='
& (Join-Path $root 'deploy\package-backend.ps1')

Write-Host '=== 2/2 Frontend build ==='
& (Join-Path $root 'deploy\build-frontend.ps1')

if ($SwDeployToken) {
  & (Join-Path $root 'deploy\deploy-frontend.ps1') -Token $SwDeployToken
} else {
  Write-Host 'Frontend: .\deploy\deploy-frontend.ps1 -Token TOKEN_DIN_AZURE'
}
