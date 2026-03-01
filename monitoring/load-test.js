#!/usr/bin/env node

/**
 * Load Test Simulator - Test with 20+ concurrent users
 *
 * Simulates multiple users making requests to test capacity
 * Helps identify bottlenecks before production issues
 *
 * Usage: node monitoring/load-test.js [concurrentUsers] [duration]
 * Examples:
 *   node monitoring/load-test.js 20 60        # 20 users for 60 seconds
 *   node monitoring/load-test.js 50 120       # 50 users for 2 minutes
 *   node monitoring/load-test.js 100 30       # Stress test: 100 users for 30 sec
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const BACKEND_URL = process.env.BACKEND_URL || "https://orgobloom.onrender.com";
const API_ENDPOINT = `${BACKEND_URL}/api/products?limit=12`;
const CONCURRENT_USERS = parseInt(process.argv[2]) || 20;
const DURATION_SECONDS = parseInt(process.argv[3]) || 60;
const REPORT_FILE = path.join(__dirname, "load-test-report.json");

class LoadTester {
  constructor(concurrentUsers, durationSeconds) {
    this.concurrentUsers = concurrentUsers;
    this.durationSeconds = durationSeconds;
    this.requests = [];
    this.errors = [];
    this.startTime = Date.now();
    this.endTime = this.startTime + durationSeconds * 1000;
  }

  async makeRequest(userId) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = BACKEND_URL.startsWith("https") ? https : http;

      const req = protocol.get(API_ENDPOINT, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseTime = Date.now() - startTime;
          resolve({
            userId,
            statusCode: res.statusCode,
            responseTime,
            size: data.length,
            timestamp: new Date().toISOString(),
            success: res.statusCode === 200,
          });
        });
      });

      req.on("error", (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          userId,
          statusCode: 0,
          responseTime,
          error: error.message,
          timestamp: new Date().toISOString(),
          success: false,
        });
      });

      req.setTimeout(10000);
    });
  }

  async runSimulation() {
    console.log(`
╔════════════════════════════════════════════════╗
║         LOAD TEST SIMULATION STARTING          ║
╚════════════════════════════════════════════════╝
`);

    console.log(`📊 Test Configuration:`);
    console.log(`   Concurrent Users: ${this.concurrentUsers}`);
    console.log(`   Duration: ${this.durationSeconds}s`);
    console.log(`   Endpoint: ${API_ENDPOINT}`);
    console.log(`   Target: ${BACKEND_URL}\n`);

    const userPromises = [];
    let userId = 0;

    // Start concurrent users
    while (Date.now() < this.endTime) {
      if (userPromises.length < this.concurrentUsers) {
        userId++;
        const promise = this.makeRequest(userId).then((result) => {
          this.requests.push(result);
          if (!result.success) {
            this.errors.push(result);
          }
          process.stdout.write(".");
        });
        userPromises.push(promise);
      }

      // Wait a bit before spawning next request
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Wait for all requests to complete
    await Promise.all(userPromises);

    console.log("\n\n✅ Load test completed!\n");
    this.printReport();
  }

  printReport() {
    const successfulRequests = this.requests.filter((r) => r.success);
    const failedRequests = this.requests.filter((r) => !r.success);

    const responseTimes = successfulRequests.map((r) => r.responseTime);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const p95 = responseTimes.sort((a, b) => a - b)[
      Math.floor(responseTimes.length * 0.95)
    ];
    const p99 = responseTimes.sort((a, b) => a - b)[
      Math.floor(responseTimes.length * 0.99)
    ];

    const totalDataTransferred = this.requests.reduce(
      (sum, r) => sum + (r.size || 0),
      0,
    );
    const testDuration = (Date.now() - this.startTime) / 1000;
    const requestsPerSecond = this.requests.length / testDuration;

    console.log("═".repeat(60));
    console.log("📈 LOAD TEST RESULTS");
    console.log("═".repeat(60));

    console.log("\n✅ Success Metrics:");
    console.log(`   Total Requests: ${this.requests.length}`);
    console.log(
      `   Successful: ${successfulRequests.length} (${((successfulRequests.length / this.requests.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Failed: ${failedRequests.length} (${((failedRequests.length / this.requests.length) * 100).toFixed(1)}%)`,
    );
    console.log(`   Requests/sec: ${requestsPerSecond.toFixed(2)}`);

    console.log("\n⏱️  Response Time (ms):");
    console.log(`   Avg: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   Min: ${minResponseTime}ms`);
    console.log(`   Max: ${maxResponseTime}ms`);
    console.log(`   P95: ${p95}ms (95% of requests faster)`);
    console.log(`   P99: ${p99}ms (99% of requests faster)`);

    console.log("\n📊 Data Transfer:");
    console.log(`   Total: ${this.formatBytes(totalDataTransferred)}`);
    console.log(
      `   Avg/Request: ${this.formatBytes(totalDataTransferred / this.requests.length)}`,
    );
    console.log(
      `   Throughput: ${this.formatBytes((totalDataTransferred / testDuration).toFixed(0))}/sec`,
    );

    console.log("\n⚙️  Performance Assessment:");
    if (avgResponseTime < 200) {
      console.log(
        `   ✅ EXCELLENT: Average response time ${avgResponseTime.toFixed(0)}ms`,
      );
    } else if (avgResponseTime < 500) {
      console.log(
        `   ✅ GOOD: Average response time ${avgResponseTime.toFixed(0)}ms`,
      );
    } else if (avgResponseTime < 1000) {
      console.log(
        `   ⚠️  ACCEPTABLE: Average response time ${avgResponseTime.toFixed(0)}ms (consider optimization)`,
      );
    } else {
      console.log(
        `   ❌ SLOW: Average response time ${avgResponseTime.toFixed(0)}ms (upgrade needed)`,
      );
    }

    if (failedRequests.length > 0) {
      console.log(`   ⚠️  ${failedRequests.length} failed requests`);
      console.log(`       Common errors:`, failedRequests[0].error);
    }

    console.log("\n💡 Capacity Estimate:");
    if (this.concurrentUsers <= 20) {
      console.log(`   ✅ Can handle ${this.concurrentUsers}+ concurrent users`);
    } else if (this.concurrentUsers <= 50) {
      console.log(`   ⚠️  Approaching limits at ${this.concurrentUsers} users`);
      console.log(`       Recommend upgrading Render/Supabase plan`);
    } else {
      console.log(
        `   ❌ Free tier insufficient for ${this.concurrentUsers} users`,
      );
      console.log(`       Recommend upgrading to paid plan`);
    }

    console.log("\n" + "═".repeat(60));

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      config: {
        concurrentUsers: this.concurrentUsers,
        durationSeconds: this.durationSeconds,
        endpoint: API_ENDPOINT,
      },
      summary: {
        totalRequests: this.requests.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        successRate: (
          (successfulRequests.length / this.requests.length) *
          100
        ).toFixed(1),
        requestsPerSecond: requestsPerSecond.toFixed(2),
      },
      responseTimes: {
        avg: avgResponseTime.toFixed(0),
        min: minResponseTime,
        max: maxResponseTime,
        p95,
        p99,
      },
      dataTransfer: {
        totalBytes: totalDataTransferred,
        avgPerRequest: (totalDataTransferred / this.requests.length).toFixed(0),
        throughputBytesPerSecond: (totalDataTransferred / testDuration).toFixed(
          0,
        ),
      },
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${REPORT_FILE}`);
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
}

// Run test
const tester = new LoadTester(CONCURRENT_USERS, DURATION_SECONDS);
tester.runSimulation().catch((error) => {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
});
