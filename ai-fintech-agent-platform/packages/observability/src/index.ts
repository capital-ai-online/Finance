/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import { TelemetrySpan } from "@fintech-platform/shared-types";

/**
 * OpenTelemetry-inspired Observability & Audit logging platform
 */
export class Observability {
  private spans: TelemetrySpan[] = [];
  private auditDirectory: string;

  constructor() {
    this.auditDirectory = path.join(process.cwd(), "logs", "audit");
    try {
      if (!fs.existsSync(this.auditDirectory)) {
        fs.mkdirSync(this.auditDirectory, { recursive: true });
      }
    } catch (err) {
      // Fallback for write-restricted environments
      this.auditDirectory = "/tmp";
    }
  }

  /**
   * Starts tracking a new transactional operation duration
   */
  public startSpan(name: string, correlationId: string): { end: (metadata?: Record<string, any>) => TelemetrySpan } {
    const startTime = Date.now();
    const spanId = `span_${Math.random().toString(36).substring(2, 11)}`;

    return {
      end: (metadata?: Record<string, any>): TelemetrySpan => {
        const durationMs = Date.now() - startTime;
        const span: TelemetrySpan = {
          id: spanId,
          correlationId,
          name,
          durationMs,
          metadata,
          timestamp: new Date().toISOString()
        };
        this.spans.push(span);
        this.logAudit(span);
        return span;
      }
    };
  }

  /**
   * Retrieves all tracked system span histories
   */
  public getSpans(correlationId?: string): TelemetrySpan[] {
    if (correlationId) {
      return this.spans.filter(s => s.correlationId === correlationId);
    }
    return [...this.spans];
  }

  /**
   * Writes compliant immutable JSON trace records into audit directories
   */
  private logAudit(span: TelemetrySpan): void {
    const filePath = path.join(this.auditDirectory, `audit_trail_${span.correlationId}.jsonl`);
    const line = JSON.stringify(span) + "\n";
    
    try {
      fs.appendFileSync(filePath, line, "utf-8");
    } catch (err) {
      // Fail-silent in read-only filesystems
    }
  }
}
