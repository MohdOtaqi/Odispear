# Unity Platform - Quick Reference Card

## 🔑 Essential API Services You Need

### 1. File Storage (Choose One)
**AWS S3** (Recommended)
- Sign up: https://aws.amazon.com/
- Free tier: 5GB storage
- Get: Access Key ID + Secret Key
- Cost after free: ~$0.023/GB/month

**OR Cloudinary** (Easier)
- Sign up: https://cloudinary.com/
- Free: 25GB forever
- Get: Cloud Name + API Key + Secret

---

### 2. Voice/Video (Optional)
**Daily.co** (Recommended)
- Sign up: https://www.daily.co/
- Free: 10 rooms
- Get: API Key
- Cost: $0.03/minute after free

---

### 3. Email (For notifications)
**SendGrid**
- Sign up: https://sendgrid.com/
- Free: 100 emails/day
- Get: API Key
- Cost: $19.95/month for 50k emails

---

### 4. Error Tracking (Optional)
**Sentry**
- Sign up: https://sentry.io/
- Free: 5k events/month
- Get: DSN URL

---

## 🖥️ Server Options (Choose One)

### Option A: DigitalOcean (Easiest)
```
Cost: $12-24/month
Sign up: https://www.digitalocean.com/
- Create Droplet (Ubuntu 22.04)
- Size: $24/month (4GB RAM) - Recommended
- Get $200 free credit (60 days)
```

### Option B: AWS EC2
```
Cost: $17-34/month
Sign up: https://aws.amazon.com/
- Launch EC2 (Ubuntu 22.04)
- Type: t2.small ($17/month) or t2.medium ($34/month)
- Free tier: 12 months free (t2.micro)
```

### Option C: Heroku (Simplest)
```
Cost: ~$15-20/month
Sign up: https://www.heroku.com/
- Install Heroku CLI
- Just git push to deploy
- Less control but easier
```

---

## 💾 Database Options (Choose One)

### Option A: Managed Database (Recommended)
```
AWS RDS PostgreSQL: $15-25/month
- Go to RDS Console
- Create PostgreSQL 14
- Copy endpoint URL

DigitalOcean Managed DB: $15/month
- Click Create → Databases
- PostgreSQL 14
- Copy connection string
```

### Option B: Database on Server (Budget)
```
Cost: $0 (included with server)
- Install PostgreSQL on your server
- Less reliable but saves money
```

---

## 🌐 Domain & SSL

### Domain Registrar (Choose One)
```
Namecheap: ~$10/year - https://www.namecheap.com/
Google Domains: ~$12/year - https://domains.google/
GoDaddy: ~$15/year - https://www.godaddy.com/
```

### SSL Certificate
```
Let's Encrypt: FREE
- Run: sudo certbot --nginx -d yourdomain.com
- Auto-renews every 90 days
```

---

## 💰 Cost Calculator

### Minimum Setup (~$15/month)
```
✓ Domain: $1/month
✓ DigitalOcean Droplet 2GB: $12/month
✓ Database on server: $0
✓ S3: $2/month
✓ Email (free tier): $0
= $15/month total
```

### Recommended Setup (~$75/month)
```
✓ Domain: $1/month
✓ DigitalOcean Droplet 4GB: $24/month
✓ Managed PostgreSQL: $15/month
✓ S3 + CloudFront: $5/month
✓ SendGrid Pro: $19.95/month
✓ Daily.co (voice): $10/month
= $75/month total
```

### Professional Setup (~$150/month)
```
✓ Domain: $1/month
✓ AWS EC2 t2.medium: $34/month
✓ AWS RDS: $25/month
✓ AWS ElastiCache Redis: $15/month
✓ S3 + CDN: $5/month
✓ SendGrid Pro: $19.95/month
✓ Daily.co: $20/month
✓ Sentry: $26/month
✓ Extras: $15/month
= $160/month total
```

---

## 📋 Deployment Checklist

### Step 1: Sign Up for Services (30 min)
- [ ] AWS account (for S3)
- [ ] SendGrid account (email)
- [ ] Daily.co account (voice - optional)
- [ ] DigitalOcean or AWS (server)
- [ ] Domain registrar (domain)

### Step 2: Get API Keys (15 min)
- [ ] AWS: Access Key + Secret Key
- [ ] SendGrid: API Key
- [ ] Daily.co: API Key (if using)
- [ ] Sentry: DSN (if using)

### Step 3: Setup Server (45 min)
- [ ] Create droplet/instance
- [ ] SSH into server
- [ ] Install: Node.js, PostgreSQL, Redis, Nginx, PM2
- [ ] Clone your code

### Step 4: Configure (20 min)
- [ ] Create .env file with all API keys
- [ ] Setup database
- [ ] Run migrations
- [ ] Build frontend

### Step 5: Deploy (15 min)
- [ ] Start app with PM2
- [ ] Configure Nginx
- [ ] Point domain to server
- [ ] Install SSL certificate

### Step 6: Test (30 min)
- [ ] Test registration
- [ ] Test login
- [ ] Test chat
- [ ] Test file upload
- [ ] Test voice channels
- [ ] Test events

Total Time: ~3 hours

---

## 🚀 One-Command Deploy (After Initial Setup)

```bash
# Update and restart
cd /var/www/unity-platform
git pull
cd backend && npm install && pm2 restart unity-platform
cd ../frontend && npm install && npm run build
sudo systemctl restart nginx
```

---

## 🆘 Emergency Commands

### App Not Working?
```bash
pm2 restart unity-platform
pm2 logs
```

### Database Issues?
```bash
sudo systemctl restart postgresql
psql -U postgres unity_platform
```

### Website Down?
```bash
sudo systemctl restart nginx
sudo nginx -t
```

### Out of Disk Space?
```bash
df -h
sudo apt autoremove
sudo apt clean
```

### High Memory?
```bash
free -h
pm2 restart unity-platform
```

---

## 📞 Support Links

**Get API Keys:**
- AWS S3: https://console.aws.amazon.com/iam/
- SendGrid: https://app.sendgrid.com/settings/api_keys
- Daily.co: https://dashboard.daily.co/developers
- Cloudinary: https://cloudinary.com/console

**Hosting:**
- DigitalOcean: https://cloud.digitalocean.com/
- AWS Console: https://console.aws.amazon.com/
- Heroku: https://dashboard.heroku.com/

**Domains:**
- Namecheap: https://www.namecheap.com/
- Google Domains: https://domains.google/

**Monitoring:**
- UptimeRobot: https://uptimerobot.com/
- Sentry: https://sentry.io/

---

## 📚 Full Documentation

For detailed step-by-step instructions, see:
- **COMPLETE_DEPLOYMENT_GUIDE.md** (Full guide with screenshots)
- **HOW_TO_RUN.md** (Local development)
- **DEPLOYMENT.md** (Production deployment details)
- **PRODUCTION_CHECKLIST.md** (Launch checklist)

---

## 🎯 Recommended Path for Beginners

1. **Start Local** (Week 1)
   - Install Node.js, PostgreSQL, Redis
   - Run locally: npm run dev
   - Test all features

2. **Get API Keys** (Week 2)
   - Sign up for AWS S3
   - Sign up for SendGrid
   - Test integrations locally

3. **Deploy MVP** (Week 3)
   - Get DigitalOcean droplet ($24/month)
   - Database on same server (budget option)
   - Deploy and test

4. **Get Domain** (Week 3)
   - Buy domain (~$10/year)
   - Point to server
   - Install SSL

5. **Scale Up** (Month 2+)
   - Move to managed database
   - Add CDN
   - Add monitoring
   - Add voice features

---

**Total Startup Cost: ~$50-100**
**Monthly Running Cost: $15-75 depending on features**

Good luck! 🚀
