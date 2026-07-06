/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from "../platform/event-bus/event-bus";
import { PolicyEngine } from "../platform/policy-engine/policy-engine";
import { AgentTask, ICoreOrchestratorAgent } from "../platform/director/platformDirector";
import { QualityGovernanceOrchestrator as CoreGovernanceEngine } from "../orchestrator/qualityGovernanceOrchestrator";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../server/logger";

/**
 * Enterprise Quality Governance Orchestrator Agent
 * Implements ICoreOrchestratorAgent interface to handle task-driven automated audits.
 */
export class QualityGovernanceOrchestrator implements ICoreOrchestratorAgent {
  private coreEngine: CoreGovernanceEngine;
  private ai: GoogleGenAI | null = null;

  constructor(
    private eventBus: EventBus,
    private policyEngine: PolicyEngine
  ) {
    // Initialize GoogleGenAI if the environment key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        logger.warn("[QualityGovernanceOrchestrator] Failed to initialize Gemini API client:", err);
      }
    }
    this.coreEngine = new CoreGovernanceEngine(this.ai);
  }

  /**
   * Primary entry point for the agent task handler
   */
  public async handle(task: AgentTask): Promise<any> {
    logger.info(`[QualityGovernanceOrchestrator Agent] Received task: ${task.type} (ID: ${task.id})`);

    // 1. Policy Check (Governance Layer)
    const policyResult = await this.policyEngine.evaluate(task);
    if (!policyResult.allowed) {
      return this.emitRejection(task, policyResult.reason);
    }

    // 2. Delegate to respective lifecycle pipeline stage
    switch (task.type) {
      case "plan":
        return this.plan(task);

      case "execute":
        return this.execute(task);

      case "validate":
        return this.validate(task);

      case "route":
        return this.route(task);

      default:
        throw new Error(`Unknown task type: ${task.type} in QualityGovernanceOrchestrator`);
    }
  }

  /**
   * Handles "plan" task: generates a structured audit execution strategy
   */
  private async plan(task: AgentTask) {
    const plan = {
      taskId: task.id,
      steps: [
        "repository_scan",
        "naming_convention_check",
        "architecture_layer_verification",
        "security_vulnerability_scan",
        "performance_and_accessibility_evaluation",
        "generate_documentation_reports"
      ],
      estimatedTimeMs: 1500,
      timestamp: new Date().toISOString()
    };

    await this.eventBus.publish("governance.plan.created", plan);
    return plan;
  }

  /**
   * Handles "execute" task: triggers the comprehensive 12-stage audit engine
   */
  private async execute(task: AgentTask) {
    await this.eventBus.publish("governance.audit.started", task);

    const trigger = task.payload?.trigger || "Task-Driven Audit";
    
    try {
      const report = await this.coreEngine.runGovernanceAudit(trigger);
      
      const result = {
        taskId: task.id,
        status: "completed",
        metrics: report.metrics,
        totalIssues: report.totalIssuesBySeverity,
        auditedFilesCount: report.auditedFilesCount,
        timestamp: report.timestamp
      };

      await this.eventBus.publish("governance.audit.completed", result);
      return result;
    } catch (err: any) {
      logger.error(`[QualityGovernanceOrchestrator Agent] Audit execution failed:`, err);
      const failedResult = {
        taskId: task.id,
        status: "failed",
        error: err.message || err
      };
      await this.eventBus.publish("governance.audit.failed", failedResult);
      throw err;
    }
  }

  /**
   * Handles "validate" task: checks whether codebase scores pass compliance thresholds
   */
  private async validate(task: AgentTask) {
    await this.eventBus.publish("governance.validation.started", task);

    const trigger = task.payload?.trigger || "Validation Check";
    const report = await this.coreEngine.runGovernanceAudit(trigger);
    
    // Check key compliance metrics
    const thresholds = {
      securityScore: 80,
      architectureScore: 75,
      maintainabilityScore: 75
    };

    const failedRules = [];
    if (report.metrics.securityScore < thresholds.securityScore) {
      failedRules.push(`Security Score (${report.metrics.securityScore}) is below target threshold (${thresholds.securityScore})`);
    }
    if (report.metrics.architectureScore < thresholds.architectureScore) {
      failedRules.push(`Architecture Score (${report.metrics.architectureScore}) is below target threshold (${thresholds.architectureScore})`);
    }
    if (report.metrics.maintainabilityScore < thresholds.maintainabilityScore) {
      failedRules.push(`Maintainability Score (${report.metrics.maintainabilityScore}) is below target threshold (${thresholds.maintainabilityScore})`);
    }

    const result = {
      taskId: task.id,
      valid: failedRules.length === 0,
      failedRules,
      metrics: report.metrics,
      timestamp: new Date().toISOString()
    };

    await this.eventBus.publish("governance.validation.completed", result);
    return result;
  }

  /**
   * Handles "route" task: directs critical security alerts or audit reports to designated channels
   */
  private async route(task: AgentTask) {
    const trigger = task.payload?.trigger || "Routing Check";
    const report = await this.coreEngine.runGovernanceAudit(trigger);

    // Determine destination route based on critical severity issues
    const hasCriticalIssues = report.totalIssuesBySeverity.Critical > 0 || report.totalIssuesBySeverity.High > 0;
    
    const routeDecision = {
      taskId: task.id,
      routedTo: hasCriticalIssues ? "Security-Response-Unit" : "Standard-Quality-Dashboard",
      priority: hasCriticalIssues ? "CRITICAL" : "NORMAL",
      reason: hasCriticalIssues 
        ? `Routed to Security Response due to ${report.totalIssuesBySeverity.Critical} critical / ${report.totalIssuesBySeverity.High} high vulnerabilities.`
        : "No critical or high issues detected. Routed to standard quality metrics loop."
    };

    await this.eventBus.publish("governance.routing.decided", routeDecision);
    return routeDecision;
  }

  /**
   * Publishes rejection event when policy blocks task
   */
  private async emitRejection(task: AgentTask, reason: string) {
    const rejection = {
      taskId: task.id,
      status: "rejected",
      reason,
      timestamp: new Date().toISOString()
    };

    await this.eventBus.publish("governance.task.rejected", rejection);
    return rejection;
  }
}
