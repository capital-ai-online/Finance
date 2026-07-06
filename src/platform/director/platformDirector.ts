/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from "../event-bus/event-bus";
import { PolicyEngine } from "../policy-engine/policy-engine";

export type AgentTask = {
  id: string;
  type: "plan" | "execute" | "validate" | "route";
  payload: any;
  context?: Record<string, any>;
};

export interface ICoreOrchestratorAgent {
  handle(task: AgentTask): Promise<any>;
}

/**
 * Core Orchestrator Agent (Enterprise AI Platform)
 * Verantwortlich für: Routing, Tool-Auswahl, Delegation, Event Dispatch
 */
export class CoreOrchestratorAgent implements ICoreOrchestratorAgent {
  constructor(
    private eventBus: EventBus,
    private policyEngine: PolicyEngine
  ) {}

  async handle(task: AgentTask) {
    // 1. Policy Check (Governance Layer)
    const policyResult = await this.policyEngine.evaluate(task);

    if (!policyResult.allowed) {
      return this.emitRejection(task, policyResult.reason);
    }

    // 2. Route Task
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
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async plan(task: AgentTask) {
    const plan = {
      steps: ["decompose", "assign", "execute"],
      taskId: task.id,
    };

    await this.eventBus.publish("agent.plan.created", plan);
    return plan;
  }

  private async execute(task: AgentTask) {
    await this.eventBus.publish("agent.execution.started", task);

    // hier würden Tool Calls / LLM Calls / Sub-Agent Calls stattfinden
    const result = {
      taskId: task.id,
      status: "completed",
      output: "Execution result placeholder",
    };

    await this.eventBus.publish("agent.execution.finished", result);
    return result;
  }

  private async validate(task: AgentTask) {
    const result = {
      taskId: task.id,
      valid: true,
    };

    await this.eventBus.publish("agent.validation.completed", result);
    return result;
  }

  private async route(task: AgentTask) {
    const routeDecision = {
      taskId: task.id,
      routedTo: "business-orchestrator",
    };

    await this.eventBus.publish("agent.routing.decided", routeDecision);
    return routeDecision;
  }

  private async emitRejection(task: AgentTask, reason: string) {
    const rejection = {
      taskId: task.id,
      status: "rejected",
      reason,
    };

    await this.eventBus.publish("agent.task.rejected", rejection);
    return rejection;
  }
}

/**
 * Platform Director - Enterprise Control Plane Coordination
 * Manages the high-level platform modules, telemetry registry, and orchestrator nodes.
 */
export class PlatformDirector {
  private eventBus: EventBus;
  private policyEngine: PolicyEngine;
  private coreAgent: CoreOrchestratorAgent;
  private registeredNodes: Map<string, any> = new Map();

  constructor() {
    this.eventBus = new EventBus();
    this.policyEngine = new PolicyEngine();
    this.coreAgent = new CoreOrchestratorAgent(this.eventBus, this.policyEngine);
    this.setupDefaultSubscriptions();
  }

  private setupDefaultSubscriptions() {
    this.eventBus.subscribe("agent.plan.created", (data) => {
      console.log(`[Platform Director] Event received: agent.plan.created`, data);
    });
    this.eventBus.subscribe("agent.execution.started", (data) => {
      console.log(`[Platform Director] Event received: agent.execution.started`, data);
    });
    this.eventBus.subscribe("agent.execution.finished", (data) => {
      console.log(`[Platform Director] Event received: agent.execution.finished`, data);
    });
    this.eventBus.subscribe("agent.validation.completed", (data) => {
      console.log(`[Platform Director] Event received: agent.validation.completed`, data);
    });
    this.eventBus.subscribe("agent.routing.decided", (data) => {
      console.log(`[Platform Director] Event received: agent.routing.decided`, data);
    });
    this.eventBus.subscribe("agent.task.rejected", (data) => {
      console.warn(`[Platform Director] Event received: agent.task.rejected - REJECTED:`, data);
    });
  }

  public getAgent(): CoreOrchestratorAgent {
    return this.coreAgent;
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }

  public getPolicyEngine(): PolicyEngine {
    return this.policyEngine;
  }

  public registerOrchestratorNode(name: string, info: any) {
    this.registeredNodes.set(name, {
      ...info,
      registeredAt: new Date().toISOString()
    });
    console.log(`[Platform Registry] Registered orchestrator node: ${name}`);
  }

  public getRegisteredNodes() {
    return Array.from(this.registeredNodes.entries()).map(([name, value]) => ({
      name,
      ...value
    }));
  }
}

// Export singleton instance for platform-wide usage
export const platformDirectorInstance = new PlatformDirector();
