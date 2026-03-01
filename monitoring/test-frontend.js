#!/usr/bin/env node
/**
 * Frontend Button & API Endpoint Tester
 * Tests critical user interactions and API endpoints
 */

const API_URL = process.env.API_URL || "https://orgobloom.onrender.com/api";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://orgobloom.vercel.app";

// Test configuration
const tests = {
  // API Endpoint Tests
  api: [
    {
      name: "Health Check",
      method: "GET",
      endpoint: "/healthz",
      expectedStatus: 200,
    },
    {
      name: "Get Products",
      method: "GET",
      endpoint: "/products",
      expectedStatus: 200,
    },
    {
      name: "Login Rate Limit Check",
      method: "POST",
      endpoint: "/auth/login",
      body: { email: "test@test.com", password: "wrong" },
      iterations: 6, // Should fail on 6th attempt
      expectedStatus: 429,
      description: "Test rate limiting on login (5 attempts max)",
    },
  ],

  // Critical Frontend Pages
  pages: [
    { name: "Home Page", url: "/" },
    { name: "Products Page", url: "/products" },
    { name: "Cart Page", url: "/cart" },
    { name: "Login Page", url: "/login" },
    { name: "Register Page", url: "/register" },
  ],

  // Critical Buttons (by page)
  buttons: {
    cart: [
      {
        name: "Place Order Button",
        selector: 'button:has-text("Place Order")',
        description: "Should enable order placement",
      },
      {
        name: "Proceed to Payment Button",
        selector: 'button:has-text("Proceed to Payment")',
        description: "Should trigger Razorpay checkout",
      },
    ],
    products: [
      {
        name: "Add to Cart Button",
        selector: 'button:has-text("Add to Cart")',
        description: "Should add product to cart",
      },
      {
        name: "Filter Buttons",
        selector: 'button[class*="filter"]',
        description: "Should filter products by category",
      },
    ],
    profile: [
      {
        name: "Profile Dropdown",
        selector: 'div[class*="profile"]',
        description: "Should show user menu",
      },
      {
        name: "Logout Button",
        selector: 'button:has-text("Logout")',
        description: "Should log user out",
      },
    ],
  },
};

// Color output helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log("\n" + "=".repeat(60));
  log(title, colors.cyan);
  console.log("=".repeat(60));
}

// Test API endpoints
async function testApiEndpoint(test) {
  const url = `${API_URL}${test.endpoint}`;
  const iterations = test.iterations || 1;

  log(`\nTesting: ${test.name}`, colors.blue);
  log(`Endpoint: ${url}`);
  log(`Method: ${test.method}`);

  let results = [];

  for (let i = 1; i <= iterations; i++) {
    try {
      const options = {
        method: test.method,
        headers: { "Content-Type": "application/json" },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const status = response.status;
      const success =
        test.expectedStatus === status || (i < iterations && status === 401);

      results.push({ iteration: i, status, duration, success });

      if (iterations > 1) {
        log(
          `  Attempt ${i}: ${status} (${duration}ms)`,
          success ? colors.green : colors.yellow,
        );
      }
    } catch (error) {
      log(`  ❌ Error: ${error.message}`, colors.red);
      results.push({ iteration: i, error: error.message, success: false });
    }
  }

  // Check final result
  const lastResult = results[results.length - 1];
  if (lastResult.status === test.expectedStatus) {
    log(`✅ PASS: Got expected status ${test.expectedStatus}`, colors.green);
    return true;
  } else {
    log(
      `❌ FAIL: Expected ${test.expectedStatus}, got ${lastResult.status}`,
      colors.red,
    );
    if (test.description) log(`   ${test.description}`, colors.yellow);
    return false;
  }
}

// Test page accessibility
async function testPage(page) {
  const url = `${FRONTEND_URL}${page.url}`;
  log(`\nTesting: ${page.name}`, colors.blue);
  log(`URL: ${url}`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, { method: "HEAD" });
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.status === 200 || response.status === 304) {
      log(`✅ PASS: Page accessible (${duration}ms)`, colors.green);
      return true;
    } else {
      log(`❌ FAIL: Status ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

// Main test runner
async function runTests() {
  log("\n🧪 ORGOBLOOM FRONTEND & API TEST SUITE", colors.cyan);
  log(`API: ${API_URL}`);
  log(`Frontend: ${FRONTEND_URL}\n`);

  const results = {
    api: { passed: 0, failed: 0 },
    pages: { passed: 0, failed: 0 },
  };

  // Test API Endpoints
  section("🔌 API ENDPOINT TESTS");
  for (const test of tests.api) {
    const passed = await testApiEndpoint(test);
    if (passed) results.api.passed++;
    else results.api.failed++;
  }

  // Test Pages
  section("📄 FRONTEND PAGE TESTS");
  for (const page of tests.pages) {
    const passed = await testPage(page);
    if (passed) results.pages.passed++;
    else results.pages.failed++;
  }

  // Print button documentation (no actual testing without browser)
  section("🔘 CRITICAL BUTTONS TO MANUALLY TEST");
  log(
    "\n⚠️  Button testing requires browser automation (not implemented)",
    colors.yellow,
  );
  log("Please manually test these critical buttons:\n");

  for (const [pageName, buttons] of Object.entries(tests.buttons)) {
    log(`\n${pageName.toUpperCase()} PAGE:`, colors.cyan);
    buttons.forEach((btn, idx) => {
      log(`  ${idx + 1}. ${btn.name}`, colors.blue);
      log(`     → ${btn.description}`, colors.reset);
    });
  }

  // Summary
  section("📊 TEST SUMMARY");
  console.log(`
API Endpoints:    ${colors.green}${results.api.passed} passed${colors.reset} | ${colors.red}${results.api.failed} failed${colors.reset}
Frontend Pages:   ${colors.green}${results.pages.passed} passed${colors.reset} | ${colors.red}${results.pages.failed} failed${colors.reset}
Total Tests:      ${results.api.passed + results.pages.passed} / ${results.api.passed + results.api.failed + results.pages.passed + results.pages.failed}
  `);

  // Exit with error if any tests failed
  const totalFailed = results.api.failed + results.pages.failed;
  if (totalFailed > 0) {
    log(`\n❌ ${totalFailed} test(s) failed`, colors.red);
    process.exit(1);
  } else {
    log("\n✅ All tests passed!", colors.green);
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
