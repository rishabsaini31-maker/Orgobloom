import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@/db/schema";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: Partial<User>): string => {
  const secret = (process.env.JWT_SECRET || "your-secret-key") as any;
  return jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as any,
  );
};

export const generateRefreshToken = (userId: string): string => {
  const secret = (process.env.JWT_REFRESH_SECRET ||
    "your-refresh-secret") as any;
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  } as any);
};

export const verifyToken = (token: string): any => {
  const secret = (process.env.JWT_SECRET || "your-secret-key") as any;
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
};
