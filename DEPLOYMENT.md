# Orgobloom 2.0 - Deployment Guide

## 🚀 Deployment Options

This guide covers deploying all three services to production.

---

## Backend Deployment (Railway)

### Why Railway?
- Easy PostgreSQL integration
- Automatic deployments from Git
- Built-in environment variables
- Free tier available

### Steps

1. **Sign up at Railway**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `Backend` directory

3. **Add PostgreSQL Database**
   - Click "New Service"
   - Select "Database" → "PostgreSQL"
   - Database will be created automatically

4. **Configure Environment Variables**
   
   Go to Backend service → Variables:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-production-secret-64-chars-minimum
   JWT_EXPIRES_IN=7d
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FRONTEND_URL=https://your-frontend.vercel.app
   ADMIN_URL=https://your-admin.vercel.app
   ```

5. **Deploy**
   - Railway will auto-deploy
   - Note your backend URL: `https://xxx.railway.app`

6. **Run Migrations**
   ```bash
   # In Railway console
   npm run db:push
   ```

---

## Frontend Deployment (Vercel)

### Why Vercel?
- Optimized for Next.js
- Automatic SSL
- CDN included
- Zero configuration

### Steps

1. **Sign up at Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Frontend**
   - Click "New Project"
   - Import your repository
   - **Root Directory**: Select `Frontend`

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
   NEXT_PUBLIC_APP_NAME=Orgobloom
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your frontend URL

6. **Custom Domain** (Optional)
   - Go to Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

---

## Admin Deployment (Vercel)

### Steps

1. **Import Admin**
   - Same Vercel account
   - New Project
   - **Root Directory**: Select `Admin`

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_APP_NAME=Orgobloom Admin
   NEXT_PUBLIC_APP_URL=https://your-admin.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Note your admin URL

---

## Alternative: AWS Deployment

### Backend on EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd Backend

# Install dependencies
npm install

# Build
npm run build

# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name orgobloom-backend

# Setup auto-start
pm2 startup
pm2 save
```

### Frontend/Admin on S3 + CloudFront

```bash
# Build frontend
cd Frontend
npm run build
npm export

# Upload to S3
aws s3 sync out/ s3://your-bucket-name

# Configure CloudFront distribution
# Point to S3 bucket
# Add custom domain
```

---

## Environment Variables Checklist

### Backend Production
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong random string (64+ chars)
- [ ] `RAZORPAY_KEY_ID` - Live key
- [ ] `RAZORPAY_KEY_SECRET` - Live secret
- [ ] `SMTP_USER` & `SMTP_PASSWORD` - Email credentials
- [ ] `FRONTEND_URL` & `ADMIN_URL` - Production URLs

### Frontend Production
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Live key
- [ ] `NEXT_PUBLIC_APP_URL` - Frontend URL

### Admin Production
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] `NEXT_PUBLIC_APP_URL` - Admin URL

---

## Post-Deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable HTTPS on all services
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set secure cookie flags

### Database
- [ ] Run all migrations
- [ ] Create admin user
- [ ] Set up automated backups
- [ ] Configure connection pooling

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Enable performance monitoring

### Testing
- [ ] Test user registration
- [ ] Test admin login
- [ ] Test product creation
- [ ] Test order flow
- [ ] Test payment gateway
- [ ] Test email notifications

### DNS Configuration
- [ ] Point domain to Vercel (Frontend)
- [ ] Point admin subdomain to Vercel (Admin)
- [ ] Configure SSL certificates
- [ ] Test all URLs

---

## SSL/HTTPS Setup

### Vercel (Automatic)
- SSL is automatically provisioned
- Custom domains get free SSL
- No configuration needed

### Railway (Automatic)
- SSL is automatically enabled
- Custom domains supported
- Free Let's Encrypt certificates

### Manual (Nginx + Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Scaling Considerations

### Database
- Use connection pooling
- Add read replicas for heavy read workloads
- Enable query caching
- Monitor slow queries

### Backend
- Use horizontal scaling (multiple instances)
- Add Redis for session management
- Implement caching layer
- Use CDN for static assets

### Frontend/Admin
- Already optimized by Vercel
- Automatic edge caching
- Global CDN included

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backups (Railway)
# Enabled by default in Railway PostgreSQL

# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### File Backups

```bash
# Backup environment variables
# Store securely in password manager

# Backup code
git push --all
```

---

## Monitoring & Logs

### Railway Logs

```bash
# View logs in Railway dashboard
# Or use CLI
railway logs
```

### Vercel Logs

```bash
# View in Vercel dashboard
# Or use CLI
vercel logs your-deployment-url
```

---

## Rollback Strategy

### Quick Rollback

**Vercel:**
- Go to Deployments
- Find previous working deployment
- Click "Promote to Production"

**Railway:**
- Rollback via Git
- Railway auto-deploys previous commit

---

## Cost Estimates

### Free Tier (Development)
- **Supabase**: Free (500 MB database)
- **Railway**: $5/month (500 hours)
- **Vercel**: Free (hobby projects)
- **Total**: ~$5/month

### Production (Small Scale)
- **Railway**: $20/month (database + backend)
- **Vercel**: $0-20/month (2 projects)
- **Supabase**: $25/month (8 GB database)
- **Total**: ~$45-65/month

---

## Support & Maintenance

- Monitor error logs daily
- Update dependencies monthly
- Review security advisories
- Backup database weekly
- Test critical flows weekly

---

**Deployment Complete! 🎉**

Your Orgobloom 2.0 platform is now live!
