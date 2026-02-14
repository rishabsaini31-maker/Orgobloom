/**
 * Fraud Detection Utilities
 * Helper functions for common fraud detection operations
 */

/**
 * Get country from IP address (mock function - integrate with GeoIP service)
 * In production, use services like MaxMind GeoIP2, IP2Location, or similar
 * @param {string} ipAddress - IP address to geolocate
 * @returns {string} - Country code
 */
export const getCountryFromIP = async (ipAddress) => {
  if (!ipAddress || ipAddress === "localhost" || ipAddress === "127.0.0.1") {
    return "IN"; // Default to India for local development
  }

  try {
    // NOTE: In production, replace with actual GeoIP service
    // Example: const geoip = require("geoip-lite");
    // const geo = geoip.lookup(ipAddress);
    // return geo?.country || "UNKNOWN";

    // For now, return mock response
    const mockCountries = {
      192.168: "IN",
      "10.0": "IN",
    };

    for (const [prefix, country] of Object.entries(mockCountries)) {
      if (ipAddress.startsWith(prefix)) return country;
    }

    return "UNKNOWN";
  } catch (error) {
    console.error("GeoIP lookup error:", error);
    return "UNKNOWN";
  }
};

/**
 * Generate device fingerprint from user agent and accepted languages
 * Simple implementation - in production use libraries like TruValidate or similar
 * @param {string} userAgent - Browser user agent
 * @param {string} acceptLanguage - Accept-Language header
 * @returns {string} - Hash-like fingerprint
 */
export const generateDeviceFingerprint = (userAgent, acceptLanguage) => {
  if (!userAgent) return null;

  const crypto = require("crypto");
  const combined = `${userAgent}|${acceptLanguage || ""}`;
  return crypto
    .createHash("sha256")
    .update(combined)
    .digest("hex")
    .substring(0, 32);
};

/**
 * Calculate time difference in minutes
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp (defaults to now)
 * @returns {number} - Minutes elapsed
 */
export const getMinutesDifference = (startTime, endTime = new Date()) => {
  return Math.floor((endTime - startTime) / (1000 * 60));
};

/**
 * Parse shipping address from order
 * @param {string} addressJSON - Address as JSON string
 * @returns {Object} - Parsed address
 */
export const parseShippingAddress = (addressJSON) => {
  try {
    if (typeof addressJSON === "string") {
      return JSON.parse(addressJSON);
    }
    return addressJSON;
  } catch (error) {
    console.error("Error parsing shipping address:", error);
    return {};
  }
};

/**
 * Extract client IP from request
 * Handles proxy headers like X-Forwarded-For
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-client-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if request likely from bot/automation
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
export const isProbablyBot = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "curl",
    "wget",
    "python",
    "java",
  ];

  return botPatterns.some((pattern) =>
    userAgent.toLowerCase().includes(pattern),
  );
};

/**
 * Format fraud log for audit trail
 * @param {Object} fraudLog - Raw fraud log data
 * @returns {Object} - Formatted for logging/display
 */
export const formatFraudLogForAudit = (fraudLog) => {
  return {
    id: fraudLog.id,
    userId: fraudLog.userId,
    eventType: fraudLog.eventType,
    riskPoints: fraudLog.riskPoints,
    reason: fraudLog.reason,
    metadata: fraudLog.metadata,
    timestamp: fraudLog.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Calculate risk score decay
 * Risk scores should gradually decrease if user behavior is normal
 * @param {number} currentRiskScore - User's current risk score
 * @param {Date} lastActivityDate - Last fraudulent activity date
 * @param {number} decayRatePerDay - Points to decay per day (default: 1 point/day)
 * @returns {number} - Decayed risk score
 */
export const applyRiskDecay = (
  currentRiskScore,
  lastActivityDate,
  decayRatePerDay = 1,
) => {
  if (!lastActivityDate || !currentRiskScore) return currentRiskScore;

  const daysSinceActivity =
    (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24);
  const decayPoints = Math.floor(daysSinceActivity * decayRatePerDay);
  const decayedScore = Math.max(0, currentRiskScore - decayPoints);

  return decayedScore;
};

/**
 * Sanitize metadata for safe logging
 * Removes sensitive information
 * @param {Object} metadata - Raw metadata
 * @returns {Object} - Sanitized metadata
 */
export const sanitizeMetadata = (metadata) => {
  if (!metadata) return {};

  const sensitiveFields = [
    "cardNumber",
    "cvv",
    "password",
    "token",
    "secret",
    "pin",
  ];
  const sanitized = { ...metadata };

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Check if timestamp is within time window
 * @param {Date} timestamp - Timestamp to check
 * @param {number} windowMinutes - Time window in minutes
 * @returns {boolean}
 */
export const isWithinTimeWindow = (timestamp, windowMinutes) => {
  if (!timestamp) return false;
  const ageMinutes = getMinutesDifference(new Date(timestamp));
  return ageMinutes <= windowMinutes;
};
