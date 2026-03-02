// @ts-nocheck
import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { products } from "../db/schema/products.js";
import { logger } from "../utils/logger.js";
import { sql, ilike, or, and } from "drizzle-orm";

const router = Router();

/**
 * @route   GET /api/search/products
 * @desc    Search products with full-text search, filters, and pagination
 * @access  Public
 */
router.get("/products", async (req: Request, res: Response) => {
  try {
    const {
      q = "",
      category,
      minPrice = 0,
      maxPrice = 100000,
      page = 1,
      limit = 20,
      sort = "relevance",
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build search query
    let query: any = db.select().from(products);

    // Full-text search using PostgreSQL tsvector
    if (q) {
      const searchTerms = String(q)
        .split(" ")
        .filter((term) => term.length > 0)
        .join(" | ");

      query = query.where(
        or(
          sql`to_tsvector('english', ${products.name}) @@ plainto_tsquery('english', ${String(q)})`,
          sql`to_tsvector('english', ${products.description}) @@ plainto_tsquery('english', ${String(q)})`,
          ilike(products.name, `%${q}%`),
        ),
      );
    }

    // Apply filters
    if (category) {
      query = query.where(ilike(products.category, `%${String(category)}%`));
    }

    // Price filter
    query = query.where(
      and(
        sql`${products.price} >= ${Number(minPrice)}`,
        sql`${products.price} <= ${Number(maxPrice)}`,
      ),
    );

    // Only show active products
    query = query.where(sql`${products.isActive} = true`);

    // Apply sorting
    if (sort === "price-low") {
      query = query.orderBy(products.price);
    } else if (sort === "price-high") {
      query = query.orderBy(sql`${products.price} DESC`);
    } else if (sort === "newest") {
      query = query.orderBy(sql`${products.createdAt} DESC`);
    } else if (sort === "popular") {
      query = query.orderBy(sql`${products.salesCount} DESC`);
    } else {
      // Default: relevance (for text search) or newest
      query = q
        ? query.orderBy(
            sql`ts_rank(to_tsvector('english', ${products.name}), plainto_tsquery('english', ${String(q)})) DESC`,
          )
        : query.orderBy(sql`${products.createdAt} DESC`);
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(
        and(
          or(
            !q
              ? sql`true`
              : sql`to_tsvector('english', ${products.name}) @@ plainto_tsquery('english', ${String(q)})`,
            !q
              ? sql`true`
              : sql`to_tsvector('english', ${products.description}) @@ plainto_tsquery('english', ${String(q)})`,
          ),
          category
            ? ilike(products.category, `%${String(category)}%`)
            : sql`true`,
          sql`${products.price} >= ${Number(minPrice)}`,
          sql`${products.price} <= ${Number(maxPrice)}`,
          sql`${products.status} = 'ACTIVE'`,
        ),
      );

    const totalCount = Number(countResult[0]?.count || 0);

    // Fetch results
    const results = await query.limit(Number(limit)).offset(offset);

    res.json({
      results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit)),
      },
      query: {
        search: q,
        category,
        priceRange: { min: minPrice, max: maxPrice },
        sort,
      },
    });
  } catch (error) {
    logger.error("Search failed", { error });
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions/autocomplete
 * @access  Public
 */
router.get("/suggestions", async (req: Request, res: Response) => {
  try {
    const { q = "" } = req.query;

    if (!q || String(q).length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get top 10 matching product names
    const suggestions = await db
      .select({ name: products.name })
      .from(products)
      .where(
        and(
          ilike(products.name, `%${String(q)}%`),
          sql`${products.status} = 'ACTIVE'`,
        ),
      )
      .limit(10)
      .orderBy(sql`${products.salesCount} DESC`);

    // Get unique suggestions
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map((s) => [s.name, s])).values(),
    );

    res.json({
      suggestions: uniqueSuggestions.map((s) => ({
        text: s.name,
        type: "product",
      })),
    });
  } catch (error) {
    logger.error("Suggestions failed", { error });
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

/**
 * @route   GET /api/search/facets
 * @desc    Get available facets (categories, price ranges, ratings)
 * @access  Public
 */
router.get("/facets", async (req: Request, res: Response) => {
  try {
    // Get categories with product counts
    const categories = await db
      .select({
        category: products.category,
        count: sql`count(*) as product_count`,
      })
      .from(products)
      .where(sql`${products.status} = 'ACTIVE'`)
      .groupBy(products.category)
      .orderBy(sql`product_count DESC`);

    // Price ranges
    const priceRanges = [
      { label: "Under ₹500", min: 0, max: 500 },
      { label: "₹500 - ₹1000", min: 500, max: 1000 },
      { label: "₹1000 - ₹5000", min: 1000, max: 5000 },
      { label: "₹5000 - ₹10000", min: 5000, max: 10000 },
      { label: "₹10000+", min: 10000, max: 999999 },
    ];

    // Count products in each price range
    const priceDistribution = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await db
          .select({ count: sql`count(*)` })
          .from(products)
          .where(
            and(
              sql`${products.price} >= ${range.min}`,
              sql`${products.price} <= ${range.max}`,
              sql`${products.status} = 'ACTIVE'`,
            ),
          );

        return {
          ...range,
          count: Number(count[0]?.count || 0),
        };
      }),
    );

    res.json({
      facets: {
        categories: categories.map((c) => ({
          name: c.category,
          count: Number(c.count),
        })),
        priceRanges: priceDistribution.filter((p) => p.count > 0),
        ratings: [
          { stars: 4, min: 4, max: 5, label: "4★ & up" },
          { stars: 3, min: 3, max: 5, label: "3★ & up" },
          { stars: 2, min: 2, max: 5, label: "2★ & up" },
        ],
      },
    });
  } catch (error) {
    logger.error("Facets fetch failed", { error });
    res.status(500).json({ error: "Failed to fetch facets" });
  }
});

/**
 * @route   GET /api/search/trending
 * @desc    Get trending searches
 * @access  Public
 */
router.get("/trending", async (req: Request, res: Response) => {
  try {
    const trending = await db
      .select({
        category: products.category,
        count: sql`count(*) as search_count`,
      })
      .from(products)
      .where(sql`${products.status} = 'ACTIVE'`)
      .groupBy(products.category)
      .orderBy(sql`search_count DESC`)
      .limit(10);

    res.json({
      trending: trending.map((t) => ({
        name: t.category,
        searches: Number(t.count),
      })),
    });
  } catch (error) {
    logger.error("Trending fetch failed", { error });
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

/**
 * @route   GET /api/search/advanced
 * @desc    Advanced search with multiple filters
 * @access  Public
 */
router.post("/advanced", async (req: Request, res: Response) => {
  try {
    const {
      keywords = "",
      categories = [],
      priceMin = 0,
      priceMax = 999999,
      ratingMin = 0,
      inStock = true,
      sortBy = "relevance",
      page = 1,
      limit = 20,
    } = req.body;

    const offset = (page - 1) * limit;

    let query = db.select().from(products);

    // Multi-keyword search
    if (keywords) {
      const keywordArray = keywords
        .split(" ")
        .filter((k: string) => k.length > 0);
      query = query.where(
        or(
          ...keywordArray.map((k: string) =>
            or(
              ilike(products.name, `%${k}%`),
              ilike(products.description, `%${k}%`),
            ),
          ),
        ),
      );
    }

    // Multiple categories
    if (categories.length > 0) {
      query = query.where(
        or(
          ...categories.map((cat: string) =>
            ilike(products.category, `%${cat}%`),
          ),
        ),
      );
    }

    // Price range
    query = query.where(
      and(
        sql`${products.price} >= ${priceMin}`,
        sql`${products.price} <= ${priceMax}`,
      ),
    );

    // Stock filter
    if (inStock) {
      query = query.where(sql`${products.stock} > 0`);
    }

    // Get results
    const results = await query.limit(limit).offset(offset);

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(
        and(
          keywords
            ? or(
                ilike(products.name, `%${keywords}%`),
                ilike(products.description, `%${keywords}%`),
              )
            : sql`true`,
          categories.length > 0
            ? or(
                ...categories.map((cat: string) =>
                  ilike(products.category, `%${cat}%`),
                ),
              )
            : sql`true`,
          sql`${products.price} >= ${priceMin}`,
          sql`${products.price} <= ${priceMax}`,
        ),
      );

    res.json({
      results,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count || 0),
      },
    });
  } catch (error) {
    logger.error("Advanced search failed", { error });
    res.status(500).json({ error: "Advanced search failed" });
  }
});

export default router;
