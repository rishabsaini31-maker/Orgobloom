/**
 * Fraud Detection Scoring Strategy Pattern (ML-Ready)
 * Abstract interface for fraud risk calculation
 * Enables pluggable scoring strategies: Rule-Based, ML-Based, Hybrid
 *
 * This design allows:
 * - Runtime strategy switching (A/B testing ML vs rules)
 * - Gradual ML model rollout (percentage-based)
 * - Easy experimentation with new scoring approaches
 * - Clear separation of concern (scoring logic decoupled from service)
 */

import {
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
} from "./fraud.rules.js";

/**
 * Rule-Based Scoring Strategy (Current Implementation)
 * Uses predefined rules with fixed point allocations
 * Fast, deterministic, explainable
 */
export class RuleBasedScoringStrategy {
  async calculateRisk(userId, eventType, features, metadata = {}) {
    const startTime = Date.now();
    const riskFactors = [];
    let totalRiskPoints = 0;
    let codDisable = false;

    // Evaluate each rule
    const rules = [
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

    for (const rule of rules) {
      const points = rule.evaluate ? rule.evaluate(features, eventType) : 0;
      if (points > 0) {
        riskFactors.push({
          name: rule.name,
          impact: points,
          reason: rule.reason,
          weight: 0.7,
          isAnomaly: false,
        });
        totalRiskPoints += points;
      }

      // Check if COD should be disabled
      if (rule.disableCOD && rule.disableCOD(features)) {
        codDisable = true;
      }
    }

    // Determine fraud status
    let fraudStatus = "SAFE";
    if (totalRiskPoints >= 60) {
      fraudStatus = "HIGH_RISK";
    } else if (totalRiskPoints >= 30) {
      fraudStatus = "MEDIUM_RISK";
    }

    // Build reasons
    const reasons = riskFactors.map((f) => f.reason);
    const primaryRiskDriver =
      riskFactors.length > 0
        ? riskFactors.reduce((a, b) => (a.impact > b.impact ? a : b)).name
        : undefined;

    const executionTimeMs = Date.now() - startTime;

    return {
      totalRiskScore: totalRiskPoints,
      riskPoints: totalRiskPoints,
      fraudStatus,
      riskFactors,
      codDisable,
      strategy: "RuleBased",
      version: "1.0.0",
      confidence: 0.85,
      executionTimeMs,
      reasons,
      primaryRiskDriver,
    };
  }

  getStrategyName() {
    return "RuleBasedScoringStrategy_v1.0.0";
  }

  explainDecision(userId, result) {
    const factors = result.riskFactors
      .map((f) => `• ${f.name}: +${f.impact} points`)
      .join("\n");

    return `User ${userId} Risk Analysis:
Status: ${result.fraudStatus}
Total Score: ${result.totalRiskScore} points

Risk Factors:
${factors}

Primary Driver: ${result.primaryRiskDriver || "None"}
`;
  }
}

/**
 * ML-Based Scoring Strategy (Future Placeholder)
 * Placeholder for machine learning model integration
 */
export class MLBasedScoringStrategy {
  constructor(modelPath) {
    console.log("[FRAUD ML STRATEGY] ML scoring strategy loaded (placeholder)");
  }

  async calculateRisk(userId, eventType, features, metadata = {}) {
    throw new Error(
      "[FRAUD ML] ML scoring not yet implemented. Use RuleBasedScoringStrategy.",
    );
  }

  getStrategyName() {
    return "MLBasedScoringStrategy_v0.0.1 (PLACEHOLDER)";
  }

  explainDecision(userId, result) {
    return "[ML Model Explanation - Not yet implemented]\nPlease use RuleBasedScoringStrategy.";
  }
}

/**
 * Hybrid Scoring Strategy
 * Combines rule-based and ML scoring
 */
export class HybridScoringStrategy {
  constructor(mlWeight = 0.3, mlModelPath = undefined) {
    this.ruleStrategy = new RuleBasedScoringStrategy();
    this.mlWeight = Math.min(Math.max(mlWeight, 0), 1);
    this.mlStrategy = undefined;

    try {
      this.mlStrategy = new MLBasedScoringStrategy(mlModelPath);
    } catch (error) {
      console.warn("[FRAUD HYBRID] ML model unavailable, using rules only");
    }
  }

  async calculateRisk(userId, eventType, features, metadata = {}) {
    const startTime = Date.now();

    // Always get rule-based score
    const ruleResult = await this.ruleStrategy.calculateRisk(
      userId,
      eventType,
      features,
      metadata,
    );

    // Try to get ML score if available
    let mlResult = null;
    try {
      if (this.mlStrategy) {
        mlResult = await this.mlStrategy.calculateRisk(
          userId,
          eventType,
          features,
          metadata,
        );
      }
    } catch (error) {
      console.warn(`[FRAUD HYBRID] ML scoring failed for ${userId}`);
    }

    // Blend scores
    let finalScore = ruleResult.totalRiskScore;
    let confidence = ruleResult.confidence || 0.85;

    if (mlResult && mlResult.confidence && mlResult.confidence > 0.7) {
      finalScore =
        ruleResult.totalRiskScore * (1 - this.mlWeight) +
        mlResult.totalRiskScore * this.mlWeight;

      confidence =
        (ruleResult.confidence || 0.85) * (1 - this.mlWeight) +
        (mlResult.confidence || 0.85) * this.mlWeight;
    }

    // Determine fraud status from blended score
    let fraudStatus = "SAFE";
    if (finalScore >= 60) {
      fraudStatus = "HIGH_RISK";
    } else if (finalScore >= 30) {
      fraudStatus = "MEDIUM_RISK";
    }

    return {
      totalRiskScore: Math.round(finalScore),
      riskPoints: Math.round(finalScore),
      fraudStatus,
      riskFactors: [
        ...ruleResult.riskFactors,
        ...(mlResult?.riskFactors || []),
      ],
      codDisable: fraudStatus === "HIGH_RISK" || ruleResult.codDisable,
      strategy: "Hybrid",
      version: "1.0.0",
      confidence,
      executionTimeMs: Date.now() - startTime,
      reasons: [...ruleResult.reasons, ...(mlResult?.reasons || [])],
      primaryRiskDriver: ruleResult.primaryRiskDriver,
    };
  }

  getStrategyName() {
    const ruleWeight = Math.round((1 - this.mlWeight) * 100);
    const mlWeight = Math.round(this.mlWeight * 100);
    return `HybridScoringStrategy_v1.0.0 (Rules:${ruleWeight}% ML:${mlWeight}%)`;
  }

  explainDecision(userId, result) {
    const strategyDesc = this.mlStrategy
      ? "Hybrid (Rule-based + ML)"
      : "Rules only (ML unavailable)";

    const factors = result.riskFactors
      .map((f) => `• ${f.name}: +${f.impact} points`)
      .join("\n");

    return `User ${userId} Risk Analysis (${strategyDesc}):
Status: ${result.fraudStatus}
Final Score: ${result.totalRiskScore} points
Confidence: ${(result.confidence || 0).toFixed(2)}

Risk Factors:
${factors}
`;
  }
}

/**
 * Strategy Factory - Creates appropriate scoring strategy
 */
export class ScoringStrategyFactory {
  static create(strategy = "RULE") {
    switch (strategy) {
      case "ML":
        return new MLBasedScoringStrategy();
      case "HYBRID":
        return new HybridScoringStrategy();
      case "RULE":
      default:
        return new RuleBasedScoringStrategy();
    }
  }

  static createFromConfig(config = {}) {
    const strategy = config.strategy || "RULE";

    if (strategy === "HYBRID") {
      return new HybridScoringStrategy(config.mlWeight, config.mlModelPath);
    }

    if (strategy === "ML") {
      return new MLBasedScoringStrategy(config.mlModelPath);
    }

    return new RuleBasedScoringStrategy();
  }
}
