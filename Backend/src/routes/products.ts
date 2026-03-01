import { Router, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import sharp from "sharp";
const router = Router();

// Supabase Storage Provider
import {
  getStorageProvider,
  CloudUploadResult,
} from "../utils/mediaStorage.js";

// Configure multer for temp storage before uploading to Supabase
const tempDir = path.resolve(process.cwd(), "uploads", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (reduced from 50MB)
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
  },
});

const productImageUpload = upload.fields([
  { name: "image", maxCount: 6 },
  { name: "images", maxCount: 6 },
]);

// POST /products/upload-image - Uses Supabase Storage
router.post(
  "/upload-image",
  productImageUpload,
  async (req: AuthRequest, res: Response) => {
    try {
      const fileMap = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const files = [...(fileMap?.image || []), ...(fileMap?.images || [])];

      if (!files.length) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const storageProvider = getStorageProvider();

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const timestamp = Date.now();
          const hash = createHash("sha256")
            .update(file.originalname + timestamp)
            .digest("hex")
            .substring(0, 8);
          const key = `products/${timestamp}-${hash}.webp`;

          const processedPath = path.join(
            tempDir,
            `processed-${path.basename(file.path)}.webp`,
          );

          await sharp(file.path)
            .resize(1200, 1200, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toFile(processedPath);

          const result: CloudUploadResult = await storageProvider.upload(
            processedPath,
            key,
            "image/webp",
          );

          fs.unlinkSync(processedPath);
          fs.unlinkSync(file.path);

          return { url: result.url, key: result.key };
        }),
      );

      res.json({
        url: uploaded[0]?.url,
        key: uploaded[0]?.key,
        urls: uploaded.map((item) => item.url),
        keys: uploaded.map((item) => item.key),
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Image upload failed" });
    }
  },
);

import { db } from "../db/index.js";
import { products } from "../db/schema/index.js";
import { eq, and, ilike, desc, sql, count } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "../middleware/auth.js";
import { productSchema } from "../utils/validations.js";
import { generateSlug } from "../utils/helpers.js";
import { ApiError } from "../middleware/errorHandler.js";

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

const fixImageList = (images: unknown): string[] => {
  if (!images) return [];

  const parsedImages =
    typeof images === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : Array.isArray(images)
        ? images
        : [];

  return parsedImages
    .filter(
      (url): url is string => typeof url === "string" && url.trim().length > 0,
    )
    .map((url) => fixImageUrl(url) || "")
    .filter((url) => url.length > 0);
};

const checkImageUrl = async (
  imageUrl: string,
): Promise<{
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error?: string;
}> => {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const headResponse = await fetch(imageUrl, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (headResponse.ok) {
      return {
        ok: true,
        status: headResponse.status,
        latencyMs: Date.now() - start,
      };
    }

    const getResponse = await fetch(imageUrl, {
      method: "GET",
      signal: controller.signal,
    });

    return {
      ok: getResponse.ok,
      status: getResponse.status,
      latencyMs: Date.now() - start,
      error: getResponse.ok ? undefined : `HTTP ${getResponse.status}`,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
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
      images: fixImageList((p as any).images),
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

// Check product image URL health (admin only)
router.get(
  "/image-health",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);

      const productRows = await db
        .select({
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          images: products.images,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .orderBy(desc(products.updatedAt))
        .limit(limit);

      const checks = await Promise.all(
        productRows.flatMap((product) => {
          const normalizedPrimary = fixImageUrl(product.imageUrl);
          const normalizedList = fixImageList((product as any).images);
          const allUrls = Array.from(
            new Set(
              [normalizedPrimary, ...normalizedList].filter(
                (url): url is string =>
                  typeof url === "string" && url.length > 0,
              ),
            ),
          );

          return allUrls.map(async (url) => {
            const result = await checkImageUrl(url);
            return {
              productId: product.id,
              productName: product.name,
              imageUrl: url,
              ok: result.ok,
              status: result.status,
              latencyMs: result.latencyMs,
              error: result.error,
            };
          });
        }),
      );

      const totalChecked = checks.length;
      const broken = checks.filter((item) => !item.ok);
      const slow = checks.filter((item) => item.ok && item.latencyMs > 1500);

      res.json({
        success: true,
        summary: {
          productsScanned: productRows.length,
          totalUrlsChecked: totalChecked,
          brokenCount: broken.length,
          slowCount: slow.length,
        },
        broken,
        slow,
      });
    } catch (error) {
      next(error);
    }
  },
);

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
        images: fixImageList((product as any).images),
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
        images: fixImageList((product as any).images),
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
        .set({ ...validatedData, updatedAt: new Date().toISOString() })
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
