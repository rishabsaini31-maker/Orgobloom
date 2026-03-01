#!/bin/bash

# 🎯 QUICK COMMANDS FOR MONITORING
# Copy and paste these commands to run monitoring tools

echo "✅ Monitoring Tools - Quick Reference Commands"
echo "═════════════════════════════════════════════"
echo ""

# Cold Start Monitor
echo "🥶 COLD START MONITOR (Detect Render spin-downs)"
echo "   Command:"
echo "   node monitoring/cold-start-monitor.js"
echo ""
echo "   What it shows:"
echo "   - ✅ WARM  = Server running (< 5 sec)"
echo "   - ❄️  COLD START = Server restarted (> 5 sec)"
echo ""
echo "   View stats:"
echo "   node monitoring/cold-start-monitor.js stats"
echo ""

# Storage Monitor
echo "💾 STORAGE MONITOR (Track Supabase usage)"
echo "   Setup first:"
echo "   1. Edit monitoring/.env.monitoring"
echo "   2. Add your SUPABASE_URL and SUPABASE_SERVICE_KEY"
echo ""
echo "   Command:"
echo "   cd monitoring && source .env.monitoring && cd .. && node monitoring/storage-monitor.js"
echo ""
echo "   Or simpler (source from current directory):"
echo "   export \$(cat monitoring/.env.monitoring | xargs) && node monitoring/storage-monitor.js"
echo ""

# Load Tester
echo "🔥 LOAD TESTER (Test with concurrent users)"
echo "   Command format:"
echo "   node monitoring/load-test.js [users] [seconds]"
echo ""
echo "   Examples:"
echo "   - 5 users for 20 seconds:   node monitoring/load-test.js 5 20"
echo "   - 20 users for 60 seconds:  node monitoring/load-test.js 20 60"
echo "   - 50 users for 120 seconds: node monitoring/load-test.js 50 120"
echo ""
echo "   What it shows:"
echo "   - Success Rate (target: > 99%)"
echo "   - Avg Response Time (target: < 500ms)"
echo "   - P95 & P99 (95% and 99% percentiles)"
echo ""
echo "   Output saved to: monitoring/load-test-report.json"
echo ""

echo "═════════════════════════════════════════════"
echo "✅ Ready to monitor! Pick a command above 👆"
