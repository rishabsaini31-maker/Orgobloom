# Quick Debug - Why Everything is Blank

## 🔴 IMMEDIATE CHECKS (Do These First)

### 1. Is Backend Running?
```bash
curl http://localhost:5001/health
```
Should return: `{"status":"OK","timestamp":"..."}`

If fails → Backend not running, start it:
```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Backend"
npm run dev
```

---

### 2. Is Admin App Running?
```bash
curl http://localhost:3001 | head -5
```
Should return HTML starting with `<!DOCTYPE html>`

If fails → Admin not running, start it:
```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Admin"
npm run dev
```

---

### 3. Check Browser Console (F12)
Open http://localhost:3001 and press **F12**

Look for ANY red error messages below (not just yellow warnings)

**Common Errors:**
- ❌ `Cannot read property 'token' of undefined` → Zustand issue
- ❌ `401 Unauthorized` → Token not sent
- ❌ `CORS error` → Backend not allowing frontend
- ❌ `Cannot GET /` → App not started

---

### 4. Check Network Calls (F12 → Network Tab)
1. Reload page (Cmd+R / Ctrl+R)
2. Look for API calls to `localhost:5001`
3. Check their status:
   - ✅ `200` = Good
   - ❌ `401` = Not authenticated (login again)
   - ❌ `500` = Backend error (restart backend)
   - ❌ `0` or no response = Backend not running

---

### 5. Try Force Clearing Everything
```bash
# Option A: Browser
# 1. DevTools → Application
# 2. Local Storage → Clear All
# 3. Cookies → Clear All
# 4. Close tab completely
# 5. Open new tab to http://localhost:3001

# Option B: Terminal (if browser doesn't work)
# Nothing to clear in terminal, just restart apps
```

---

## 🟢 IF Backend + Admin Running But Still Blank

### Check Step A: Database Connection
```bash
# See if backend connected to database
tail -f /tmp/server.log | head -20
```

Look for:
- ✅ `Database connected` → Good
- ❌ `Connection error` → Database issue

---

### Check Step B: Manual API Test
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"orgobloom5033@gmail.com","password":"orgobloom5033@@$"}' | jq -r '.token')

echo "Token: $TOKEN"

# If token is empty/null → Login failed
# If token shows long string → Login worked

# Test data fetch
curl -s "http://localhost:5001/api/admin/analytics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Should show data like: {"data":{"totalOrders":1,...}}
```

---

## 🚀 Quick Fix - Nuclear Option

If nothing works, do this in order:

```bash
# 1. Kill everything
pkill -f "npm run dev"
pkill -f "tsx src"
sleep 2

# 2. Clear Next.js cache
rm -rf "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Admin/.next"
rm -rf "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Frontend/.next"

# 3. Restart backend
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Backend"
npm run dev > /tmp/server.log 2>&1 &
sleep 3

# 4. Restart admin
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0/Admin"
npm run dev > /tmp/admin.log 2>&1 &
sleep 5

# 5. Open browser
open http://localhost:3001

# 6. Wait 10 seconds then login
# Email: orgobloom5033@gmail.com
# Password: orgobloom5033@@$
```

---

## After Nuclear Fix

1. Open http://localhost:3001
2. Should see Loading...
3. Should redirect to /login automatically
4. Enter credentials above
5. Click Login
6. Should see dashboard with data

---

## ⚡ Deployment Questions?

Once you confirm what's happening above, we can move to deployment guides for:
- ✅ Backend → Render
- ✅ Admin → Vercel
- ✅ Frontend → Vercel

Tell me:
1. What error do you see in console?
2. Does backend show as running?
3. Is API returning data in curl tests?
