#!/usr/bin/env node

/**
 * Cold Start Monitor for Render Free Tier
 *
 * Detects when your Backend spins down and measures restart time
 * Run this continuously to monitor cold starts in production
 *
 * Usage: node monitoring/cold-start-monitor.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const BACKEND_URL = process.env.BACKEND_URL || "https://orgobloom.onrender.com";
const CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes (Render spin-down time)
const LOG_FILE = path.join(__dirname, "cold-starts.log");

class ColdStartMonitor {
  constructor() {
    this.lastCheckTime = null;
    this.coldStartCount = 0;
    this.responseTime = 0;
  }

  async checkHealthz() {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const req = http.request(`${BACKEND_URL}/api/healthz`, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            responseTime,
            isColdStart: responseTime > 5000, // Cold starts typically > 5s
            timestamp: new Date().toISOString(),
          });
        });
      });

      req.on("error", (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: 500,
          responseTime,
          error: error.message,
          isColdStart: true,
          timestamp: new Date().toISOString(),
        });
      });

      req.setTimeout(30000); // 30 second timeout
      req.end();
    });
  }

  logColdStart(result) {
    const logEntry = {
      ...result,
      coldStartCount: this.coldStartCount,
    };

    const logLine = `${result.timestamp} | ${
      result.isColdStart ? "❄️  COLD START" : "✅ WARM"
    } | Response: ${result.responseTime}ms | Total ColdStarts: ${
      this.coldStartCount
    }\n`;

    console.log(logLine.trim());

    // Append to log file
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
  }

  async start() {
    console.log("🔍 Cold Start Monitor Started - Checking every 15 minutes\n");
    console.log(`📊 Logging to: ${LOG_FILE}\n`);

    // Run initial check
    await this.check();

    // Then check every 15 minutes
    setInterval(() => this.check(), CHECK_INTERVAL);
  }

  async check() {
    const result = await this.checkHealthz();

    if (result.isColdStart) {
      this.coldStartCount++;
      console.log("⏱️  Cold start detected!");
    }

    this.logColdStart(result);

    // Alert if too many cold starts
    if (this.coldStartCount >= 3) {
      console.log(
        "⚠️  WARNING: Multiple cold starts detected - Consider upgrading Render plan\n",
      );
    }
  }

  async getStats() {
    if (!fs.existsSync(LOG_FILE)) {
      console.log("No logs found yet");
      return;
    }

    const logs = fs
      .readFileSync(LOG_FILE, "utf-8")
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    const coldStarts = logs.filter((l) => l.isColdStart).length;
    const avgResponseTime =
      logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length;
    const maxResponseTime = Math.max(...logs.map((l) => l.responseTime));

    console.log("\n📊 Cold Start Statistics:");
    console.log("─".repeat(50));
    console.log(`Total Checks: ${logs.length}`);
    console.log(
      `Cold Starts: ${coldStarts} (${((coldStarts / logs.length) * 100).toFixed(1)}%)`,
    );
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log("─".repeat(50));
  }
}

const monitor = new ColdStartMonitor();

// CLI commands
if (process.argv[2] === "stats") {
  monitor.getStats();
} else if (process.argv[2] === "clear") {
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
    console.log("✅ Logs cleared");
  }
} else {
  monitor.start();
}
