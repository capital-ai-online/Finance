/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinTechPolicyEngine as PolicyEngine } from "@fintech-platform/policy-engine";

describe("PolicyEngine Tests", () => {
  let policyEngine: PolicyEngine;

  beforeEach(() => {
    policyEngine = new PolicyEngine();
  });

  it("should approve low-risk standard stock simulations", async () => {
    const result = await policyEngine.evaluate({
      type: "execute",
      payload: {
        assetClass: "STOCK",
        amount: 5000
      },
      context: {
        role: "Trader",
        isSimulation: true
      }
    });

    expect(result.allowed).toBe(true);
    expect(result.riskScore).toBeLessThan(30);
    expect(result.gatingRequired).toBe(false);
  });

  it("should block non-simulation real transactions", async () => {
    const result = await policyEngine.evaluate({
      type: "execute",
      payload: {
        action: "transact",
        amount: 1000
      },
      context: {
        isSimulation: false
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Safety violation: Real transactional operations are disabled");
  });

  it("should trigger human in the loop gating for meme coin acquisitions", async () => {
    const result = await policyEngine.evaluate({
      type: "execute",
      payload: {
        assetClass: "MEMECOIN",
        amount: 150000 // increases risk
      },
      context: {
        role: "Trader",
        isSimulation: true
      }
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(70);
    expect(result.gatingRequired).toBe(true);
  });
});
