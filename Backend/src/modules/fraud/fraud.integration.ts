/**
 * Fraud Integration Layer
 * TypeScript wrapper for fraud service integration
 * Bridges fraud detection into existing TypeScript routes
 */

import { evaluateFraudRisk } from "./fraud.service.js";
import { getClientIP, generateDeviceFingerprint } from "./fraud.utils.js";

/**
 * Trigger fraud evaluation on login
 * Called after successful authentication
 */
export const triggerLoginFraudCheck = async (
  req: any,
  userId: string,
  userEmail: string,
) => {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";
    const acceptLanguage = req.headers["accept-language"] || "";
    const deviceFingerprint = generateDeviceFingerprint(
      userAgent,
      acceptLanguage,
    );

    // Evaluate fraud risk
    const result = await evaluateFraudRisk(userId, "LOGIN", {
      ipAddress,
      deviceFingerprint,
      userAgent,
      acceptLanguage,
      email: userEmail,
    });

    console.log(
      `[FRAUD-INTEGRATION] Login fraud check - User: ${userId}`,
      result,
    );

    return result;
  } catch (error) {
    console.error(`[FRAUD-INTEGRATION] Login fraud check error:`, error);
    // Don't block login on fraud check error - log and continue
    return null;
  }
};

/**
 * Trigger fraud evaluation on order placement
 */
export const triggerOrderPlacedFraudCheck = async (
  req: any,
  userId: string,
  orderData: any,
) => {
  try {
    const ipAddress = getClientIP(req);

    const result = await evaluateFraudRisk(userId, "ORDER_PLACED", {
      ipAddress,
      order: orderData,
      shippingCountry: orderData.shippingCountry || "IN",
    });

    console.log(
      `[FRAUD-INTEGRATION] Order fraud check - User: ${userId}`,
      result,
    );

    return result;
  } catch (error) {
    console.error(`[FRAUD-INTEGRATION] Order fraud check error:`, error);
    return null;
  }
};

/**
 * Trigger fraud evaluation on payment failure
 */
export const triggerPaymentFailedFraudCheck = async (
  userId: string,
  paymentData: any,
) => {
  try {
    const result = await evaluateFraudRisk(userId, "PAYMENT_FAILED", {
      paymentMethod: paymentData.method,
      amount: paymentData.amount,
      errorCode: paymentData.errorCode,
    });

    console.log(
      `[FRAUD-INTEGRATION] Payment failed fraud check - User: ${userId}`,
      result,
    );

    return result;
  } catch (error) {
    console.error(
      `[FRAUD-INTEGRATION] Payment failed fraud check error:`,
      error,
    );
    return null;
  }
};

/**
 * Trigger fraud evaluation on return request
 */
export const triggerReturnRequestedFraudCheck = async (
  userId: string,
  returnData: any,
) => {
  try {
    const result = await evaluateFraudRisk(userId, "RETURN_REQUESTED", {
      orderId: returnData.orderId,
      reason: returnData.reason,
      amount: returnData.amount,
    });

    console.log(
      `[FRAUD-INTEGRATION] Return fraud check - User: ${userId}`,
      result,
    );

    return result;
  } catch (error) {
    console.error(`[FRAUD-INTEGRATION] Return fraud check error:`, error);
    return null;
  }
};

/**
 * Trigger fraud evaluation on COD rejection
 */
export const triggerCODRejectedFraudCheck = async (
  userId: string,
  codData: any,
) => {
  try {
    const result = await evaluateFraudRisk(userId, "COD_REJECTED", {
      orderId: codData.orderId,
      amount: codData.amount,
      rejectionReason: codData.rejectionReason,
    });

    console.log(
      `[FRAUD-INTEGRATION] COD rejected fraud check - User: ${userId}`,
      result,
    );

    return result;
  } catch (error) {
    console.error(`[FRAUD-INTEGRATION] COD rejected fraud check error:`, error);
    return null;
  }
};

export default {
  triggerLoginFraudCheck,
  triggerOrderPlacedFraudCheck,
  triggerPaymentFailedFraudCheck,
  triggerReturnRequestedFraudCheck,
  triggerCODRejectedFraudCheck,
};
