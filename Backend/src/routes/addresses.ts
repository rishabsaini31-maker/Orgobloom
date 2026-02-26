import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "@/middleware/auth.js";
import { ApiError } from "@/middleware/errorHandler.js";

const router = Router();

// Get user addresses
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const userAddresses = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId));

      res.json({
        addresses: userAddresses,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create new address
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country,
        isDefault,
      } = req.body;

      // Validate required fields
      if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
        throw new ApiError("Please provide all required address fields", 400);
      }

      // If this is the default address, unset other default addresses
      if (isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, userId));
      }

      const [newAddress] = await db
        .insert(addresses)
        .values({
          userId,
          fullName,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          state,
          pincode,
          country: country || "India",
          isDefault: isDefault || false,
        })
        .returning();

      res.status(201).json({
        success: true,
        address: newAddress,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update address
router.put(
  "/:addressId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const addressId = req.params.addressId;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Check if address belongs to user
      const [address] = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (!address) {
        throw new ApiError("Address not found", 404);
      }

      const {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country,
        isDefault,
      } = req.body;

      // If this is the default address, unset other default addresses
      if (isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, userId));
      }

      const [updatedAddress] = await db
        .update(addresses)
        .set({
          fullName: fullName || address.fullName,
          phone: phone || address.phone,
          addressLine1: addressLine1 || address.addressLine1,
          addressLine2:
            addressLine2 !== undefined ? addressLine2 : address.addressLine2,
          city: city || address.city,
          state: state || address.state,
          pincode: pincode || address.pincode,
          country: country || address.country,
          isDefault: isDefault !== undefined ? isDefault : address.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, addressId))
        .returning();

      res.json({
        success: true,
        address: updatedAddress,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Delete address
router.delete(
  "/:addressId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const addressId = req.params.addressId;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Check if address belongs to user
      const [address] = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (!address) {
        throw new ApiError("Address not found", 404);
      }

      await db.delete(addresses).where(eq(addresses.id, addressId));

      res.json({
        success: true,
        message: "Address deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Set default address
router.post(
  "/:addressId/default",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const addressId = req.params.addressId;

      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      // Check if address belongs to user
      const [address] = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (!address) {
        throw new ApiError("Address not found", 404);
      }

      // Unset other default addresses
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));

      // Set this as default
      const [updatedAddress] = await db
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, addressId))
        .returning();

      res.json({
        success: true,
        address: updatedAddress,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
