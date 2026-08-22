import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const coreContractsSource = read('../../src/platform/FinTechCore/CoreContracts.ts');
const fixedPointSource = read('../../src/platform/FinTechCore/Financial/FixedPoint.ts');
const orderIntentSource = read('../../src/platform/FinTechCore/OrderIntent/OrderIntentBinding.ts');
const reconciliationSource = read('../../src/platform/FinTechCore/Reconciliation/ReconciliationContracts.ts');
const persistenceSource = read('../../src/platform/FinTechCore/Persistence/FinTechCorePersistencePort.ts');

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
      expect(reconciliationSource.toLowerCase()).not.toContain(token.toLowerCase());
      expect(fixedPointSource.toLowerCase()).not.toContain(token.toLowerCase());
    }
    expect(orderIntentSource).toContain("context.operatingMode !== 'PAPER'");
    expect(orderIntentSource).toContain('executionHandoffEligible: false');
    expect(orderIntentSource).toContain('PRE_TRADE_RISK_GATE');
    expect(orderIntentSource).toContain('PRE_TRADE_COMPLIANCE_GATE');
  });

  it('uses one canonical OrderIntent and one fixed-point representation', () => {
    expect(coreContractsSource).toContain('quantity: FinTechCoreFixedPoint');
    expect(coreContractsSource).toContain('priceBounds: FinTechCoreOrderPriceBounds');
    expect(coreContractsSource).not.toContain('readonly quantity: number');
    expect(orderIntentSource).not.toContain('FinTechCoreBoundOrderIntent');
    expect(fixedPointSource).toContain('atoms: string');
    expect(fixedPointSource).toContain('scale: number');
  });

  it('keeps reconciliation evidence-only and unresolved mismatch non-remediating', () => {
    expect(reconciliationSource).toContain('settlementFinalityAsserted: false');
    expect(reconciliationSource).toContain('realExecutionAsserted: false');
    expect(reconciliationSource).toContain('autoRepairAttempted: false');
    expect(reconciliationSource).toContain("status === 'MISMATCH'");
    expect(reconciliationSource).toContain('supervisorEscalationRequired');
  });

  it('exposes one OrderIntent persistence port without concrete database imports', () => {
    expect(persistenceSource).not.toContain("from '@supabase");
    expect(persistenceSource).not.toContain("from '../../../server");
    expect(persistenceSource).toContain('appendOrderIntent');
    expect(persistenceSource).not.toContain('appendBoundOrderIntent');
    expect(persistenceSource).toContain('appendReconciliationRecord');
  });

  it('keeps real execution hard-blocked until FT-7+', () => {
    expect(coreContractsSource).toContain('return false;');
    expect(coreContractsSource).toContain('does not gain a real-execution handoff before');
  });
});
