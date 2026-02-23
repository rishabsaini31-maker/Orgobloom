# Google OAuth "Origin Not Allowed" Error Fix

## The Problem

The error `[GSI_LOGGER]: The given origin is not allowed for the given client ID` occurs when the domain where your application is running is not listed in the **Authorized JavaScript origins** in your Google Cloud Console.

## Current Configuration

Based on your `.env.local` files:

- **Frontend URL**: `http://localhost:3000`
- **Admin URL**: `http://localhost:3002`
- **Google Client ID**: `220109410769-kesdvsur4bi1hcp2hj2f1vp7uhlkcn53.apps.googleusercontent.com`

## Step-by-Step Fix

### Step 1: Open Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the correct project (the one associated with your OAuth Client ID)

### Step 2: Navigate to Credentials

1. In the left sidebar, click on **APIs & Services**
2. Click on **Credentials**

### Step 3: Edit Your OAuth 2.0 Client ID

1. Find your OAuth 2.0 Client ID in the list
2. Click the **pencil icon** (Edit) to edit it

### Step 4: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section, add ALL of these URLs:

```
http://localhost:3000
http://localhost:3002
http://localhost:9090
http://127.0.0.1:3000
http://127.0.0.1:3002
http://127.0.0.1:9090
```

For production, also add:

```
https://your-frontend-domain.vercel.app
https://your-admin-domain.vercel.app
https://your-custom-domain.com
```

### Step 5: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, add:

```
http://localhost:3000
http://localhost:3002
http://localhost:9090
```

And your production URLs.

### Step 6: Save Changes

1. Click **Save** at the bottom of the page
2. **Wait 5-10 minutes** for changes to propagate

### Step 7: Clear Next.js Cache and Restart

**IMPORTANT**: Next.js caches environment variables. You must clear the cache:

```bash
# Stop your dev server (Ctrl+C)

# Clear Next.js cache
cd Admin
rm -rf .next

# Restart the dev server
npm run dev
```

This ensures the updated environment variables are loaded.

## Quick Verification

To verify your configuration is correct:

1. Open your Admin app at `http://localhost:3002`
2. Open browser DevTools (F12)
3. Go to the Console tab
4. The GSI_LOGGER error should no longer appear

## Alternative: Create a New OAuth Client (If Needed)

If you can't modify the existing OAuth client, create a new one:

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Select **Web application**
3. Add all the authorized origins listed above
4. Copy the new Client ID
5. Update your `.env.local` files:

```env
# Frontend/.env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID

# Admin/.env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID

# Backend/.env
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET
```

## Common Issues

### Issue: Changes Not Taking Effect

**Solution**:

- Wait 5-10 minutes after saving changes in Google Cloud Console
- Clear browser cache and cookies
- Try in an incognito/private window

### Issue: Still Getting Error After Adding Origins

**Solution**:

- Make sure you added the correct port (3002 for Admin, 3000 for Frontend)
- Check that you're using `http://` not `https://` for localhost
- Verify the Client ID in your `.env.local` matches the one in Google Cloud Console

### Issue: Production URLs Not Working

**Solution**:

- Add your production domain to authorized origins
- Make sure to include both `https://` prefix
- Add the exact domain (e.g., `https://orgobloom-admin.vercel.app`)

## Summary

The fix requires updating your Google Cloud Console OAuth settings to include all origins where your app runs. This is a **configuration change in Google Cloud Console**, not a code change.

**Key Points**:

- Add `http://localhost:3002` for Admin app
- Add `http://localhost:3000` for Frontend app
- Wait for changes to propagate (5-10 minutes)
- Restart your dev server after changes
