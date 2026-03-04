@echo off
chcp 65001 >nul
echo ==========================================
echo   GINGAFLOW DEV ENVIRONMENT STARTER
echo ==========================================
echo.
echo Iniciando API (Backend)...
start cmd /k "cd apps/api && pnpm dev"

echo Iniciando Desktop (Frontend)...
start cmd /k "cd apps/desktop && pnpm dev"

echo Iniciando Mobile (Expo)...
start cmd /k "cd apps/mobile && npx expo start --clear"

echo.
echo Ambientes iniciados em janelas separadas.
echo.
echo   API:     http://localhost:5175
echo   Desktop: http://localhost:5173
echo   Mobile:  Escaneie o QR code que aparecer no Expo
echo.
echo Para celular fisico: edite apps/mobile/src/services/api.ts
echo Substitua o IP por: ipconfig | findstr /i IPv4
echo.
pause
