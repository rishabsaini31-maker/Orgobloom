import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "@/db/schema";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Use type assertion approach to avoid interface extension issues
export type AuthRequest = Request & {
  user?: User;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const jwtSecret = process.env.JWT_SECRET || "default-secret";
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    // Fetch actual user from database to get real role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach actual user to request
    (req as AuthRequest).user = user;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authReq = req as AuthRequest;

  if (!authReq.user || authReq.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || "default-secret";
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      (req as AuthRequest).user = {
        id: decoded.userId,
        email: "",
        name: "",
        role: "USER",
      } as unknown as User;
    }
    next();
  } catch {
    // Continue without user
    next();
  }
};
