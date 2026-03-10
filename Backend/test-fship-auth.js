/**
 * FShip API Authentication Test
 * Tests if the API key is valid by making a simple API call
 */

import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const FSHIP_API_KEY = process.env.FSHIP_API_KEY;
const FSHIP_BASE_URL =
  process.env.FSHIP_BASE_URL || "https://api.fship.in/api/v1";

console.log("=== FShip API Authentication Test ===\n");
console.log("API Base URL:", FSHIP_BASE_URL);
console.log(
  "API Key (first 10 chars):",
  FSHIP_API_KEY ? FSHIP_API_KEY.substring(0, 10) + "..." : "NOT SET",
);
console.log("API Key Length:", FSHIP_API_KEY ? FSHIP_API_KEY.length : 0);
console.log("\n");

if (!FSHIP_API_KEY) {
  console.error("❌ FSHIP_API_KEY is not set in .env file");
  process.exit(1);
}

// Test 1: Try with X-API-KEY header (correct method)
async function testWithApiKeyHeader() {
  console.log("📝 Test 1: Using X-API-KEY header...");
  try {
    const response = await axios.get(`${FSHIP_BASE_URL}/courier/list`, {
      headers: {
        "X-API-KEY": FSHIP_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ SUCCESS with X-API-KEY header");
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log("❌ FAILED with X-API-KEY header");
    console.log("Status:", error.response?.status);
    console.log("Status Text:", error.response?.statusText);
    console.log("Error Data:", error.response?.data);
    return false;
  }
}

// Test 2: Try with Bearer token (old method)
async function testWithBearerToken() {
  console.log("\n📝 Test 2: Using Bearer token...");
  try {
    const response = await axios.get(`${FSHIP_BASE_URL}/courier/list`, {
      headers: {
        Authorization: `Bearer ${FSHIP_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ SUCCESS with Bearer token");
    console.log("Response status:", response.status);
    return true;
  } catch (error) {
    console.log("❌ FAILED with Bearer token");
    console.log("Status:", error.response?.status);
    return false;
  }
}

// Test 3: Try with api_key query parameter
async function testWithQueryParam() {
  console.log("\n📝 Test 3: Using api_key query parameter...");
  try {
    const response = await axios.get(`${FSHIP_BASE_URL}/courier/list`, {
      params: {
        api_key: FSHIP_API_KEY,
      },
      timeout: 10000,
    });

    console.log("✅ SUCCESS with query parameter");
    console.log("Response status:", response.status);
    return true;
  } catch (error) {
    console.log("❌ FAILED with query parameter");
    console.log("Status:", error.response?.status);
    return false;
  }
}

// Run all tests
async function runTests() {
  const test1 = await testWithApiKeyHeader();
  const test2 = await testWithBearerToken();
  const test3 = await testWithQueryParam();

  console.log("\n=== Test Summary ===");
  console.log("X-API-KEY header:", test1 ? "✅ WORKS" : "❌ FAILED");
  console.log("Bearer token:", test2 ? "✅ WORKS" : "❌ FAILED");
  console.log("Query parameter:", test3 ? "✅ WORKS" : "❌ FAILED");

  if (!test1 && !test2 && !test3) {
    console.log(
      "\n⚠️  ALL TESTS FAILED - Your API key is likely invalid or expired",
    );
    console.log("\n📌 Next Steps:");
    console.log("1. Login to FShip dashboard: https://fship.in/dashboard");
    console.log("2. Navigate to Settings → API Keys");
    console.log("3. Generate a new API key");
    console.log("4. Update FSHIP_API_KEY in Backend/.env");
    console.log("5. Run this test again");
  }
}

runTests();
