#!/bin/bash

# Setup HTTPS on AWS EC2 with Let's Encrypt
# Run this script on your AWS server

echo "========================================="
echo "Setting up HTTPS for Unity Platform"
echo "========================================="

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash setup-https-aws.sh"
    exit
fi

# Install certbot
echo "Installing certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Get domain name or IP
read -p "Enter your domain name (or press Enter to use IP): " DOMAIN

if [ -z "$DOMAIN" ]; then
    # If no domain, use the public IP
    DOMAIN=$(curl -s http://checkip.amazonaws.com)
    echo "Using IP address: $DOMAIN"
    USE_SELF_SIGNED=true
else
    echo "Using domain: $DOMAIN"
    USE_SELF_SIGNED=false
fi

if [ "$USE_SELF_SIGNED" = true ]; then
    echo "Creating self-signed certificate for IP address..."
    
    # Create directory for certificates
    mkdir -p /etc/nginx/ssl
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Create Nginx configuration for HTTPS
    cat > /etc/nginx/sites-available/unity-platform-ssl << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
EOF
    
    echo "Self-signed certificate created!"
    
else
    # Use Let's Encrypt for domain
    echo "Getting Let's Encrypt certificate..."
    
    # Get email for Let's Encrypt
    read -p "Enter your email for Let's Encrypt: " EMAIL
    
    # Get certificate
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
    
    echo "Let's Encrypt certificate obtained!"
fi

# Enable the site
ln -sf /etc/nginx/sites-available/unity-platform-ssl /etc/nginx/sites-enabled/

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Update AWS Security Group instructions
echo ""
echo "========================================="
echo "✅ HTTPS Setup Complete!"
echo "========================================="
echo ""
echo "IMPORTANT: Update your AWS Security Group:"
echo "1. Go to AWS Console → EC2 → Security Groups"
echo "2. Select your instance's security group"
echo "3. Add inbound rule:"
echo "   - Type: HTTPS"
echo "   - Port: 443"
echo "   - Source: 0.0.0.0/0 (or your specific IP range)"
echo ""
echo "Your site is now accessible at:"
if [ "$USE_SELF_SIGNED" = true ]; then
    echo "  https://$DOMAIN"
    echo ""
    echo "Note: You'll see a browser warning about the self-signed certificate."
    echo "This is normal - just click 'Advanced' and 'Proceed to site'"
else
    echo "  https://$DOMAIN"
fi
echo ""
echo "Voice chat should now work! 🎤"
echo "========================================="
