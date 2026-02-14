/**
 * Fraud Detection Rules Engine
 * Modular, scalable rules for risk scoring
 * Each rule is independent and composable for flexibility
 *
 * Future AI Ready: Rules are abstract and can be enhanced with ML models
 */

/**
 * ACCOUNT_AGE_RULE
 * Penalizes very new accounts as they're higher risk
 */
export const ACCOUNT_AGE_RULE = {
  name: "ACCOUNT_AGE_RULE",
  riskPoints: 10,
  evaluate: (userData) => {
    if (!userData.createdAt) return 0;

    const accountAgeHours =
      (Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60);
    return accountAgeHours < 24 ? 10 : 0;
  },
  reason: "New account (less than 24 hours old)",
};

/**
 * HIGH_ORDER_VALUE_RULE
 * Flags unusually high-value orders
 */
export const HIGH_ORDER_VALUE_RULE = {
  name: "HIGH_ORDER_VALUE_RULE",
  riskPoints: 20,
  threshold: 20000,
  evaluate: (orderData) => {
    if (!orderData || !orderData.total) return 0;
    return orderData.total > 20000 ? 20 : 0;
  },
  reason: "High order value (>INR 20,000)",
};

/**
 * FAILED_PAYMENT_RULE
 * Detects payment processing issues - potential fraud pattern
 * 3+ failures within 1 hour = suspicious
 */
export const FAILED_PAYMENT_RULE = {
  name: "FAILED_PAYMENT_RULE",
  riskPoints: 25,
  threshold: 3,
  timeWindow: 60, // minutes
  evaluate: (paymentCount) => {
    return paymentCount >= 3 ? 25 : 0;
  },
  reason:
    "Multiple failed payment attempts (3+) within 1 hour - may indicate card test or fraud",
};

/**
 * RETURN_ABUSE_RULE
 * High return ratio indicates potential return fraud
 * Return ratio > 60% = abuse pattern
 */
export const RETURN_ABUSE_RULE = {
  name: "RETURN_ABUSE_RULE",
  riskPoints: 25,
  threshold: 0.6,
  evaluate: (totalOrders, returnedOrders) => {
    if (totalOrders === 0) return 0;
    const returnRatio = returnedOrders / totalOrders;
    return returnRatio > 0.6 ? 25 : 0;
  },
  reason: "Excessive returns - return ratio exceeds 60%",
};

/**
 * COD_ABUSE_RULE
 * Tracks COD payment failures
 * 2+ COD rejections = disable COD + risk points
 */
export const COD_ABUSE_RULE = {
  name: "COD_ABUSE_RULE",
  riskPoints: 20,
  threshold: 2,
  evaluate: (codRejectionCount) => {
    return codRejectionCount >= 2 ? 20 : 0;
  },
  disableCOD: (codRejectionCount) => {
    return codRejectionCount >= 2;
  },
  reason: "Multiple COD rejections (2+) - Cash on Delivery disabled",
};

/**
 * IP_MISMATCH_RULE
 * Compares login IP with shipping address country
 * Significant mismatch = fraud indicator
 */
export const IP_MISMATCH_RULE = {
  name: "IP_MISMATCH_RULE",
  riskPoints: 15,
  evaluate: (ipCountry, shippingCountry) => {
    if (!ipCountry || !shippingCountry) return 0;
    return ipCountry !== shippingCountry ? 15 : 0;
  },
  reason:
    "IP location mismatch with shipping address - possible account takeover",
};

/**
 * VELOCITY_RULE
 * Detects rapid successive transactions
 * 5 orders in 5 minutes OR 10 login attempts in 2 minutes
 */
export const VELOCITY_RULE = {
  name: "VELOCITY_RULE",
  evaluate: (velocityType, count, timeWindow) => {
    // High order velocity: 5+ orders in 5 minutes
    if (velocityType === "orders" && count >= 5 && timeWindow <= 5) {
      return { riskPoints: 30, reason: "5+ orders placed within 5 minutes" };
    }

    // High login velocity: 10+ attempts in 2 minutes
    if (velocityType === "login" && count >= 10 && timeWindow <= 2) {
      return {
        riskPoints: 20,
        reason: "10+ login attempts within 2 minutes",
      };
    }

    return { riskPoints: 0, reason: null };
  },
};

/**
 * MULTI_ACCOUNT_DEVICE_RULE
 * Detects device fingerprint reuse across multiple accounts
 * Same device used by 3+ accounts = fraud network
 */
export const MULTI_ACCOUNT_DEVICE_RULE = {
  name: "MULTI_ACCOUNT_DEVICE_RULE",
  riskPoints: 30,
  threshold: 3,
  evaluate: (accountCountForDevice) => {
    return accountCountForDevice >= 3 ? 30 : 0;
  },
  reason: "Device fingerprint linked to 3+ accounts - possible fraud network",
};

/**
 * GEOGRAPHICAL_ANOMALY_RULE
 * Detects impossible travel (orders from different countries in short time)
 */
export const GEOGRAPHICAL_ANOMALY_RULE = {
  name: "GEOGRAPHICAL_ANOMALY_RULE",
  riskPoints: 20,
  timeWindow: 60, // minutes
  evaluate: (locations) => {
    if (locations.length < 2) return 0;
    // If 2+ different countries in last hour, flag it
    const uniqueCountries = new Set(locations.map((l) => l.country));
    return uniqueCountries.size > 1 ? 20 : 0;
  },
  reason: "Impossible travel - orders from multiple countries in short time",
};

/**
 * EMAIL_VERIFICATION_RULE
 * Unverified email accounts have higher risk
 */
export const EMAIL_VERIFICATION_RULE = {
  name: "EMAIL_VERIFICATION_RULE",
  riskPoints: 15,
  evaluate: (isEmailVerified) => {
    return !isEmailVerified ? 15 : 0;
  },
  reason: "Unverified email address",
};

/**
 * EXPORT All Rules
 * Makes it easy to iterate through all rules
 */
export const FRAUD_RULES = [
  ACCOUNT_AGE_RULE,
  HIGH_ORDER_VALUE_RULE,
  FAILED_PAYMENT_RULE,
  RETURN_ABUSE_RULE,
  COD_ABUSE_RULE,
  IP_MISMATCH_RULE,
  VELOCITY_RULE,
  MULTI_ACCOUNT_DEVICE_RULE,
  GEOGRAPHICAL_ANOMALY_RULE,
  EMAIL_VERIFICATION_RULE,
];

/**
 * Risk Score Thresholds
 * Determines fraud status based on accumulated risk points
 */
export const RISK_THRESHOLDS = {
  SAFE: { min: 0, max: 30 },
  MEDIUM_RISK: { min: 30, max: 60 },
  HIGH_RISK: { min: 60, max: Infinity },
};

/**
 * Get fraud status from risk score
 * @param {number} riskScore - Accumulated risk points
 * @returns {string} - SAFE, MEDIUM_RISK, or HIGH_RISK
 */
export const getFraudStatus = (riskScore) => {
  if (riskScore < 30) return "SAFE";
  if (riskScore >= 30 && riskScore < 60) return "MEDIUM_RISK";
  return "HIGH_RISK";
};

/**
 * Get action recommendations based on fraud status
 */
export const getFraudActions = (fraudStatus) => {
  switch (fraudStatus) {
    case "SAFE":
      return {
        allowCheckout: true,
        allowCOD: true,
        requireManualApproval: false,
        message: "Low fraud risk - proceed normally",
      };

    case "MEDIUM_RISK":
      return {
        allowCheckout: true,
        allowCOD: false,
        requireManualApproval: false,
        message: "Medium fraud risk - COD disabled, online payment required",
      };

    case "HIGH_RISK":
      return {
        allowCheckout: false,
        allowCOD: false,
        requireManualApproval: true,
        message:
          "High fraud risk - Manual admin approval required before checkout",
      };

    default:
      return {
        allowCheckout: false,
        allowCOD: false,
        requireManualApproval: true,
        message: "Unknown fraud status",
      };
  }
};
