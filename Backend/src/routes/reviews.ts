import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { reviews } from "@/db/schema/reviews.js";
import { products } from "@/db/schema";
import { eq, and, desc, avg, sql } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth.js";
import { ApiError } from "@/middleware/errorHandler.js";

const router = Router();

// Get reviews for a product
router.get(
  "/product/:productId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const productReviews = await db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.productId, productId), eq(reviews.isApproved, true)),
        )
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(
          and(eq(reviews.productId, productId), eq(reviews.isApproved, true)),
        );

      // Get average rating
      const [{ average }] = await db
        .select({ average: avg(reviews.rating) })
        .from(reviews)
        .where(
          and(eq(reviews.productId, productId), eq(reviews.isApproved, true)),
        );

      res.json({
        reviews: productReviews,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
        averageRating: Number(average) || 0,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create a review
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { productId, rating, title, comment, images } = req.body;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        throw new ApiError("Rating must be between 1 and 5", 400);
      }

      // Check if product exists
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        throw new ApiError("Product not found", 404);
      }

      // Check if user already reviewed this product
      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.userId, userId), eq(reviews.productId, productId)),
        )
        .limit(1);

      if (existingReview) {
        throw new ApiError("You have already reviewed this product", 400);
      }

      // Create review
      const [newReview] = await db
        .insert(reviews)
        .values({
          userId,
          productId,
          rating,
          title,
          comment,
          images: images || [],
          isApproved: false, // Requires admin approval
        })
        .returning();

      res.status(201).json({
        success: true,
        message: "Review submitted. It will be visible after approval.",
        review: newReview,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update review
router.put(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { rating, title, comment, images } = req.body;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Check if review exists and belongs to user
      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, id))
        .limit(1);

      if (!existingReview) {
        throw new ApiError("Review not found", 404);
      }

      if (existingReview.userId !== userId) {
        throw new ApiError("You can only edit your own reviews", 403);
      }

      // Update review
      const [updatedReview] = await db
        .update(reviews)
        .set({
          rating: rating || existingReview.rating,
          title: title || existingReview.title,
          comment: comment || existingReview.comment,
          images: images || existingReview.images,
          isApproved: false, // Reset approval on edit
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, id))
        .returning();

      res.json({
        success: true,
        message: "Review updated. It will be visible after approval.",
        review: updatedReview,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Delete review
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Check if review exists and belongs to user
      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, id))
        .limit(1);

      if (!existingReview) {
        throw new ApiError("Review not found", 404);
      }

      if (existingReview.userId !== userId && req.user?.role !== "ADMIN") {
        throw new ApiError("You can only delete your own reviews", 403);
      }

      await db.delete(reviews).where(eq(reviews.id, id));

      res.json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Mark review as helpful
router.post(
  "/:id/helpful",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, id))
        .limit(1);

      if (!existingReview) {
        throw new ApiError("Review not found", 404);
      }

      const [updatedReview] = await db
        .update(reviews)
        .set({
          helpfulCount: existingReview.helpfulCount + 1,
        })
        .where(eq(reviews.id, id))
        .returning();

      res.json({
        success: true,
        helpfulCount: updatedReview.helpfulCount,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Get all reviews (with pending approval)
router.get(
  "/admin/all",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string; // 'pending', 'approved', 'all'

      const offset = (page - 1) * limit;

      let query = db.select().from(reviews);

      if (status === "pending") {
        query = query.where(eq(reviews.isApproved, false)) as any;
      } else if (status === "approved") {
        query = query.where(eq(reviews.isApproved, true)) as any;
      }

      const allReviews = await query
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({
        reviews: allReviews,
        pagination: {
          page,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Approve/Reject review
router.patch(
  "/:id/moderate",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isApproved, isFeatured } = req.body;

      const [updatedReview] = await db
        .update(reviews)
        .set({
          isApproved: isApproved !== undefined ? isApproved : undefined,
          isFeatured: isFeatured !== undefined ? isFeatured : undefined,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, id))
        .returning();

      if (!updatedReview) {
        throw new ApiError("Review not found", 404);
      }

      res.json({
        success: true,
        review: updatedReview,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
