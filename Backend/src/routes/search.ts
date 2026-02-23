import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { products, orders, users, reviews } from "@/db/schema";
import { or, ilike, gte, lte, eq, and, SQL } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth";
import { ApiError } from "@/middleware/errorHandler";

const router = Router();

// All search routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Global search across all entities
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, type } = req.query;
    const searchTerm = String(q || "").trim();

    if (!searchTerm || searchTerm.length < 2) {
      throw new ApiError("Search term must be at least 2 characters", 400);
    }

    const results: any = {};

    // Search products
    if (!type || type === "all" || type === "products") {
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          isActive: products.isActive,
          category: products.category,
        })
        .from(products)
        .where(
          or(
            ilike(products.name, `%${searchTerm}%`),
            ilike(products.description, `%${searchTerm}%`),
          ),
        )
        .limit(20);

      results.products = productResults;
    }

    // Search orders
    if (!type || type === "all" || type === "orders") {
      const orderResults = await db
        .select({
          id: orders.id,
          status: orders.status,
          total: orders.total,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(ilike(orders.id, `%${searchTerm}%`))
        .limit(20);

      results.orders = orderResults;
    }

    // Search customers
    if (!type || type === "all" || type === "customers") {
      const customerResults = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
        })
        .from(users)
        .where(
          or(
            ilike(users.name, `%${searchTerm}%`),
            ilike(users.email, `%${searchTerm}%`),
            ilike(users.phone, `%${searchTerm}%`),
          ),
        )
        .limit(20);

      results.customers = customerResults;
    }

    // Search reviews
    if (!type || type === "all" || type === "reviews") {
      const reviewResults = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(ilike(reviews.comment, `%${searchTerm}%`))
        .limit(20);

      results.reviews = reviewResults;
    }

    res.json({
      success: true,
      query: searchTerm,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// Advanced product search with filters
router.get(
  "/products",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        q,
        status,
        category,
        minPrice,
        maxPrice,
        featured,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = parseInt(String(page));
      const limitNum = parseInt(String(limit));
      const offset = (pageNum - 1) * limitNum;

      // Build filter conditions
      const conditions: SQL[] = [];

      if (q) {
        conditions.push(
          or(
            ilike(products.name, `%${q}%`),
            ilike(products.description, `%${q}%`),
          )!,
        );
      }

      if (status) {
        conditions.push(
          eq(products.isActive, status === "true" || status === "active"),
        );
      }

      if (category) {
        conditions.push(eq(products.category, String(category)));
      }

      if (minPrice) {
        conditions.push(gte(products.price, Number(minPrice)));
      }

      if (maxPrice) {
        conditions.push(lte(products.price, Number(maxPrice)));
      }

      if (featured !== undefined) {
        conditions.push(eq(products.isFeatured, featured === "true"));
      }

      // Execute query
      const results = await db
        .select()
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limitNum)
        .offset(offset);

      // Get total count for pagination
      const totalResults = await db
        .select({ id: products.id })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({
        success: true,
        results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResults.length,
          totalPages: Math.ceil(totalResults.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Advanced order search with filters
router.get(
  "/orders",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        q,
        status,
        paymentStatus,
        startDate,
        endDate,
        minTotal,
        maxTotal,
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = parseInt(String(page));
      const limitNum = parseInt(String(limit));
      const offset = (pageNum - 1) * limitNum;

      // Build filter conditions
      const conditions: SQL[] = [];

      if (q) {
        conditions.push(ilike(orders.id, `%${q}%`));
      }

      if (status) {
        conditions.push(
          eq(
            orders.status,
            String(status) as
              | "PENDING"
              | "PROCESSING"
              | "CONFIRMED"
              | "SHIPPED"
              | "DELIVERED"
              | "CANCELLED",
          ),
        );
      }

      if (paymentStatus) {
        conditions.push(
          eq(
            orders.paymentStatus,
            String(paymentStatus) as
              | "PENDING"
              | "COMPLETED"
              | "FAILED"
              | "REFUNDED",
          ),
        );
      }

      if (startDate) {
        conditions.push(gte(orders.createdAt, new Date(String(startDate))));
      }

      if (endDate) {
        conditions.push(lte(orders.createdAt, new Date(String(endDate))));
      }

      if (minTotal) {
        conditions.push(gte(orders.total, Number(minTotal)));
      }

      if (maxTotal) {
        conditions.push(lte(orders.total, Number(maxTotal)));
      }

      // Execute query
      const results = await db
        .select()
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limitNum)
        .offset(offset);

      // Get total count
      const totalResults = await db
        .select({ id: orders.id })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({
        success: true,
        results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResults.length,
          totalPages: Math.ceil(totalResults.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Advanced customer search with filters
router.get(
  "/customers",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        q,
        role,
        isBlocked,
        fraudStatus,
        startDate,
        endDate,
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = parseInt(String(page));
      const limitNum = parseInt(String(limit));
      const offset = (pageNum - 1) * limitNum;

      // Build filter conditions
      const conditions: SQL[] = [];

      if (q) {
        conditions.push(
          or(
            ilike(users.name, `%${q}%`),
            ilike(users.email, `%${q}%`),
            ilike(users.phone, `%${q}%`),
          )!,
        );
      }

      if (role) {
        conditions.push(eq(users.role, String(role) as "CUSTOMER" | "ADMIN"));
      }

      if (isBlocked !== undefined) {
        conditions.push(eq(users.isBlocked, isBlocked === "true"));
      }

      if (fraudStatus) {
        conditions.push(
          eq(
            users.fraudStatus,
            String(fraudStatus) as "SAFE" | "MEDIUM_RISK" | "HIGH_RISK",
          ),
        );
      }

      if (startDate) {
        conditions.push(gte(users.createdAt, new Date(String(startDate))));
      }

      if (endDate) {
        conditions.push(lte(users.createdAt, new Date(String(endDate))));
      }

      // Execute query
      const results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isBlocked: users.isBlocked,
          fraudStatus: users.fraudStatus,
          riskScore: users.riskScore,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limitNum)
        .offset(offset);

      // Get total count
      const totalResults = await db
        .select({ id: users.id })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({
        success: true,
        results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResults.length,
          totalPages: Math.ceil(totalResults.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
