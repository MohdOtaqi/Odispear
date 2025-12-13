# AWS Quick Reference Commands

## SSH Connection
```bash
ssh -i ~/.ssh/odispear-key.pem ubuntu@YOUR_EC2_IP
```

## PM2 Commands
```bash
pm2 status                    # Check app status
pm2 logs                      # View live logs
pm2 logs --lines 100          # View last 100 lines
pm2 restart odispear-backend  # Restart app
pm2 stop odispear-backend     # Stop app
pm2 delete odispear-backend   # Remove from PM2
pm2 monit                     # Real-time monitoring
```

## Nginx Commands
```bash
sudo nginx -t                 # Test config
sudo systemctl restart nginx  # Restart Nginx
sudo systemctl status nginx   # Check status
sudo tail -f /var/log/nginx/error.log    # View errors
sudo tail -f /var/log/nginx/access.log   # View access logs
```

## Database Commands
```bash
# Connect to RDS
psql postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/odispear

# Inside psql:
\dt                           # List tables
\d users                      # Describe users table
SELECT COUNT(*) FROM users;   # Count users
\q                            # Exit
```

## Update Application
```bash
cd ~/Odispear
./unity-platform/aws/deploy-update.sh
```

## Manual Update Steps
```bash
cd ~/Odispear
git pull origin main
cd unity-platform/backend && npm install && npm run build
cd ../frontend && npm install && npm run build
cd ../backend && npm run migrate:prod
pm2 restart odispear-backend
```

## SSL Certificate
```bash
# Renew SSL (auto-renews, but manual if needed)
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

## System Monitoring
```bash
htop                          # CPU/Memory usage
df -h                         # Disk usage
free -m                       # Memory usage
```

## Firewall (if using UFW)
```bash
sudo ufw status
sudo ufw allow 22/tcp         # SSH
sudo ufw allow 80/tcp         # HTTP
sudo ufw allow 443/tcp        # HTTPS
sudo ufw enable
```
