/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { EventBus } from "@fintech-platform/event-bus";
import { Observability } from "@fintech-platform/observability";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT_DASHBOARD) || 3015;

app.use(cors());
app.use(express.json());

const eventBus = new EventBus();
const observability = new Observability();

/**
 * Enterprise Dashboard Backend API
 * Collects and serves high-level telemetry and status reports of the platform.
 */
app.get("/api/dashboard/status", (req, res) => {
  const events = eventBus.getHistory();
  const spans = observability.getSpans();

  const counts: Record<string, number> = {
    totalWorkflows: events.filter(e => e.name === "workflow.initiated").length,
    completedWorkflows: events.filter(e => e.name === "workflow.completed").length,
    failedWorkflows: events.filter(e => e.name === "workflow.failed").length,
    policyViolations: events.filter(e => e.name === "policy.violation.encountered").length
  };

  // Calculate average latency
  const avgLatency = spans.length > 0
    ? spans.reduce((sum, s) => sum + s.durationMs, 0) / spans.length
    : 0;

  res.json({
    systemHealth: "green",
    activeClusterNodes: [
      "api-gateway",
      "platform-director",
      "master-supervisor",
      "dashboard-backend"
    ],
    metrics: {
      ...counts,
      averageOperationDurationMs: Math.round(avgLatency),
      totalSystemSpansCollected: spans.length
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================================`);
  console.log(`📊 FinTech Dashboard Backend listening on port ${PORT}`);
  console.log(`================================================================`);
});
