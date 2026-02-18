import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function updateAdminRole() {
  const adminEmail = process.env.ADMIN_EMAIL || "orgobloom5033@gmail.com";
  
  console.log(`Updating role to ADMIN for: ${adminEmail}`);
  
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ role: "ADMIN" })
      .where(eq(users.email, adminEmail))
      .returning();
    
    if (updatedUser) {
      console.log("✅ User role updated successfully!");
      console.log("User:", {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      });
    } else {
      console.log("❌ No user found with that email");
    }
  } catch (error) {
    console.error("Error updating user:", error);
  }
  
  process.exit(0);
}

updateAdminRole();