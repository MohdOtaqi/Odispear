# Unity Platform Setup Script for Windows
# Run with: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "🚀 Unity Platform Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = (node -v).Substring(1).Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Host "✗ Node.js version must be 18 or higher" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Node.js $(node -v)" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✓ PostgreSQL installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ PostgreSQL not found" -ForegroundColor Yellow
    Write-Host "Please install PostgreSQL 14+ from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

# Check Redis
Write-Host "Checking Redis..." -ForegroundColor Yellow
try {
    $null = Get-Command redis-cli -ErrorAction Stop
    Write-Host "✓ Redis installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Redis not found" -ForegroundColor Yellow
    Write-Host "Please install Redis from https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Backend
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Create .env files
Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Cyan
if (-not (Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "✓ Created backend/.env" -ForegroundColor Green
    Write-Host "⚠ Please edit backend/.env with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "✓ backend/.env already exists" -ForegroundColor Green
}

if (-not (Test-Path "frontend/.env")) {
    Copy-Item "frontend/.env.example" "frontend/.env"
    Write-Host "✓ Created frontend/.env" -ForegroundColor Green
} else {
    Write-Host "✓ frontend/.env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure backend/.env with your database credentials"
Write-Host "2. Create database: createdb unity_platform (or use pgAdmin)"
Write-Host "3. Run migrations: cd backend; npm run migrate"
Write-Host "4. Start Redis: redis-server"
Write-Host "5. Start backend: cd backend; npm run dev"
Write-Host "6. Start frontend: cd frontend; npm run dev"
Write-Host ""
Write-Host "Access the application at http://localhost:5173" -ForegroundColor Green
