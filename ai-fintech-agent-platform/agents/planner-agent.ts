/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { BaseAgent } from "@fintech-platform/core-agent";

const PlannerSchema = z.object({
  objective: z.string(),
  assetClass: z.enum(["STOCK", "CRYPTO", "MEMECOIN", "COMMODITY"]),
  capitalAllocated: z.number().positive(),
  timeframeDays: z.number().int().positive()
});

/**
 * Planner Agent
 * Formulates structured multi-stage execution schedules for investments or trading plans.
 */
export class PlannerAgent extends BaseAgent {
  constructor(eventBus: any, llmGateway: any) {
    super(
      {
        name: "PlannerAgent",
        role: "Financial Workflow Architect",
        inputSchema: PlannerSchema
      },
      eventBus,
      llmGateway
    );
  }

  protected async handle(validatedData: z.infer<typeof PlannerSchema>, correlationId: string): Promise<any> {
    const prompt = `Formulate a structured execution strategy for the following financial objective:
Objective: ${validatedData.objective}
Asset Class: ${validatedData.assetClass}
Capital: $${validatedData.capitalAllocated}
Timeframe: ${validatedData.timeframeDays} days

Generate a step-by-step plan containing:
1. Entry signal check
2. Risk assessment metrics
3. Allocation scaling steps
4. Target exit triggers`;

    const llmResponse = await this.llmGateway.generate({
      prompt,
      strategy: "reasoning"
    });

    return {
      planId: `plan_${Math.random().toString(36).substr(2, 9)}`,
      objective: validatedData.objective,
      steps: [
        { step: 1, action: "FETCH_MARKET_TRENDS", description: "Query market liquidity and beta levels." },
        { step: 2, action: "EVALUATE_RISK_LIMITS", description: `Check threshold for $${validatedData.capitalAllocated} exposure.` },
        { step: 3, action: "CALCULATE_OPTIMAL_ENTRIES", description: "Formulate risk-adjusted entry scaling points." },
        { step: 4, action: "FINALIZE_STOP_LOSS", description: "Design hard stop-loss safeguards to preserve capital." }
      ],
      llmInsights: llmResponse.content,
      timestamp: new Date().toISOString()
    };
  }
}
