import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// CSRF Token generation and verification
const CSRF_HEADER = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrf-token";

// Store for CSRF tokens (in production, use Redis)
const tokenStore = new Map<string, { token: string; expires: number }>();

// Generate CSRF token
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Clean expired tokens (run periodically)
const cleanExpiredTokens = () => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires < now) {
      tokenStore.delete(key);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanExpiredTokens, 600000);

// CSRF Protection Middleware
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    // Generate and set token for GET requests
    const sessionId = req.headers.authorization || req.ip || "anonymous";
    const token = generateCsrfToken();

    tokenStore.set(sessionId, {
      token,
      expires: Date.now() + 3600000, // 1 hour
    });

    // Set token in header (client should read and send back)
    res.setHeader("X-CSRF-Token", token);
    return next();
  }

  // For POST, PUT, DELETE, PATCH - verify token
  const sessionId = req.headers.authorization || req.ip || "anonymous";
  const storedToken = tokenStore.get(sessionId);

  const clientToken =
    req.headers[CSRF_HEADER] || req.body?._csrf || req.query?._csrf;

  if (!storedToken) {
    return res.status(403).json({
      error: "CSRF token not found. Please refresh the page.",
    });
  }

  if (storedToken.expires < Date.now()) {
    tokenStore.delete(sessionId);
    return res.status(403).json({
      error: "CSRF token expired. Please refresh the page.",
    });
  }

  if (!clientToken || clientToken !== storedToken.token) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  next();
};

// Double-submit cookie pattern for CSRF
export const csrfDoubleSubmit = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be accessible by JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });
    res.setHeader("X-CSRF-Token", token);
    return next();
  }

  // Verify double-submit
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: "CSRF token missing",
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({
      error: "CSRF token mismatch",
    });
  }

  next();
};

// Export both methods
export default {
  csrfProtection,
  csrfDoubleSubmit,
  generateCsrfToken,
};
