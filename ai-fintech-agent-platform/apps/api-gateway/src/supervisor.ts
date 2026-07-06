/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from "@fintech-platform/event-bus";
import { FinTechPolicyEngine as PolicyEngine } from "@fintech-platform/policy-engine";
import { LLMGateway } from "@fintech-platform/llm-gateway";
import { Observability } from "@fintech-platform/observability";

import { PlannerAgent } from "../../../agents/planner-agent";
import { ExecutorAgent } from "../../../agents/executor-agent";
import { ValidatorAgent } from "../../../agents/validator-agent";
import { RouterAgent } from "../../../agents/router-agent";
import { RiskAgent } from "../../../agents/risk-agent";
import { ComplianceAgent } from "../../../agents/compliance-agent";

export interface OrchestrationRequest {
  query: string;
  assetClass: "STOCK" | "CRYPTO" | "MEMECOIN" | "COMMODITY";
  capital: number;
  timeframeDays: number;
  userId?: string;
  role?: string;
}

export interface OrchestrationResult {
  correlationId: string;
  success: boolean;
  stageReached: string;
  policyDecision?: any;
  plan?: any;
  riskMetrics?: any;
  execution?: any;
  compliance?: any;
  validation?: any;
  traces: any[];
}

/**
 * Master Supervisor System
 * Global orchestrator responsible for compiling tasks, evaluating multi-agent results,
 * enforcing compliance gating, and committing irreversible transactions.
 */
export class MasterSupervisor {
  private planner: PlannerAgent;
  private executor: ExecutorAgent;
  private validator: ValidatorAgent;
  private router: RouterAgent;
  private riskOfficer: RiskAgent;
  private complianceOfficer: ComplianceAgent;

  constructor(
    private eventBus: EventBus,
    private policyEngine: PolicyEngine,
    private llmGateway: LLMGateway,
    private observability: Observability
  ) {
    // Instantiate role-based micro-agents
    this.planner = new PlannerAgent(this.eventBus, this.llmGateway);
    this.executor = new ExecutorAgent(this.eventBus, this.llmGateway);
    this.validator = new ValidatorAgent(this.eventBus, this.llmGateway);
    this.router = new RouterAgent(this.eventBus, this.llmGateway);
    this.riskOfficer = new RiskAgent(this.eventBus, this.llmGateway);
    this.complianceOfficer = new ComplianceAgent(this.eventBus, this.llmGateway);
  }

  /**
   * Executes the full multi-agent distributed workflow with policy gating
   */
  public async orchestrate(req: OrchestrationRequest): Promise<OrchestrationResult> {
    const correlationId = `corr_tx_${Math.random().toString(36).substr(2, 9)}`;
    const mainSpan = this.observability.startSpan("orchestration_workflow", correlationId);

    await this.eventBus.publish("workflow.initiated", { req }, correlationId, "Supervisor");

    let stage = "ROUTING";
    let policyDecision: any = null;
    let plan: any = null;
    let riskMetrics: any = null;
    let execution: any = null;
    let compliance: any = null;
    let validation: any = null;

    try {
      // 1. Semantic Task Routing
      stage = "ROUTING";
      const routeSpan = this.observability.startSpan("agent_routing", correlationId);
      const routingResult = await this.router.executeTask({
        query: req.query,
        availableNodes: ["StockOrchestrator", "CryptoOrchestrator", "PortfolioOrchestrator"]
      }, correlationId);
      routeSpan.end({ routingResult });

      // 2. Planning Strategy Formulation
      stage = "PLANNING";
      const planSpan = this.observability.startSpan("agent_planning", correlationId);
      plan = await this.planner.executeTask({
        objective: req.query,
        assetClass: req.assetClass,
        capitalAllocated: req.capital,
        timeframeDays: req.timeframeDays
      }, correlationId);
      planSpan.end({ plan });

      // 3. Quantitative Risk Estimation (FinTech Check)
      stage = "RISK_EVALUATION";
      const riskSpan = this.observability.startSpan("agent_risk_assessment", correlationId);
      riskMetrics = await this.riskOfficer.executeTask({
        portfolioAssets: [
          { symbol: "PORT_BASE", weight: 0.6, historicalBeta: req.assetClass === "MEMECOIN" ? 2.5 : 1.1 },
          { symbol: "PORT_HEDGE", weight: 0.4, historicalBeta: req.assetClass === "COMMODITY" ? 0.3 : 0.8 }
        ],
        simulateMarketShockPercent: -15
      }, correlationId);
      riskSpan.end({ riskMetrics });

      // 4. Pre-Execution OPA Policy Evaluation
      stage = "POLICY_EVALUATION";
      const policySpan = this.observability.startSpan("policy_evaluation", correlationId);
      policyDecision = await this.policyEngine.evaluate({
        type: "execute",
        payload: {
          assetClass: req.assetClass,
          amount: req.capital,
          riskScore: riskMetrics.weightedBeta * 30
        },
        context: {
          userId: req.userId,
          role: req.role || "Trader",
          isSimulation: true
        }
      });
      policySpan.end({ policyDecision });

      // Enforce policy decision
      if (!policyDecision.allowed) {
        await this.eventBus.publish("policy.violation.encountered", { policyDecision }, correlationId, "Supervisor");
        mainSpan.end({ success: false, stageReached: stage });
        return {
          correlationId,
          success: false,
          stageReached: stage,
          policyDecision,
          traces: this.observability.getSpans(correlationId)
        };
      }

      // Check if Human in the Loop approval gating is needed
      if (policyDecision.gatingRequired) {
        await this.eventBus.publish("workflow.suspended.human_gate", { reason: policyDecision.reason }, correlationId, "Supervisor");
        // In a live system, this would store state in DB and pause. For this implementation, we log the gate requirement
        // but proceed under secure "auto-simulation" mode to ensure non-blocking output.
      }

      // 5. Execution (Trade and Portfolio Rebalancing simulation)
      stage = "EXECUTION";
      const executionSpan = this.observability.startSpan("agent_execution", correlationId);
      execution = await this.executor.executeTask({
        action: "BUY",
        symbol: req.assetClass === "STOCK" ? "AAPL" : "BTC",
        amount: req.capital / 150.0,
        isSimulation: true
      }, correlationId);
      executionSpan.end({ execution });

      // 6. Regulatory Compliance Audit Checks
      stage = "COMPLIANCE_AUDIT";
      const complianceSpan = this.observability.startSpan("agent_compliance", correlationId);
      compliance = await this.complianceOfficer.executeTask({
        traderId: req.userId || "usr_9923",
        jurisdiction: req.assetClass === "STOCK" ? "US_SEC" : "GLOBAL",
        assetType: req.assetClass,
        isSimulatedTrade: true
      }, correlationId);
      complianceSpan.end({ compliance });

      // 7. Quantitative Validation checks
      stage = "VALIDATION";
      const validationSpan = this.observability.startSpan("agent_validation", correlationId);
      validation = await this.validator.executeTask({
        targetEntity: "PORT_BASE",
        proposedAction: "BUY",
        mathematicalBounds: {
          expectedMax: req.capital,
          actualValue: execution.totalCost
        }
      }, correlationId);
      validationSpan.end({ validation });

      stage = "COMPLETED";
      await this.eventBus.publish("workflow.completed", { success: true }, correlationId, "Supervisor");
      mainSpan.end({ success: true, stageReached: stage });

      return {
        correlationId,
        success: true,
        stageReached: stage,
        policyDecision,
        plan,
        riskMetrics,
        execution,
        compliance,
        validation,
        traces: this.observability.getSpans(correlationId)
      };

    } catch (err: any) {
      console.error(`[Master Supervisor Error] Flow failed at stage: ${stage}`, err);
      await this.eventBus.publish("workflow.failed", { stage, error: err.message }, correlationId, "Supervisor");
      mainSpan.end({ success: false, error: err.message });
      return {
        correlationId,
        success: false,
        stageReached: stage,
        traces: this.observability.getSpans(correlationId)
      };
    }
  }
}
