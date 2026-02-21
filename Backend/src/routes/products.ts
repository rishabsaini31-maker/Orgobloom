import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, ilike, desc, sql, count } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth";
import { productSchema } from "@/utils/validations";
import { generateSlug } from "@/utils/helpers";
import { ApiError } from "@/middleware/errorHandler";

const router = Router();

// Helper function to fix emoji imageUrls and localhost URLs
const fixImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url === "🐄")
    return "https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=400&h=400&fit=crop";
  if (url === "🐔")
    return "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop";
  
  // Fix localhost URLs for production - use the BASE_URL from environment
  const baseUrl = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL;
  if (baseUrl && url.includes('localhost')) {
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
        .where(and(...conditions))
    ]);

    const total = countResult[0]?.count || 0;

    // Fix emoji imageUrls
    const productsWithFixedImages = paginatedProducts.map((p) => ({
      ...p,
      imageUrl: fixImageUrl(p.imageUrl),
    }));

    // Set cache headers for better performance (cache for 5 minutes)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.set('CDN-Cache-Control', 'public, max-age=300');
    
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
      const validatedData = productSchema.parse(req.body);

      // Auto-generate slug if not provided
      if (!validatedData.slug) {
        validatedData.slug = generateSlug(validatedData.name);
      }

      // Check if slug exists
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.slug, validatedData.slug))
        .limit(1);

      if (existing) {
        throw new ApiError("Product with this slug already exists", 400);
      }

      const [product] = await db
        .insert(products)
        .values(validatedData)
        .returning();

      res.status(201).json({ product });
    } catch (error) {
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
