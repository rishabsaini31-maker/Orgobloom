#!/bin/bash
# Test basic DNS and connectivity to Neon

echo "🔍 Testing Neon database connectivity..."
echo ""

# Extract hostname from connection string
HOST="ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech"

echo "1️⃣ DNS Resolution Test:"
nslookup "$HOST" 2>&1 | grep -E "Name:|Address:" || echo "❌ DNS resolution failed"

echo ""
echo "2️⃣ Network Connectivity Test:"
nc -zv "$HOST" 5432 2>&1 || echo "❌ Port 5432 not accessible"

echo ""
echo "3️⃣ Testing connection with psql (if installed):"
psql 'postgresql://neondb_owner:npg_vPVq9b6NhzjY@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -c "SELECT 1" 2>&1 && echo "✅ psql connection successful" || echo "❌ psql connection failed"
