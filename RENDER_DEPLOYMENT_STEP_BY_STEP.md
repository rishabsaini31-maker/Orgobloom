# 🚀 Backend Deployment to Render - Complete Step-by-Step Guide

## Prerequisites Check
Before starting, make sure you have:
- ✅ GitHub account (https://github.com)
- ✅ Neon database connection string
- ✅ Code pushed to GitHub
- ✅ Backend folder in repo

---

## STEP 1: Verify Your Backend Code is Ready

### 1.1 Check package.json has correct scripts

```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Backend"
cat package.json
```

You should see:
```json
{
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 1.2 Verify tsconfig.json exists
```bash
ls -la tsconfig.json
# Should show: -rw-r--r-- ... tsconfig.json
```

### 1.3 Check .gitignore
```bash
cat .gitignore | grep -E "node_modules|dist|\.env"
```

Should have:
```
node_modules/
dist/
.env
.env.local
```

---

## STEP 2: Push Latest Code to GitHub

### 2.1 Stage all changes
```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0"
git add .
git commit -m "Prepare backend for Render deployment"
```

### 2.2 Push to GitHub
```bash
git push origin main
```

**Verify it pushed:**
```bash
git log -1 --oneline
# Should show your recent commit
```

---

## STEP 3: Get Your Database Connection String

### 3.1 Go to Neon Console
1. Open: https://console.neon.tech
2. Login with your credentials
3. Click on your project → "orgobloom" (or your project name)
4. Click "Connection String" tab
5. Copy the PostgreSQL URL

**Should look like:**
```
postgresql://neondb_owner:npg_XXXXX@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Save this URL** - you'll need it in Step 5

---

## STEP 4: Create Render Account & Service

### 4.1 Sign Up to Render
1. Go to: https://render.com
2. Click "Get Started"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your GitHub
5. Complete signup

### 4.2 Create New Web Service
1. Dashboard → Click "New +"
2. Select "Web Service"
3. See this screen:
```
┌─────────────────────────────────────┐
│ Connect a repository                │
│                                     │
│ [Search for repository...]          │
│ • rishabsaini31-maker/Orgobloom    │ ← Click this
│ • other-repo                        │
└─────────────────────────────────────┘
```

### 4.3 Select Your Repository
1. Find and click: **rishabsaini31-maker/Orgobloom**
2. You'll see:
```
┌─────────────────────────────────────┐
│ GitHub Authorization                │
│                                     │
│ Render needs to access your repo    │
│ [Authorize]  [Cancel]               │
└─────────────────────────────────────┘
```
3. Click **Authorize**

---

## STEP 5: Configure Render Service

### 5.1 Fill in Basic Details

After authorization, you'll see a form:

```
Name:                    orgobloom-api
Environment:             Node
Region:                  Singapore (ap-southeast-1)
Branch:                  main
Root Directory:          Backend (leave blank if not shown)
Build Command:           npm install && npm run build
Start Command:           npm start
```

### Step-by-step filling:

**Name:** 
- Clear existing name
- Type: `orgobloom-api`

**Environment:**
- Already selected: Node ✅

**Region:**
- Click dropdown
- Select: **Singapore** (closest to India)
- Or any region with low latency

**Branch:**
- Already set to: main ✅

**Build Command:**
- Clear existing
- Paste: `npm install && npm run build`

**Start Command:**
- Clear existing
- Paste: `npm start`

---

## STEP 6: Add Environment Variables

### 6.1 Scroll down to "Environment" section

You'll see:
```
┌─────────────────────────────────────┐
│ Environment Variables               │
│                                     │
│ [Add Environment Variable]          │
│                                     │
│ Name: [_____________]   Value: [__] │
└─────────────────────────────────────┘
```

### 6.2 Add DATABASE_URL

**Click "Add Environment Variable":**

1. **Name field:** `DATABASE_URL`
2. **Value field:** Paste the Neon URL from Step 3.1
3. Click "Add"

### 6.3 Add JWT_SECRET

**Click "Add Environment Variable" again:**

1. **Name field:** `JWT_SECRET`
2. **Value field:** Paste a long random string
   ```
   your-super-secret-jwt-key-min-32-characters-long-random-string
   ```
3. Click "Add"

### 6.4 Add NODE_ENV

**Click "Add Environment Variable" again:**

1. **Name field:** `NODE_ENV`
2. **Value field:** `production`
3. Click "Add"

### 6.5 Add Port (optional)

Render auto-assigns PORT, but you can add:

1. **Name field:** `PORT`
2. **Value field:** `3000`
3. Click "Add"

**Final result should look like:**
```
✅ DATABASE_URL    postgresql://...
✅ JWT_SECRET      your-secret-key
✅ NODE_ENV        production
✅ PORT            3000
```

---

## STEP 7: Deploy!

### 7.1 Click "Create Web Service" button

- Large blue button at bottom right
- This triggers the deployment
- Takes 2-3 minutes

### 7.2 Watch the Build Log

You'll see a scrolling log:
```
=== Building your service...
npm install
npm run build
...
=== Build complete!
=== Deploying...
...
=== Deployment complete!
```

### 7.3 Wait for "Live" Status

Once it says **LIVE**, your backend is deployed! 🎉

---

## STEP 8: Get Your API URL

### 8.1 Find Your URL in Dashboard

Once service is "LIVE", you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
orgobloom-api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: Live ✅
Region: Singapore
URL: https://orgobloom-api.onrender.com  ← COPY THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 8.2 Save Your API URL

**Copy the URL:**
```
https://orgobloom-api.onrender.com
```

**You'll need this for:**
- Admin frontend deployment
- Customer frontend deployment
- Testing

---

## STEP 9: Test Your Backend is Working

### 9.1 Test Health Check

```bash
curl https://orgobloom-api.onrender.com/health
```

**Should return:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-15T..."
}
```

### 9.2 Test Login Endpoint

```bash
curl -X POST https://orgobloom-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"orgobloom5033@gmail.com","password":"orgobloom5033@@$"}'
```

**Should return:**
```json
{
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGci..."
}
```

### 9.3 Test Analytics Endpoint

```bash
# Get token first
TOKEN=$(curl -s -X POST https://orgobloom-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"orgobloom5033@gmail.com","password":"orgobloom5033@@$"}' | jq -r '.token')

echo "Token: $TOKEN"

# Test analytics
curl -s "https://orgobloom-api.onrender.com/api/admin/analytics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Should return:**
```json
{
  "data": {
    "totalOrders": 1,
    "totalRevenue": 0,
    "ordersByStatus": {...}
  }
}
```

---

## STEP 10: View Logs (if something goes wrong)

### 10.1 In Render Dashboard

1. Click your service → **orgobloom-api**
2. Scroll down to "Logs"
3. Click "Logs" tab
4. You'll see real-time logs

### 10.2 Check for errors

```
✅ Good logs:
- "Server running on port 3000"
- "Database connected"
- "Port 3000 ready"

❌ Bad logs:
- "Connection refused"
- "Cannot find module"
- "Database error"
```

---

## 🎯 Summary - You Just Deployed!

```
✅ Backend deployed to Render
✅ Database connected to Neon
✅ API accessible at: https://orgobloom-api.onrender.com
✅ Can login and fetch data
✅ Ready for Admin/Frontend to use
```

---

## 🚀 Next Steps

### Deploy Admin to Vercel
Your API URL: `https://orgobloom-api.onrender.com`

Use this when deploying Admin dashboard.

### Deploy Frontend to Vercel
Your API URL: `https://orgobloom-api.onrender.com`

Use this when deploying customer site.

---

## 🆘 Troubleshooting

### If Build Fails

**Error: "npm install failed"**
```bash
# Solution: Check package.json is valid
cd Backend
npm install  # Run locally first
git add package-lock.json
git commit -m "Update package-lock"
git push
# Then redeploy in Render
```

### If Status is "Failed"

**Check logs in Render dashboard:**
1. Click your service
2. Go to Logs tab
3. Look for red error messages
4. Most common: DATABASE_URL incorrect

**Solution:**
1. Go to Environment tab
2. Edit DATABASE_URL
3. Paste correct Neon URL
4. Save and redeploy

### If API Returns 401 Errors

**Check JWT_SECRET:**
1. Go to Environment Variables
2. Verify JWT_SECRET is set
3. Make sure it's not empty
4. Try a different random string
5. Redeploy

### If Backend Not Responding

**Check if service is running:**
```bash
curl https://orgobloom-api.onrender.com/health
```

**If timeout or no response:**
1. Go to Render dashboard
2. Click your service
3. Check status (should be "Live")
4. If not, click redeploy button
5. Wait 2-3 minutes

---

## ✨ Important Notes

- 🚀 **First deployment takes 3-5 minutes** (subsequent deploys faster)
- 📝 **Logs show everything** - always check if something goes wrong
- ♻️ **Auto-redeploy on push** - push to GitHub, Render rebuilds automatically
- 💾 **Database is separate** - Neon runs independently
- 🔐 **Environment variables are secure** - Render hides them from view
- ⚡ **Cold start** - First request after 15min idle may be slow (normal)

---

## 📞 Still Having Issues?

Tell me:
1. What error do you see? (full error message)
2. What step did you get stuck on?
3. Do you see "Live" status in Render?
4. Can you access the API URL?

I'll help you fix it! 💪
