@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0launch-desktop.ps1"
exit /b %errorlevel%
