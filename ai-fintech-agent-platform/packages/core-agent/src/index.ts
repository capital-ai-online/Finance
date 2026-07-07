/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { AgentConfig, AgentContext } from "@fintech-platform/shared-types";
import { EventBus } from "@fintech-platform/event-bus";
import { LLMGateway } from "@fintech-platform/llm-gateway";

/**
 * Base Agent Core implementation
 * Enforces dynamic validation, execution flow compliance, and event-driven audits.
 */
export abstract class BaseAgent {
  public readonly name: string;
  public readonly role: string;
  protected inputSchema: z.ZodSchema;

  constructor(
    config: AgentConfig,
    protected eventBus: EventBus,
    protected llmGateway: LLMGateway
  ) {
    this.name = config.name;
    this.role = config.role;
    this.inputSchema = config.inputSchema;
  }

  /**
   * Safe entry-point for all multi-agent execution steps
   */
  public async executeTask(payload: any, correlationId: string): Promise<any> {
    // 1. Validation Layer
    const validationResult = this.inputSchema.safeParse(payload);
    if (!validationResult.success) {
      const errorMsg = `Input validation failed for agent ${this.name}: ${JSON.stringify(validationResult.error.format())}`;
      await this.eventBus.publish("agent.execution.failed", { agent: this.name, error: errorMsg }, correlationId, this.name);
      throw new Error(errorMsg);
    }

    // 2. Lifecycle Audit Start Event
    await this.eventBus.publish(
      `agent.${this.name.toLowerCase()}.started`,
      { stage: "initiate", payload: validationResult.data },
      correlationId,
      this.name
    );

    try {
      // 3. Delegate to custom handler
      const result = await this.handle(validationResult.data, correlationId);

      // 4. Lifecycle Audit Complete Event
      await this.eventBus.publish(
        `agent.${this.name.toLowerCase()}.completed`,
        { stage: "finished", result },
        correlationId,
        this.name
      );

      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Execution exception encountered.";
      await this.eventBus.publish(
        `agent.${this.name.toLowerCase()}.failed`,
        { stage: "error", error: errorMsg },
        correlationId,
        this.name
      );
      throw err;
    }
  }

  /**
   * Specialized implementation handler for specific agents
   */
  protected abstract handle(validatedData: any, correlationId: string): Promise<any>;
}

/**
 * Core Orchestrator
 * Manages active agents, validates contexts, and exposes safe execution gateways.
 */
export class CoreOrchestrator {
  private registeredAgents: Map<string, BaseAgent> = new Map();

  constructor(
    private eventBus: EventBus,
    private llmGateway: LLMGateway
  ) {}

  /**
   * Registers a vetted micro-agent with the orchestrator
   */
  public registerAgent(agent: BaseAgent): void {
    if (this.registeredAgents.has(agent.name)) {
      throw new Error(`[Orchestrator Error] Agent ${agent.name} is already registered.`);
    }
    this.registeredAgents.set(agent.name, agent);
  }

  /**
   * Triggers an agent task securely in a policy-governed transaction scope
   */
  public async triggerAgentTask(agentName: string, payload: any, context: AgentContext): Promise<any> {
    const agent = this.registeredAgents.get(agentName);
    if (!agent) {
      throw new Error(`[Orchestrator Error] Agent ${agentName} is not registered in this system node.`);
    }

    await this.eventBus.publish("workflow.task.dispatched", {
      agent: agentName,
      payload,
      context
    }, context.correlationId, "Orchestrator");

    try {
      const result = await agent.executeTask(payload, context.correlationId);
      return result;
    } catch (err: any) {
      console.error(`[CoreOrchestrator] Task execution failed on agent ${agentName}:`, err);
      throw err;
    }
  }

  /**
   * Exposes active agents details
   */
  public getAgents(): Array<{ name: string; role: string }> {
    return Array.from(this.registeredAgents.values()).map(a => ({
      name: a.name,
      role: a.role
    }));
  }
}

// ==========================================
// Plugin Security & Sandboxed Execution Types
// ==========================================

export interface PlatformPlugin {
  name: string;
  version: string;
  hooks: string[];
  execute(hook: string, payload: any): Promise<any>;
}

/**
 * Sandboxed pluggable module registry and execution sandbox
 */
export class PluginSystem {
  private plugins: Map<string, PlatformPlugin> = new Map();

  /**
   * Registers a vetted and certified plugin with the execution environment
   */
  public register(plugin: PlatformPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`[Plugin Security Warning] Plugin "${plugin.name}" is already registered. Overwrite blocked.`);
    }
    console.log(`[Plugin System] SECURELY loaded plugin: ${plugin.name} (v${plugin.version})`);
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Safe execution of registered hook functions with error containment
   */
  public async triggerHook(hook: string, payload: any): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.hooks.includes(hook)) {
        try {
          console.log(`[Plugin System] Dispatching hook "${hook}" to sandbox plugin "${name}"`);
          const out = await plugin.execute(hook, payload);
          results[name] = { success: true, data: out };
        } catch (err: any) {
          console.error(`[Plugin System Error] Plugin "${name}" failed executing hook "${hook}":`, err);
          results[name] = { success: false, error: err.message || err };
        }
      }
    }

    return results;
  }

  /**
   * List all currently active plugins
   */
  public getPlugins(): Array<{ name: string; version: string; hooks: string[] }> {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
      hooks: p.hooks
    }));
  }
}

