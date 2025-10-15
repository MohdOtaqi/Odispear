# Unity Platform Deployment Guide

## Production Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

1. **Prerequisites**
   - Docker & Docker Compose installed
   - Domain name pointing to your server
   - SSL certificate (Let's Encrypt recommended)

2. **Setup**
   ```bash
   # Clone repository
   git clone <your-repo>
   cd unity-platform

   # Create production environment file
   cp .env.production.example .env
   
   # Edit .env with your production values
   nano .env

   # Build and start services
   docker-compose up -d

   # Check logs
   docker-compose logs -f
   ```

3. **SSL Setup with Certbot**
   ```bash
   # Install certbot
   sudo apt-get install certbot python3-certbot-nginx

   # Get certificate
   sudo certbot --nginx -d yourdomain.com

   # Auto-renewal
   sudo certbot renew --dry-run
   ```

### Option 2: Manual Deployment

1. **Server Setup**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib

   # Install Redis
   sudo apt-get install redis-server

   # Install PM2
   npm install -g pm2
   ```

2. **Database Setup**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE unity_platform;
   CREATE USER unity_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE unity_platform TO unity_user;
   \q
   ```

3. **Application Deployment**
   ```bash
   # Clone and install
   git clone <your-repo>
   cd unity-platform/backend
   npm install
   npm run build

   cd ../frontend
   npm install
   npm run build

   # Run migrations
   cd ../backend
   npm run migrate

   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
heroku login
heroku create unity-platform-prod

# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### AWS (Elastic Beanstalk)
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js unity-platform

# Create environment
eb create unity-platform-prod

# Deploy
eb deploy
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `node dist/index.js`
3. Add PostgreSQL and Redis managed databases
4. Set environment variables
5. Deploy

## Environment Variables (Production)

Required variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<generate with: openssl rand -base64 64>
CORS_ORIGIN=https://yourdomain.com
```

## Security Checklist

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] SSL/TLS certificate installed
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Database password is strong
- [ ] Environment variables are not committed
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Regular backups configured
- [ ] Monitoring and logging set up

## Database Backups

### Automated Backup Script
```bash
#!/bin/bash
# Save as backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/unity-platform"
DB_NAME="unity_platform"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Cron Job for Daily Backups
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Monitoring

### PM2 Monitoring
```bash
# Monitor
pm2 monit

# Logs
pm2 logs

# Status
pm2 status
```

### Health Checks
The platform includes a `/health` endpoint:
```bash
curl http://localhost:3000/health
```

## Scaling

### Horizontal Scaling
```bash
# PM2 cluster mode (already configured)
pm2 scale unity-platform +2  # Add 2 more instances
pm2 scale unity-platform 4   # Scale to 4 instances
```

### Database Scaling
- Enable connection pooling (already configured)
- Add read replicas for read-heavy workloads
- Consider managed database services (AWS RDS, DigitalOcean Managed Databases)

## Troubleshooting

### Check Logs
```bash
# Docker
docker-compose logs backend

# PM2
pm2 logs

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **Redis Connection Failed**
   - Verify Redis is running: `redis-cli ping`
   - Check REDIS_URL format

3. **WebSocket Not Working**
   - Ensure nginx is configured for WebSocket
   - Check CORS settings
   - Verify port 3000 is accessible

## Performance Optimization

1. **Enable Caching**
   - Redis caching is already implemented
   - Consider CDN for static assets

2. **Database Optimization**
   - Indexes are already in place
   - Monitor slow queries
   - Consider connection pooling adjustments

3. **Load Balancing**
   - Use nginx as load balancer
   - Multiple backend instances with PM2

## Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart
pm2 restart unity-platform

# Or with Docker
docker-compose down
docker-compose up -d --build
```

### Database Migrations
```bash
# Run new migrations
npm run migrate
```

## Support

For issues, check:
- Application logs
- Database logs
- Redis logs
- Nginx logs
- System resources (CPU, memory, disk)
