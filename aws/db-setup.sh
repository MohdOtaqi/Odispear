#!/bin/bash
# ===========================================
# Database Setup Script for AWS RDS
# ===========================================

echo "=========================================="
echo "Unity Platform Database Setup"
echo "=========================================="

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./db-setup.sh <DATABASE_URL>"
    echo "Example: ./db-setup.sh postgresql://postgres:password@rds-endpoint:5432/odispear"
    exit 1
fi

DATABASE_URL=$1

echo ""
echo "Testing database connection..."
psql "$DATABASE_URL" -c "SELECT 1 as connection_test;" || {
    echo "Failed to connect to database!"
    echo "Check your DATABASE_URL and RDS security group settings."
    exit 1
}

echo ""
echo "Connection successful!"
echo ""
echo "Running migrations..."

cd ~/Odispear/unity-platform/backend

# Export DATABASE_URL for the migration script
export DATABASE_URL="$DATABASE_URL"

# Run migrations
npm run migrate:prod

echo ""
echo "=========================================="
echo "Database setup complete!"
echo "=========================================="
