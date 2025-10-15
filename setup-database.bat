@echo off
REM Unity Platform - Database Setup Script for Windows
REM This script initializes the PostgreSQL database with the schema

echo =========================================
echo Unity Platform - Database Setup
echo =========================================
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL (psql) is not found in PATH
    echo Please install PostgreSQL or ensure it's in your system PATH
    echo.
    echo You can find it usually at: C:\Program Files\PostgreSQL\[version]\bin
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Get database password (or use default)
set /p DB_PASSWORD="Enter PostgreSQL password (default: changeme): "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=changeme

echo.
echo Creating database and loading schema...
echo.

REM Set PGPASSWORD environment variable to avoid password prompts
set PGPASSWORD=%DB_PASSWORD%

REM Create the database (ignore error if it already exists)
echo Step 1: Creating database 'unity_platform'...
psql -U postgres -h localhost -c "CREATE DATABASE unity_platform;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database created successfully!
) else (
    echo Database might already exist, continuing...
)

echo.
echo Step 2: Loading schema...
psql -U postgres -h localhost -d unity_platform -f database\schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to load schema
    pause
    exit /b 1
)

echo Schema loaded successfully!
echo.

REM Ask if user wants to load seed data
set /p LOAD_SEED="Do you want to load sample data for testing? (Y/N): "
if /I "%LOAD_SEED%"=="Y" (
    echo.
    echo Step 3: Loading seed data...
    psql -U postgres -h localhost -d unity_platform -f database\seed.sql
    if %ERRORLEVEL% EQU 0 (
        echo Seed data loaded successfully!
    ) else (
        echo Warning: Failed to load seed data
    )
)

REM Clear password from environment
set PGPASSWORD=

echo.
echo =========================================
echo Database setup complete!
echo =========================================
echo.
echo Database: unity_platform
echo Host: localhost
echo Port: 5432
echo User: postgres
echo.
echo Connection string:
echo postgresql://postgres:%DB_PASSWORD%@localhost:5432/unity_platform
echo.
echo Next steps:
echo 1. Update your backend/.env file with the connection string
echo 2. Run: npm run dev (in backend folder)
echo.
pause
