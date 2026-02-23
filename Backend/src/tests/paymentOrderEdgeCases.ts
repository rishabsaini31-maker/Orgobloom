/**
 * Payment and Order Edge Cases Tests
 *
 * This file contains tests for various edge cases in payment and order processing.
 * Run with: npx tsx src/tests/paymentOrderEdgeCases.ts
 */

// Test configuration
const API_URL = process.env.TEST_API_URL || "http://localhost:5001/api";

// Test results interface
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

// Test runner
class TestRunner {
  private results: TestResult[] = [];
  private testUserToken: string = "";
  private testOrderId: string = "";
  private testPaymentId: string = "";

  // Helper function for API calls
  private async apiCall(
    endpoint: string,
    method: string = "GET",
    body?: any,
    token?: string,
  ): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return { status: response.status, data };
    } catch (error: any) {
      return { status: 0, data: { error: error.message } };
    }
  }

  // Test helper
  private async test(name: string, fn: () => Promise<boolean>): Promise<void> {
    try {
      const passed = await fn();
      this.results.push({
        name,
        passed,
        message: passed ? "PASSED" : "FAILED",
      });
      console.log(`${passed ? "✅" : "❌"} ${name}`);
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        message: error.message,
      });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // Setup test data
  async setup(): Promise<void> {
    console.log("\n🔧 Setting up test environment...\n");
    // In a real test, you would create a test user and get a token here
    this.testUserToken = "test-token-placeholder";
    this.testOrderId = "test-order-id-placeholder";
  }

  // Run all tests
  async runAll(): Promise<void> {
    console.log("\n🧪 Running Payment and Order Edge Cases Tests\n");
    console.log("=".repeat(50) + "\n");

    // Order Creation Edge Cases
    console.log("📋 Order Creation Edge Cases\n");

    await this.test("Should reject order with empty items", async () => {
      const { status } = await this.apiCall(
        "/orders",
        "POST",
        {
          items: [],
          address: { city: "Test City", pincode: "123456" },
          paymentMethod: "cod",
          total: 0,
        },
        this.testUserToken,
      );
      return status === 400;
    });

    await this.test(
      "Should reject order without shipping address",
      async () => {
        const { status } = await this.apiCall(
          "/orders",
          "POST",
          {
            items: [{ productId: "test", quantity: 1, price: 100 }],
            paymentMethod: "cod",
            total: 100,
          },
          this.testUserToken,
        );
        return status === 400;
      },
    );

    await this.test("Should reject order with negative amount", async () => {
      const { status } = await this.apiCall(
        "/orders",
        "POST",
        {
          items: [{ productId: "test", quantity: 1, price: -100 }],
          address: { city: "Test", pincode: "123456" },
          paymentMethod: "cod",
          total: -100,
        },
        this.testUserToken,
      );
      return status === 400;
    });

    // Payment Edge Cases
    console.log("\n💳 Payment Edge Cases\n");

    await this.test("Should reject payment with zero amount", async () => {
      const { status } = await this.apiCall(
        "/payments/create-order",
        "POST",
        {
          orderId: this.testOrderId,
          amount: 0,
        },
        this.testUserToken,
      );
      return status === 400;
    });

    await this.test("Should reject payment with negative amount", async () => {
      const { status } = await this.apiCall(
        "/payments/create-order",
        "POST",
        {
          orderId: this.testOrderId,
          amount: -100,
        },
        this.testUserToken,
      );
      return status === 400;
    });

    await this.test(
      "Should reject payment verification with invalid signature",
      async () => {
        const { status } = await this.apiCall(
          "/payments/verify",
          "POST",
          {
            razorpay_order_id: "test_order",
            razorpay_payment_id: "test_payment",
            razorpay_signature: "invalid_signature",
            orderId: this.testOrderId,
          },
          this.testUserToken,
        );
        return status === 400;
      },
    );

    await this.test(
      "Should handle payment for non-existent order",
      async () => {
        const { status } = await this.apiCall(
          "/payments/create-order",
          "POST",
          {
            orderId: "non-existent-order-id",
            amount: 100,
          },
          this.testUserToken,
        );
        return status === 404;
      },
    );

    // Refund Edge Cases
    console.log("\n💰 Refund Edge Cases\n");

    await this.test("Should reject refund request without reason", async () => {
      const { status } = await this.apiCall(
        "/refunds/request",
        "POST",
        {
          orderId: this.testOrderId,
        },
        this.testUserToken,
      );
      return status === 400;
    });

    await this.test("Should reject refund for unpaid order", async () => {
      const { status } = await this.apiCall(
        "/refunds/request",
        "POST",
        {
          orderId: "unpaid-order-id",
          reason: "Test refund",
        },
        this.testUserToken,
      );
      return status === 400 || status === 404;
    });

    // Shipment Edge Cases
    console.log("\n📦 Shipment Edge Cases\n");

    await this.test(
      "Should handle tracking for invalid tracking number",
      async () => {
        const { status } = await this.apiCall(
          "/shipments/track/INVALID_TRACKING",
          "GET",
        );
        return status === 404;
      },
    );

    // Input Validation
    console.log("\n🔒 Input Validation Tests\n");

    await this.test("Should handle SQL injection attempts safely", async () => {
      const { status } = await this.apiCall(
        "/orders",
        "POST",
        {
          items: [
            { productId: "1; DROP TABLE orders;--", quantity: 1, price: 100 },
          ],
          address: {
            city: "'; DELETE FROM users;--",
            pincode: "123456",
          },
          paymentMethod: "cod",
          total: 100,
        },
        this.testUserToken,
      );
      // Should either reject or sanitize (not crash)
      return status === 400 || status === 201 || status === 401;
    });

    await this.test("Should handle XSS attempts safely", async () => {
      const { status } = await this.apiCall(
        "/orders",
        "POST",
        {
          items: [{ productId: "test", quantity: 1, price: 100 }],
          address: { city: "Test", pincode: "123456" },
          paymentMethod: "cod",
          total: 100,
          notes: "<script>alert('xss')</script>",
        },
        this.testUserToken,
      );
      // Should either reject or sanitize (not crash)
      return status === 400 || status === 201 || status === 401;
    });

    // Authentication Tests
    console.log("\n🔐 Authentication Tests\n");

    await this.test(
      "Should reject unauthenticated order creation",
      async () => {
        const { status } = await this.apiCall(
          "/orders",
          "POST",
          {
            items: [{ productId: "test", quantity: 1, price: 100 }],
            address: { city: "Test", pincode: "123456" },
            paymentMethod: "cod",
            total: 100,
          },
          // No token provided
        );
        return status === 401;
      },
    );

    await this.test(
      "Should reject unauthenticated payment creation",
      async () => {
        const { status } = await this.apiCall(
          "/payments/create-order",
          "POST",
          {
            orderId: this.testOrderId,
            amount: 100,
          },
          // No token provided
        );
        return status === 401;
      },
    );

    // Print summary
    this.printSummary();
  }

  // Print test summary
  private printSummary(): void {
    console.log("\n" + "=".repeat(50));
    console.log("\n📊 Test Summary\n");

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}: ${r.message}`);
        });
    }

    console.log("\n" + "=".repeat(50));
  }
}

// Main execution
async function main() {
  console.log(`
===========================================
Payment and Order Edge Cases Test Suite
===========================================

This test suite covers:
1. Order creation edge cases (empty items, missing address, invalid amounts)
2. Payment edge cases (invalid amounts, invalid signatures)
3. Refund edge cases (unpaid orders, missing reasons)
4. Shipment edge cases (invalid tracking numbers)
5. Input validation (SQL injection, XSS)
6. Authentication tests

To run these tests:
1. Ensure the backend server is running
2. Set TEST_API_URL environment variable if needed
3. Run: npx tsx src/tests/paymentOrderEdgeCases.ts

===========================================
`);

  const runner = new TestRunner();
  await runner.setup();
  await runner.runAll();
}

main().catch(console.error);
