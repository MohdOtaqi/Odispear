#!/bin/bash

# Unity Platform Setup Script
# This script sets up the development environment

set -e

echo "🚀 Unity Platform Setup"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version must be 18 or higher${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check PostgreSQL
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL client not found${NC}"
    echo "Please install PostgreSQL 14+"
else
    echo -e "${GREEN}✓ PostgreSQL installed${NC}"
fi

# Check Redis
echo "Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠ Redis not found${NC}"
    echo "Please install Redis 6+"
else
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis is not running${NC}"
        echo "Start Redis with: redis-server"
    fi
fi

echo ""
echo "Installing dependencies..."
echo "=========================="

# Backend
echo "Installing backend dependencies..."
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Frontend
echo "Installing frontend dependencies..."
cd ../frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

# Create .env files if they don't exist
echo ""
echo "Setting up environment files..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
    echo -e "${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
else
    echo "✓ backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo "✓ frontend/.env already exists"
fi

echo ""
echo "Database setup..."
echo "================="
echo "To create the database, run:"
echo "  createdb unity_platform"
echo ""
echo "To run migrations:"
echo "  cd backend && npm run migrate"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env with your database credentials"
echo "2. Create database: createdb unity_platform"
echo "3. Run migrations: cd backend && npm run migrate"
echo "4. Start Redis: redis-server"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm run dev"
echo ""
echo "Access the application at http://localhost:5173"
