@echo off
title Unity Platform Launcher
color 0A

echo ============================================
echo    Unity Platform - Starting Services
echo ============================================
echo.

:: Check if node_modules exist
if not exist "backend\node_modules" (
    echo [!] Backend dependencies not installed. Installing...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [!] Frontend dependencies not installed. Installing...
    cd frontend
    call npm install
    cd ..
)

:: Kill any existing processes on port 3000
echo [*] Checking for existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [*] Killing process %%a on port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

:: Start Backend Server
echo.
echo [1/3] Starting Backend Server...
cd backend
start "Unity Backend" cmd /k "npm run dev"
cd ..

:: Wait for backend to start
echo [*] Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Build frontend if dist doesn't exist or is old
echo.
echo [2/3] Checking Frontend Build...
cd frontend
if not exist "dist\index.html" (
    echo [*] Building frontend...
    call npm run build
)
cd ..

:: Start ngrok if available
echo.
echo [3/3] Starting ngrok tunnel...
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    :: Kill existing ngrok first to avoid session limit error
    taskkill /F /IM ngrok.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    start "Unity Ngrok" cmd /k "ngrok http 3000"
    echo [*] Ngrok started! Check the ngrok window for your public URL.
    timeout /t 3 /nobreak >nul
) else (
    echo [!] Ngrok not found. Install it from https://ngrok.com/download
    echo [*] You can access the app locally at: http://localhost:3000
)

:: Open browser
echo.
echo ============================================
echo    All services started!
echo ============================================
echo.
echo Local URL: http://localhost:3000
echo.
echo Press any key to open the browser...
pause >nul

start http://localhost:3000

echo.
echo [*] Browser opened. Keep this window open to see status.
echo [*] Press Ctrl+C or close windows to stop all services.
echo.
pause
