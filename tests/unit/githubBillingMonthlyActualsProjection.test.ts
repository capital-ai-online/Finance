import { describe, expect, it } from 'vitest';
import { projectMonthlyBillingActuals } from '../../scripts/operations/githubBillingMonthlyActualsProjection.mjs';

describe('monthly GitHub billing actuals projection', () => {
  it('preserves billed-cost fields and totals current-period actuals', () => {
    const result = projectMonthlyBillingActuals({
      timePeriod: { year: 2026, month: 9, day: null },
      usageItems: [
        {
          product: 'Actions',
          sku: 'actions_linux',
          unitType: 'minutes',
          pricePerUnit: 0.008,
          grossQuantity: 100,
          grossAmount: 0.8,
          discountQuantity: 25,
          discountAmount: 0.2,
          netQuantity: 75,
          netAmount: 0.6,
        },
        {
          product: 'GHAS',
          sku: 'ghas_code_security_licenses',
          unitType: 'user-months',
          pricePerUnit: 49,
          grossQuantity: 1,
          grossAmount: 49,
          discountQuantity: 1,
          discountAmount: 49,
          netQuantity: 0,
          netAmount: 0,
        },
      ],
    });

    expect(result.timePeriod).toEqual({ year: 2026, month: 9, day: null });
    expect(result.usageItemCount).toBe(2);
    expect(result.totals).toEqual({
      grossAmount: 49.8,
      discountAmount: 49.2,
      netAmount: 0.6,
    });
    expect(result.rows).toEqual([
      {
        product: 'Actions',
        sku: 'actions_linux',
        unitType: 'minutes',
        pricePerUnit: 0.008,
        grossQuantity: 100,
        grossAmount: 0.8,
        discountQuantity: 25,
        discountAmount: 0.2,
        netQuantity: 75,
        netAmount: 0.6,
      },
      {
        product: 'GHAS',
        sku: 'ghas_code_security_licenses',
        unitType: 'user-months',
        pricePerUnit: 49,
        grossQuantity: 1,
        grossAmount: 49,
        discountQuantity: 1,
        discountAmount: 49,
        netQuantity: 0,
        netAmount: 0,
      },
    ]);
  });
});
