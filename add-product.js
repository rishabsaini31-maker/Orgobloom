// Quick script to add chicken manure product
const { v4: uuidv4 } = require("uuid");

const chickmanureProduct = {
  id: uuidv4(),
  name: "Premium Chicken Manure",
  slug: "chicken-manure",
  description:
    "High-nitrogen chicken manure boosts plant growth rapidly. Ideal for leafy greens, cereals, and heavy-feeding plants.",
  price: 320,
  weight: "1",
  stock: 150,
  imageUrl:
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop",
  category: "chicken",
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
};

console.log(JSON.stringify(chickmanureProduct, null, 2));
