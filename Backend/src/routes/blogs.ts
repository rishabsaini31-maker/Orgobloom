import express, { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { blogs } from "../db/schema/blogs";
import { authenticate, isAdmin, AuthRequest } from "../middleware/auth";
import { eq, desc, sql, and, or, like } from "drizzle-orm";

const router = express.Router();

// ===========================
// Public Routes
// ===========================

// Get all published blogs (public)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, limit = "10", offset = "0" } = req.query;

    let query = db
      .select()
      .from(blogs)
      .where(eq(blogs.published, true))
      .orderBy(desc(blogs.publishedAt));

    // Filter by category
    if (category && typeof category === "string") {
      query = db
        .select()
        .from(blogs)
        .where(and(eq(blogs.published, true), eq(blogs.category, category)))
        .orderBy(desc(blogs.publishedAt));
    }

    // Search functionality
    if (search && typeof search === "string") {
      query = db
        .select()
        .from(blogs)
        .where(
          and(
            eq(blogs.published, true),
            or(
              like(blogs.title, `%${search}%`),
              like(blogs.excerpt, `%${search}%`),
              like(blogs.content, `%${search}%`),
            ),
          ),
        )
        .orderBy(desc(blogs.publishedAt));
    }

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const allBlogs = await query.limit(limitNum).offset(offsetNum);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogs)
      .where(eq(blogs.published, true));

    res.json({
      blogs: allBlogs,
      total: countResult[0]?.count || 0,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    next(error);
  }
});

// Get featured blogs (public)
router.get(
  "/featured",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featuredBlogs = await db
        .select()
        .from(blogs)
        .where(and(eq(blogs.published, true), eq(blogs.featured, true)))
        .orderBy(desc(blogs.publishedAt))
        .limit(3);

      res.json(featuredBlogs);
    } catch (error) {
      next(error);
    }
  },
);

// Get blog categories (public)
router.get(
  "/categories",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await db
        .selectDistinct({ category: blogs.category })
        .from(blogs)
        .where(eq(blogs.published, true));

      res.json(categories.map((c) => c.category).filter(Boolean));
    } catch (error) {
      next(error);
    }
  },
);

// Get single blog by slug (public)
router.get(
  "/:slug",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const [blog] = await db
        .select()
        .from(blogs)
        .where(and(eq(blogs.slug, slug), eq(blogs.published, true)));

      if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // Increment view count
      await db
        .update(blogs)
        .set({ viewCount: (blog.viewCount || 0) + 1 })
        .where(eq(blogs.id, blog.id));

      res.json(blog);
    } catch (error) {
      next(error);
    }
  },
);

// ===========================
// Admin Routes
// ===========================

// Get all blogs (admin only - includes unpublished)
router.get(
  "/admin/all",
  authenticate,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = "20", offset = "0" } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      const allBlogs = await db
        .select()
        .from(blogs)
        .orderBy(desc(blogs.createdAt))
        .limit(limitNum)
        .offset(offsetNum);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(blogs);

      res.json({
        blogs: allBlogs,
        total: countResult[0]?.count || 0,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create new blog (admin only)
router.post(
  "/",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        featuredImageAlt,
        category,
        tags,
        author,
        metaTitle,
        metaDescription,
        published,
        featured,
        readTime,
      } = req.body;

      // Validate required fields
      if (!title || !slug || !content) {
        return res.status(400).json({
          error: "Title, slug, and content are required",
        });
      }

      // Check if slug already exists
      const [existingBlog] = await db
        .select()
        .from(blogs)
        .where(eq(blogs.slug, slug));

      if (existingBlog) {
        return res
          .status(400)
          .json({ error: "Blog with this slug already exists" });
      }

      const [newBlog] = await db
        .insert(blogs)
        .values({
          title,
          slug,
          excerpt: excerpt || title.substring(0, 150),
          content,
          featuredImage: featuredImage || null,
          featuredImageAlt: featuredImageAlt || null,
          category: category || "General",
          tags: tags || null,
          author: author || "Orgobloom Team",
          metaTitle: metaTitle || title,
          metaDescription:
            metaDescription || excerpt || title.substring(0, 160),
          published: published || false,
          featured: featured || false,
          readTime: readTime || 5,
          publishedAt: published ? new Date() : null,
        })
        .returning();

      res.status(201).json(newBlog);
    } catch (error) {
      next(error);
    }
  },
);

// Update blog (admin only)
router.put(
  "/:id",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        featuredImageAlt,
        category,
        tags,
        author,
        metaTitle,
        metaDescription,
        published,
        featured,
        readTime,
      } = req.body;

      // Check if blog exists
      const [existingBlog] = await db
        .select()
        .from(blogs)
        .where(eq(blogs.id, id));

      if (!existingBlog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // If slug is being changed, check for duplicates
      if (slug && slug !== existingBlog.slug) {
        const [duplicateSlug] = await db
          .select()
          .from(blogs)
          .where(eq(blogs.slug, slug));

        if (duplicateSlug) {
          return res
            .status(400)
            .json({ error: "Blog with this slug already exists" });
        }
      }

      // Determine if we should set publishedAt
      let publishedAt = existingBlog.publishedAt;
      if (published && !existingBlog.published) {
        publishedAt = new Date();
      }

      const [updatedBlog] = await db
        .update(blogs)
        .set({
          title: title || existingBlog.title,
          slug: slug || existingBlog.slug,
          excerpt: excerpt !== undefined ? excerpt : existingBlog.excerpt,
          content: content || existingBlog.content,
          featuredImage:
            featuredImage !== undefined
              ? featuredImage
              : existingBlog.featuredImage,
          featuredImageAlt:
            featuredImageAlt !== undefined
              ? featuredImageAlt
              : existingBlog.featuredImageAlt,
          category: category || existingBlog.category,
          tags: tags !== undefined ? tags : existingBlog.tags,
          author: author || existingBlog.author,
          metaTitle:
            metaTitle !== undefined ? metaTitle : existingBlog.metaTitle,
          metaDescription:
            metaDescription !== undefined
              ? metaDescription
              : existingBlog.metaDescription,
          published:
            published !== undefined ? published : existingBlog.published,
          featured: featured !== undefined ? featured : existingBlog.featured,
          readTime: readTime || existingBlog.readTime,
          publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(blogs.id, id))
        .returning();

      res.json(updatedBlog);
    } catch (error) {
      next(error);
    }
  },
);

// Delete blog (admin only)
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if blog exists
      const [existingBlog] = await db
        .select()
        .from(blogs)
        .where(eq(blogs.id, id));

      if (!existingBlog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      await db.delete(blogs).where(eq(blogs.id, id));

      res.json({ message: "Blog deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
