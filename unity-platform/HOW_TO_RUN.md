# 🚀 HOW TO RUN UNITY PLATFORM

## Step 1: Install Prerequisites (15 minutes)

### A. Node.js
1. Go to: **https://nodejs.org/**
2. Download LTS version (v18+)
3. Run installer → Check "Add to PATH"
4. Restart computer

### B. PostgreSQL  
1. Go to: **https://www.postgresql.org/download/windows/**
2. Download version 14+
3. During install: Set password (remember it!)
4. Keep port 5432

### C. Redis
1. Go to: **https://github.com/microsoftarchive/redis/releases**
2. Download **Redis-x64-3.2.100.msi**
3. Install and it auto-starts

---

## Step 2: Setup Database (2 minutes)

Open PowerShell and run:

```powershell
# Create database
createdb -U postgres unity_platform
# Enter your PostgreSQL password when prompted
```

---

## Step 3: Install & Configure (5 minutes)

```powershell
# Navigate to project
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform

# Install backend
cd backend
npm install

# Install frontend  
cd ..\frontend
npm install

# Go back to root
cd ..
```

Configure backend `.env`:
```powershell
cd backend
copy .env.example .env
notepad .env
```

Edit these lines:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/unity_platform
JWT_SECRET=your-random-secret-key-here-make-it-long
```

---

## Step 4: Run Database Migrations

```powershell
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform\backend
npm run migrate
```

---

## Step 5: Start Everything! (3 terminals)

### Terminal 1 - Redis:
```powershell
redis-server
```

### Terminal 2 - Backend:
```powershell
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform\backend
npm run dev
```

### Terminal 3 - Frontend:
```powershell
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform\frontend
npm run dev
```

---

## ✅ Access Your Platform

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

---

## 🎮 Test Login

Register a new account or use seed data:
- Email: admin@unity.com
- Password: password123

---

## ❗ Troubleshooting

**"npm not found"?**
→ Restart computer after Node.js install

**Database connection error?**
→ Check PostgreSQL is running
→ Verify password in .env file

**Redis error?**
→ Run: `redis-server`

**Port in use?**
→ Close other apps using ports 3000 or 5173

---

## 🎨 UI/UX Improvements Applied

✅ Vibrant gradients and colors
✅ Smooth animations
✅ Glass morphism effects  
✅ Glow effects on important elements
✅ Better spacing and typography
✅ Modern, attractive design
✅ Hover effects everywhere
✅ Status indicators with pulse
✅ Gradient text effects
✅ Professional shadows

The platform will be fully functional with real-time chat, voice channels, events, and all features working!
