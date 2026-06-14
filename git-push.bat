@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0git-push.ps1"
pause
