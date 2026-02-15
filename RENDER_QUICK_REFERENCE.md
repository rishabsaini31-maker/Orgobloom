# 🔥 Render Deployment - Quick Reference Card

## The 5-Minute Checklist

### ✅ Pre-Deployment (Do These First)

```bash
# 1. Push latest code to GitHub
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0"
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Get Neon database URL
# Go to: https://console.neon.tech
# Copy the PostgreSQL connection string
```

---

## The 10-Minute Deployment

### 1️⃣ Go to Render (2 min)

```
https://render.com
↓
Sign up with GitHub
↓
Click "New Web Service"
↓
Select your Orgobloom repo
↓
Authorize GitHub
```

### 2️⃣ Fill the Form (5 min)

| Field             | Value                          |
| ----------------- | ------------------------------ |
| **Name**          | `orgobloom-api`                |
| **Environment**   | Node                           |
| **Region**        | Singapore (ap-southeast-1)     |
| **Branch**        | main                           |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start`                    |

### 3️⃣ Add Environment Variables (3 min)

```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_XXXXX@ep-frosty-pine-a1ldus...

Name: JWT_SECRET
Value: super-secret-key-min-32-chars-random-string

Name: NODE_ENV
Value: production

Name: PORT
Value: 3000
```

### 4️⃣ Click "Create Web Service"

- Wait 2-3 minutes
- See "Live" status ✅

---

## URLs to Know

### After Deployment

```
🟢 LIVE Status = Deployed!
📍 Your API URL: https://orgobloom-api.onrender.com

Test it:
curl https://orgobloom-api.onrender.com/health
```

---

## Environment Variables Explained

| Variable       | What It Is                  | Where to Get               |
| -------------- | --------------------------- | -------------------------- |
| `DATABASE_URL` | Your database connection    | Neon console               |
| `JWT_SECRET`   | Secret key for login tokens | Any random 32+ char string |
| `NODE_ENV`     | App mode                    | Type: `production`         |
| `PORT`         | Server port                 | Type: `3000`               |

---

## Copy-Paste Values

### DATABASE_URL

```
postgresql://neondb_owner:npg_vPVq9b6NhzjY@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### JWT_SECRET

```
your-super-secret-jwt-key-min-32-characters-long-random-string
```

---

## Test Your Backend

### After "Live" Status

```bash
# 1. Health check (should return OK)
curl https://orgobloom-api.onrender.com/health

# 2. Login test (should return token)
curl -X POST https://orgobloom-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"orgobloom5033@gmail.com","password":"orgobloom5033@@$"}'

# 3. Full test (should return data)
TOKEN=$(curl -s -X POST https://orgobloom-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"orgobloom5033@gmail.com","password":"orgobloom5033@@$"}' | jq -r '.token')

curl -s "https://orgobloom-api.onrender.com/api/admin/analytics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## Quick Fixes

| Problem                  | Solution                                       |
| ------------------------ | ---------------------------------------------- |
| Build fails              | Check package.json `npm install` locally first |
| "Live" but can't connect | Check DATABASE_URL env var                     |
| Login doesn't work       | Check JWT_SECRET is set                        |
| 500 errors               | Check logs in Render dashboard                 |
| Still failing?           | Redeploy: click "Redeploy" button              |

---

## Status Meanings

- 🟡 **Building** = Compiling code (2-3 min)
- 🟢 **Live** = DEPLOYED! ✅ Ready to use
- 🔴 **Failed** = Error occurred, check logs
- ⚫ **Deploy aborted** = You cancelled it

---

## Important Reminders

- ✅ Code must be on GitHub
- ✅ package.json must have "start" script
- ✅ DATABASE_URL must be correct
- ✅ First deploy = slower (3-5 min)
- ✅ Auto-redeploys on GitHub push
- ❌ Don't push .env file
- ❌ Don't use localhost URLs in env vars

---

## Slack/Discord Share

When deployment is done, you'll have:

```
🎉 Backend Deployed!
🌐 API: https://orgobloom-api.onrender.com
📊 Status: Live
⚡ Ready for Admin & Frontend
```

---

## Next: Deploy Admin & Frontend

After backend is live, use this URL for:

1. Admin deployment to Vercel
2. Frontend deployment to Vercel

Value: `https://orgobloom-api.onrender.com`

Environment variable name: `NEXT_PUBLIC_API_URL`

Full value: `https://orgobloom-api.onrender.com/api`

---

## Video Guide Alternative

If you get stuck, watch:

- https://www.youtube.com/watch?v=... (search "Render Node.js deployment")

Or ask me for help! 🚀
