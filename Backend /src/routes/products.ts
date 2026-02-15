import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, ilike, desc } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth";
import { productSchema } from "@/utils/validations";
import { generateSlug } from "@/utils/helpers";
import { ApiError } from "@/middleware/errorHandler";

const router = Router();

// Get all products (public)
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
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

    const allProducts = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));

    const total = allProducts.length;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    res.json({
      products: paginatedProducts,
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
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id))
      .limit(1);

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// Get product by slug (public)
router.get("/slug/:slug", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, req.params.slug))
      .limit(1);

    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// Create product (admin only)
router.post("/", authenticate, isAdmin, async (req: AuthRequest, res, next) => {
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
});

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
