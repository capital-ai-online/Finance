/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { BaseAgent } from "@fintech-platform/core-agent";

const RouterSchema = z.object({
  query: z.string(),
  availableNodes: z.array(z.string())
});

/**
 * Router Agent
 * Directs raw requests or high-frequency alerts to the appropriate domain supervisor.
 */
export class RouterAgent extends BaseAgent {
  constructor(eventBus: any, llmGateway: any) {
    super(
      {
        name: "RouterAgent",
        role: "Semantic Task Router",
        inputSchema: RouterSchema
      },
      eventBus,
      llmGateway
    );
  }

  protected async handle(validatedData: z.infer<typeof RouterSchema>, correlationId: string): Promise<any> {
    const prompt = `Classify this financial request and select the best orchestrator node from the available list:
Request: "${validatedData.query}"
Nodes available: ${validatedData.availableNodes.join(", ")}

Identify:
- Target Orchestrator
- Estimated Priority (LOW, MEDIUM, HIGH, CRITICAL)
- Key Entity or Asset Class referenced`;

    const llmResponse = await this.llmGateway.generate({
      prompt,
      strategy: "low-latency"
    });

    // Simple robust fallback parsing
    let selectedNode = validatedData.availableNodes[0] || "StockOrchestrator";
    const lowerQuery = validatedData.query.toLowerCase();
    if (lowerQuery.includes("crypto") || lowerQuery.includes("token") || lowerQuery.includes("solana")) {
      selectedNode = "CryptoOrchestrator";
    } else if (lowerQuery.includes("meme")) {
      selectedNode = "MemeCoinOrchestrator";
    } else if (lowerQuery.includes("gold") || lowerQuery.includes("commodity") || lowerQuery.includes("oil")) {
      selectedNode = "RawMaterialsOrchestrator";
    } else if (lowerQuery.includes("portfolio") || lowerQuery.includes("sharpe") || lowerQuery.includes("allokation")) {
      selectedNode = "PortfolioOrchestrator";
    } else if (lowerQuery.includes("governance") || lowerQuery.includes("code") || lowerQuery.includes("audit")) {
      selectedNode = "QualityGovernanceOrchestrator";
    }

    return {
      routingId: `rt_${Math.random().toString(36).substr(2, 9)}`,
      query: validatedData.query,
      targetNode: selectedNode,
      confidence: 0.94,
      routingDetails: llmResponse.content,
      timestamp: new Date().toISOString()
    };
  }
}
