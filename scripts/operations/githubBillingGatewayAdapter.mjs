export const GITHUB_BILLING_CAPABILITIES = Object.freeze([
  'github.billing.budgets.list',
  'github.billing.budgets.get',
  'github.billing.usage.summary',
  'github.billing.cost_centers.list',
]);

export const GITHUB_BILLING_REQUIRED_PERMISSION = 'enterprise_billing:read';

const CAPABILITY_SET = new Set(GITHUB_BILLING_CAPABILITIES);
const BUDGET_SCOPE_SET = new Set([
  'enterprise',
  'organization',
  'repository',
  'cost_center',
  'multi_user_customer',
  'multi_user_cost_center',
  'user',
]);
const COST_CENTER_STATE_SET = new Set(['active', 'deleted']);
const MAX_BUDGET_PAGES = 100;
const MAX_STRING_LENGTH = 128;

/** @returns {never} */
function fail(message) {
  throw new Error(`[GITHUB-BILLING-GATEWAY] ${message}`);
}

function assertRestTransport(githubRest) {
  if (typeof githubRest !== 'function') fail('githubRest transport is required');
}

function assertEnterpriseSlug(enterprise) {
  if (
    typeof enterprise !== 'string'
    || enterprise.length < 1
    || enterprise.length > 100
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(enterprise)
  ) {
    fail('enterprise must be a valid GitHub enterprise slug');
  }
}

function assertCapability(capability) {
  if (!CAPABILITY_SET.has(capability)) {
    fail(`capability is not allowlisted: ${String(capability)}`);
  }
}

function assertSafeOpaqueId(value, label) {
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > MAX_STRING_LENGTH
    || !/^[A-Za-z0-9._-]+$/.test(value)
  ) {
    fail(`${label} must be a safe opaque identifier`);
  }
}

function assertOptionalEnum(value, allowed, label) {
  if (value === undefined || value === null) return;
  if (!allowed.has(value)) fail(`${label} is not allowlisted: ${String(value)}`);
}

function assertOptionalInteger(value, label, min, max) {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`${label} must be an integer between ${min} and ${max}`);
  }
}

function assertOptionalFilterString(value, label) {
  if (value === undefined || value === null) return;
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > MAX_STRING_LENGTH
    || !/^[A-Za-z0-9 _.-]+$/.test(value)
  ) {
    fail(`${label} contains unsupported characters`);
  }
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value) {
  return typeof value === 'string' ? value : null;
}

function booleanOrFalse(value) {
  return value === true;
}

function buildQuery(path, entries) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function normalizeBudget(raw) {
  if (!raw || typeof raw !== 'object') fail('budget provider response must be an object');
  assertSafeOpaqueId(raw.id, 'budget.id');

  const productSkus = Array.isArray(raw.budget_product_skus)
    ? raw.budget_product_skus
    : raw.budget_product_sku
      ? [raw.budget_product_sku]
      : [];

  return Object.freeze({
    id: raw.id,
    budgetType: stringOrNull(raw.budget_type),
    productSkus: Object.freeze(productSkus.filter((value) => typeof value === 'string')),
    scope: stringOrNull(raw.budget_scope),
    entityName: stringOrNull(raw.budget_entity_name),
    amount: numberOrNull(raw.budget_amount),
    preventFurtherUsage: booleanOrFalse(raw.prevent_further_usage),
    alerting: Object.freeze({
      willAlert: booleanOrFalse(raw.budget_alerting?.will_alert),
      recipients: Object.freeze(
        Array.isArray(raw.budget_alerting?.alert_recipients)
          ? raw.budget_alerting.alert_recipients.filter((value) => typeof value === 'string')
          : [],
      ),
    }),
  });
}

function normalizeUsageItem(raw) {
  if (!raw || typeof raw !== 'object') fail('usage item provider response must be an object');
  return Object.freeze({
    product: stringOrNull(raw.product),
    sku: stringOrNull(raw.sku),
    unitType: stringOrNull(raw.unitType),
    pricePerUnit: numberOrNull(raw.pricePerUnit),
    grossQuantity: numberOrNull(raw.grossQuantity),
    grossAmount: numberOrNull(raw.grossAmount),
    discountQuantity: numberOrNull(raw.discountQuantity),
    discountAmount: numberOrNull(raw.discountAmount),
    netQuantity: numberOrNull(raw.netQuantity),
    netAmount: numberOrNull(raw.netAmount),
  });
}

function normalizeUsageSummary(raw) {
  if (!raw || typeof raw !== 'object') fail('usage summary provider response must be an object');
  const timePeriod = raw.timePeriod && typeof raw.timePeriod === 'object' ? raw.timePeriod : {};
  const usageItems = Array.isArray(raw.usageItems) ? raw.usageItems : [];

  return Object.freeze({
    timePeriod: Object.freeze({
      year: Number.isInteger(timePeriod.year) ? timePeriod.year : null,
      month: Number.isInteger(timePeriod.month) ? timePeriod.month : null,
      day: Number.isInteger(timePeriod.day) ? timePeriod.day : null,
    }),
    enterprise: stringOrNull(raw.enterprise),
    usageItems: Object.freeze(usageItems.map(normalizeUsageItem)),
  });
}

function normalizeCostCenter(raw) {
  if (!raw || typeof raw !== 'object') fail('cost center provider response must be an object');
  assertSafeOpaqueId(raw.id, 'costCenter.id');

  return Object.freeze({
    id: raw.id,
    name: stringOrNull(raw.name),
    state: stringOrNull(raw.state),
    aiCreditPoolEnabled: booleanOrFalse(raw.ai_credit_pool_enabled),
    aiCreditPoolState: raw.ai_credit_pool_state && typeof raw.ai_credit_pool_state === 'object'
      ? Object.freeze({
        targetAmount: numberOrNull(raw.ai_credit_pool_state.target_amount),
        currentAmount: numberOrNull(raw.ai_credit_pool_state.current_amount),
      })
      : null,
  });
}

async function listBudgets(githubRest, enterprise, scope) {
  assertOptionalEnum(scope, BUDGET_SCOPE_SET, 'budget scope');
  const budgets = [];

  for (let page = 1; page <= MAX_BUDGET_PAGES; page += 1) {
    const path = buildQuery(
      `/enterprises/${enterprise}/settings/billing/budgets`,
      [
        ['per_page', 100],
        ['page', page],
        ['scope', scope],
      ],
    );
    const raw = await githubRest({ method: 'GET', path });
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.budgets)) {
      fail('budget list response must contain a budgets array');
    }

    budgets.push(...raw.budgets.map(normalizeBudget));
    if (raw.has_next_page !== true) {
      return Object.freeze({
        totalCount: Number.isInteger(raw.total_count) ? raw.total_count : budgets.length,
        budgets: Object.freeze(budgets),
      });
    }
  }

  fail(`budget pagination exceeded safety limit of ${MAX_BUDGET_PAGES} pages`);
}

async function getBudget(githubRest, enterprise, budgetId) {
  assertSafeOpaqueId(budgetId, 'budgetId');
  const raw = await githubRest({
    method: 'GET',
    path: `/enterprises/${enterprise}/settings/billing/budgets/${encodeURIComponent(budgetId)}`,
  });
  return normalizeBudget(raw);
}

async function getUsageSummary(githubRest, enterprise, input) {
  assertOptionalInteger(input.year, 'year', 2000, 2100);
  assertOptionalInteger(input.month, 'month', 1, 12);
  assertOptionalInteger(input.day, 'day', 1, 31);
  assertOptionalFilterString(input.product, 'product');
  assertOptionalFilterString(input.sku, 'sku');
  if (input.costCenterId !== undefined && input.costCenterId !== null) {
    assertSafeOpaqueId(input.costCenterId, 'costCenterId');
  }

  const path = buildQuery(
    `/enterprises/${enterprise}/settings/billing/usage/summary`,
    [
      ['year', input.year],
      ['month', input.month],
      ['day', input.day],
      ['product', input.product],
      ['sku', input.sku],
      ['cost_center_id', input.costCenterId],
    ],
  );
  return normalizeUsageSummary(await githubRest({ method: 'GET', path }));
}

async function listCostCenters(githubRest, enterprise, state) {
  assertOptionalEnum(state, COST_CENTER_STATE_SET, 'cost center state');
  const path = buildQuery(
    `/enterprises/${enterprise}/settings/billing/cost-centers`,
    [['state', state]],
  );
  const raw = await githubRest({ method: 'GET', path });
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.costCenters)) {
    fail('cost center list response must contain a costCenters array');
  }

  return Object.freeze(raw.costCenters.map(normalizeCostCenter));
}

/**
 * @param {{
 *   githubRest?: (request: { method: string; path: string }) => Promise<any>;
 *   enterprise?: string;
 * }} [options]
 */
export function createGitHubBillingGatewayAdapter({
  githubRest = undefined,
  enterprise = undefined,
} = {}) {
  assertRestTransport(githubRest);
  assertEnterpriseSlug(enterprise);

  return Object.freeze({
    describeSurface() {
      return Object.freeze({
        enterprise,
        requiredPermission: GITHUB_BILLING_REQUIRED_PERMISSION,
        allowedHttpMethods: Object.freeze(['GET']),
        capabilities: GITHUB_BILLING_CAPABILITIES,
        excludes: Object.freeze([
          'budget.write',
          'cost_center.write',
          'usage_report_exports',
          'raw_github_proxy',
        ]),
      });
    },

    async execute(capability, input = {}) {
      assertCapability(capability);

      if (capability === 'github.billing.budgets.list') {
        return listBudgets(githubRest, enterprise, input.scope);
      }

      if (capability === 'github.billing.budgets.get') {
        return getBudget(githubRest, enterprise, input.budgetId);
      }

      if (capability === 'github.billing.usage.summary') {
        return getUsageSummary(githubRest, enterprise, input);
      }

      if (capability === 'github.billing.cost_centers.list') {
        return listCostCenters(githubRest, enterprise, input.state);
      }

      fail(`unreachable capability dispatch: ${capability}`);
    },
  });
}
