import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

// Supabase connection
const SUPABASE_URL = "postgresql://postgres:Orgobloom%402025@db.wfmmdkknrigkhdpldwhc.supabase.co:5432/postgres";
const NEON_URL = process.env.DATABASE_URL!;

const supabase = postgres(SUPABASE_URL);
const neon = postgres(NEON_URL);

async function migrateData() {
  try {
    console.log("🔄 Starting data migration from Supabase to Neon...\n");

    // 1. Migrate Users
    console.log("1️⃣ Migrating users...");
    const users = await supabase`SELECT * FROM users`;
    console.log(`   Found ${users.length} users in Supabase`);
    
    if (users.length > 0) {
      for (const user of users) {
        await neon`
          INSERT INTO users ${neon(user)}
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            password = EXCLUDED.password,
            phone = EXCLUDED.phone,
            image = EXCLUDED.image,
            provider = EXCLUDED.provider,
            provider_account_id = EXCLUDED.provider_account_id,
            email_verified = EXCLUDED.email_verified,
            role = EXCLUDED.role,
            is_blocked = EXCLUDED.is_blocked,
            blocked_at = EXCLUDED.blocked_at,
            blocked_reason = EXCLUDED.blocked_reason,
            risk_score = EXCLUDED.risk_score,
            fraud_status = EXCLUDED.fraud_status,
            cod_enabled = EXCLUDED.cod_enabled,
            last_ip_address = EXCLUDED.last_ip_address,
            device_fingerprint = EXCLUDED.device_fingerprint,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
        `;
      }
      console.log(`   ✅ Migrated ${users.length} users`);
    } else {
      console.log(`   ⚠️  No users found in Supabase`);
    }

    // 2. Migrate Products
    console.log("\n2️⃣ Migrating products...");
    const products = await supabase`SELECT * FROM products`;
    console.log(`   Found ${products.length} products in Supabase`);
    
    if (products.length > 0) {
      for (const product of products) {
        await neon`
          INSERT INTO products ${neon(product)}
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            images = EXCLUDED.images,
            benefits = EXCLUDED.benefits,
            price = EXCLUDED.price,
            category = EXCLUDED.category,
            weight = EXCLUDED.weight,
            stock = EXCLUDED.stock,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            is_featured = EXCLUDED.is_featured,
            is_active = EXCLUDED.is_active,
            tags = EXCLUDED.tags,
            meta_title = EXCLUDED.meta_title,
            meta_description = EXCLUDED.meta_description,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
        `;
      }
      console.log(`   ✅ Migrated ${products.length} products`);
    } else {
      console.log(`   ⚠️  No products found in Supabase`);
    }

    // 3. Migrate Addresses
    console.log("\n3️⃣ Migrating addresses...");
    const addresses = await supabase`SELECT * FROM addresses`;
    console.log(`   Found ${addresses.length} addresses in Supabase`);
    
    if (addresses.length > 0) {
      for (const address of addresses) {
        // Map postal_code to pincode if it exists
        const mappedAddress = {
          ...address,
          pincode: address.postal_code || address.pincode
        };
        delete mappedAddress.postal_code; // Remove old field name
        
        await neon`
          INSERT INTO addresses ${neon(mappedAddress)}
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            address_line1 = EXCLUDED.address_line1,
            address_line2 = EXCLUDED.address_line2,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            pincode = EXCLUDED.pincode,
            country = EXCLUDED.country,
            is_default = EXCLUDED.is_default,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
        `;
      }
      console.log(`   ✅ Migrated ${addresses.length} addresses`);
    } else {
      console.log(`   ⚠️  No addresses found in Supabase`);
    }

    // 4. Migrate Orders
    console.log("\n4️⃣ Migrating orders...");
    const orders = await supabase`SELECT * FROM orders`;
    console.log(`   Found ${orders.length} orders in Supabase`);
    
    if (orders.length > 0) {
      for (const order of orders) {
        await neon`
          INSERT INTO orders ${neon(order)}
          ON CONFLICT (id) DO UPDATE SET
            order_number = EXCLUDED.order_number,
            user_id = EXCLUDED.user_id,
            subtotal = EXCLUDED.subtotal,
            shipping_cost = EXCLUDED.shipping_cost,
            tax = EXCLUDED.tax,
            total = EXCLUDED.total,
            status = EXCLUDED.status,
            payment_status = EXCLUDED.payment_status,
            shipping_address = EXCLUDED.shipping_address,
            tracking_number = EXCLUDED.tracking_number,
            notes = EXCLUDED.notes,
            cancelled_at = EXCLUDED.cancelled_at,
            cancel_reason = EXCLUDED.cancel_reason,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
        `;
      }
      console.log(`   ✅ Migrated ${orders.length} orders`);
    } else {
      console.log(`   ⚠️  No orders found in Supabase`);
    }

    // 5. Migrate Order Items
    console.log("\n5️⃣ Migrating order items...");
    const orderItems = await supabase`SELECT * FROM order_items`;
    console.log(`   Found ${orderItems.length} order items in Supabase`);
    
    if (orderItems.length > 0) {
      for (const item of orderItems) {
        await neon`
          INSERT INTO order_items ${neon(item)}
          ON CONFLICT (id) DO UPDATE SET
            order_id = EXCLUDED.order_id,
            product_id = EXCLUDED.product_id,
            quantity = EXCLUDED.quantity,
            price = EXCLUDED.price,
            weight = EXCLUDED.weight,
            created_at = EXCLUDED.created_at
        `;
      }
      console.log(`   ✅ Migrated ${orderItems.length} order items`);
    } else {
      console.log(`   ⚠️  No order items found in Supabase`);
    }

    // 6. Migrate Payments
    console.log("\n6️⃣ Migrating payments...");
    const payments = await supabase`SELECT * FROM payments`;
    console.log(`   Found ${payments.length} payments in Supabase`);
    
    if (payments.length > 0) {
      for (const payment of payments) {
        await neon`
          INSERT INTO payments ${neon(payment)}
          ON CONFLICT (id) DO UPDATE SET
            order_id = EXCLUDED.order_id,
            amount = EXCLUDED.amount,
            method = EXCLUDED.method,
            status = EXCLUDED.status,
            razorpay_order_id = EXCLUDED.razorpay_order_id,
            razorpay_payment_id = EXCLUDED.razorpay_payment_id,
            razorpay_signature = EXCLUDED.razorpay_signature,
            created_at = EXCLUDED.created_at
        `;
      }
      console.log(`   ✅ Migrated ${payments.length} payments`);
    } else {
      console.log(`   ⚠️  No payments found in Supabase`);
    }

    // 7. Migrate Fraud Logs (if table exists)
    console.log("\n7️⃣ Migrating fraud logs...");
    try {
      const fraudLogs = await supabase`SELECT * FROM fraud_logs`;
      console.log(`   Found ${fraudLogs.length} fraud logs in Supabase`);
      
      if (fraudLogs.length > 0) {
        for (const log of fraudLogs) {
          await neon`
            INSERT INTO fraud_logs ${neon(log)}
            ON CONFLICT (id) DO UPDATE SET
              user_id = EXCLUDED.user_id,
              event_type = EXCLUDED.event_type,
              risk_factors = EXCLUDED.risk_factors,
              ip_address = EXCLUDED.ip_address,
              device_info = EXCLUDED.device_info,
              action_taken = EXCLUDED.action_taken,
              created_at = EXCLUDED.created_at
          `;
        }
        console.log(`   ✅ Migrated ${fraudLogs.length} fraud logs`);
      } else {
        console.log(`   ⚠️  No fraud logs found in Supabase`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  Fraud logs table not found or error: ${error.message}`);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Addresses: ${addresses.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Order Items: ${orderItems.length}`);
    console.log(`   - Payments: ${payments.length}`);

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await supabase.end();
    await neon.end();
  }
}

migrateData();
