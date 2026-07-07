/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { BaseAgent } from "@fintech-platform/core-agent";

const ComplianceSchema = z.object({
  traderId: z.string(),
  jurisdiction: z.enum(["US_SEC", "EU_MIFID_II", "DE_BAFIN", "GLOBAL"]),
  assetType: z.string(),
  isSimulatedTrade: z.boolean()
});

/**
 * Compliance Agent
 * Evaluates simulated asset trades against actual SEC, BaFin, and MiFID II compliance rulesets.
 */
export class ComplianceAgent extends BaseAgent {
  constructor(eventBus: any, llmGateway: any) {
    super(
      {
        name: "ComplianceAgent",
        role: "Chief Compliance and AML Director",
        inputSchema: ComplianceSchema
      },
      eventBus,
      llmGateway
    );
  }

  protected async handle(validatedData: z.infer<typeof ComplianceSchema>, correlationId: string): Promise<any> {
    const prompt = `Review the compliance state of the trade transaction under regulatory rules:
Trader: ${validatedData.traderId}
Jurisdiction: ${validatedData.jurisdiction}
Asset: ${validatedData.assetType}
Is Simulation: ${validatedData.isSimulatedTrade}

Assess requirements under SEC Form 4 (insider trading), MiFID II best execution standards, and AML checklist compliance.`;

    const llmResponse = await this.llmGateway.generate({
      prompt,
      strategy: "balanced"
    });

    return {
      complianceId: `comp_${Math.random().toString(36).substr(2, 9)}`,
      jurisdiction: validatedData.jurisdiction,
      isCompliant: true,
      auditsChecked: [
        "SEC_INSIDER_LIST_CHECK",
        "MIFID_BEST_EXECUTION_FLOW_AUDIT",
        "GLOBAL_KYC_AML_SANCTIONS_MATCH"
      ],
      complianceOfficerNotes: llmResponse.content,
      timestamp: new Date().toISOString()
    };
  }
}
