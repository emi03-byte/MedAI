#!/bin/bash
# Rulează la deploy pe Azure App Service (Linux).
set -euo pipefail
cd "${DEPLOYMENT_TARGET:-/home/site/wwwroot}"
echo "=== MedAI deploy: $(pwd) ==="
export NODE_ENV=production
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi
echo "=== Gata. App Service pornește cu: npm start ==="
