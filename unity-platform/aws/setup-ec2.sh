#!/bin/bash
# ===========================================
# EC2 Setup Script for Unity Platform
# Run this on a fresh Ubuntu 22.04 EC2 instance
# ===========================================

set -e  # Exit on error

echo "=========================================="
echo "Unity Platform AWS Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Update system
echo ""
echo "Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y
print_status "System updated"

# Install Node.js 20
echo ""
echo "Step 2: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
print_status "Node.js $(node --version) installed"

# Install PM2
echo ""
echo "Step 3: Installing PM2..."
sudo npm install -g pm2
print_status "PM2 installed"

# Install Nginx
echo ""
echo "Step 4: Installing Nginx..."
sudo apt install -y nginx
print_status "Nginx installed"

# Install PostgreSQL client
echo ""
echo "Step 5: Installing PostgreSQL client..."
sudo apt install -y postgresql-client
print_status "PostgreSQL client installed"

# Install Git
echo ""
echo "Step 6: Installing Git..."
sudo apt install -y git
print_status "Git installed"

# Install Certbot for SSL
echo ""
echo "Step 7: Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx
print_status "Certbot installed"

# Clone repository
echo ""
echo "Step 8: Cloning repository..."
cd ~
if [ -d "Odispear" ]; then
    print_warning "Repository already exists, pulling latest..."
    cd Odispear && git pull origin main
else
    git clone https://github.com/MohdOtaqi/Odispear.git
    cd Odispear
fi
print_status "Repository ready"

# Create .env file prompt
echo ""
echo "=========================================="
echo "Setup complete! Next steps:"
echo "=========================================="
echo ""
echo "1. Create your .env file:"
echo "   nano ~/Odispear/unity-platform/backend/.env"
echo ""
echo "2. Install dependencies and build:"
echo "   cd ~/Odispear/unity-platform/backend"
echo "   npm install --production=false"
echo "   npm run build"
echo "   cd ../frontend"
echo "   npm install --production=false"
echo "   npm run build"
echo ""
echo "3. Run database migrations:"
echo "   cd ~/Odispear/unity-platform/backend"
echo "   npm run migrate:prod"
echo ""
echo "4. Configure Nginx (copy from AWS_DEPLOYMENT.md)"
echo ""
echo "5. Start with PM2:"
echo "   cd ~/Odispear/unity-platform/backend"
echo "   pm2 start dist/index.js --name odispear-backend"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "6. Setup SSL:"
echo "   sudo certbot --nginx -d n0tmot.com -d www.n0tmot.com"
echo ""
print_status "Setup script completed!"
