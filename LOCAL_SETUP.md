# 🚀 Local Development Setup - Running

## ✅ All Services Running Locally

### Backend API

- **URL**: http://localhost:8000
- **API**: http://localhost:8000/api
- **Status**: ✅ Running
- **Command**: `cd Backend && npm run dev`
- **Port**: 8000
- **Database**: Connected to Neon PostgreSQL (Production DB)

### Frontend Store

- **URL**: http://localhost:3000
- **Status**: ✅ Running
- **Command**: `cd Frontend && npm run dev`
- **Port**: 3000
- **API Connection**: http://localhost:8000/api

### Admin Dashboard

- **URL**: http://localhost:3002
- **Status**: ✅ Running
- **Command**: `cd Admin && npm run dev`
- **Port**: 3002
- **API Connection**: http://localhost:8000/api

---

## 📋 Local Environment Configuration

### Backend (.env)

```
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://... (Neon - Production DB)
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3002
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Add these for Google OAuth:
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### Admin (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

---

## 🧪 Testing Checklist

### 1. Test Products (No Auth Required)

```
Frontend: http://localhost:3000
- Should show 1 product: "Cow Manure"
```

### 2. Test Admin Login

```
Admin: http://localhost:3002/login
Credentials:
- Email: orgobloom5033@gmail.com
- Password: orgobloom5033@@$
- Should redirect to /dashboard if successful
```

### 3. Test Admin Dashboard

```
http://localhost:3002/dashboard
- View Products
- View Orders
- View Customers
- View Analytics
```

### 4. Test Google OAuth (Local)

```
⚠️ NOT YET CONFIGURED LOCALLY

To enable Google OAuth locally:

1. Get your Google OAuth credentials from:
   https://console.cloud.google.com/

2. Create OAuth 2.0 Web Application with:
   - Authorized JavaScript origins:
     * http://localhost:3000
     * http://localhost:3002
     * http://localhost:8000

   - Authorized redirect URIs:
     * http://localhost:8000/api/auth/google/callback

3. Add to .env files:
   Backend:
     GOOGLE_CLIENT_ID=your-client-id
     GOOGLE_CLIENT_SECRET=your-client-secret

   Frontend/Admin:
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id

4. Restart all servers
```

---

## 🔄 To Test Changes Locally

### After Backend Changes:

1. Edit files in `Backend/src/`
2. Changes hot-reload automatically
3. Test at http://localhost:8000/api/

### After Frontend Changes:

1. Edit files in `Frontend/src/`
2. Changes hot-reload automatically
3. Test at http://localhost:3000

### After Admin Changes:

1. Edit files in `Admin/src/`
2. Changes hot-reload automatically
3. Test at http://localhost:3002

---

## 🎯 Current Issues to Fix Locally

### Issue 1: Admin Products Not Showing

- **Status**: ⚠️ Likely fixed with API URL changes
- **Test**: Go to http://localhost:3002/dashboard/products
- **Expected**: Should show "Cow Manure" product

### Issue 2: Google OAuth Not Working

- **Status**: ⏳ Not configured yet
- **Action**: Configure Google credentials (see section above)

### Issue 3: Email/SMTP Not Working

- **Status**: ⏳ Need to configure
- **Action**: Add SMTP\_\* variables to Backend/.env

---

## 📝 DO NOT COMMIT YET

The following files are local-only and should NOT be committed:

- `Backend/.env` ✅ Keep in .gitignore
- `Frontend/.env.local` ✅ Keep in .gitignore
- `Admin/.env.local` ✅ Keep in .gitignore

Changes to package.json (port changes) can be committed later if desired.

---

## ✨ After Local Testing

Once everything works locally:

1. Test all features thoroughly
2. Document any bugs found
3. Fix bugs locally
4. Create a commit message with ALL changes
5. Push to GitHub (only then will Vercel redeploy)

---

## 🆘 Quick Commands

```bash
# View Backend logs
tail -f Backend/npm-debug.log

# Test API endpoint
curl http://localhost:8000/api/products

# Kill all Node processes
pkill -f "node"

# Restart all servers
# In Backend: npm run dev
# In Frontend: npm run dev
# In Admin: npm run dev
```

---

## 📞 Local URLs Quick Reference

| Service         | URL                              | Status |
| --------------- | -------------------------------- | ------ |
| Backend API     | http://localhost:8000/api        | ✅     |
| Frontend Store  | http://localhost:3000            | ✅     |
| Admin Dashboard | http://localhost:3002            | ✅     |
| Health Check    | http://localhost:8000/api/health | ✅     |
