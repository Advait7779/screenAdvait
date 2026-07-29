@echo off
setlocal
title ScreenAdvait Full Platform Launcher
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo Closing previously launched ScreenAdvait windows...
taskkill /FI "WINDOWTITLE eq ScreenAdvait API*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq ScreenAdvait Admin Web*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq ScreenAdvait Desktop Renderer*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq ScreenAdvait Desktop*" /T /F >nul 2>nul
for %%Q in (3000 3001 5000) do (
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%%Q .*LISTENING"') do (
    taskkill /PID %%P /T /F >nul 2>nul
  )
)
timeout /t 1 /nobreak >nul

where docker >nul 2>nul
if %errorlevel%==0 docker compose -f docker\docker-compose.yml up -d postgres

echo Applying database migrations...
pushd "%PROJECT_ROOT%packages\shared-types"
call node_modules\.bin\tsc.CMD -b
if errorlevel 1 (
  popd
  echo Shared types build failed.
  pause
  exit /b 1
)
popd
pushd "%PROJECT_ROOT%packages\shared-utils"
call node_modules\.bin\tsc.CMD -b
if errorlevel 1 (
  popd
  echo Shared validation package build failed.
  pause
  exit /b 1
)
popd

pushd "%PROJECT_ROOT%services\api"
call node_modules\.bin\prisma.CMD migrate deploy --schema prisma\schema.prisma
if errorlevel 1 (
  popd
  echo Database migration failed. PostgreSQL must be running before ScreenAdvait starts.
  pause
  exit /b 1
)
echo Building the current API source...
call node_modules\.bin\nest.CMD build
if errorlevel 1 (
  popd
  echo API build failed. Review the TypeScript errors above.
  pause
  exit /b 1
)
popd

start "ScreenAdvait API" cmd /k "cd /d ""%PROJECT_ROOT%services\api"" && node dist\src\main.js"

echo Waiting for the API...
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(30); do { try { Invoke-RestMethod 'http://127.0.0.1:5000/api/v1/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 500 } } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
  echo API failed to start. Check the ScreenAdvait API window for the exact error.
  pause
  exit /b 1
)

start "ScreenAdvait Admin Web" cmd /k "cd /d ""%PROJECT_ROOT%apps\admin-web"" && node_modules\.bin\vite.CMD --host 0.0.0.0 --port 3001"
start "ScreenAdvait Desktop Renderer" cmd /k "cd /d ""%PROJECT_ROOT%apps\desktop"" && node_modules\.bin\vite.CMD --host 127.0.0.1 --port 3000"
timeout /t 2 /nobreak >nul
start "ScreenAdvait Desktop" cmd /k "cd /d ""%PROJECT_ROOT%apps\desktop"" && set SCREENADVAIT_RENDERER_URL=http://localhost:3000&& node_modules\.bin\electron.CMD ."

echo ScreenAdvait processes launched. Review each terminal for readiness.
endlocal
