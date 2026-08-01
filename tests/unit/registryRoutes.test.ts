// Audit ARCH-AUDIT-0002 (H5): Testabdeckung fuer die aus server.ts nach
// src/features/registry/ extrahierte Payload-Filterlogik.

import { describe, it, expect } from 'vitest';
import { buildAssetUpdatePayload } from '../../src/features/registry/registryRoutes';

describe('buildAssetUpdatePayload', () => {
  it('uebernimmt korrekt typisierte Felder unveraendert', () => {
    const payload = buildAssetUpdatePayload({
      expectedReturn: 5.5,
      volatility: 20,
      drift: 0.08,
      price: 100,
      change24h: 2.1,
      marketCap: 500,
      isLocked: true,
    });
    expect(payload).toEqual({
      expectedReturn: 5.5,
      volatility: 20,
      drift: 0.08,
      price: 100,
      change24h: 2.1,
      marketCap: 500,
      isLocked: true,
    });
  });

  it('laesst falsch typisierte Felder als undefined aus', () => {
    const payload = buildAssetUpdatePayload({
      price: '100', // string statt number
      isLocked: 'true', // string statt boolean
      volatility: 20,
    });
    expect(payload.price).toBeUndefined();
    expect(payload.isLocked).toBeUndefined();
    expect(payload.volatility).toBe(20);
  });

  it('ignoriert unbekannte Felder und wirft nicht bei leerem/fehlendem Body', () => {
    expect(() => buildAssetUpdatePayload({ notAField: 1 })).not.toThrow();
    expect(() => buildAssetUpdatePayload(undefined)).not.toThrow();
    const payload = buildAssetUpdatePayload(undefined);
    expect(Object.values(payload).every(v => v === undefined)).toBe(true);
  });
});
