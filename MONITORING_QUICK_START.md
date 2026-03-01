# 🎯 Production Monitoring - Quick Start

Your complete monitoring toolkit is ready! Use these commands to monitor your **free tier infrastructure**.

---

## 📦 What You Have

### 3 Monitoring Tools

1. **cold-start-monitor.js** - Detects when Render spins down (free tier issue)
2. **storage-monitor.js** - Tracks Supabase storage usage (1GB limit)
3. **load-test.js** - Tests with 20+ concurrent users (capacity check)

### Documentation

- **README.md** - Comprehensive monitoring guide
- **setup.sh** - Automated setup script

---

## 🚀 Quick Start (5 minutes)

### 1. First Time Setup

```bash
cd monitoring
bash setup.sh
```

This will:

- Create monitoring directory
- Make scripts executable
- Create `.env.monitoring` template
- Show next steps

### 2. Fill in Your Config

Edit `monitoring/.env.monitoring`:

```bash
# Get SUPABASE_URL from: https://app.supabase.com → Settings → API
SUPABASE_URL=https://xxxx.supabase.co

# Get SERVICE KEY from: https://app.supabase.com → Settings → API
# ⚠️ Use SERVICE KEY, not ANON KEY
SUPABASE_SERVICE_KEY=eyJhbGc...

# Bucket name (usually "media")
SUPABASE_STORAGE_BUCKET=media

# Your backend URL
BACKEND_URL=https://orgobloom.onrender.com
```

### 3. Run Monitoring

```bash
# Cold start monitoring (run once, checks every 15 min)
node cold-start-monitor.js

# Storage analysis (see current usage)
source .env.monitoring && node storage-monitor.js

# Load test (simulate 20 users for 60 seconds)
node load-test.js 20 60
```

---

## 📊 What Each Tool Does

### ❄️ Cold Start Monitor

```bash
node cold-start-monitor.js

# Shows:
# ✅ WARM  - Server responded < 5 seconds
# ❄️  COLD START - Server needed 15-30s to start

# Why it matters:
# Render free tier spins down after 15 minutes
# Next request is very slow (bad user experience)
# If frequent, upgrade to Render Pro ($7/mo)
```

### 💾 Storage Monitor

```bash
source .env.monitoring && node storage-monitor.js

# Shows:
# - Current usage: X MB / 1024 MB
# - Growth rate: X MB per day
# - Days until full storage
# - Largest files

# Why it matters:
# Free tier = 1GB only
# Filling up? Re-upload old images to Supabase
# At 750 MB? Upgrade to Supabase Pro ($25/mo)
```

### 🔥 Load Test

```bash
# Test with 20 concurrent users (60 seconds)
node load-test.js 20 60

# Shows:
# - Success rate (target: 99%+)
# - Response times (avg, p95, p99)
# - Requests per second
# - Which response times are "good"

# Interpretation:
# ✅ GOOD: Avg < 500ms, Success > 99%
# ⚠️  OK: Avg < 1000ms, Success > 95%
# ❌ BAD: Avg > 1000ms, Success < 95%
```

---

## 📈 Interpret Results

### Cold Start Monitor

```
✅ Output: [WARM] Response: 145ms
   → Server is running, no issue

❄️ Output: [COLD START] Response: 18234ms
   → Server had to start (Render spun down)
   → Users experienced 18 second delay!

What to do:
- < 2 cold starts/day: Normal ✅
- 3-5 cold starts/day: Upgrade Render ⚠️
- > 5 cold starts/day: Upgrade now 🚨
```

### Storage Monitor

```
Usage: 24.5% [███░░░░░░░░░░░░░░░░]
Remaining: 773.55 MB

✅ SAFE: Less than 750 MB used
⚠️ WARNING: 750-900 MB used - upgrade soon
🚨 CRITICAL: > 900 MB used - upgrade now

Days Until Full: 327 days (10.9 months)
→ If > 60 days: You have time ✅
→ If < 60 days: Upgrade soon ⚠️
```

### Load Test

```
Test: 20 concurrent users for 60 seconds

Success Rate: 99.7% ✅
Avg Response: 234ms ✅
P95: 567ms ✅

Interpretation:
✅ GOOD - Your app can handle 20+ users
   Recommendation: Free tier is fine for now

---

Success Rate: 57.7% ❌
Avg Response: 4523ms ❌
P95: 8903ms ❌

Interpretation:
❌ BAD - Free tier insufficient
   Recommendation: Upgrade to paid plan
```

---

## 🔄 Automation Setup

### Mac/Linux Cron

Add to your crotab (`crontab -e`):

```bash
# Check cold starts every 15 minutes (continuous background)
*/15 * * * * cd /path/to/orgobloom && node monitoring/cold-start-monitor.js >> monitoring/cold-starts.log 2>&1 &

# Check storage daily at 6 AM
0 6 * * * cd /path/to/orgobloom && source monitoring/.env.monitoring && node monitoring/storage-monitor.js >> monitoring/storage.log 2>&1

# Weekly load test: Sunday at 2 PM
0 14 * * 0 cd /path/to/orgobloom && node monitoring/load-test.js 20 60 >> monitoring/load-tests.log 2>&1
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Orgobloom Cold Start Monitor"
4. Trigger: Daily
5. Action:
   - Program: `node.exe`
   - Arguments: `monitoring/cold-start-monitor.js`
   - Start in: `C:\path\to\orgobloom`

---

## 💡 Monitoring Schedule

### Daily (Automated)

- ✅ Cold start checks run automatically
- ✅ Storage checks run at 6 AM

### Weekly (Manual - Sunday 2 PM)

```bash
cd monitoring
node load-test.js 20 60
```

### Monthly (Review)

```bash
# View statistics
node cold-start-monitor.js stats

# View growth
source .env.monitoring && node storage-monitor.js project

# Review load test trends
cat load-test-report.json
```

---

## 🚨 Red Flags → Upgrade Now

### Render (Cold Starts)

```
❌ If: > 5 cold starts per day
   Then: Upgrade to Render Pro ($7/month)
```

### Supabase (Storage)

```
❌ If: > 750 MB used OR < 60 days until full
   Then: Upgrade to Supabase Pro ($25/month)
```

### Load Test (Capacity)

```
❌ If: Load test fails with 20 concurrent users
   Then: Upgrade your plan (combined $32/month recommended)
```

---

## 📍 File Locations

```
monitoring/
├── cold-start-monitor.js      ← Cold start detection
├── storage-monitor.js         ← Storage tracking
├── load-test.js               ← Load testing
├── README.md                  ← Full documentation
├── setup.sh                   ← Setup script
├── .env.monitoring            ← Your config (create this)
├── .gitignore                 ← Don't commit logs
├── cold-starts.log            ← Generated: cold start logs
├── storage-usage.log          ← Generated: storage logs
└── load-test-report.json      ← Generated: test results
```

---

## ✅ Checklist

- [ ] Run `bash setup.sh`
- [ ] Fill in `monitoring/.env.monitoring`
- [ ] Run each tool once to verify it works
- [ ] Check cold start monitor output
- [ ] Run storage analysis
- [ ] Run load test with 20 concurrent users
- [ ] Review results
- [ ] Set up cron jobs (optional but recommended)
- [ ] Add to calendar: Monthly monitoring review

---

## 🆘 Troubleshooting

### "Command not found: node"

```bash
# Install Node.js from https://nodejs.org
# Verify: node --version
```

### "SUPABASE_URL is not set"

```bash
# Make sure you sourced the config:
source monitoring/.env.monitoring

# Then run the command:
node storage-monitor.js
```

### Load test fails to connect

```bash
# Check if backend is running
curl https://orgobloom.onrender.com/api/healthz

# Backend must be online for load tests
```

### Monitoring scripts won't run

```bash
# Make them executable:
chmod +x monitoring/*.js
chmod +x monitoring/setup.sh
```

---

## 📚 Learn More

- [Render Pricing & Limits](https://render.com/pricing)
- [Supabase Free Tier](https://supabase.com/pricing)
- [Node.js Documentation](https://nodejs.org/en/docs/)

---

**You're all set! Happy monitoring! 🎉**
