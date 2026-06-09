@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off
echo === MedAI App Service deploy (Windows) ===
IF EXIST "%DEPLOYMENT_TARGET%\package.json" (
  pushd "%DEPLOYMENT_TARGET%"
  call npm ci --omit=dev
  IF !ERRORLEVEL! NEQ 0 call npm install --omit=dev
  popd
)
echo === Dependențe instalate. Pornire: npm start ===
exit /b 0
