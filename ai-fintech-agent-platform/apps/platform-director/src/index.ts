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

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT_DIRECTOR) || 3005;

app.use(cors());
app.use(express.json());

// Initialize Orchestration Singletons
const eventBus = new EventBus();
const policyEngine = new PolicyEngine();
const llmGateway = new LLMGateway();

/**
 * Platform Director Daemon
 * The central regulatory system brain. Listens to events and enforces global transaction limits.
 */
class PlatformDirector {
  constructor() {
    this.initializeSubscriptions();
  }

  private initializeSubscriptions(): void {
    // Audit policy check on workflow initiation
    eventBus.subscribe("workflow.initiated", async (event) => {
      console.log(`[Platform Director] Intercepted workflow.initiated transaction: ${event.correlationId}`);
      
      const req = event.payload.req;
      const decision = await policyEngine.evaluate({
        type: "governance_intercept",
        payload: {
          assetClass: req.assetClass,
          amount: req.capital
        },
        context: {
          userId: req.userId,
          role: req.role,
          isSimulation: true
        }
      });

      if (!decision.allowed) {
        console.warn(`[Platform Director] CRITICAL GOVERNANCE BLOCK: Transaction ${event.correlationId} rejected by rules.`);
        await eventBus.publish("policy.violation.encountered", { decision }, event.correlationId, "PlatformDirector");
      } else {
        console.log(`[Platform Director] Transaction ${event.correlationId} passed initial regulatory check.`);
        await eventBus.publish("policy.approved", { decision }, event.correlationId, "PlatformDirector");
      }
    });

    // Handle policy violations with immediate compliance warnings
    eventBus.subscribe("policy.violation.encountered", async (event) => {
      await eventBus.publish("audit.alert.compliance", {
        alert: "GOVERNANCE_BREACH_ATTEMPT",
        details: event.payload
      }, event.correlationId, "PlatformDirector");
    });
  }
}

const director = new PlatformDirector();

app.get("/api/director/health", (req, res) => {
  res.json({
    service: "Platform Director (System Brain)",
    status: "online",
    monitoredNamespaces: ["agent.*", "workflow.*", "policy.*", "risk.*"],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================================`);
  console.log(`🧠 Platform Director (System Brain) listening on port ${PORT}`);
  console.log(`================================================================`);
});
