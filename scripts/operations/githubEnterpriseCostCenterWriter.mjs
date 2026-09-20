export const ENTERPRISE_COST_CENTER_NAME = 'Enterprise';
export const ENTERPRISE_COST_CENTER_AI_CREDIT_POOL_ENABLED = false;

function fail(message) {
  throw new Error(`[GITHUB-ENTERPRISE-COST-CENTER-WRITER] ${message}`);
}

function normalizeCostCenter(raw) {
  if (!raw || typeof raw !== 'object') fail('provider response must be an object');
  if (typeof raw.id !== 'string' || raw.id.length < 1 || raw.id.length > 128) {
    fail('provider response contains an invalid cost center id');
  }
  return Object.freeze({
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : null,
    state: typeof raw.state === 'string' ? raw.state : null,
    aiCreditPoolEnabled: raw.ai_credit_pool_enabled === true,
  });
}

function matchesEnterpriseName(costCenter) {
  return String(costCenter?.name || '').trim().toLowerCase() === ENTERPRISE_COST_CENTER_NAME.toLowerCase();
}

/**
 * Idempotently ensures the canonical Enterprise cost center exists.
 *
 * Read-before-write is mandatory:
 * - exactly one active match -> NOOP/EXISTS
 * - multiple active matches -> fail closed
 * - deleted match -> fail closed for manual reconciliation
 * - no match -> one bounded create call
 */
export function createGitHubEnterpriseCostCenterWriter({ billingReader, createCostCenter } = {}) {
  if (!billingReader || typeof billingReader.execute !== 'function') {
    fail('billingReader.execute is required');
  }
  if (typeof createCostCenter !== 'function') {
    fail('createCostCenter transport is required');
  }

  return Object.freeze({
    async ensure() {
      const [active, deleted] = await Promise.all([
        billingReader.execute('github.billing.cost_centers.list', { state: 'active' }),
        billingReader.execute('github.billing.cost_centers.list', { state: 'deleted' }),
      ]);

      const activeMatches = active.filter(matchesEnterpriseName);
      const deletedMatches = deleted.filter(matchesEnterpriseName);

      if (activeMatches.length > 1) {
        fail('multiple active Enterprise cost centers exist; manual reconciliation required');
      }
      if (activeMatches.length === 1) {
        const existing = activeMatches[0];
        return Object.freeze({
          status: 'EXISTS',
          created: false,
          costCenter: Object.freeze({
            id: existing.id,
            name: existing.name,
            state: existing.state,
            aiCreditPoolEnabled: existing.aiCreditPoolEnabled === true,
          }),
        });
      }
      if (deletedMatches.length > 0) {
        fail('an archived Enterprise cost center exists; manual reconciliation required before recreation');
      }

      const raw = await createCostCenter({
        name: ENTERPRISE_COST_CENTER_NAME,
        aiCreditPoolEnabled: ENTERPRISE_COST_CENTER_AI_CREDIT_POOL_ENABLED,
      });
      const created = normalizeCostCenter(raw);
      if (String(created.name || '').trim() !== ENTERPRISE_COST_CENTER_NAME) {
        fail('created cost center name does not match the canonical Enterprise name');
      }

      return Object.freeze({
        status: 'CREATED',
        created: true,
        costCenter: created,
      });
    },
  });
}
