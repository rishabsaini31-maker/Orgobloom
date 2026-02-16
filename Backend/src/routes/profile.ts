import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "@/middleware/auth";
import { comparePassword, hashPassword } from "@/utils/auth";
import { ApiError } from "@/middleware/errorHandler";

const router = Router();

// Get current user profile
router.get("/me", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId!))
      .limit(1);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put("/profile", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user?.id;

    if (!name) {
      throw new ApiError("Name is required", 400);
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId!))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
      });

    res.json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put("/password", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword) {
      throw new ApiError("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new ApiError("Password must be at least 6 characters", 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId!))
      .limit(1);

    if (!user || !user.password) {
      throw new ApiError("User not found or password not set", 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ApiError("Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId!));

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
