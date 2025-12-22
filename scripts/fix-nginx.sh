#!/bin/bash
# Fix nginx config and add LiveKit location

# Use sudo tee to write the config with root permissions
sudo tee /etc/nginx/sites-available/odispear > /dev/null << 'EOFNGINX'
# Main site (through Cloudflare)
server {
    if ($host = www.n0tmot.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = n0tmot.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name n0tmot.com www.n0tmot.com 16.24.207.113;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name n0tmot.com www.n0tmot.com 16.24.207.113;
    ssl_certificate /etc/letsencrypt/live/n0tmot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n0tmot.com/privkey.pem;

    root /home/ubuntu/Odispear/unity-platform/frontend/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        add_header Cross-Origin-Resource-Policy "cross-origin" always;
        add_header Access-Control-Allow-Origin "*" always;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # LiveKit WebSocket proxy
    location /livekit/ {
        proxy_pass http://127.0.0.1:7880/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000;
    }
}

# Direct API subdomain (bypasses Cloudflare for low latency)
server {
    listen 80;
    server_name api.n0tmot.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.n0tmot.com;

    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    add_header Access-Control-Allow-Origin "https://n0tmot.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;

    location / {
        if ($request_method = OPTIONS) {
            return 204;
        }
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }
}
EOFNGINX

echo "Nginx config created. Testing..."
sudo nginx -t && sudo systemctl reload nginx && echo "Nginx reloaded successfully!"
