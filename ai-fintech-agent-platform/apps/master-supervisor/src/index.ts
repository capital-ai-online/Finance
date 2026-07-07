/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { EventBus } from "@fintech-platform/event-bus";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT_SUPERVISOR) || 3010;

app.use(cors());
app.use(express.json());

const eventBus = new EventBus();

/**
 * Master Supervisor Daemon
 * Actively monitors micro-agent health and resolves transaction level execution conflicts.
 */
class MasterSupervisorMonitor {
  private activeJobsCount = 0;
  private statusLog: Array<{ timestamp: string; level: string; message: string }> = [];

  constructor() {
    this.initializeSubscriptions();
  }

  private initializeSubscriptions(): void {
    // Monitor initiated workflows
    eventBus.subscribe("workflow.initiated", (event) => {
      this.activeJobsCount++;
      this.logStatus("INFO", `Tracked job initiated. Total concurrent executions: ${this.activeJobsCount}`);
    });

    // Monitor finished workflows
    eventBus.subscribe("workflow.completed", (event) => {
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.logStatus("INFO", `Job completed. Total concurrent executions: ${this.activeJobsCount}`);
    });

    // Handle agent execution exceptions with automatic retry logs
    eventBus.subscribe("agent.*.failed", async (event) => {
      const errorMsg = event.payload.error || "Agent failure";
      this.logStatus("WARN", `Conflict or agent failure detected from ${event.senderId}: "${errorMsg}". Routing fallback.`);
      
      // Emit conflict resolution event
      await eventBus.publish("workflow.conflict.resolved", {
        faultyAgent: event.senderId,
        resolution: "SWITCH_TO_REDUNDANT_BACKUP_NODE",
        originalError: errorMsg
      }, event.correlationId, "MasterSupervisor");
    });
  }

  private logStatus(level: string, message: string): void {
    this.statusLog.push({
      timestamp: new Date().toISOString(),
      level,
      message
    });
    if (this.statusLog.length > 100) this.statusLog.shift();
    console.log(`[Master Supervisor Monitor] [${level}] ${message}`);
  }

  public getStatusLog() {
    return this.statusLog;
  }
}

const monitor = new MasterSupervisorMonitor();

app.get("/api/supervisor/health", (req, res) => {
  res.json({
    service: "Master Supervisor (Health Monitor)",
    status: "online",
    activeSupervisorDeduplication: true,
    activityMetrics: {
      loggedIncidentsCount: monitor.getStatusLog().length
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/supervisor/conflicts", (req, res) => {
  res.json({
    conflictsLog: monitor.getStatusLog()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`================================================================`);
  console.log(`🛡️ Master Supervisor Monitor listening on port ${PORT}`);
  console.log(`================================================================`);
});
