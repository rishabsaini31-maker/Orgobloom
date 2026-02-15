import "dotenv/config";
import { db } from "./src/db";
import { users, orders } from "./src/db/schema";

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...");
    
    // Test 1: Count users
    const userCount = await db.select().from(users);
    console.log(`✅ Users fetched: ${userCount.length} total`);
    
    // Test 2: Count orders
    const orderCount = await db.select().from(orders);
    console.log(`✅ Orders fetched: ${orderCount.length} total`);
    
    // Test 3: Get role distribution
    const roles = userCount.reduce((acc: Record<string, number>, u: any) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    console.log(`👥 Users by role:`, roles);
    
    // Test 4: Get order status distribution  
    const statuses = orderCount.reduce((acc: Record<string, number>, o: any) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    console.log(`📦 Orders by status:`, statuses);
    
    // Test 5: Sample user data
    if (userCount.length > 0) {
      console.log("\n📋 Sample user (first one):");
      const u = userCount[0];
      console.log(`  ID: ${u.id}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Role: ${u.role}`);
    }
    
    // Test 6: Try getting orders for first user
    if (userCount.length > 0) {
      const firstUserId = userCount[0].id;
      const userOrders = await db.select().from(orders);
        //.where(eq(orders.userId, firstUserId));
      const filtered = userOrders.filter((o: any) => o.userId === firstUserId);
      console.log(`\n📦 Orders for user ${firstUserId}: ${filtered.length}`);
      if (filtered.length > 0) {
        console.log(`  First order: ${filtered[0].orderNumber}`);
      }
    }
    
    console.log("\n✅ Database connection test passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();
