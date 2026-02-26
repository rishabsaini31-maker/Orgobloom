import { Router, Response, NextFunction } from "express";
const router = Router();
// Cloudinary image upload endpoint
const { upload } = require("../utils/cloudinary");

// POST /products/upload-image
router.post(
  "/upload-image",
  upload.single("image"),
  (req: AuthRequest, res: Response) => {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "Image upload failed" });
    }
    res.json({ url: req.file.path }); // Cloudinary URL
  },
);
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, ilike, desc, sql, count } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth";
import { productSchema } from "@/utils/validations";
import { generateSlug } from "@/utils/helpers";
import { ApiError } from "@/middleware/errorHandler";

// Duplicate router declaration removed

// Helper function to fix emoji imageUrls and localhost URLs
const fixImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url === "🐄")
    return "https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=400&h=400&fit=crop";
  if (url === "🐔")
    return "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop";

  // Fix localhost URLs for production - use the BASE_URL from environment
  const baseUrl = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL;
  if (baseUrl && url.includes("localhost")) {
    // Extract the path after /uploads/
    const uploadsMatch = url.match(/\/uploads\/(.+)$/);
    if (uploadsMatch) {
      return `${baseUrl}/uploads/${uploadsMatch[1]}`;
    }
    // If no /uploads/ pattern, try to extract path after port
    const pathMatch = url.match(/localhost:\d+\/(.+)$/);
    if (pathMatch) {
      return `${baseUrl}/${pathMatch[1]}`;
    }
  }

  return url;
};

// Get all products (public) - Optimized with database-level pagination
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50); // Cap at 50
    const search = req.query.search as string;
    const featured = req.query.featured === "true";
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(products.isActive, true)];

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    if (featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    // Use Promise.all for parallel queries
    const [paginatedProducts, countResult] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(products)
        .where(and(...conditions)),
    ]);

    const total = countResult[0]?.count || 0;

    // Fix emoji imageUrls
    const productsWithFixedImages = paginatedProducts.map((p) => ({
      ...p,
      imageUrl: fixImageUrl(p.imageUrl),
    }));

    // Disable caching to always show fresh products
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    res.json({
      products: productsWithFixedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID (public)
router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, req.params.id))
        .limit(1);

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      const fixedProduct = {
        ...product,
        imageUrl: fixImageUrl(product.imageUrl),
      };
      res.json({ product: fixedProduct });
    } catch (error) {
      next(error);
    }
  },
);

// Get product by slug (public)
router.get(
  "/slug/:slug",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.slug, req.params.slug))
        .limit(1);

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      const fixedProduct = {
        ...product,
        imageUrl: fixImageUrl(product.imageUrl),
      };
      res.json({ product: fixedProduct });
    } catch (error) {
      next(error);
    }
  },
);

// Create product (admin only)
router.post(
  "/",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Map form fields to schema fields
      const data = {
        name: req.body.name,
        description: req.body.description || "",
        price: parseFloat(req.body.price) || 0,
        comparePrice: req.body.comparePrice
          ? parseFloat(req.body.comparePrice)
          : null,
        weight: req.body.weight || "500g",
        stock: parseInt(req.body.stock, 10) || 0,
        imageUrl: req.body.imageUrl || null,
        imageAltText: req.body.imageAltText || null,
        images: req.body.images || null,
        category: req.body.category || "cow",
        benefits: req.body.benefits || null,
        usage: req.body.howToUse || req.body.usage || null,
        composition: req.body.compositions || req.body.composition || null,
        metaTitle: req.body.metaTitle || null,
        metaDescription: req.body.metaDescription || null,
        isActive: true,
        isFeatured: false,
      };

      const validatedData = productSchema.parse(data);

      // Auto-generate slug if not provided
      const slug = req.body.slug || generateSlug(validatedData.name);

      // Check if slug exists
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (existing) {
        throw new ApiError("Product with this slug already exists", 400);
      }

      const [product] = await db
        .insert(products)
        .values({
          ...validatedData,
          slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      res.status(201).json({ product });
    } catch (error) {
      console.error("Create product error:", error);
      next(error);
    }
  },
);

// Update product (admin only)
router.put(
  "/:id",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = productSchema.partial().parse(req.body);

      const [updatedProduct] = await db
        .update(products)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(products.id, req.params.id))
        .returning();

      if (!updatedProduct) {
        throw new ApiError("Product not found", 404);
      }

      res.json({ product: updatedProduct });
    } catch (error) {
      next(error);
    }
  },
);

// Delete product (admin only)
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [deleted] = await db
        .delete(products)
        .where(eq(products.id, req.params.id))
        .returning();

      if (!deleted) {
        throw new ApiError("Product not found", 404);
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
