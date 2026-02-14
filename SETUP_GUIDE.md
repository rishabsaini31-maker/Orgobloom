# Orgobloom 2.0 - Complete Setup Guide

## 📝 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Admin Setup](#admin-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Prerequisites

### Required Software

- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Required Accounts

- **Supabase**: https://supabase.com (Free tier)
- **Razorpay**: https://razorpay.com (Test mode)
- **Gmail**: For SMTP email notifications

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Project Name**: Orgobloom
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait for project to initialize (~2 minutes)

### 2. Get Connection Details

1. Go to **Settings** → **Database**
2. Find **Connection String** section
3. Copy the **URI** format connection string
4. It looks like:
   ```
   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

### 3. Get API Keys

1. Go to **Settings** → **API**
2. Copy these keys:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

---

## Backend Setup

### 1. Navigate to Backend

```bash
cd Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# JWT (Generate a random 32+ character string)
JWT_SECRET=your-super-secret-key-change-this-immediately
JWT_EXPIRES_IN=7d

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Razorpay (Use test keys for now)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=Orgobloom <noreply@orgobloom.com>
```

### 4. Setup Database

```bash
# Generate Drizzle migrations
npm run db:generate

# Push schema to Supabase
npm run db:push
```

### 5. Start Backend

```bash
npm run dev
```

Backend should now be running on **http://localhost:5000**

Test it:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"OK","timestamp":"2026-02-13T..."}
```

---

## Frontend Setup

### 1. Navigate to Frontend

```bash
cd ../Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
NEXT_PUBLIC_APP_NAME=Orgobloom
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` with your test key.

### 4. Start Frontend

```bash
npm run dev
```

Frontend should now be running on **http://localhost:3000**

---

## Admin Setup

### 1. Navigate to Admin

```bash
cd ../Admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Orgobloom Admin
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Start Admin Panel

```bash
npm run dev
```

Admin should now be running on **http://localhost:3001**

---

## Testing

### Create Admin User

You need to create an admin user manually in Supabase:

1. Open **Drizzle Studio**:
   ```bash
   cd Backend
   npm run db:studio
   ```

2. Navigate to **users** table

3. Insert admin user:
   - **email**: admin@orgobloom.com
   - **password**: (hash of "Admin@123456")
   - **role**: ADMIN
   - **name**: Admin User

OR use this SQL in Supabase SQL Editor:

```sql
-- First, generate password hash in Node.js:
-- bcrypt.hashSync('Admin@123456', 12)

INSERT INTO users (id, email, name, password, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@orgobloom.com',
  'Admin User',
  '$2a$12$YOUR_GENERATED_HASH_HERE',
  'ADMIN',
  NOW(),
  NOW()
);
```

### Test the System

1. **Test Backend Health**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Register a Customer** (Frontend)
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Fill in registration form

3. **Login as Admin** (Admin Panel)
   - Go to http://localhost:3001
   - Email: admin@orgobloom.com
   - Password: Admin@123456

4. **Create a Product** (Admin)
   - Navigate to Products
   - Click "Add New Product"
   - Fill in details and save

5. **Browse Products** (Frontend)
   - Go to http://localhost:3000/products
   - View the product you created

---

## Gmail App Password Setup

To enable email notifications:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to **App Passwords**
4. Select "Mail" and generate password
5. Copy the 16-character password
6. Use it in `SMTP_PASSWORD` in Backend `.env`

---

## Razorpay Test Mode Setup

1. Sign up at https://razorpay.com
2. Go to **Settings** → **API Keys**
3. Generate **Test Mode** keys
4. Copy **Key ID** and **Key Secret**
5. Add to Backend `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
6. Add Key ID to Frontend `.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
   ```

---

## Common Issues

### Issue: Backend can't connect to database

**Solution**:
- Verify Supabase connection string
- Check if Supabase project is active
- Ensure password is correct (no special characters encoding)

### Issue: CORS errors in browser

**Solution**:
- Verify Frontend/Admin URLs in Backend `.env`
- Restart backend server
- Clear browser cache

### Issue: "Module not found" errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port already in use

**Solution**:
```bash
# Kill process on port 5000 (Backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9
```

---

## Next Steps

✅ All services running  
✅ Admin user created  
✅ Test product created  
✅ Customer registration works  

Now you can:
- Add more products
- Test the complete order flow
- Configure Razorpay payment
- Set up email notifications
- Customize the UI
- Deploy to production

---

## Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

---

**Need Help?** Check the main README.md or individual service README files.
