# 🚀 QUICK FIX FOR API ROUTING

## The Problem
The API calls are resulting in `/api/api/v1/auth/login` because Nginx is adding `/api` to an already `/api`-prefixed URL.

## The Solution

### On your AWS server, run these commands:

```bash
# 1. Upload and run the fix script
cd /var/www/Odispear/unity-platform
nano fix-api-routing.sh
# Paste the content from fix-api-routing.sh file
chmod +x fix-api-routing.sh
./fix-api-routing.sh
```

### OR manually fix it step by step:

```bash
# 1. Fix Nginx configuration
sudo nano /etc/nginx/sites-available/unity-https
```

Change this line:
```nginx
proxy_pass http://localhost:3000/api/;  # WRONG
```

To this:
```nginx
proxy_pass http://localhost:3000/;  # CORRECT
```

```bash
# 2. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 3. Fix frontend environment
cd /var/www/Odispear/unity-platform/frontend
echo "VITE_API_URL=https://16.171.225.46/api" > .env.production
echo "VITE_WS_URL=wss://16.171.225.46" >> .env.production

# 4. Rebuild frontend
npm run build

# 5. Restart backend
pm2 restart unity-backend
```

## Testing

After fixing, test with:
```bash
# Should return 400 (missing credentials) not 404
curl -k https://16.171.225.46/api/v1/auth/login -X POST
```

## IMPORTANT
**Clear your browser cache completely:**
- Press `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Clear browsing data
- Try again

## Expected Behavior

✅ **Frontend:** Calls `https://16.171.225.46/api/v1/auth/login`
✅ **Nginx:** Proxies to `http://localhost:3000/api/v1/auth/login`
✅ **Backend:** Receives `/api/v1/auth/login` correctly
