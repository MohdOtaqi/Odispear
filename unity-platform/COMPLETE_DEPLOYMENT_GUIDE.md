# 🚀 Unity Platform - Complete Deployment Guide
## From Zero to Production

---

## 📋 Table of Contents
1. [Local Development Setup](#1-local-development-setup)
2. [Third-Party Services & APIs](#2-third-party-services--apis)
3. [Production Server Setup](#3-production-server-setup)
4. [Database Configuration](#4-database-configuration)
5. [Application Deployment](#5-application-deployment)
6. [Domain & SSL Setup](#6-domain--ssl-setup)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Cost Breakdown](#8-cost-breakdown)

---

# 1. Local Development Setup

## A. Install Prerequisites on Your Computer

### Windows:

**1.1 Node.js** (JavaScript Runtime)
```
Download: https://nodejs.org/
- Get the LTS version (v18+)
- Run installer
- ✓ Check "Add to PATH"
- Restart computer after install

Verify:
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

**1.2 PostgreSQL** (Database)
```
Download: https://www.postgresql.org/download/windows/
- Get version 14 or higher
- During install:
  * Set a password (REMEMBER THIS!)
  * Port: 5432 (default)
  * Install pgAdmin (recommended)

Verify:
psql --version  # Should show PostgreSQL 14.x
```

**1.3 Redis** (Cache/Real-time)
```
Download: https://github.com/microsoftarchive/redis/releases
- Get: Redis-x64-3.2.100.msi
- Install (service starts automatically)

Verify:
redis-cli ping  # Should return: PONG
```

---

## B. Setup Project Locally

```powershell
# 1. Navigate to project
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ..\frontend
npm install

# 4. Create environment files
cd ..\backend
copy .env.example .env

cd ..\frontend
copy .env.example .env
```

---

## C. Configure Local Environment

**Edit `backend/.env`:**
```env
NODE_ENV=development
PORT=3000

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/unity_platform

# Local Redis
REDIS_URL=redis://localhost:6379

# Generate a random secret (use this for now):
JWT_SECRET=dev-secret-change-in-production-make-this-very-long-and-random
JWT_EXPIRES_IN=7d

# For development, these can be empty
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# Allow frontend origin
CORS_ORIGIN=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Edit `frontend/.env`:**
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## D. Setup Database

```powershell
# Create database
createdb -U postgres unity_platform

# Run migrations
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform\backend
npm run migrate

# Optional: Load sample data for testing
# (This gives you test users and channels)
psql -U postgres -d unity_platform -f ../database/seed.sql
```

---

## E. Run Locally

**Open 3 PowerShell terminals:**

**Terminal 1 - Redis:**
```powershell
redis-server
```

**Terminal 2 - Backend:**
```powershell
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform\backend
npm run dev
```

**Terminal 3 - Frontend:**
```powershell
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform\frontend
npm run dev
```

**Access:** http://localhost:5173

---

# 2. Third-Party Services & APIs

## A. File Storage (Required for uploads)

### **Option 1: AWS S3** (Recommended)

**Setup:**
1. Go to: https://aws.amazon.com/
2. Create account (requires credit card, but free tier available)
3. Go to S3 Console: https://console.aws.amazon.com/s3/
4. Click "Create bucket"
   - Name: `unity-platform-uploads` (must be unique globally)
   - Region: `us-east-1` (or closest to you)
   - Uncheck "Block all public access" (for uploaded images)
   - Enable versioning (optional)
   - Create bucket

5. Get API Keys:
   - Go to IAM: https://console.aws.amazon.com/iam/
   - Users → Create user: `unity-platform-app`
   - Attach policy: `AmazonS3FullAccess`
   - Security credentials → Create access key
   - Copy: Access Key ID & Secret Access Key

**Cost:** Free tier: 5GB storage, 20,000 GET requests/month
**After free tier:** ~$0.023 per GB per month

**Add to `.env`:**
```env
AWS_ACCESS_KEY_ID=AKIA...YOUR_KEY
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=unity-platform-uploads
AWS_REGION=us-east-1
```

---

### **Option 2: Cloudinary** (Alternative, easier)

**Setup:**
1. Go to: https://cloudinary.com/
2. Sign up (free plan: 25GB storage, 25GB bandwidth/month)
3. Dashboard → Account Details
4. Copy: Cloud Name, API Key, API Secret

**Cost:** Free forever for small projects

**Install package:**
```powershell
cd backend
npm install cloudinary
```

**Add to `.env`:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## B. Voice/Video (Optional for voice channels)

### **Option 1: Daily.co** (Recommended for MVP)

**Setup:**
1. Go to: https://www.daily.co/
2. Sign up (free plan: 10 rooms, unlimited participants)
3. Dashboard → Developers → API Key
4. Copy your API key

**Cost:** Free plan available, then $0.03/minute

**Add to `.env`:**
```env
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your-domain.daily.co
```

---

### **Option 2: Agora** (Alternative)

**Setup:**
1. Go to: https://www.agora.io/
2. Sign up (10,000 free minutes/month)
3. Project → App ID & Token
4. Copy credentials

**Cost:** 10,000 free minutes/month

---

## C. Email Service (For notifications)

### **SendGrid** (Recommended)

**Setup:**
1. Go to: https://sendgrid.com/
2. Sign up (free: 100 emails/day)
3. Settings → API Keys → Create API Key
4. Copy the key

**Cost:** Free: 100/day, then $19.95/month for 50k

**Add to `.env`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here
SMTP_FROM=noreply@yourdomain.com
```

---

## D. Error Tracking (Optional but recommended)

### **Sentry**

**Setup:**
1. Go to: https://sentry.io/
2. Sign up (free: 5k events/month)
3. Create project → Node.js
4. Copy DSN

**Cost:** Free for small projects

**Add to `.env`:**
```env
SENTRY_DSN=https://...@sentry.io/...
```

---

# 3. Production Server Setup

## Option A: AWS (Most Popular)

### **A1. Create AWS Account**
1. Go to: https://aws.amazon.com/
2. Sign up (requires credit card)
3. Free tier: 12 months free for many services

---

### **A2. Launch EC2 Instance**

**Steps:**
1. Go to EC2 Console: https://console.aws.amazon.com/ec2/
2. Click "Launch Instance"

**Configuration:**
```
Name: unity-platform-server

AMI: Ubuntu Server 22.04 LTS (Free tier eligible)

Instance Type: t2.medium (Recommended)
- CPU: 2 vCPU
- RAM: 4 GB
- Cost: ~$34/month (or t2.small for $17/month if budget tight)

Key pair: Create new
- Name: unity-platform-key
- Download .pem file (SAVE THIS!)

Network Settings:
- Create security group
- Allow SSH (port 22) from your IP
- Allow HTTP (port 80) from anywhere
- Allow HTTPS (port 443) from anywhere
- Allow Custom TCP (port 3000) from anywhere (for API)

Storage: 30 GB gp3 (Free tier: 30GB)
```

3. Click "Launch Instance"
4. Wait for instance to start
5. Note the **Public IP address**

---

### **A3. Connect to Server**

**Windows (using PowerShell):**
```powershell
# Convert .pem to .ppk if using PuTTY
# Or use SSH in PowerShell:

ssh -i "unity-platform-key.pem" ubuntu@YOUR_SERVER_IP
```

---

### **A4. Setup Server**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Verify installations
node --version    # Should be v18.x
npm --version
psql --version
redis-cli --version
nginx -v
```

---

## Option B: DigitalOcean (Easier, Recommended for Beginners)

### **B1. Create Account**
1. Go to: https://www.digitalocean.com/
2. Sign up (get $200 credit for 60 days with referral)
3. Add payment method

---

### **B2. Create Droplet**

**Steps:**
1. Click "Create" → "Droplets"

**Configuration:**
```
Image: Ubuntu 22.04 LTS

Plan: Basic
Size: $24/month (4GB RAM, 2 vCPU) - Recommended
      OR $12/month (2GB RAM, 1 vCPU) - Minimum

Datacenter: Choose closest to your users

Authentication: SSH Key (recommended) or Password

Hostname: unity-platform

Enable: Monitoring (free)
```

2. Click "Create Droplet"
3. Wait for creation
4. Note the **IP address**

---

### **B3. Connect and Setup**

```bash
ssh root@YOUR_DROPLET_IP

# Run all commands from A4 above
```

---

## Option C: Heroku (Easiest, but more expensive)

### **C1. Setup**
```bash
# Install Heroku CLI
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform
heroku create unity-platform-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini
# Cost: $5/month

# Add Redis
heroku addons:create heroku-redis:mini
# Cost: $3/month

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-generated-secret
heroku config:set AWS_ACCESS_KEY_ID=your-key
heroku config:set AWS_SECRET_ACCESS_KEY=your-secret
# ... (all other env vars)

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate:prod

# Open
heroku open
```

**Total Cost:** ~$15-20/month (simpler but limited)

---

# 4. Database Configuration

## A. Managed Database (Recommended for Production)

### **AWS RDS PostgreSQL**

**Setup:**
1. Go to RDS Console: https://console.aws.amazon.com/rds/
2. Click "Create database"

**Configuration:**
```
Engine: PostgreSQL
Version: 14.x

Templates: Production (or Dev/Test for lower cost)

DB instance identifier: unity-platform-db

Master username: postgres
Master password: [Generate strong password]

Instance: db.t3.micro (Free tier) or db.t3.small ($25/month)

Storage: 20 GB SSD

Connectivity:
- Public access: Yes (for initial setup)
- Security group: Create new
  - Allow PostgreSQL (port 5432) from your EC2 security group

Backup:
- Automated backups: Enabled
- Retention: 7 days
```

3. Create database
4. Wait ~5 minutes
5. Note the **Endpoint** (looks like: xxx.rds.amazonaws.com)

**Cost:** Free tier: db.t3.micro for 12 months
**After:** ~$15-25/month

---

### **DigitalOcean Managed Database**

**Setup:**
1. Click "Create" → "Databases"
2. Choose PostgreSQL 14
3. Plan: $15/month (1GB RAM, 10GB storage)
4. Datacenter: Same as your Droplet
5. Create

**Get connection string** from dashboard

**Cost:** $15/month minimum

---

## B. Database on Same Server (Budget Option)

**Setup PostgreSQL on your server:**

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database
createdb unity_platform

# Create user
createuser --interactive --pwprompt
# Name: unity_app
# Password: [strong password]

# Grant permissions
psql
GRANT ALL PRIVILEGES ON DATABASE unity_platform TO unity_app;
\q

exit
```

**Connection string:**
```
postgresql://unity_app:password@localhost:5432/unity_platform
```

---

# 5. Application Deployment

## A. Deploy to Your Server (AWS/DigitalOcean)

### **Step 1: Upload Code**

```bash
# On your server:
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/unity-platform.git
cd unity-platform

# Or upload via SFTP/SCP if not using Git
```

---

### **Step 2: Install Dependencies**

```bash
# Backend
cd /var/www/unity-platform/backend
npm ci --production

# Frontend
cd /var/www/unity-platform/frontend
npm ci
npm run build
# This creates /frontend/dist folder
```

---

### **Step 3: Configure Environment**

```bash
cd /var/www/unity-platform/backend
nano .env
```

**Production `.env`:**
```env
NODE_ENV=production
PORT=3000

# Your RDS or managed database URL
DATABASE_URL=postgresql://username:password@your-db-endpoint:5432/unity_platform

# Redis (local or managed)
REDIS_URL=redis://localhost:6379

# Generate secure secret: openssl rand -base64 64
JWT_SECRET=YOUR_SECURE_64_CHARACTER_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=unity-platform-uploads
AWS_REGION=us-east-1

# Your domain
CORS_ORIGIN=https://yourdomain.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key
SMTP_FROM=noreply@yourdomain.com

# Voice (optional)
DAILY_API_KEY=your_key

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
```

---

### **Step 4: Run Migrations**

```bash
cd /var/www/unity-platform/backend
npm run migrate:prod
```

---

### **Step 5: Setup PM2**

```bash
cd /var/www/unity-platform/backend

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs
```

---

### **Step 6: Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/unity-platform
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/unity-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

# 6. Domain & SSL Setup

## A. Get a Domain

**Popular registrars:**
- **Namecheap**: https://www.namecheap.com/ (~$10/year)
- **Google Domains**: https://domains.google/ (~$12/year)
- **GoDaddy**: https://www.godaddy.com/ (~$15/year)

**Buy:** `yourdomain.com` or `yourgamingplatform.com`

---

## B. Point Domain to Server

**In your domain registrar:**

1. Go to DNS settings
2. Add A records:

```
Type: A
Host: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Host: www
Value: YOUR_SERVER_IP
TTL: 3600
```

Wait 5-30 minutes for DNS propagation

---

## C. Install SSL Certificate (HTTPS)

```bash
# On your server:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Auto-renewal test
sudo certbot renew --dry-run
```

**SSL is now active!** Your site will use HTTPS.

---

# 7. Monitoring & Maintenance

## A. Setup Monitoring

### **UptimeRobot** (Free)
1. Go to: https://uptimerobot.com/
2. Sign up
3. Add monitor:
   - Type: HTTP(s)
   - URL: https://yourdomain.com/health
   - Interval: 5 minutes
4. Add alert contacts (email, SMS)

---

### **Server Monitoring**

```bash
# Install htop
sudo apt install htop

# Check resources
htop

# Check disk space
df -h

# Check memory
free -h

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

---

## B. Backups

### **Database Backups**

**Create backup script:**
```bash
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/unity-platform"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump unity_platform > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * /usr/local/bin/backup-db.sh
```

---

### **Automated S3 Backup** (Optional)

```bash
# Install AWS CLI
sudo apt install awscli

# Configure
aws configure
# Enter your AWS credentials

# Add to backup script:
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

---

## C. Updates

```bash
# Update application
cd /var/www/unity-platform
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart unity-platform

# Frontend
cd ../frontend
npm install
npm run build

# Restart nginx
sudo systemctl restart nginx
```

---

# 8. Cost Breakdown

## Budget Setup (~$50/month)

```
✓ Domain: $10/year (~$1/month)
✓ DigitalOcean Droplet: $12/month (2GB RAM)
✓ Database on same server: $0
✓ Redis on same server: $0
✓ S3 Storage: $1-2/month (for 10GB)
✓ SendGrid Email: Free (100/day)
✓ SSL Certificate: Free (Let's Encrypt)

TOTAL: ~$15/month
```

---

## Recommended Setup (~$75/month)

```
✓ Domain: $10/year (~$1/month)
✓ DigitalOcean Droplet: $24/month (4GB RAM)
✓ Managed PostgreSQL: $15/month
✓ Redis on server: $0
✓ S3 Storage: $2-3/month
✓ SendGrid: $19.95/month (50k emails)
✓ Daily.co Voice: $0-10/month (pay per use)
✓ SSL Certificate: Free

TOTAL: ~$65-75/month
```

---

## Professional Setup (~$150/month)

```
✓ Domain: $10/year (~$1/month)
✓ AWS EC2 t2.medium: $34/month
✓ AWS RDS db.t3.small: $25/month
✓ AWS ElastiCache Redis: $15/month
✓ S3 + CloudFront CDN: $5/month
✓ SendGrid Pro: $19.95/month
✓ Daily.co: $20/month
✓ Sentry: $26/month
✓ Load Balancer: $18/month
✓ Backups: $10/month

TOTAL: ~$150-175/month
```

---

# 9. Launch Checklist

## Pre-Launch

- [ ] All third-party API keys configured
- [ ] Database migrations completed
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] Environment variables set correctly
- [ ] PM2 running and stable
- [ ] Nginx configured
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] Test user registration
- [ ] Test real-time chat
- [ ] Test file uploads
- [ ] Test voice channels
- [ ] Load testing completed
- [ ] Security scan done

## Post-Launch

- [ ] Monitor logs daily (first week)
- [ ] Check server resources
- [ ] Verify backups working
- [ ] Test all features
- [ ] Collect user feedback
- [ ] Setup analytics
- [ ] Plan scaling strategy

---

# 10. Quick Commands Reference

```bash
# Check application status
pm2 status
pm2 logs

# Restart application
pm2 restart unity-platform

# Check server resources
htop
df -h
free -h

# Check database
psql -U postgres unity_platform

# Check Redis
redis-cli ping

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u nginx -f

# SSL renewal
sudo certbot renew

# Update application
cd /var/www/unity-platform
git pull
cd backend && npm install && pm2 restart unity-platform
cd ../frontend && npm install && npm run build
```

---

# 11. Support Resources

**Documentation:**
- Node.js: https://nodejs.org/docs/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/docs/

**Community:**
- Stack Overflow: https://stackoverflow.com/
- Reddit r/node: https://reddit.com/r/node
- Discord Developer Community

---

## 🎉 Congratulations!

You now have a complete guide from zero to production deployment!

**Next Steps:**
1. Start with local development
2. Get third-party API keys
3. Choose a hosting provider
4. Deploy to production
5. Monitor and maintain

**Need Help?** Check the documentation files in this project!
