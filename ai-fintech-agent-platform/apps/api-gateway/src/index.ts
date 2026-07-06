/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";

import { EventBus } from "@fintech-platform/event-bus";
import { FinTechPolicyEngine as PolicyEngine } from "@fintech-platform/policy-engine";
import { LLMGateway } from "@fintech-platform/llm-gateway";
import { Observability } from "@fintech-platform/observability";
import { PluginSystem } from "@fintech-platform/core-agent";

import { MasterSupervisor } from "./supervisor";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Initialize Shared Enterprise Platform Singletons
const eventBus = new EventBus();
const policyEngine = new PolicyEngine();
const llmGateway = new LLMGateway();
const observability = new Observability();
const pluginSystem = new PluginSystem();

// Initialize Master supervisor
const supervisor = new MasterSupervisor(eventBus, policyEngine, llmGateway, observability);

// ----------------------------------------------------
// API Gateway Routes
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "AI Agent FinTech Orchestration Platform V2",
    timestamp: new Date().toISOString()
  });
});

/**
 * Core dynamic orchestration route
 */
app.post("/api/orchestrate", async (req, res) => {
  const { query, assetClass, capital, timeframeDays, userId, role } = req.body;

  if (!query || !assetClass || !capital) {
    return res.status(400).json({
      error: "Missing required properties: 'query', 'assetClass', 'capital'."
    });
  }

  try {
    const result = await supervisor.orchestrate({
      query,
      assetClass,
      capital: Number(capital),
      timeframeDays: timeframeDays ? Number(timeframeDays) : 30,
      userId: userId || "usr_default",
      role: role || "Trader"
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || "An error occurred during workflow orchestration."
    });
  }
});

/**
 * Retrieve immutable event history
 */
app.get("/api/events", (req, res) => {
  const pattern = req.query.pattern as string | undefined;
  res.json({
    events: eventBus.replay(pattern)
  });
});

/**
 * Retrieve policies or alter threshold settings
 */
app.get("/api/policy", (req, res) => {
  res.json({
    description: "Enterprise OPA Guidelines",
    approvalThreshold: 70,
    rules: [
      "RULE_VALUE_LIMIT_CHECK",
      "RULE_EXTERNAL_API_RESTRICTION",
      "RULE_ASSET_CLASS_RISK_SCORING",
      "RULE_HUMAN_IN_THE_LOOP_THRESHOLD"
    ]
  });
});

/**
 * Retrieve trace logs by correlation ID
 */
app.get("/api/traces/:correlationId", (req, res) => {
  const { correlationId } = req.params;
  const spans = observability.getSpans(correlationId);
  res.json({
    correlationId,
    spans
  });
});

// Start the express server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================================`);
  console.log(`🤖 AI AGENT FINTECH ORCHESTRATION PLATFORM V2 ONLINE`);
  console.log(`📡 API Gateway listening on port ${PORT}`);
  console.log(`================================================================`);
});
