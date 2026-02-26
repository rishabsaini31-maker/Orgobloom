import { db } from "./db.js";
import { products } from "./db/schema.js";
import { createId } from "@paralleldrive/cuid2";
import * as dotenv from "dotenv";

dotenv.config();

async function addChickenProduct() {
  try {
    console.log("🐔 Adding Chicken Manure product...");

    const newProduct = await db
      .insert(products)
      .values({
        id: createId(),
        name: "Premium Chicken Manure",
        slug: "chicken-manure",
        description:
          "High-nitrogen chicken manure boosts plant growth rapidly. Ideal for leafy greens, cereals, and heavy-feeding plants.",
        price: 320,
        stock: 150,
        category: "chicken",
        weight: "1",
        imageUrl:
          "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop",
        benefits: [
          "✓ High nitrogen content (3.2%)",
          "✓ Fast nutrient release",
          "✓ Enhances foliage growth",
          "✓ Kills weed seeds",
        ],
        usage: "Use 1-2 kg per sq.meter, mix well with soil before planting",
        composition: "N: 3.2% | P: 2.1% | K: 1.5%",
        isActive: true,
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("✅ Chicken Manure product added successfully!");
    console.log(`📦 Product ID: ${newProduct[0].id}`);
    console.log(`📝 Product Name: ${newProduct[0].name}`);
    console.log(`💰 Price: ₹${newProduct[0].price}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding product:", error);
    process.exit(1);
  }
}

addChickenProduct();
