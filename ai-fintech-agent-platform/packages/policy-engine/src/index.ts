/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PolicyDecision, PolicyContext } from "@fintech-platform/shared-types";

/**
 * Enterprise OPA-style Policy and Compliance Engine
 */
export class FinTechPolicyEngine {
  private approvalThreshold = 70;

  /**
   * Evaluates the risk and policy validation of an incoming agent task request
   */
  public async evaluate(task: { type: string; payload?: any; context?: PolicyContext }): Promise<PolicyDecision> {
    const rulesEvaluated: string[] = [];
    let riskScore = 0;
    let allowed = true;
    let reason = "Approved by system policy guidelines.";
    let gatingRequired = false;

    const payload = task.payload || {};
    const context = task.context || {};

    // Rule 1: Evaluate transaction simulation value limits
    rulesEvaluated.push("RULE_VALUE_LIMIT_CHECK");
    if (payload.amount && typeof payload.amount === "number") {
      if (payload.amount > 1000000) {
        riskScore += 45;
        if (context.role !== "Admin" && context.role !== "Trader") {
          allowed = false;
          reason = "Value limit exceeded: Non-authorized personnel cannot run simulations above $1M.";
          return { allowed, riskScore, reason, gatingRequired: false, rulesEvaluated };
        }
      } else if (payload.amount > 100000) {
        riskScore += 25;
      }
    }

    // Rule 2: Evaluate API key security / compliance boundaries
    rulesEvaluated.push("RULE_EXTERNAL_API_RESTRICTION");
    if (payload.externalEndpoint) {
      riskScore += 35;
      if (!payload.externalEndpoint.startsWith("https://")) {
        allowed = false;
        reason = "Protocol Security violation: External requests must use SSL (https).";
        return { allowed, riskScore, reason, gatingRequired: false, rulesEvaluated };
      }
    }

    // Rule 3: Dynamic risk assessment based on asset-type profile (crypto/meme coins vs. commodities)
    rulesEvaluated.push("RULE_ASSET_CLASS_RISK_SCORING");
    if (payload.assetClass) {
      const asset = String(payload.assetClass).toUpperCase();
      if (asset === "MEMECOIN") {
        riskScore += 50;
      } else if (asset === "CRYPTO") {
        riskScore += 25;
      } else if (asset === "STOCK") {
        riskScore += 10;
      }
    }

    // Rule 4: Human-in-the-loop check for high-risk profiles
    rulesEvaluated.push("RULE_HUMAN_IN_THE_LOOP_THRESHOLD");
    if (riskScore >= this.approvalThreshold) {
      gatingRequired = true;
      reason = `Pre-execution risk score is ${riskScore}, which meets or exceeds the critical threshold of ${this.approvalThreshold}. Human supervisor action requested.`;
    }

    // Simulation rules check
    rulesEvaluated.push("RULE_SIMULATION_COMPLIANCE");
    if (payload.action === "transact" && !context.isSimulation) {
      allowed = false;
      reason = "Safety violation: Real transactional operations are disabled; must be flag-enabled as isSimulation: true.";
    }

    return {
      allowed,
      riskScore: Math.min(riskScore, 100),
      reason,
      gatingRequired,
      rulesEvaluated
    };
  }

  /**
   * Dynamically configures the human approval limit
   */
  public setApprovalThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 100) {
      throw new Error("Threshold must be between 0 and 100");
    }
    this.approvalThreshold = threshold;
  }
}
