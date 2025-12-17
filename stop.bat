@echo off
title Unity Platform - Stopping Services
color 0C

echo ============================================
echo    Unity Platform - Stopping Services
echo ============================================
echo.

:: Kill backend on port 3000
echo [*] Stopping backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [*] Killed process %%a
)

:: Kill ngrok
echo [*] Stopping ngrok...
taskkill /F /IM ngrok.exe >nul 2>&1

:: Kill any node processes related to the project
echo [*] Stopping node processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo ============================================
echo    All services stopped!
echo ============================================
echo.
pause
