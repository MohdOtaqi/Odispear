# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Strong JWT_SECRET generated (64+ characters): `openssl rand -base64 64`
- [ ] All environment variables are set and secure
- [ ] Database passwords are strong and unique
- [ ] No .env files committed to repository
- [ ] CORS_ORIGIN set to production domain
- [ ] Rate limiting configured appropriately
- [ ] Security headers enabled (helmet)
- [ ] SSL/TLS certificate installed
- [ ] Firewall configured (only 80, 443, 22 open)

### Database
- [ ] PostgreSQL 14+ installed
- [ ] Database created
- [ ] All migrations run successfully: `npm run migrate`
- [ ] Connection pooling configured
- [ ] Backup strategy in place
- [ ] Regular backup schedule configured

### Redis
- [ ] Redis 6+ installed
- [ ] Redis password set (if applicable)
- [ ] Persistence enabled (AOF or RDB)
- [ ] Memory limit configured

### Application
- [ ] All dependencies installed: `npm ci --production`
- [ ] Application built: `npm run build`
- [ ] Environment variables validated
- [ ] Startup checks pass
- [ ] Health endpoint responding: `/health`
- [ ] API documentation accessible: `/api/docs`

### Infrastructure
- [ ] Server resources adequate (CPU, RAM, Disk)
- [ ] Domain name configured and pointing to server
- [ ] DNS records set up correctly
- [ ] Load balancer configured (if applicable)
- [ ] CDN set up for static assets (optional)

## Deployment

### Initial Deployment
- [ ] Code deployed to server
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Services started (PostgreSQL, Redis, App)
- [ ] Health checks passing

### Process Management
- [ ] PM2 or systemd configured for auto-restart
- [ ] Application runs as non-root user
- [ ] Process monitoring set up
- [ ] Log rotation configured

### Monitoring
- [ ] Application logs being collected
- [ ] Error tracking configured (Sentry, optional)
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured
- [ ] Disk space monitoring
- [ ] Database performance monitoring

## Post-Deployment

### Testing
- [ ] Health endpoint check: `curl https://yourdomain.com/health`
- [ ] User registration works
- [ ] User login works
- [ ] WebSocket connections work
- [ ] Create guild/server works
- [ ] Send messages works
- [ ] Create events works
- [ ] Moderation tools work
- [ ] File uploads work (if configured)

### Performance
- [ ] Response times acceptable (<200ms for API)
- [ ] WebSocket latency acceptable (<100ms)
- [ ] Database queries optimized
- [ ] No memory leaks detected
- [ ] CPU usage normal (<70% average)

### Security Verification
- [ ] HTTPS working correctly
- [ ] Security headers present: `curl -I https://yourdomain.com`
- [ ] Rate limiting working
- [ ] Authentication required on protected endpoints
- [ ] SQL injection prevention tested
- [ ] XSS prevention tested
- [ ] CSRF protection verified

### Backup & Recovery
- [ ] Database backup tested
- [ ] Backup restoration tested
- [ ] Redis backup configured
- [ ] Application state recoverable
- [ ] Disaster recovery plan documented

## Ongoing Maintenance

### Daily
- [ ] Check application logs for errors
- [ ] Monitor system resources
- [ ] Check uptime status

### Weekly
- [ ] Review error rates
- [ ] Check disk space
- [ ] Review security logs
- [ ] Test backups

### Monthly
- [ ] Update dependencies (security patches)
- [ ] Review performance metrics
- [ ] Check SSL certificate expiry
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Review and rotate logs

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Disaster recovery drill
- [ ] Update documentation

## Quick Commands

### Start Services
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Start Redis
sudo systemctl start redis

# Start Application (PM2)
pm2 start ecosystem.config.js
pm2 save

# Or with Docker
docker-compose up -d
```

### Check Status
```bash
# Check services
pm2 status

# View logs
pm2 logs

# Check health
curl http://localhost:3000/health

# Test database
psql -U postgres -d unity_platform -c "SELECT NOW();"

# Test Redis
redis-cli ping
```

### Maintenance
```bash
# Database backup
pg_dump unity_platform > backup_$(date +%Y%m%d).sql

# View logs
tail -f /var/log/nginx/error.log
pm2 logs --lines 100

# Restart application
pm2 restart unity-platform

# Update application
git pull origin main
npm run build
pm2 restart unity-platform
```

## Emergency Procedures

### Application Down
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs`
3. Check system resources: `htop`
4. Restart if needed: `pm2 restart unity-platform`

### Database Connection Issues
1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Check connections: `SELECT count(*) FROM pg_stat_activity;`
3. Restart if needed: `sudo systemctl restart postgresql`

### High Memory Usage
1. Identify process: `ps aux --sort=-%mem | head -10`
2. Check application logs
3. Restart application: `pm2 restart unity-platform`
4. Consider scaling up resources

### DDoS or High Traffic
1. Check access logs: `tail -f /var/log/nginx/access.log`
2. Verify rate limiting is working
3. Consider temporarily lowering rate limits
4. Enable Cloudflare DDoS protection

## Support Contacts

- DevOps Team: [contact]
- Database Admin: [contact]
- Security Team: [contact]
- On-call Engineer: [contact]

## Documentation Links

- [Setup Guide](./SETUP.md)
- [API Documentation](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
