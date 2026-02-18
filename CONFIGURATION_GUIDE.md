# Orgobloom Configuration Guide

## 🔧 Fix Products Not Showing

### Issue

Products show as "added" but don't appear in Admin dashboard or Frontend.

### Solution

The `NEXT_PUBLIC_API_URL` environment variable is not set correctly in Vercel.

### Steps to Fix:

#### For Admin Dashboard:

1. Go to **Vercel Dashboard** → Select **Admin** project
2. Click **Settings** → **Environment Variables**
3. Add/Update:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://orgobloom.onrender.com/api`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
4. Click **Save**
5. Go to **Deployments** tab
6. Click **three dots (...)** on latest deployment → **Redeploy**
7. ⚠️ **IMPORTANT**: Uncheck "Use existing Build Cache"

#### For Frontend Store:

1. Go to **Vercel Dashboard** → Select **Frontend** project
2. Follow the same steps above
3. Add the same environment variable

### Test After Redeployment:

- Admin: https://orgobloom-admin.vercel.app/dashboard/products
- Frontend: https://orgobloom.vercel.app

---

## 🔐 Google OAuth Setup

### Prerequisites

- Google Cloud Console account
- Your deployed URLs ready

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `Orgobloom`
4. Click **Create**

### Step 2: Configure OAuth Consent Screen

1. In the sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public users)
3. Click **Create**
4. Fill in:
   - **App name**: Orgobloom
   - **User support email**: your email
   - **Developer contact**: your email
5. Click **Save and Continue**
6. **Scopes**: Skip (click Save and Continue)
7. **Test users**: Add your email for testing
8. Click **Save and Continue**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Fill in:
   - **Name**: Orgobloom Web Client
   - **Authorized JavaScript origins**:
     ```
     https://orgobloom.vercel.app
     https://orgobloom-admin.vercel.app
     http://localhost:3000
     http://localhost:3001
     ```
   - **Authorized redirect URIs**:
     ```
     https://orgobloom.onrender.com/api/auth/google/callback
     http://localhost:5000/api/auth/google/callback
     ```
5. Click **Create**
6. **SAVE** the Client ID and Client Secret

### Step 4: Add Environment Variables

#### Backend (Render):

1. Go to Render Dashboard → your Backend service
2. Click **Environment** tab
3. Add:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL=https://orgobloom.onrender.com/api/auth/google/callback
   ```
4. Click **Save Changes** (triggers redeploy)

#### Frontend & Admin (Vercel):

Add to both projects:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
```

### Step 5: Test Google Login

1. Go to Frontend: https://orgobloom.vercel.app
2. Click **Sign in with Google**
3. Authorize the app
4. Should redirect back with login success

---

## 📧 Email SMTP Setup

### Option 1: Gmail (Free, Recommended for Development)

#### Enable 2-Step Verification:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**

#### Create App Password:

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Other (Custom name)**
3. Name it: `Orgobloom Backend`
4. Click **Generate**
5. **SAVE** the 16-character password

#### Add to Backend Environment (Render):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=Orgobloom <your-email@gmail.com>
```

### Option 2: SendGrid (Free 100 emails/day)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: `Orgobloom API Key`
5. Permissions: **Full Access**
6. Click **Create & View**
7. **SAVE** the API key

#### Add to Backend Environment (Render):

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=Orgobloom <noreply@yourdomain.com>
```

### Option 3: Resend (Recommended for Production)

1. Sign up at [Resend](https://resend.com/)
2. Go to **API Keys**
3. Click **Create API Key**
4. **SAVE** the key

#### Add to Backend Environment (Render):

```
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Orgobloom <onboarding@resend.dev>
```

### Step: Verify Email Configuration

Test the SMTP setup by triggering a password reset:

1. Go to Frontend login page
2. Click "Forgot Password"
3. Enter your email
4. Check if email arrives

---

## 🔒 Admin Credentials

**Current Admin Login:**

- **Email**: `orgobloom5033@gmail.com`
- **Password**: `orgobloom5033@@$`

### To Change Admin Credentials:

#### Option 1: Update via Environment Variables (Render)

```
ADMIN_EMAIL=your-new-admin@email.com
ADMIN_PASSWORD=YourNewSecurePassword123!
```

Then run: `npm run update-admin`

#### Option 2: Run Update Script Locally

```bash
cd Backend
npm run update-admin
```

---

## 🚀 Quick Deployment Checklist

### Backend (Render)

- [x] Root Directory: `Backend`
- [x] Build Command: `npm install && npm run build`
- [x] Start Command: `npm start`
- [ ] Environment Variables:
  - `DATABASE_URL` ✅
  - `JWT_SECRET` ✅
  - `FRONTEND_URL` ✅
  - `ADMIN_URL` ✅
  - `GOOGLE_CLIENT_ID` ⏳
  - `GOOGLE_CLIENT_SECRET` ⏳
  - `SMTP_HOST` ⏳
  - `SMTP_USER` ⏳
  - `SMTP_PASSWORD` ⏳

### Frontend (Vercel)

- [x] Framework: Next.js
- [x] Root Directory: `Frontend`
- [ ] Environment Variables:
  - `NEXT_PUBLIC_API_URL` = `https://orgobloom.onrender.com/api` ⚠️
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ⏳

### Admin (Vercel)

- [x] Framework: Next.js
- [x] Root Directory: `Admin`
- [ ] Environment Variables:
  - `NEXT_PUBLIC_API_URL` = `https://orgobloom.onrender.com/api` ⚠️
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ⏳

---

## 📝 Notes

### Products API Endpoints:

- Public: `GET /api/products` ✅ Working
- Admin: `GET /api/admin/products` ✅ Working
- Create: `POST /api/admin/products` ✅ Working

### Current Database Status:

- ✅ 1 Product exists: "Cow Manure"
- ✅ Admin user exists
- ✅ Database connected (Neon PostgreSQL)

### Common Issues:

**Products not showing?**
→ Check `NEXT_PUBLIC_API_URL` in Vercel is set to `https://orgobloom.onrender.com/api`

**Login failed?**
→ Use correct admin credentials: `orgobloom5033@gmail.com` / `orgobloom5033@@$`

**CORS errors?**
→ Check `FRONTEND_URL` and `ADMIN_URL` are set correctly in Render

**405 Method Not Allowed?**
→ Environment variable missing, requests going to wrong URL

---

## 🆘 Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check Render logs for backend errors
3. Verify all environment variables are set
4. Try clearing cache and hard refresh (Ctrl+Shift+R)
