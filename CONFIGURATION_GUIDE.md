# 🚀 Complete Configuration & Testing Guide

## 🎯 Overview
This guide covers all newly implemented features and their configuration requirements.

---

## ✅ Completed Features

### 1. **Daily.co API Fallback System**
- ✅ Centralized service with 3 API keys
- ✅ Automatic failover on errors
- ✅ Applied to voice channels and DM calls

### 2. **Google OAuth Authentication**
- ✅ Passport.js integration
- ✅ Automatic account linking
- ✅ OAuth callback route

### 3. **Password Reset Flow**
- ✅ Forgot password page
- ✅ Email service with templates
- ✅ Secure token generation
- ✅ Reset password page

### 4. **Ad Integration**
- ✅ Reusable AdComponent
- ✅ Integrated in member sidebar
- ✅ Google AdSense ready

### 5. **Mobile Responsiveness**
- ✅ 375px - 1440px support
- ✅ Touch-friendly targets (44x44px)
- ✅ Responsive sidebars
- ✅ Landscape support

### 6. **SEO & Performance**
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ robots.txt & sitemap.xml
- ✅ PWA manifest
- ✅ Error boundaries
- ✅ Enhanced API error handling

---

## 🔧 Required Configuration

### **A. Google OAuth Setup**

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Odispear"
3. Enable **Google+ API**

#### Step 2: Create OAuth Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Configure consent screen:
   - App name: **Odispear**
   - User support email: your email
   - Developer contact: your email
4. Create OAuth client:
   - Application type: **Web application**
   - Name: **Odispear Web Client**
   - Authorized redirect URIs:
     - `https://n0tmot.com/api/v1/auth/google/callback`
     - `http://localhost:5000/api/v1/auth/google/callback` (for local dev)
5. Copy **Client ID** and **Client Secret**

#### Step 3: Update Backend .env
```bash
# SSH into AWS
ssh -i ~/.ssh/mot-key.pem ubuntu@16.24.207.113

# Edit .env file
nano ~/Odispear/backend/.env

# Add these lines:
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=https://n0tmot.com/api/v1/auth/google/callback
FRONTEND_URL=https://n0tmot.com

# Save and restart
pm2 restart odispear-backend
```

---

### **B. Email Service (Gmail SMTP)**

#### Step 1: Generate App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to **App passwords**
4. Generate password for "Mail"
5. Copy the 16-character password

#### Step 2: Update Backend .env
```bash
nano ~/Odispear/backend/.env

# Add these lines:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=noreply@n0tmot.com

# Restart
pm2 restart odispear-backend
```

---

### **C. Google AdSense Setup**

#### Step 1: Create AdSense Account
1. Go to [Google AdSense](https://www.google.com/adsense)
2. Sign up with your domain: `n0tmot.com`
3. Add site and verify ownership
4. Wait for approval (1-2 weeks)

#### Step 2: Get Publisher ID
1. Once approved, go to **Account** > **Settings**
2. Copy your **Publisher ID** (starts with `ca-pub-`)

#### Step 3: Update Frontend
```bash
# Edit index.html on AWS
nano ~/Odispear/frontend/index.html

# Uncomment and update line 41:
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR-ID" crossorigin="anonymous"></script>

# Create .env.local for ad slots
nano ~/Odispear/frontend/.env.local

# Add:
VITE_ADSENSE_CLIENT=ca-pub-YOUR-ID
VITE_ADSENSE_SLOT=YOUR-AD-SLOT-ID

# Rebuild
cd ~/Odispear/frontend
npm run build
```

---

## 🧪 Testing Checklist

### **1. Google OAuth Testing**
```bash
# Test Flow:
1. Navigate to https://n0tmot.com/login
2. Click "Continue with Google"
3. Select Google account
4. Should redirect to /app after login
5. Check user table for google_id column

# Verify:
- User created with google_id
- Avatar pulled from Google
- Display name set from Google profile
- Session created in sessions table
```

### **2. Password Reset Testing**
```bash
# Test Flow:
1. Go to https://n0tmot.com/forgot-password
2. Enter email address
3. Check email inbox for reset link
4. Click link in email
5. Enter new password twice
6. Should redirect to /login
7. Login with new password

# Verify:
- Email received within 1 minute
- Reset link works for 1 hour
- Old sessions cleared after reset
- Password hash updated in database
```

### **3. Mobile Responsiveness Testing**
```bash
# Test Viewports:
- 375px (iPhone SE)
- 414px (iPhone Pro)
- 768px (iPad)
- 1024px (Desktop)
- 1440px (Large Desktop)

# Test Features:
✓ Sidebar slides on mobile
✓ Touch targets 44x44px minimum
✓ No horizontal scroll
✓ Modals fill screen on mobile
✓ Voice panel bottom sheet
✓ Font size prevents iOS zoom
```

### **4. Daily.co Fallback Testing**
```bash
# Simulate API failure:
1. Join voice channel
2. If primary key fails, should automatically try backup keys
3. Check browser console for fallback logs:
   "[DailyService] Attempting with config 2/3"

# Verify:
- Voice connects even if primary key fails
- No white screen crashes
- User sees loading state during fallback
```

### **5. Ad Display Testing**
```bash
# Check Ad Rendering:
1. Navigate to server with members
2. Scroll to bottom of member list
3. Should see ad placeholder or AdSense ad

# If ads not showing:
- Check AdSense approval status
- Verify VITE_ADSENSE_CLIENT is set
- Check browser console for ad errors
- Wait 24 hours after approval
```

### **6. SEO Testing**
```bash
# Test Social Sharing:
1. Share https://n0tmot.com on:
   - Facebook
   - Twitter
   - Discord
   - LinkedIn

# Should display:
- Title: "Odispear - Modern Communication Platform"
- Description: Chat platform info
- Image: MOT favicon
- Preview card

# Test Search:
curl https://n0tmot.com/robots.txt
curl https://n0tmot.com/sitemap.xml
```

### **7. Error Handling Testing**
```bash
# Test Network Errors:
1. Disconnect internet
2. Try to send message
3. Should see: "Network error. Please check connection"
4. Reconnect internet
5. Retry should work

# Test Auth Errors:
1. Delete accessToken from localStorage
2. Try to load /app
3. Should redirect to /login
4. Should NOT see "Invalid email/password"
```

---

## 📊 Best Ad Networks for Your Platform

### **Recommended Priority:**

#### 1. **Google AdSense** ⭐ (Best)
- **CPM**: $1-5
- **Requirements**: 100+ daily visitors, original content
- **Sign up**: https://www.google.com/adsense
- **Best for**: Tech/gaming audience
- **Payment**: $100 minimum via wire transfer

#### 2. **Media.net** 
- **CPM**: $1-3
- **Requirements**: US/UK traffic preferred
- **Sign up**: https://www.media.net
- **Best for**: Contextual ads
- **Payment**: $100 minimum via PayPal

#### 3. **Ezoic** (Premium - requires traffic)
- **CPM**: $3-10
- **Requirements**: 10,000+ monthly visitors
- **Sign up**: https://www.ezoic.com
- **Best for**: High traffic sites
- **Payment**: $20 minimum via PayPal

#### 4. **PropellerAds** (Fallback)
- **CPM**: $0.5-2
- **Requirements**: None (instant approval)
- **Sign up**: https://propellerads.com
- **Best for**: High fill rate
- **Payment**: $5 minimum via various methods

### **Revenue Projections:**
```
1,000 daily users:   $30-100/month
10,000 daily users:  $300-1,000/month
100,000 daily users: $3,000-10,000/month
```

---

## 🚨 Troubleshooting

### **Google OAuth Not Working**
```bash
# Check logs:
pm2 logs odispear-backend --lines 100

# Common issues:
1. Incorrect redirect URI
   - Must match EXACTLY in Google Console
2. Missing environment variables
   - Run: env | grep GOOGLE
3. Passport not initialized
   - Check backend/src/config/passport.ts exists
```

### **Password Reset Emails Not Sending**
```bash
# Test SMTP connection:
ssh ubuntu@16.24.207.113
cd ~/Odispear/backend
node -e "const nodemailer = require('nodemailer'); const t = nodemailer.createTransport({host:'smtp.gmail.com',port:587,auth:{user:'YOUR_EMAIL',pass:'YOUR_APP_PASS'}}); t.verify((e,s) => console.log(e||'SMTP OK'));"

# Common issues:
1. App password vs regular password
2. 2FA not enabled on Gmail
3. "Less secure apps" still enabled
```

### **Ads Not Displaying**
```bash
# Debug checklist:
1. AdSense approval status (check email)
2. 24-48 hour delay after approval
3. Ad blockers disabled
4. VITE_ADSENSE_CLIENT set correctly
5. Script tag uncommented in index.html

# Check browser console:
- Look for "adsbygoogle" errors
- Check for "ad slot" warnings
```

### **Mobile UI Issues**
```bash
# Common fixes:
1. Hard refresh: Ctrl+Shift+R
2. Clear cache and rebuild:
   cd ~/Odispear/frontend
   rm -rf node_modules/.vite
   npm run build
3. Check viewport meta tag in index.html
4. Verify mobile-responsive.css is imported
```

---

## 📱 Mobile Testing URLs

Test on real devices:
- **iPhone**: Safari
- **Android**: Chrome
- **iPad**: Safari

Or use browser DevTools:
- Chrome: F12 > Device Toolbar
- Firefox: F12 > Responsive Design Mode

---

## ✨ Success Indicators

### **Authentication**
- ✅ Google OAuth button functional
- ✅ No Discord button visible
- ✅ Password reset emails received
- ✅ Sessions persist correctly
- ✅ 401 errors force logout (not "Invalid email")

### **User Experience**
- ✅ Ads visible in sidebar (after AdSense approval)
- ✅ Mobile UI responsive on all devices
- ✅ No horizontal scroll
- ✅ Touch targets minimum 44x44px
- ✅ Voice calls work with fallback keys

### **SEO & Performance**
- ✅ Social media previews show correctly
- ✅ robots.txt accessible
- ✅ sitemap.xml accessible
- ✅ PWA installable
- ✅ Error boundaries catch crashes

---

## 🎓 Next Steps

1. **Configure Google OAuth**
   - Create Google Cloud project
   - Add credentials to .env
   - Test login flow

2. **Set up Email Service**
   - Generate Gmail app password
   - Update .env with SMTP details
   - Test password reset

3. **Apply for AdSense**
   - Create AdSense account
   - Wait for approval
   - Add publisher ID when approved

4. **Test Mobile Experience**
   - Test on real devices
   - Check touch targets
   - Verify responsive layouts

5. **Monitor Performance**
   - Track ad revenue
   - Monitor API fallback usage
   - Check error logs

---

## 📧 Support Contacts

- **Google OAuth Issues**: https://console.cloud.google.com/support
- **AdSense Support**: https://support.google.com/adsense
- **SMTP Issues**: Check Gmail account security settings
- **Daily.co Issues**: Contact Daily.co support or use backup keys

---

## 🎉 Summary

All features are **DEPLOYED and LIVE** on https://n0tmot.com/

**What's Working:**
- ✅ Message sorting fixed
- ✅ Daily.co fallback active
- ✅ Mobile responsive CSS applied
- ✅ SEO tags live
- ✅ Error boundaries active
- ✅ Database migrations complete

**Configuration Needed:**
- ⏳ Google OAuth credentials (CLIENT_ID/SECRET)
- ⏳ Gmail SMTP credentials (for password reset)
- ⏳ AdSense approval and publisher ID

**Test your platform and configure the remaining services!**
