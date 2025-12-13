# AWS Deployment Guide for Unity Platform

## Expected Latency Improvement
| Current (Render - Oregon) | AWS Frankfurt | Improvement |
|---------------------------|---------------|-------------|
| 280-450ms | **40-80ms** | ~5x faster |

## Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Frankfurt (eu-central-1)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   EC2       │    │    RDS      │    │ ElastiCache │     │
│  │  (Backend)  │◄──►│ PostgreSQL  │    │   (Redis)   │     │
│  │  + Frontend │    │             │    │  Optional   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Cost Estimate (Monthly)
| Service | Specification | Cost |
|---------|--------------|------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~$15/month |
| RDS db.t3.micro | PostgreSQL, 20GB | ~$15/month |
| **Total** | | **~$30/month** |

*Free tier available for first 12 months!*

---

## Step 1: Create AWS Account

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Complete registration (requires credit card)
4. Select **Frankfurt (eu-central-1)** region in top-right

---

## Step 2: Create RDS PostgreSQL Database

### 2.1 Navigate to RDS
1. Search "RDS" in AWS Console
2. Click "Create database"

### 2.2 Database Settings
```
Engine: PostgreSQL
Version: 15.x (latest)
Template: Free tier (or Production for better performance)

DB instance identifier: odispear-db
Master username: postgres
Master password: [CREATE A STRONG PASSWORD]

Instance: db.t3.micro (Free tier) or db.t3.small
Storage: 20 GB, Enable autoscaling

Connectivity:
  - VPC: Default
  - Public access: Yes (for initial setup, disable later)
  - Security group: Create new → "odispear-db-sg"

Database name: odispear
```

### 2.3 After Creation
Note down:
- **Endpoint**: `odispear-db.xxxxx.eu-central-1.rds.amazonaws.com`
- **Port**: `5432`

### 2.4 Configure Security Group
1. Go to EC2 → Security Groups
2. Find `odispear-db-sg`
3. Edit Inbound Rules → Add:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (temporarily, restrict later)

---

## Step 3: Create EC2 Instance

### 3.1 Launch Instance
1. Go to EC2 → Launch Instance

### 3.2 Instance Settings
```
Name: odispear-server
AMI: Ubuntu Server 22.04 LTS (Free tier eligible)
Instance type: t3.small (or t2.micro for free tier)
Key pair: Create new → "odispear-key" (download .pem file!)

Network settings:
  - Allow SSH (port 22)
  - Allow HTTPS (port 443)
  - Allow HTTP (port 80)
  - Allow Custom TCP (port 3000)

Storage: 20 GB gp3
```

### 3.3 Note Down
- **Public IPv4**: `xx.xx.xx.xx`
- **Public DNS**: `ec2-xx-xx-xx-xx.eu-central-1.compute.amazonaws.com`

---

## Step 4: Connect to EC2 & Setup

### 4.1 Connect via SSH (Windows PowerShell)
```powershell
# Move key file to safe location
mv ~/Downloads/odispear-key.pem ~/.ssh/

# Set permissions (Git Bash or WSL)
chmod 400 ~/.ssh/odispear-key.pem

# Connect
ssh -i ~/.ssh/odispear-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 4.2 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install PostgreSQL client (for running migrations)
sudo apt install -y postgresql-client

# Verify installations
node --version  # Should be v20.x
npm --version
pm2 --version
nginx -v
```

---

## Step 5: Clone & Setup Application

### 5.1 Clone Repository
```bash
cd ~
git clone https://github.com/MohdOtaqi/Odispear.git
cd Odispear/unity-platform
```

### 5.2 Create Environment File
```bash
nano backend/.env
```

Paste this content (update values):
```env
# Server
NODE_ENV=production
PORT=3000

# Database (RDS PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/odispear

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-also-32-chars-minimum

# Daily.co (Voice/Video)
DAILY_API_KEY=558446b4f880406375a3fec3cfb4f87c3c725608a2a660986fff5d61ecd060f0
DAILY_DOMAIN=odispear.daily.co

# Redis (Optional - leave empty to disable)
# REDIS_URL=

# Frontend URL (for CORS)
FRONTEND_URL=https://n0tmot.com
CORS_ORIGIN=https://n0tmot.com,https://www.n0tmot.com

# File uploads (optional)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### 5.3 Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install --production=false

# Build backend
npm run build

# Install frontend dependencies
cd ../frontend
npm install --production=false

# Build frontend
npm run build

cd ..
```

---

## Step 6: Run Database Migrations

### 6.1 Test Database Connection
```bash
psql postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/odispear -c "SELECT 1"
```

### 6.2 Run Migrations
```bash
cd ~/Odispear/unity-platform/backend
npm run migrate:prod
```

Expected output:
```
Running database migrations...
✓ schema.sql executed successfully
✓ friends_dm_migration.sql executed successfully
✓ guild_invites_migration.sql executed successfully
...
✓ All migrations completed
```

---

## Step 7: Configure Nginx

### 7.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/odispear
```

Paste:
```nginx
server {
    listen 80;
    server_name n0tmot.com www.n0tmot.com YOUR_EC2_PUBLIC_IP;

    # Frontend static files
    location / {
        root /home/ubuntu/Odispear/unity-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket (Socket.io)
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
    }
}
```

### 7.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/odispear /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 8: Start Application with PM2

### 8.1 Start Backend
```bash
cd ~/Odispear/unity-platform/backend
pm2 start dist/index.js --name "odispear-backend"
```

### 8.2 Save PM2 Config (Auto-restart on reboot)
```bash
pm2 save
pm2 startup
# Run the command it outputs
```

### 8.3 Check Status
```bash
pm2 status
pm2 logs odispear-backend
```

---

## Step 9: Setup SSL (HTTPS)

### 9.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Get SSL Certificate
```bash
sudo certbot --nginx -d n0tmot.com -d www.n0tmot.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS

### 9.3 Auto-renewal
```bash
sudo certbot renew --dry-run
```

---

## Step 10: Update DNS

### In Namecheap/Cloudflare:
Change your A records to point to your EC2 IP:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_EC2_PUBLIC_IP |
| A | www | YOUR_EC2_PUBLIC_IP |

---

## Step 11: Verify Deployment

### Test endpoints:
```bash
# Health check
curl http://YOUR_EC2_IP/health

# API docs
curl http://YOUR_EC2_IP/api/docs
```

### Visit in browser:
- http://YOUR_EC2_IP
- https://n0tmot.com (after DNS propagates)

---

## Useful Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart app
pm2 stop all            # Stop app
pm2 delete all          # Remove from PM2
```

### Update Application
```bash
cd ~/Odispear
git pull origin main
cd unity-platform/frontend && npm install && npm run build
cd ../backend && npm install && npm run build
pm2 restart odispear-backend
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Access
```bash
psql postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/odispear
```

---

## Troubleshooting

### App not starting?
```bash
pm2 logs odispear-backend --lines 100
```

### Nginx errors?
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Database connection issues?
1. Check RDS security group allows your EC2 IP
2. Verify DATABASE_URL in .env
3. Test: `psql $DATABASE_URL -c "SELECT 1"`

### 502 Bad Gateway?
- Backend not running: `pm2 status`
- Port mismatch: Check PORT in .env matches nginx config

---

## Security Checklist

- [ ] Change RDS to private access after setup
- [ ] Restrict security groups to specific IPs
- [ ] Enable AWS CloudWatch for monitoring
- [ ] Set up AWS Budget alerts
- [ ] Regular backups for RDS (enabled by default)
