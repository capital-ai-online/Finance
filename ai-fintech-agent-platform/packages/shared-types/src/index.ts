/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

// ==========================================
// FinTech Domain & Asset Types
// ==========================================

export type AssetClass = "STOCK" | "CRYPTO" | "MEMECOIN" | "COMMODITY";

export interface AssetAllocation {
  symbol: string;
  weight: number;
  historicalBeta: number;
}

export interface TradeOrder {
  action: "BUY" | "SELL" | "HOLD";
  symbol: string;
  amount: number;
  price?: number;
  timestamp: string;
  isSimulation: boolean;
}

export interface RiskMetrics {
  weightedBeta: number;
  valueAtRiskPercent: number;
  simulateMarketShockPercent: number;
  volatilities: Record<string, number>;
  isAcceptableRisk: boolean;
}

export interface ComplianceAuditReport {
  timestamp: string;
  traderId: string;
  jurisdiction: string;
  assetType: AssetClass;
  isSimulatedTrade: boolean;
  passedCheck: boolean;
  licensingVerified: boolean;
  restrictionsEnforced: string[];
}

// ==========================================
// Event-Driven System Types
// ==========================================

export interface PlatformEvent {
  id: string;
  name: string;
  correlationId: string;
  senderId: string;
  payload: any;
  timestamp: string;
}

export type EventHandler = (event: PlatformEvent) => void | Promise<void>;

// ==========================================
// Policy & Governance Types
// ==========================================

export interface PolicyContext {
  userId?: string;
  role?: string;
  transactionValue?: number;
  ipAddress?: string;
  isSimulation?: boolean;
}

export interface PolicyDecision {
  allowed: boolean;
  riskScore: number;
  reason: string;
  gatingRequired: boolean;
  rulesEvaluated: string[];
}

// ==========================================
// LLM Routing & Strategy Types
// ==========================================

export type LLMRouteStrategy = "low-latency" | "reasoning" | "cost-optimization" | "balanced";

export interface LLMRequest {
  prompt: string;
  strategy?: LLMRouteStrategy;
  preferredProvider?: "openai" | "anthropic" | "gemini" | "mistral" | "deepseek";
  temperature?: number;
}

export interface LLMResponse {
  provider: string;
  model: string;
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
}

// ==========================================
// Observability & Telemetry Types
// ==========================================

export interface TelemetrySpan {
  id: string;
  correlationId: string;
  name: string;
  durationMs: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ==========================================
// Agent & Orchestration Types
// ==========================================

export interface AgentContext {
  correlationId: string;
  userId: string;
  role: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  name: string;
  role: string;
  inputSchema: z.ZodSchema;
}

// ==========================================
// Workflow DAG Engine Types
// ==========================================

export interface WorkflowTask {
  id: string;
  agentName: string;
  payload: any;
  dependsOn: string[];
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  result?: any;
  error?: string;
  retriesRemaining: number;
}

export interface WorkflowDAG {
  id: string;
  correlationId: string;
  tasks: Map<string, WorkflowTask>;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  compensationTasks: Array<() => Promise<void>>;
}
