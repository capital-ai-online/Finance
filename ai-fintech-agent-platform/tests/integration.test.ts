/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from "@fintech-platform/event-bus";
import { FinTechPolicyEngine as PolicyEngine } from "@fintech-platform/policy-engine";
import { LLMGateway } from "@fintech-platform/llm-gateway";
import { Observability } from "@fintech-platform/observability";
import { MasterSupervisor } from "../apps/api-gateway/src/supervisor";

describe("FinTech Orchestration Platform Integration Tests", () => {
  let eventBus: EventBus;
  let policyEngine: PolicyEngine;
  let llmGateway: LLMGateway;
  let observability: Observability;
  let supervisor: MasterSupervisor;

  beforeEach(() => {
    eventBus = new EventBus();
    policyEngine = new PolicyEngine();
    llmGateway = new LLMGateway();
    observability = new Observability();
    
    supervisor = new MasterSupervisor(
      eventBus,
      policyEngine,
      llmGateway,
      observability
    );
  });

  it("should successfully route, plan, assess, and execute a balanced gold commodities workflow", async () => {
    const result = await supervisor.orchestrate({
      query: "Automate rebalancing into safe haven commodities due to high inflation",
      assetClass: "COMMODITY",
      capital: 50000,
      timeframeDays: 14,
      userId: "usr_trader_44",
      role: "Trader"
    });

    expect(result.success).toBe(true);
    expect(result.stageReached).toBe("COMPLETED");
    expect(result.plan).toBeDefined();
    expect(result.riskMetrics).toBeDefined();
    expect(result.execution).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.validation).toBeDefined();

    // Verify traceability spans are produced
    expect(result.traces.length).toBeGreaterThan(0);
    const traceNames = result.traces.map(t => t.name);
    expect(traceNames).toContain("orchestration_workflow");
    expect(traceNames).toContain("agent_planning");
  });

  it("should suspend and block the execution when policy rules reject extreme capital allocations", async () => {
    const result = await supervisor.orchestrate({
      query: "Allocate massive capital into highly leveraged speculative tokens",
      assetClass: "MEMECOIN",
      capital: 2500000, // Exceeds authorized limits
      timeframeDays: 7,
      userId: "usr_guest",
      role: "Guest" // Role not authorized to trade >$1M
    });

    expect(result.success).toBe(false);
    expect(result.stageReached).toBe("POLICY_EVALUATION");
    expect(result.policyDecision.allowed).toBe(false);
  });
});
