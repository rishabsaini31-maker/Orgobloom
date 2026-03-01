# 🎯 Production Monitoring Guide for Orgobloom 2.0

Complete guide for monitoring **cold starts**, **storage usage**, and **load capacity**.

---

## 1. 🥶 COLD START MONITORING

### What are Cold Starts?
- **Free Render tier spins down after 15 minutes of inactivity**
- Next request takes 15-30 seconds to start (server startup time)
- Users experience significant delays during spin-up
- Frequent cold starts indicate traffic pattern

### Setup Cold Start Monitoring

```bash
# Make script executable
chmod +x monitoring/cold-start-monitor.js

# Start monitoring (runs continuously)
node monitoring/cold-start-monitor.js

# View statistics (from another terminal)
node monitoring/cold-start-monitor.js stats

# Clear logs
node monitoring/cold-start-monitor.js clear
```

### How to Interpret Results

```
✅ WARM      - Response < 5s (server was already running)
❄️  COLD START - Response > 5s (server had to spin up)
```

### Example Output

```
2026-03-01T16:30:00.000Z | ✅ WARM | Response: 145ms | Total ColdStarts: 0
2026-03-01T16:45:00.000Z | ❄️  COLD START | Response: 18234ms | Total ColdStarts: 1
2026-03-01T16:45:05.000Z | ✅ WARM | Response: 156ms | Total ColdStarts: 1
```

### Logs Location
- Stored in: `monitoring/cold-starts.log`
- JSON format for analysis
- Tracks: timestamp, response time, cold start count

### Action Items

| Cold Starts/Day | Action |
|---|---|
| 0-2 | ✅ Normal - app has steady traffic |
| 3-5 | ⚠️ Warning - traffic pattern irregular |
| 5+ | 🚨 Upgrade - consider Render Pro ($7/mo) |

---

## 2. 💾 STORAGE MONITORING

### Free Tier Limits

```
Supabase Free: 1 GB = 1024 MB
Critical:      ≥ 900 MB (upgrade)
Warning:       ≥ 750 MB (plan upgrade)
Safe:          < 750 MB (no action)
```

### Setup Storage Monitoring

```bash
# Make script executable
chmod +x monitoring/storage-monitor.js

# Analyze current storage
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_KEY="eyJhbG..." \
SUPABASE_STORAGE_BUCKET="media" \
node monitoring/storage-monitor.js

# View growth projection
node monitoring/storage-monitor.js project

# Clear usage logs
node monitoring/storage-monitor.js clear
```

### Getting Your Credentials

1. **SUPABASE_URL**: 
   - Go to Supabase Dashboard → Project Settings
   - Copy: `https://[project-id].supabase.co`

2. **SUPABASE_SERVICE_KEY**:
   - Go to Supabase Dashboard → Project Settings → API
   - Copy: `Service role key` (NOT anon key)

3. **SUPABASE_STORAGE_BUCKET**:
   - Usually: `media` (confirm in Storage tab)

### Example Output

```
📊 Storage Summary:
────────────────────────────────────────────────────
Total Used:     250.45 MB / 1024.00 MB
Usage:          24.5% [███░░░░░░░░░░░░░░░░]
Remaining:      773.55 MB
Files:          245
────────────────────────────────────────────────────
✅ Safe: 50.5% buffer remaining

📁 Top 10 Largest Files:
────────────────────────────────────────────────────
1. product-image-001.jpg
   Size: 1.25 MB
2. product-image-002.webp
   Size: 0.95 MB
...

📈 Growth Projection:
────────────────────────────────────────────────────
Growth Rate: 2.34 MB/day (over 30 days)
Days Until Full: 327 days (10.9 months)
────────────────────────────────────────────────────
```

### Automated Monitoring

**Add to cron job (Linux/Mac)**:

```bash
# Check storage daily at 6 AM
0 6 * * * cd /path/to/app && node monitoring/storage-monitor.js >> monitoring/storage.log 2>&1
```

**Windows Task Scheduler**:
```
Program: node
Arguments: monitoring/storage-monitor.js
Run: Daily at 6:00 AM
```

---

## 3. 🔥 LOAD TESTING (20+ Concurrent Users)

### What is a Load Test?
- Simulates multiple users making requests simultaneously
- Tests if your app can handle peak traffic
- Identifies performance bottlenecks
- Shows response time degradation under load

### Running Load Tests

```bash
# Make script executable
chmod +x monitoring/load-test.js

# Test with 20 concurrent users for 60 seconds
node monitoring/load-test.js 20 60

# Test with 50 users for 2 minutes
node monitoring/load-test.js 50 120

# Stress test: 100 users for 30 seconds
node monitoring/load-test.js 100 30
```

### Understanding the Results

```
📊 Key Metrics:
─────────────────────────
✅ Success Rate:      Target > 99%
⏱️  Avg Response:      Target < 500ms
    P95 Response:      95% of requests faster than this
    P99 Response:      99% of requests faster than this
📊 Requests/sec:       Throughput (higher = better)
❌ Failed Requests:    Any failures during test
```

### Example Output (Healthy)

```
╔════════════════════════════════════════════════╗
║         LOAD TEST SIMULATION STARTING          ║
╚════════════════════════════════════════════════╝

📊 Test Configuration:
   Concurrent Users: 20
   Duration: 60s
   Endpoint: https://orgobloom.onrender.com/api/products
...

✅ Success Metrics:
   Total Requests: 647
   Successful: 645 (99.7%)
   Failed: 2 (0.3%)
   Requests/sec: 10.78

⏱️  Response Time (ms):
   Avg: 234ms
   Min: 45ms
   Max: 1856ms
   P95: 567ms (95% of requests faster)
   P99: 1203ms (99% of requests faster)

⚙️  Performance Assessment:
   ✅ GOOD: Average response time 234ms
   ✅ Can handle 20+ concurrent users
```

### Example Output (Needs Upgrade)

```
✅ Success Metrics:
   Total Requests: 324
   Successful: 187 (57.7%)
   Failed: 137 (42.3%)   ⚠️ HIGH FAILURE RATE

⏱️  Response Time (ms):
   Avg: 4523ms          ⚠️ TOO SLOW
   P99: 8903ms

⚙️  Performance Assessment:
   ❌ SLOW: Average response time 4523ms
   ❌ Free tier insufficient for 20 users
   Recommend upgrading to paid plan
```

### Report Location
- Saved in: `monitoring/load-test-report.json`
- Contains detailed metrics for analysis
- Can be used for trend analysis over time

---

## 📋 RECOMMENDED MONITORING SCHEDULE

### Daily (Automated)
```bash
# Cold start check - continuous in background
node monitoring/cold-start-monitor.js &

# Storage check - daily at 6 AM
0 6 * * * node monitoring/storage-monitor.js
```

### Weekly (Manual)
```bash
# Load test with current projected concurrent users
node monitoring/load-test.js 20 60

# Review cold start stats
node monitoring/cold-start-monitor.js stats
```

### Monthly (Review)
- Analyze growth trends
- Project when upgrades are needed
- Plan infrastructure changes
- Review error patterns

---

## 🚨 WHEN TO UPGRADE

### Immediate Upgrade Needed (🔴 CRITICAL)

```
✗ Storage usage ≥ 900 MB
✗ P99 response time > 8000ms
✗ Error rate > 5%
✗ Cold starts > 5 per day
✗ Load test fails with 20 concurrent users
```

### Plan Upgrade Soon (🟡 WARNING)

```
⚠ Storage usage ≥ 750 MB
⚠ Average response time > 1000ms
⚠ Error rate > 1%
⚠ Cold starts 3-5 per day
⚠ Load test marginal at 20 users
```

---

## 💰 UPGRADE OPTIONS

### Render Pro ($7/month)
```
Benefit: Removes cold starts
Install: `npm install -g render-cli`
           render login
           render deploy --service-name orgobloom-backend
```

### Supabase Pro ($25/month)
```
Benefits: 8 GB storage, higher limits
Visit: https://supabase.com/dashboard
Click: Project → Project Settings → Update Plan
```

### Recommendation: Start with Render Pro
```
Phase 1 ($7):  Render Pro (eliminate cold starts)
Phase 2 (+$25): Supabase Pro (expand capacity)
Total: $32/month for 1,000-5,000 DAU
```

---

## 🔗 Useful Links

- **Render Dashboard**: https://render.com/dashboard
- **Supabase Console**: https://app.supabase.com
- **Monitoring Logs**: `monitoring/*.log` and `monitoring/*-report.json`

---

## ✅ Checklist for New Setup

- [ ] Create `monitoring/` directory
- [ ] Copy all monitoring scripts
- [ ] Set environment variables for storage monitor
- [ ] Run first cold start monitor check
- [ ] Run first storage analysis
- [ ] Run initial load test (baseline)
- [ ] Add to cron jobs (daily checks)
- [ ] Set calendar reminder (weekly review)
- [ ] Document baseline metrics

---

**Questions?** Check each script's inline documentation with comments at the top!
