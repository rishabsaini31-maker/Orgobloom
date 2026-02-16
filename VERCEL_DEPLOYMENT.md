# Vercel Deployment Guide for Orgobloom

## ✅ Backend Status

- **Status**: 🟢 Live on Render
- **URL**: https://orgobloom.onrender.com
- **Health Check**: https://orgobloom.onrender.com/health

---

## 🚀 Deploy Admin Dashboard to Vercel

### Step 1: Go to Vercel Dashboard

1. Visit [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**

### Step 2: Import Repository

1. Select your GitHub repository: `rishabsaini31-maker/Orgobloom`
2. Click **"Import"**

### Step 3: Configure Admin Dashboard

- **Project Name**: `orgobloom-admin` (or your preferred name)
- **Framework Preset**: Next.js
- **Root Directory**: `Admin` ⚠️ IMPORTANT: Click "Edit" and select "Admin" folder
- **Build Command**: `npm run build` (should auto-detect)
- **Output Directory**: `.next` (should auto-detect)
- **Install Command**: `npm install` (should auto-detect)

### Step 4: Add Environment Variables

Add the following environment variable:

```
NEXT_PUBLIC_API_URL=https://orgobloom.onrender.com
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your admin dashboard will be live at: `https://orgobloom-admin.vercel.app` (or your custom domain)

---

## 🛍️ Deploy Frontend Store to Vercel

### Step 1: Add Another Project

1. Back in Vercel Dashboard, click **"Add New"** → **"Project"**
2. Select the same repository: `rishabsaini31-maker/Orgobloom`

### Step 2: Configure Frontend Store

- **Project Name**: `orgobloom-store` (or your preferred name)
- **Framework Preset**: Next.js
- **Root Directory**: `Frontend` ⚠️ IMPORTANT: Click "Edit" and select "Frontend" folder
- **Build Command**: `npm run build` (should auto-detect)
- **Output Directory**: `.next` (should auto-detect)
- **Install Command**: `npm install` (should auto-detect)

### Step 3: Add Environment Variables

Add the following environment variable:

```
NEXT_PUBLIC_API_URL=https://orgobloom.onrender.com
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your store will be live at: `https://orgobloom-store.vercel.app` (or your custom domain)

---

## 🔧 Post-Deployment: Update Backend CORS

After deployment, you need to update your backend's CORS configuration to allow requests from your Vercel domains.

### Update Backend Environment Variables on Render:

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Click on your `orgobloom-api` service
3. Go to **"Environment"** tab
4. Add/Update these variables:
   ```
   FRONTEND_URL=https://orgobloom-store.vercel.app
   ADMIN_URL=https://orgobloom-admin.vercel.app
   ```
5. Save changes (this will trigger a redeploy)

---

## ✅ Verification Steps

### Test Admin Dashboard:

1. Visit your deployed admin URL
2. Try to login with your credentials
3. Check if data loads from the API

### Test Frontend Store:

1. Visit your deployed store URL
2. Browse products
3. Test cart functionality
4. Try user registration/login

---

## 🐛 Troubleshooting

### If you see CORS errors:

- Make sure you updated the `FRONTEND_URL` and `ADMIN_URL` on Render
- Wait for Render to redeploy (takes ~2 minutes)

### If build fails on Vercel:

- Check the build logs for specific errors
- Make sure the Root Directory is set correctly (`Admin` or `Frontend`)
- Verify `package.json` has all dependencies

### If API requests fail:

- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel environment variables
- Check browser console for network errors
- Test the backend directly: `curl https://orgobloom.onrender.com/health`

---

## 📝 Summary

After completing these steps, you'll have:

- ✅ Backend API: `https://orgobloom.onrender.com`
- ✅ Admin Dashboard: `https://orgobloom-admin.vercel.app`
- ✅ Frontend Store: `https://orgobloom-store.vercel.app`

All three applications will be fully deployed and communicating with each other!
