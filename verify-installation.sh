#!/bin/bash

# Unity Platform - Installation Verification Script
# Run this on your AWS server after deployment

echo "================================================="
echo "🔍 Unity Platform - Installation Verification"
echo "================================================="
echo ""

ERRORS=0
WARNINGS=0

# Check if we're on the server
if [ ! -d "/var/www/Odispear/unity-platform" ]; then
    echo "❌ Error: Not in the correct directory"
    echo "   Please run this script on your AWS server"
    exit 1
fi

cd /var/www/Odispear/unity-platform

echo "📋 Checking system requirements..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    ((ERRORS++))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    ((ERRORS++))
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo "✅ PostgreSQL: $PSQL_VERSION"
else
    echo "❌ PostgreSQL not found"
    ((ERRORS++))
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    echo "✅ Redis: $REDIS_VERSION"
else
    echo "❌ Redis not found"
    ((ERRORS++))
fi

# Check Nginx
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk -F/ '{print $2}')
    echo "✅ Nginx: $NGINX_VERSION"
else
    echo "❌ Nginx not found"
    ((ERRORS++))
fi

# Check PM2
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo "✅ PM2: $PM2_VERSION"
else
    echo "❌ PM2 not found"
    ((ERRORS++))
fi

echo ""
echo "📁 Checking project structure..."
echo ""

# Check backend
if [ -d "backend" ]; then
    echo "✅ Backend directory exists"
    if [ -f "backend/package.json" ]; then
        echo "✅ Backend package.json exists"
    else
        echo "❌ Backend package.json missing"
        ((ERRORS++))
    fi
    if [ -d "backend/node_modules" ]; then
        echo "✅ Backend dependencies installed"
    else
        echo "⚠️  Backend dependencies not installed"
        ((WARNINGS++))
    fi
    if [ -d "backend/dist" ]; then
        echo "✅ Backend compiled"
    else
        echo "⚠️  Backend not compiled"
        ((WARNINGS++))
    fi
else
    echo "❌ Backend directory missing"
    ((ERRORS++))
fi

# Check frontend
if [ -d "frontend" ]; then
    echo "✅ Frontend directory exists"
    if [ -f "frontend/package.json" ]; then
        echo "✅ Frontend package.json exists"
    else
        echo "❌ Frontend package.json missing"
        ((ERRORS++))
    fi
    if [ -d "frontend/node_modules" ]; then
        echo "✅ Frontend dependencies installed"
    else
        echo "⚠️  Frontend dependencies not installed"
        ((WARNINGS++))
    fi
    if [ -d "frontend/dist" ]; then
        echo "✅ Frontend built"
    else
        echo "⚠️  Frontend not built"
        ((WARNINGS++))
    fi
else
    echo "❌ Frontend directory missing"
    ((ERRORS++))
fi

echo ""
echo "🗄️  Checking database..."
echo ""

# Check database connection
if PGPASSWORD=Ayah2010 psql -h localhost -U unity_app -d unity_platform -c "SELECT 1" &> /dev/null; then
    echo "✅ Database connection successful"
    
    # Check tables
    TABLES=$(PGPASSWORD=Ayah2010 psql -h localhost -U unity_app -d unity_platform -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
    echo "✅ Database has $TABLES tables"
    
    # Check for key tables
    for table in users guilds channels messages roles guild_invites; do
        if PGPASSWORD=Ayah2010 psql -h localhost -U unity_app -d unity_platform -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='$table'" | grep -q 1; then
            echo "✅ Table '$table' exists"
        else
            echo "⚠️  Table '$table' missing"
            ((WARNINGS++))
        fi
    done
else
    echo "❌ Database connection failed"
    ((ERRORS++))
fi

echo ""
echo "🔧 Checking services..."
echo ""

# Check PM2 processes
PM2_PROCESSES=$(pm2 jlist | jq -r '.[].name' 2>/dev/null)
if echo "$PM2_PROCESSES" | grep -q "unity-backend"; then
    echo "✅ Backend service running"
else
    echo "❌ Backend service not running"
    ((ERRORS++))
fi

if echo "$PM2_PROCESSES" | grep -q "unity-frontend"; then
    echo "✅ Frontend service running"
else
    echo "❌ Frontend service not running"
    ((ERRORS++))
fi

# Check Redis
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis not responding"
    ((ERRORS++))
fi

# Check Nginx
if sudo nginx -t &> /dev/null; then
    echo "✅ Nginx configuration valid"
else
    echo "❌ Nginx configuration invalid"
    ((ERRORS++))
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    ((ERRORS++))
fi

echo ""
echo "🔒 Checking HTTPS..."
echo ""

# Check SSL certificate
if [ -f "/etc/nginx/ssl/server.crt" ]; then
    echo "✅ SSL certificate exists"
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/nginx/ssl/server.crt | cut -d= -f2)
    echo "   Expires: $CERT_EXPIRY"
else
    echo "⚠️  SSL certificate not found"
    ((WARNINGS++))
fi

if [ -f "/etc/nginx/ssl/server.key" ]; then
    echo "✅ SSL private key exists"
else
    echo "⚠️  SSL private key not found"
    ((WARNINGS++))
fi

echo ""
echo "📂 Checking uploads directory..."
echo ""

if [ -d "uploads" ]; then
    echo "✅ Uploads directory exists"
    
    # Check permissions
    UPLOAD_PERMS=$(stat -c "%a" uploads)
    if [ "$UPLOAD_PERMS" = "755" ] || [ "$UPLOAD_PERMS" = "775" ]; then
        echo "✅ Uploads directory permissions: $UPLOAD_PERMS"
    else
        echo "⚠️  Uploads directory permissions: $UPLOAD_PERMS (should be 755 or 775)"
        ((WARNINGS++))
    fi
    
    # Check subdirectories
    for dir in avatars banners; do
        if [ -d "uploads/$dir" ]; then
            echo "✅ uploads/$dir exists"
        else
            echo "⚠️  uploads/$dir missing"
            ((WARNINGS++))
        fi
    done
else
    echo "⚠️  Uploads directory missing"
    ((WARNINGS++))
fi

echo ""
echo "🌐 Checking endpoints..."
echo ""

# Check health endpoint
if curl -k -s https://localhost/health | grep -q "ok"; then
    echo "✅ Health endpoint responding"
else
    echo "⚠️  Health endpoint not responding"
    ((WARNINGS++))
fi

# Check API endpoint
if curl -k -s https://localhost/api/docs &> /dev/null; then
    echo "✅ API documentation endpoint accessible"
else
    echo "⚠️  API documentation endpoint not accessible"
    ((WARNINGS++))
fi

echo ""
echo "================================================="
echo "📊 Verification Summary"
echo "================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Your installation is perfect!"
    echo ""
    echo "🎉 Your platform is ready to use!"
    echo "🌐 Access at: https://16.171.225.46"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found"
    echo ""
    echo "Your installation should work, but there are some minor issues."
    echo "Review the warnings above and fix them if needed."
    echo ""
    echo "🌐 Access at: https://16.171.225.46"
    echo ""
    exit 0
else
    echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo ""
    exit 1
fi
