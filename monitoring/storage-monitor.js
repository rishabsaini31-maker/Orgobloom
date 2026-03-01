#!/usr/bin/env node

/**
 * Supabase Storage Monitor
 *
 * Tracks image storage usage and warns when approaching limits
 * Helps prevent exceeding 1GB free tier limit
 *
 * Usage: node monitoring/storage-monitor.js
 * Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_KEY: Service role key (for admin access)
 * - SUPABASE_STORAGE_BUCKET: Bucket name (default: media)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "media";
const FREE_TIER_LIMIT = 1 * 1024 * 1024 * 1024; // 1 GB
const WARNING_THRESHOLD = 0.75 * FREE_TIER_LIMIT; // 750 MB
const LOG_FILE = path.join(__dirname, "storage-usage.log");

class StorageMonitor {
  constructor() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables",
      );
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.bucket = BUCKET_NAME;
  }

  async getStorageUsage() {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list("", {
          limit: 1000,
        });

      if (error) throw error;

      let totalSize = 0;
      const files = [];

      for (const file of data || []) {
        if (file.metadata?.size) {
          totalSize += file.metadata.size;
          files.push({
            name: file.name,
            size: file.metadata.size,
            created: file.created_at,
          });
        }
      }

      return {
        totalSize,
        fileCount: data?.length || 0,
        files: files.sort((a, b) => b.size - a.size), // Sort by size descending
      };
    } catch (error) {
      console.error("❌ Error fetching storage usage:", error.message);
      throw error;
    }
  }

  formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  getUsagePercentage() {
    return (this.totalSize / FREE_TIER_LIMIT) * 100;
  }

  async analyzeStorage() {
    console.log("📊 Analyzing Supabase Storage Usage...\n");

    const { totalSize, fileCount, files } = await this.getStorageUsage();
    this.totalSize = totalSize;

    const usagePercent = this.getUsagePercentage();
    const remaining = FREE_TIER_LIMIT - totalSize;

    console.log("📈 Storage Summary:");
    console.log("─".repeat(60));
    console.log(
      `Total Used:     ${this.formatBytes(totalSize)} / ${this.formatBytes(FREE_TIER_LIMIT)}`,
    );
    console.log(
      `Usage:          ${usagePercent.toFixed(1)}% ${this.getProgressBar(usagePercent)}`,
    );
    console.log(`Remaining:      ${this.formatBytes(remaining)}`);
    console.log(`Files:          ${fileCount}`);
    console.log("─".repeat(60));

    // Show warnings
    if (usagePercent >= 90) {
      console.log("🚨 CRITICAL: Storage usage at 90%! Upgrade immediately!");
    } else if (usagePercent >= WARNING_THRESHOLD) {
      console.log(
        `⚠️  WARNING: Storage usage at ${usagePercent.toFixed(1)}% - Plan upgrade soon`,
      );
    } else {
      console.log(
        `✅ Safe: ${(WARNING_THRESHOLD - usagePercent).toFixed(1)}% buffer remaining`,
      );
    }

    console.log("\n📁 Top 10 Largest Files:");
    console.log("─".repeat(60));
    files.slice(0, 10).forEach((file, idx) => {
      console.log(`${idx + 1}. ${file.name}`);
      console.log(`   Size: ${this.formatBytes(file.size)}`);
    });

    // Log to file
    const logEntry = {
      timestamp: new Date().toISOString(),
      totalSize,
      fileCount,
      usagePercent: usagePercent.toFixed(1),
      remaining,
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");

    return { totalSize, usagePercent, fileCount };
  }

  getProgressBar(percent) {
    const filled = Math.round(percent / 5);
    const empty = 20 - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }

  async estimateGrowth() {
    if (!fs.existsSync(LOG_FILE)) {
      console.log("Not enough data yet (need 2+ measurements)");
      return;
    }

    const logs = fs
      .readFileSync(LOG_FILE, "utf-8")
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (logs.length < 2) {
      console.log("Not enough data yet (need 2+ measurements)");
      return;
    }

    const first = logs[0];
    const last = logs[logs.length - 1];
    const timeDiffDays =
      (new Date(last.timestamp) - new Date(first.timestamp)) /
      (1000 * 60 * 60 * 24);
    const sizeDiffBytes = last.totalSize - first.totalSize;
    const growthPerDay = sizeDiffBytes / timeDiffDays;
    const daysUntilFull = (FREE_TIER_LIMIT - last.totalSize) / growthPerDay;

    console.log("\n📈 Growth Projection:");
    console.log("─".repeat(60));
    console.log(
      `Growth Rate: ${this.formatBytes(growthPerDay)}/day (over ${timeDiffDays.toFixed(1)} days)`,
    );
    console.log(
      `Days Until Full: ${daysUntilFull.toFixed(0)} days (${(daysUntilFull / 30).toFixed(1)} months)`,
    );
    console.log("─".repeat(60));
  }
}

async function main() {
  const monitor = new StorageMonitor();

  try {
    const command = process.argv[2];

    if (command === "project") {
      await monitor.analyzeStorage();
      await monitor.estimateGrowth();
    } else if (command === "clear") {
      if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
        console.log("✅ Storage logs cleared");
      }
    } else {
      await monitor.analyzeStorage();
    }
  } catch (error) {
    console.error("❌ Monitor Error:", error.message);
    process.exit(1);
  }
}

main();
