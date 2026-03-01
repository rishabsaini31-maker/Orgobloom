#!/bin/bash

# 🎯 Quick Setup Script for Production Monitoring
# Run this once to set up all monitoring tools

set -e

echo "🚀 Setting up Production Monitoring for Orgobloom 2.0"
echo "═══════════════════════════════════════════════════════"

# Create monitoring directory if it doesn't exist
if [ ! -d "monitoring" ]; then
  mkdir -p monitoring
  echo "✅ Created monitoring directory"
fi

# Make scripts executable
chmod +x monitoring/cold-start-monitor.js
chmod +x monitoring/storage-monitor.js
chmod +x monitoring/load-test.js

echo "✅ Made all monitoring scripts executable"

# Create .env.monitoring file for storage monitor
if [ ! -f "monitoring/.env.monitoring" ]; then
  cat > monitoring/.env.monitoring << 'EOF'
# Storage Monitor Configuration
# Get these from https://app.supabase.com → Project Settings → API

SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_STORAGE_BUCKET=media

# Backend URL for health checks
BACKEND_URL=https://orgobloom.onrender.com
EOF
  
  echo "✅ Created monitoring/.env.monitoring"
  echo "⚠️  IMPORTANT: Fill in your Supabase credentials in monitoring/.env.monitoring"
fi

echo ""
echo "📋 Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🔍 Next Steps:"
echo ""
echo "1. COLD START MONITORING (Detect Render spin-downs):"
echo "   node monitoring/cold-start-monitor.js"
echo ""
echo "2. STORAGE MONITORING (Track Supabase usage):"
echo "   source monitoring/.env.monitoring"
echo "   node monitoring/storage-monitor.js"
echo ""
echo "3. LOAD TESTING (Test with 20+ concurrent users):"
echo "   node monitoring/load-test.js 20 60"
echo ""
echo "📖 Full documentation:"
echo "   cat monitoring/README.md"
echo ""
echo "✅ Setup complete! Happy monitoring! 🎉"
