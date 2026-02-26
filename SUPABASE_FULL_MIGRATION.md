# Complete Migration Guide: Neon + Cloudinary → Supabase

This guide covers migrating your entire backend from **Neon PostgreSQL + Cloudinary** to **Supabase** (Database + Storage).

---

## Current Setup

- **Database**: Neon PostgreSQL (`ep-frosty-pine-a1ldusuy-pooler`)
- **Image Storage**: Cloudinary
- **Storage Provider**: local/Cloudinary hybrid

---

## New Setup (All Supabase)

- **Database**: Supabase PostgreSQL
- **Image Storage**: Supabase Storage
- **Storage Provider**: `CLOUD_STORAGE_PROVIDER=supabase`

---

## Step 1: Create Supabase Project (If Not Done)

1. Go to [supabase.com](https://supabase.com) → New Project
2. **Name**: `Orgobloom-main`
3. **Database Password**: (create a strong password)
4. **Region**: `Asia (Singapore)` - ap-southeast-1
5. Wait ~2 minutes for provisioning

---

## Step 2: Get Supabase Credentials

### From Settings → API:

- **Project URL**: `https://orgobloom-main-xxxxx.supabase.co`
- **Service Role Key**: (scroll down, click "Reveal")

### From Settings → Database:

- **Connection URI**: `postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres`

---

## Step 3: Migrate Database from Neon to Supabase

### Option A: Export/Import (Recommended)

1. **Export from Neon:**

```bash
# Install pg_dump if not installed
# Then run:
pg_dump "postgresql://neondb_owner:npg_vPVq9b6NhzjY@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" > neon_dump.sql
```

2. **Import to Supabase:**

```bash
# Use the connection string from Supabase Settings → Database
psql "postgres://postgres.[your-password]@db.[your-ref].supabase.co:5432/postgres" < neon_dump.sql
```

### Option B: Manual Schema Push

```bash
cd Backend

# Update DATABASE_URL in .env first (see Step 4)

# Push schema to Supabase
npm run db:push
```

---

## Step 4: Update Environment Variables

Update `Backend/.env`:

```env
# ========================
# Supabase Database
# ========================
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require

# ========================
# Supabase Storage (replace Cloudinary)
# ========================
CLOUD_STORAGE_PROVIDER=supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]
SUPABASE_STORAGE_BUCKET=orgobloom-uploads
```

---

## Step 5: Configure Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**:
   - **Name**: `orgobloom-uploads`
   - **Public**: ✅ Yes
3. Add policies for folder access (optional for public buckets):
   - Click "New Policy" → "Allow public access"

---

## Step 6: Update Code Files

The following files have been updated:

| File                             | Change                          |
| -------------------------------- | ------------------------------- |
| `Backend/src/db/index.ts`        | Connection message updated      |
| `Backend/src/routes/products.ts` | Uses Supabase Storage           |
| `Backend/.env`                   | CLOUD_STORAGE_PROVIDER=supabase |

---

## Step 7: Delete Neon Project (After Testing)

⚠️ **IMPORTANT**: Only delete Neon after confirming everything works on Supabase!

1. Test your app with Supabase
2. Verify all products, orders, users work
3. Then go to Neon dashboard → Settings → Delete Project

---

## Cost Comparison

| Feature   | Neon + Cloudinary | Supabase        |
| --------- | ----------------- | --------------- |
| Database  | ~$0 (free tier)   | ~$0 (free tier) |
| Storage   | ~$0 (free tier)   | ~$0 (free tier) |
| **Total** | **Free**          | **Free**        |

**Supabase Free Tier:**

- 500MB Database
- 1GB Storage
- 2GB Bandwidth
- 50MB File size limit

---

## Testing

```bash
cd Backend
npm run dev
```

Test:

1. Login as admin
2. Upload a product image
3. Check if image appears in Supabase Storage
4. Verify products load correctly

---

## Troubleshooting

### Database Connection Fails

- Check DATABASE_URL format
- Ensure IP is allowed in Supabase settings

### Storage Upload Fails

- Check bucket is Public
- Verify SUPABASE_SERVICE_KEY is correct

### File Size Too Large

- Supabase free tier: 50MB max per file
