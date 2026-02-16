/**
 * Fraud Detection Routes
 * Admin endpoints for fraud management
 * Protected by authentication middleware
 */

import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  getFraudSummary,
  getHighRiskUsersList,
  getMediumRiskUsersList,
  getUserFraudProfileEndpoint,
  getUserFraudEvents,
  blockUserForFraud,
  unblockUserForFraud,
  resetUserFraudScore,
  enableCODForUser,
  disableCODForUser,
} from "./fraud.controller.js";

const router = Router();

// All fraud routes require authentication
router.use(authenticate);

// Fraud summary and dashboard
router.get("/", getFraudSummary);

// High-risk users
router.get("/high-risk", getHighRiskUsersList);

// Medium-risk users
router.get("/medium-risk", getMediumRiskUsersList);

// User-specific endpoints
router.get("/user/:userId", getUserFraudProfileEndpoint);
router.get("/events/:userId", getUserFraudEvents);

// User management endpoints
router.patch("/block/:userId", blockUserForFraud);
router.patch("/unblock/:userId", unblockUserForFraud);
router.patch("/reset-score/:userId", resetUserFraudScore);

// COD management
router.patch("/enable-cod/:userId", enableCODForUser);
router.patch("/disable-cod/:userId", disableCODForUser);

export default router;
