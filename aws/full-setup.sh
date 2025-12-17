#!/bin/bash
# ===========================================
# COMPLETE EC2 Setup Script for Unity Platform
# Just paste this entire script into EC2 terminal
# ===========================================

set -e

echo "=========================================="
echo "Unity Platform - Full AWS Setup"
echo "=========================================="

# Update system
echo "Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "Step 2: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
echo "Step 3: Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "Step 4: Installing Nginx..."
sudo apt install -y nginx

# Install PostgreSQL client
echo "Step 5: Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Install Git
echo "Step 6: Installing Git..."
sudo apt install -y git

# Install Certbot
echo "Step 7: Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Clone repository
echo "Step 8: Cloning repository..."
cd ~
if [ -d "Odispear" ]; then
    rm -rf Odispear
fi
git clone https://github.com/MohdOtaqi/Odispear.git
cd Odispear/unity-platform

echo "=========================================="
echo "Dependencies installed!"
echo "=========================================="
