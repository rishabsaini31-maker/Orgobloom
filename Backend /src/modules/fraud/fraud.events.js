/**
 * Fraud Event Normalization & Streaming Layer (ML-Ready)
 * Structures fraud events for Kafka/EventStream publishing
 * Enables ML data collection, audit logging, and real-time alerting
 *
 * Event Flow:
 * Fraud Detection → Event Normalization → Event Publisher → Kafka/Stream
 *                                                         → Data Warehouse
 *                                                         → ML Training Pipeline
 *                                                         → Real-time Alerts
 */

/**
 * Create normalized fraud event from risk calculation
 */
export function createNormalizedEvent(
  userId,
  eventType,
  riskResult,
  metadata = {},
  features = null,
  executionTimeMs = null,
) {
  const eventId = `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  // Determine actions based on risk status
  const actions = {
    codDisabled: riskResult.codDisable,
    checkoutBlocked: riskResult.fraudStatus === "HIGH_RISK",
    requiresManualReview:
      riskResult.fraudStatus === "MEDIUM_RISK" ||
      riskResult.fraudStatus === "HIGH_RISK",
    autoApproved: riskResult.fraudStatus === "SAFE",
    adminAlert: riskResult.fraudStatus === "HIGH_RISK",
  };

  return {
    eventId,
    eventVersion: "1.0.0",
    timestamp: now.toISOString(),
    receivedAt: now.toISOString(),

    eventType,
    userId,

    entityIds: {
      orderId: metadata.orderId,
      paymentId: metadata.paymentId,
      deviceFingerprint: metadata.deviceFingerprint,
      ipAddress: metadata.ipAddress,
    },

    riskCalculation: {
      strategy: riskResult.strategy,
      score: riskResult.totalRiskScore,
      status: riskResult.fraudStatus,
      confidence: riskResult.confidence || 0.85,
      factors: (riskResult.riskFactors || []).map((f) => ({
        name: f.name,
        impact: f.impact,
        weight: f.weight,
      })),
    },

    features: features ? sanitizeFeaturesForStorage(features) : null,

    actions,

    context: {
      requestIp: metadata.ipAddress,
      userAgent: metadata.userAgent,
      country: metadata.country,
      deviceBrand: metadata.deviceBrand,
      paymentMethod: metadata.paymentMethod,
      orderValue: metadata.orderValue,
      deviceAccountCount: metadata.deviceAccountCount,
    },

    audit: {
      source: metadata.source || "service",
      requestId: metadata.requestId,
      executionTimeMs: executionTimeMs || riskResult.executionTimeMs || 0,
      errors: metadata.errors,
    },
  };
}

/**
 * Create alert event when fraud threshold breached
 */
export function createFraudAlertEvent(fraudEvent, severity) {
  return {
    ...fraudEvent,
    eventId: `alert_${fraudEvent.eventId}`,
    eventType: "FRAUD_DETECTED",
    timestamp: new Date().toISOString(),
    context: {
      ...fraudEvent.context,
      severity,
    },
  };
}

/**
 * Create event when fraud risk is cleared
 */
export function createFraudClearedEvent(
  userId,
  originalEventId,
  reason,
  clearedBy = null,
) {
  const now = new Date();

  return {
    eventId: `cleared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventVersion: "1.0.0",
    timestamp: now.toISOString(),
    receivedAt: now.toISOString(),

    eventType: "FRAUD_CLEARED",
    userId,

    entityIds: {},

    riskCalculation: {
      strategy: "ADMIN_OVERRIDE",
      score: 0,
      status: "SAFE",
      confidence: 1.0,
      factors: [],
    },

    actions: {
      codDisabled: false,
      checkoutBlocked: false,
      requiresManualReview: false,
      autoApproved: true,
      adminAlert: false,
    },

    context: {
      clearedBy,
    },

    audit: {
      source: "admin",
      executionTimeMs: 0,
      errors: null,
    },
  };
}

/**
 * Remove sensitive information from features before storage
 */
function sanitizeFeaturesForStorage(features) {
  return {
    accountAgeHours: features.accountAgeHours,
    accountAgeNorm: features.accountAgeNorm,
    emailVerified: features.emailVerified,
    profileCompletion: features.profileCompletion,
    avgOrderValue: features.avgOrderValue,
    avgOrderValueNorm: features.avgOrderValueNorm,
    totalOrderCount: features.totalOrderCount,
    totalSpent: features.totalSpent,
    returnRatio: features.returnRatio,
    failedPaymentRate: features.failedPaymentRate,
    loginVelocity1h: features.loginVelocity1h,
    loginVelocity24h: features.loginVelocity24h,
    orderVelocity7d: features.orderVelocity7d,
    deviceAccountCount: features.deviceAccountCount,
    ipCountryMismatchFlag: features.ipCountryMismatchFlag,
    ipChangeRecent: features.ipChangeRecent,
    codRejectionRate: features.codRejectionRate,
    riskLevel: features.riskLevel,
    anomalyScore: features.anomalyScore,
  };
}

/**
 * In-Memory Event Publisher
 * Stores events in memory for testing/development
 */
export class InMemoryEventPublisher {
  constructor() {
    this.events = [];
    this.alerts = [];
  }

  async publish(event) {
    this.events.push(event);
    console.log(`[EVENT STREAM] Published: ${event.eventId}`);

    // Keep only last 10,000 events
    if (this.events.length > 10000) {
      this.events.shift();
    }
  }

  async publishAlert(event, severity) {
    const alertEvent = createFraudAlertEvent(event, severity);
    this.alerts.push(alertEvent);
    console.log(`[FRAUD ALERT] ${severity}: ${alertEvent.eventId}`);

    // Keep only last 1,000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }
  }

  getEvents() {
    return [...this.events];
  }

  getAlerts() {
    return [...this.alerts];
  }

  async close() {
    console.log(`[EVENT STREAM] Closed. Total events: ${this.events.length}`);
  }
}

/**
 * Event Stream Manager
 * Manages publishing to multiple endpoints
 */
export class EventStreamManager {
  constructor() {
    this.publishers = [];
  }

  addPublisher(publisher) {
    this.publishers.push(publisher);
  }

  async publish(event) {
    const results = await Promise.allSettled(
      this.publishers.map((p) => p.publish(event)),
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.warn(
        `[EVENT MANAGER] ${failures.length}/${this.publishers.length} publishers failed`,
      );
    }
  }

  async publishAlert(event, severity) {
    const results = await Promise.allSettled(
      this.publishers.map((p) => p.publishAlert(event, severity)),
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(
        `[ALERTS] Failed to alert all publishers: ${failures.length} failures`,
      );
    }
  }

  async closeAll() {
    await Promise.all(this.publishers.map((p) => p.close()));
  }
}

/**
 * Generate training data export from event stream
 */
export function generateTrainingDataExport(events, labeledFlags = {}) {
  return {
    exportId: `export_${Date.now()}`,
    exportedAt: new Date().toISOString(),
    eventCount: events.length,
    events: events
      .filter((e) => e.features)
      .map((e) => ({
        eventId: e.eventId,
        userId: e.userId,
        timestamp: e.timestamp,
        features: e.features || {},
        riskScore: e.riskCalculation.score,
        fraudStatus: e.riskCalculation.status,
        label: labeledFlags[e.eventId],
      })),
  };
}
