# 🚀 Complete Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Users                               │
└────────┬───────────────────────────────────┬────────────────┘
         │                                   │
         ▼                                   ▼
    ┌─────────────┐                  ┌──────────────┐
    │   Frontend  │                  │   Admin      │
    │  (Vercel)   │                  │ (Vercel)     │
    │  Port: 80   │                  │ Port: 80     │
    └────────┬────┘                  └──────┬───────┘
             │                               │
             └───────────┬───────────────────┘
                         │ HTTPS
                         ▼
            ┌────────────────────────┐
            │  Backend API (Render)  │
            │  https://api.xxx.com   │
            └────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Neon PostgreSQL       │
            │  (Database)            │
            └────────────────────────┘
```

---

# 📦 PART 1: DEPLOY BACKEND TO RENDER

## Step 1: Prepare Backend for Deployment

### 1.1 Update Backend Configuration

```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Backend"

# Check package.json has start script
cat package.json | grep -A5 '"scripts"'
```

**Should have:**

```json
{
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 1.2 Create .gitignore (if missing)

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.next/
*.log
EOF
```

### 1.3 Create Build Script

```bash
cat > package.json.updated << 'EOF'
Update your package.json scripts to:

{
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc && cp -r src/db/schema dist/db/ 2>/dev/null || true",
    "start": "node dist/server.js",
    "migrate": "npm run build && node dist/migrate.js"
  }
}
EOF
```

---

## Step 2: Create Render Account

1. **Go to:** https://render.com
2. **Sign up** with GitHub or email
3. **Create new Web Service**
4. **Connect your GitHub repository** (push Backend folder)

---

## Step 3: Configure Render Service

### 3.1 Basic Settings

```
Service Name:        orgobloom-api
Environment:         Node
Region:              Singapore (or closest to you)
Branch:              main
Build Command:       npm install && npm run build
Start Command:       npm start
```

### 3.2 Environment Variables

**Add these in Render Dashboard:**

```
DATABASE_URL:        (copy from Neon - see below)
JWT_SECRET:          your_jwt_secret_key_here
NODE_ENV:            production
PORT:                (leave blank, Render assigns automatically)
CORS_ORIGIN:         https://yourfrontend.vercel.app,https://youradmin.vercel.app
```

### 3.3 Get Neon Database URL

1. Go to: https://console.neon.tech
2. Your project → Connection string
3. Copy the PostgreSQL URL
4. Add to Render as `DATABASE_URL`

---

## Step 4: Deploy Backend

1. **Push code to GitHub**

   ```bash
   cd Backend
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **In Render Dashboard:**
   - Click "Create Web Service"
   - Select your Backend repository
   - Fill in settings above
   - Click "Deploy"

3. **Wait 2-3 minutes** for build to complete

4. **Get your API URL** → Shows in Render dashboard
   - Format: `https://orgobloom-api.onrender.com`

---

# 📱 PART 2: DEPLOY ADMIN TO VERCEL

## Step 1: Prepare Admin for Deployment

### 1.1 Update Environment Config

```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Admin"

# Create .env.production
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://orgobloom-api.onrender.com/api
EOF
```

### 1.2 Update for Production

Edit `src/lib/api.ts`:

```typescript
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://orgobloom-api.onrender.com/api";
```

### 1.3 Verify vercel.json exists

```bash
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
```

---

## Step 2: Create Vercel Account

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub
3. **Connect GitHub** to Vercel

---

## Step 3: Deploy Admin to Vercel

### 3.1 Push to GitHub

```bash
cd Admin
git add .
git commit -m "Deploy Admin to Vercel"
git push origin main
```

### 3.2 In Vercel Dashboard

1. Click "Add New Project"
2. Select "Admin" repository
3. **Framework Preset:** Next.js
4. **Root Directory:** `./Admin` (or where your admin code is)
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL = https://orgobloom-api.onrender.com/api
   ```
6. Click "Deploy"

### 3.3 Vercel auto-deploys on every push!

---

# 🛍️ PART 3: DEPLOY FRONTEND TO VERCEL

## Step 1: Prepare Frontend

### 1.1 Update Environment

```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Frontend"

cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://orgobloom-api.onrender.com/api
EOF
```

### 1.2 Create vercel.json

```bash
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
```

---

## Step 2: Deploy Frontend

### 2.1 Push to GitHub

```bash
cd Frontend
git add .
git commit -m "Deploy Frontend to Vercel"
git push origin main
```

### 2.2 In Vercel Dashboard

1. Click "Add New Project"
2. Select "Frontend" repository
3. **Framework Preset:** Next.js
4. **Root Directory:** `./Frontend`
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL = https://orgobloom-api.onrender.com/api
   ```
6. Click "Deploy"

---

# ⚙️ PART 4: ENVIRONMENT VARIABLES SUMMARY

## Render (Backend)

```
DATABASE_URL       postgresql://user:pass@host/db
JWT_SECRET         your_secret_key (min 32 chars)
NODE_ENV           production
CORS_ORIGIN        https://admin.vercel.app,https://frontend.vercel.app
```

## Vercel (Admin)

```
NEXT_PUBLIC_API_URL    https://orgobloom-api.onrender.com/api
```

## Vercel (Frontend)

```
NEXT_PUBLIC_API_URL    https://orgobloom-api.onrender.com/api
```

---

# 🔗 PART 5: DATABASE SETUP (Neon)

## Already Connected?

✅ Your database is already on Neon at:

```
postgresql://neondb_owner:npg_vPVq9b6NhzjY@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Use This URL For:

1. **Render Backend** → Paste as `DATABASE_URL`
2. Uses same database as your local backend
3. All existing data preserved

---

# 📋 DEPLOYMENT CHECKLIST

## Before Deploying

- [ ] Backend code pushed to GitHub
- [ ] Admin code pushed to GitHub
- [ ] Frontend code pushed to GitHub
- [ ] All `.env.production` files created
- [ ] Database URL verified in Neon
- [ ] JWT_SECRET generated (32+ chars)

## After Backend Deploy (Render)

- [ ] Backend service shows "Live"
- [ ] Test API: `curl https://orgobloom-api.onrender.com/health`
- [ ] Should return: `{"status":"OK"}`
- [ ] Copy API URL for frontend/admin

## After Admin Deploy (Vercel)

- [ ] Admin app shows "Ready"
- [ ] Go to admin URL
- [ ] Can login with `orgobloom5033@gmail.com`
- [ ] Dashboard loads and shows data
- [ ] Network tab shows 200 status on API calls

## After Frontend Deploy (Vercel)

- [ ] Frontend app shows "Ready"
- [ ] Go to frontend URL
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Checkout works

---

# 🆘 TROUBLESHOOTING DEPLOYMENT

## Backend Not Starting (Render)

**Error: "Build failed"**

```bash
# Fix:
1. Check package.json has "start" script
2. Check all dependencies installed: npm install
3. Run locally first: npm run build && npm start
4. Then push to GitHub and retry
```

**Error: "Database connection failed"**

```bash
# Fix:
1. Verify DATABASE_URL in Render env vars
2. Check database is running: curl to Neon
3. Check firewall allows connections (Neon does)
4. Verify correct PostgreSQL URL format
```

## Admin/Frontend Not Loading (Vercel)

**Error: "API requests failing"**

```bash
# Fix:
1. Check NEXT_PUBLIC_API_URL is correct
2. Verify backend is running
3. Check CORS_ORIGIN includes Vercel domain
4. Restart Vercel deployment
```

**Error: "Login not working"**

```bash
# Fix:
1. Verify backend API is accessible
2. Check localStorage in browser (DevTools → Application)
3. Check Network tab for 401/500 errors
4. Verify JWT_SECRET same in backend and code
```

---

# 📞 QUICK REFERENCE

| Service         | Platform   | Cost         | Time         |
| --------------- | ---------- | ------------ | ------------ |
| Backend API     | Render.com | Free tier ok | 5 min        |
| Admin Dashboard | Vercel.com | Free         | 3 min        |
| Frontend        | Vercel.com | Free         | 3 min        |
| Database        | Neon.tech  | Free tier ok | Already done |

---

# 🎉 AFTER DEPLOYMENT

Your URLs will be:

```
Backend API:    https://orgobloom-api.onrender.com
Admin Panel:    https://orgobloom-admin.vercel.app
Frontend Site:  https://orgobloom-store.vercel.app
```

Everyone can access your live app from these URLs!

---

Still having issues? Tell me which step is failing and I'll help fix it! 🚀
