/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { BaseAgent } from "@fintech-platform/core-agent";

const RiskSchema = z.object({
  portfolioAssets: z.array(z.object({
    symbol: z.string(),
    weight: z.number().min(0).max(1),
    historicalBeta: z.number()
  })),
  simulateMarketShockPercent: z.number().optional().default(-15)
});

/**
 * Risk Agent (FinTech Specific)
 * Calculates portfolio-level risk metrics, stress tests, and Value-at-Risk (VaR).
 */
export class RiskAgent extends BaseAgent {
  constructor(eventBus: any, llmGateway: any) {
    super(
      {
        name: "RiskAgent",
        role: "Chief Financial Risk Officer",
        inputSchema: RiskSchema
      },
      eventBus,
      llmGateway
    );
  }

  protected async handle(validatedData: z.infer<typeof RiskSchema>, correlationId: string): Promise<any> {
    const totalWeight = validatedData.portfolioAssets.reduce((sum, asset) => sum + asset.weight, 0);
    const weightedBeta = validatedData.portfolioAssets.reduce((sum, asset) => sum + (asset.weight * asset.historicalBeta), 0);
    const stressShock = validatedData.simulateMarketShockPercent;

    const stressScenarioLoss = weightedBeta * stressShock;

    const prompt = `Assess risk for a portfolio with assets:
${JSON.stringify(validatedData.portfolioAssets, null, 2)}
Weighted Beta: ${weightedBeta}
Simulated Market Stress Shock: ${stressShock}%

Evaluate the expected Max Drawdown, the impact on capital preservation, and suggested hedges.`;

    const llmResponse = await this.llmGateway.generate({
      prompt,
      strategy: "reasoning"
    });

    return {
      riskEvaluationId: `risk_${Math.random().toString(36).substr(2, 9)}`,
      weightedBeta,
      totalWeight,
      stressScenarioLossPercent: stressScenarioLoss,
      vaRPercent99: weightedBeta * 3.12, // Value at Risk approximation
      hedgesRecommended: [
        "Gold Futures contracts (Commodity Hedging)",
        "Out-of-the-money Index Put options",
        "Stablecoin high-yield reserves"
      ],
      llmDetailedAnalysis: llmResponse.content,
      timestamp: new Date().toISOString()
    };
  }
}
