import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const orderIntentSource = read('src/platform/FinTechCore/OrderIntent/OrderIntentBinding.ts');
const reconciliationSource = read('src/platform/FinTechCore/Reconciliation/ReconciliationContracts.ts');
const persistenceSource = read('src/platform/FinTechCore/Persistence/FinTechCorePersistencePort.ts');

const forbiddenRuntimeImports = [
  '/agents/',
  '/MarketData/providers/',
  'ScoringDispatcher',
  'cryptoScoringService',
  'binance',
  'kraken',
  'coinbase',
  'supabase',
  'stripe',
  'custody',
  'wallet',
];

describe('FinTech Core FT-6 authority boundary', () => {
  it('keeps OrderIntent binding deterministic and independent of provider/agent/exchange runtimes', () => {
    for (const token of forbiddenRuntimeImports) {
      expect(orderIntentSource.toLowerCase()).not.toContain(token.toLowerCase());
    }
    expect(orderIntentSource).toContain("context.operatingMode !== 'PAPER'");
    expect(orderIntentSource).toContain('executionHandoffEligible: false');
    expect(orderIntentSource).toContain('PRE_TRADE_RISK_GATE');
    expect(orderIntentSource).toContain('PRE_TRADE_COMPLIANCE_GATE');
  });

  it('keeps reconciliation evidence-only and does not assert settlement or real execution', () => {
    for (const token of forbiddenRuntimeImports) {
      expect(reconciliationSource.toLowerCase()).not.toContain(token.toLowerCase());
    }
    expect(reconciliationSource).toContain('settlementFinalityAsserted: false');
    expect(reconciliationSource).toContain('realExecutionAsserted: false');
    expect(reconciliationSource).toContain("? 'MATCHED'");
    expect(reconciliationSource).toContain(": 'MISMATCH'");
  });

  it('exposes persistence as a port without importing a concrete database implementation', () => {
    expect(persistenceSource).not.toContain("from '@supabase");
    expect(persistenceSource).not.toContain("from '../../../server");
    expect(persistenceSource).toContain('appendBoundOrderIntent');
    expect(persistenceSource).toContain('appendReconciliationRecord');
  });
});
