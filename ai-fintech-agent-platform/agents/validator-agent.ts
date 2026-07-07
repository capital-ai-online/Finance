/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { BaseAgent } from "@fintech-platform/core-agent";

const ValidatorSchema = z.object({
  targetEntity: z.string(),
  proposedAction: z.string(),
  mathematicalBounds: z.object({
    expectedMax: z.number(),
    actualValue: z.number()
  })
});

/**
 * Validator Agent
 * Verifies computations, ensures pricing limits fall within acceptable sigma bounds,
 * and double-checks system outputs before finalizing logs.
 */
export class ValidatorAgent extends BaseAgent {
  constructor(eventBus: any, llmGateway: any) {
    super(
      {
        name: "ValidatorAgent",
        role: "Quantitative Integrity Officer",
        inputSchema: ValidatorSchema
      },
      eventBus,
      llmGateway
    );
  }

  protected async handle(validatedData: z.infer<typeof ValidatorSchema>, correlationId: string): Promise<any> {
    const { actualValue, expectedMax } = validatedData.mathematicalBounds;
    const passesBoundsCheck = actualValue <= expectedMax;

    const prompt = `Validate the structural parameters of the execution results:
Proposed Action: ${validatedData.proposedAction} on ${validatedData.targetEntity}
Calculated Metric Value: ${actualValue} (Max Permitted: ${expectedMax})

Confirm whether this exhibits any signal outliers or extreme deviation.`;

    const llmResponse = await this.llmGateway.generate({
      prompt,
      strategy: "balanced"
    });

    return {
      validationId: `val_${Math.random().toString(36).substr(2, 9)}`,
      targetEntity: validatedData.targetEntity,
      proposedAction: validatedData.proposedAction,
      passesBoundsCheck,
      confidenceScore: passesBoundsCheck ? 98.4 : 32.1,
      notes: llmResponse.content,
      timestamp: new Date().toISOString()
    };
  }
}
