import { Router } from "express";
import { passwordResetLimiter } from "./src/middleware/rateLimiter";

const router = Router();

console.log(
  "passwordResetLimiter:",
  typeof passwordResetLimiter,
  !!passwordResetLimiter,
);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  async (req, res, next) => {
    res.json({ ok: true });
  },
);

console.log("Route registered successfully");
export default router;
