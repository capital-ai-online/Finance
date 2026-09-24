const REQUEST_TIMEOUT_MS = 10_000;

export const RENDER_PIPELINE_INCLUDED_MINUTES = Object.freeze({
  hobby: 500,
  pro: 1_000,
  scale: 5_000,
});

export const RENDER_WORKFLOWS_FLEX_PRICING = Object.freeze({
  effectiveAt: '2026-09-01',
  plan: 'flex',
  maxCpu: 1,
  maxRamGb: 4,
  cpuUsdPerActiveHour: 0.20,
  ramUsdPerActiveGbHour: 0.05,
  maxUsdPerHourAtFullUsage: 0.40,
  taskStateRetentionUsdPerGbMonth: 0.25,
  pricingSource: 'https://render.com/docs/workflows-limits',
});

const RENDER_SERVICE_MONTHLY_USD = Object.freeze({
  free: 0,
  starter: 7,
  '0.5c-512mb': 7,
});

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

async function readJson(url, apiKey, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(`provider read failed with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function unwrapCollection(payload, key) {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((entry) => entry && typeof entry === 'object' && entry[key] ? entry[key] : entry)
    .filter((entry) => entry && typeof entry === 'object');
}

function normalizeWorkspacePlan(value) {
  const plan = clean(value).toLowerCase();
  return Object.hasOwn(RENDER_PIPELINE_INCLUDED_MINUTES, plan) ? plan : null;
}

function normalizeRenderService(service) {
  const details = service?.serviceDetails && typeof service.serviceDetails === 'object'
    ? service.serviceDetails
    : {};
  const type = clean(service?.type) || 'unknown';
  const plan = clean(details.plan) || null;
  const buildPlan = clean(details.buildPlan) || null;
  const instances = type === 'static_site' ? 0 : positiveInteger(details.numInstances, 1);
  const pricePerInstance = type === 'static_site'
    ? 0
    : Object.hasOwn(RENDER_SERVICE_MONTHLY_USD, String(plan || '').toLowerCase())
      ? RENDER_SERVICE_MONTHLY_USD[String(plan).toLowerCase()]
      : null;
  const monthlyListPriceUsd = typeof pricePerInstance === 'number'
    ? Number((pricePerInstance * instances).toFixed(2))
    : null;

  return Object.freeze({
    id: clean(service?.id) || null,
    name: clean(service?.name) || null,
    type,
    suspended: clean(service?.suspended) || null,
    plan,
    buildPlan,
    instances,
    monthlyListPriceUsd,
    pricingStatus: monthlyListPriceUsd === null ? 'NOT_PRICED' : 'PUBLIC_LIST_PRICE_BASELINE',
  });
}

function buildRenderUnavailableSnapshot({ workspaceId, workspacePlan, status, reason }) {
  const normalizedPlan = normalizeWorkspacePlan(workspacePlan);
  return Object.freeze({
    coverage: Object.freeze({ status, reason }),
    workspaceId: clean(workspaceId) || null,
    workspacePlan: normalizedPlan,
    activeServices: Object.freeze([]),
    monthlyListPriceBaselineUsd: 0,
    unpricedActiveServiceCount: 0,
    pricingSemantics: 'PUBLIC_LIST_PRICE_FULL_MONTH_BASELINE_NOT_PROVIDER_INVOICE',
    pricingSource: 'https://render.com/pricing',
    pipeline: Object.freeze({
      observedTier: null,
      workspacePlan: normalizedPlan,
      includedMinutes: normalizedPlan ? RENDER_PIPELINE_INCLUDED_MINUTES[normalizedPlan] : null,
      currentUsageMinutes: null,
      remainingIncludedMinutes: null,
      usageStatus: 'NOT_OBSERVABLE_VIA_RENDER_PUBLIC_API',
      includedByWorkspacePlan: RENDER_PIPELINE_INCLUDED_MINUTES,
      source: 'https://render.com/docs/build-pipeline',
    }),
    workflows: Object.freeze({
      count: null,
      names: Object.freeze([]),
      pricing: RENDER_WORKFLOWS_FLEX_PRICING,
    }),
  });
}

export async function readRenderCostSnapshot({
  apiKey,
  workspaceId,
  workspacePlan = null,
  fetchImpl = fetch,
} = {}) {
  const token = clean(apiKey);
  const ownerId = clean(workspaceId);
  if (!token || !ownerId) {
    return buildRenderUnavailableSnapshot({
      workspaceId: ownerId,
      workspacePlan,
      status: 'NOT_CONFIGURED',
      reason: !token
        ? 'CAPITAL_AI_RENDER_API_KEY is not configured'
        : 'CAPITAL_AI_RENDER_WORKSPACE_ID is not configured',
    });
  }

  const query = new URLSearchParams({
    ownerId,
    includePreviews: 'false',
    limit: '100',
  });
  const workflowQuery = new URLSearchParams({
    ownerId,
    limit: '100',
  });
  const [servicePayload, workflowPayload] = await Promise.all([
    readJson(`https://api.render.com/v1/services?${query.toString()}`, token, fetchImpl),
    readJson(`https://api.render.com/v1/workflows?${workflowQuery.toString()}`, token, fetchImpl),
  ]);

  const services = unwrapCollection(servicePayload, 'service')
    .map(normalizeRenderService)
    .filter((service) => service.suspended !== 'suspended');
  const workflows = unwrapCollection(workflowPayload, 'workflow');
  const normalizedPlan = normalizeWorkspacePlan(workspacePlan);
  const observedBuildPlans = [...new Set(services.map((service) => service.buildPlan).filter(Boolean))];
  const pricedServices = services.filter((service) => typeof service.monthlyListPriceUsd === 'number');

  return Object.freeze({
    coverage: Object.freeze({ status: 'PASS', reason: null }),
    workspaceId: ownerId,
    workspacePlan: normalizedPlan,
    activeServices: Object.freeze(services),
    monthlyListPriceBaselineUsd: Number(
      pricedServices.reduce((sum, service) => sum + service.monthlyListPriceUsd, 0).toFixed(2),
    ),
    unpricedActiveServiceCount: services.length - pricedServices.length,
    pricingSemantics: 'PUBLIC_LIST_PRICE_FULL_MONTH_BASELINE_NOT_PROVIDER_INVOICE',
    pricingSource: 'https://render.com/pricing',
    pipeline: Object.freeze({
      observedTier: observedBuildPlans.length === 1 ? observedBuildPlans[0] : null,
      workspacePlan: normalizedPlan,
      includedMinutes: normalizedPlan ? RENDER_PIPELINE_INCLUDED_MINUTES[normalizedPlan] : null,
      currentUsageMinutes: null,
      remainingIncludedMinutes: null,
      usageStatus: 'NOT_OBSERVABLE_VIA_RENDER_PUBLIC_API',
      includedByWorkspacePlan: RENDER_PIPELINE_INCLUDED_MINUTES,
      source: 'https://render.com/docs/build-pipeline',
    }),
    workflows: Object.freeze({
      count: workflows.length,
      names: Object.freeze(workflows.map((workflow) => clean(workflow?.name)).filter(Boolean).sort()),
      pricing: RENDER_WORKFLOWS_FLEX_PRICING,
    }),
  });
}

function monthlyEquivalentMinor(amountMinor, interval, intervalCount, quantity) {
  const amount = Number(amountMinor);
  if (!Number.isFinite(amount)) return null;
  const count = positiveInteger(intervalCount, 1);
  const qty = positiveInteger(quantity, 1);
  const cadence = clean(interval).toLowerCase();
  const recurring = amount * qty;

  if (cadence === 'month') return recurring / count;
  if (cadence === 'year') return recurring / (12 * count);
  if (cadence === 'week') return recurring * (52 / 12) / count;
  if (cadence === 'day') return recurring * (365 / 12) / count;
  return null;
}

export function normalizeStripeActiveSubscriptions(payload) {
  const subscriptions = Array.isArray(payload?.data) ? payload.data : [];
  const rows = [];

  for (const subscription of subscriptions) {
    if (clean(subscription?.status).toLowerCase() !== 'active') continue;
    const items = Array.isArray(subscription?.items?.data) ? subscription.items.data : [];
    for (const item of items) {
      const price = item?.price && typeof item.price === 'object' ? item.price : item?.plan;
      const recurring = price?.recurring && typeof price.recurring === 'object' ? price.recurring : price;
      const amountMinor = typeof price?.unit_amount === 'number'
        ? price.unit_amount
        : typeof price?.amount === 'number'
          ? price.amount
          : null;
      const interval = clean(recurring?.interval) || null;
      const intervalCount = positiveInteger(recurring?.interval_count, 1);
      const quantity = positiveInteger(item?.quantity, 1);
      const equivalent = monthlyEquivalentMinor(amountMinor, interval, intervalCount, quantity);
      rows.push(Object.freeze({
        subscriptionId: clean(subscription?.id) || null,
        planLabel: clean(subscription?.metadata?.plan)
          || clean(subscription?.metadata?.plan_id)
          || clean(subscription?.metadata?.planId)
          || clean(price?.nickname)
          || clean(price?.id)
          || 'Unbenannt',
        status: 'active',
        cancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
        currency: clean(price?.currency || subscription?.currency).toLowerCase() || null,
        amountMinor,
        quantity,
        interval,
        intervalCount,
        monthlyEquivalentMinor: equivalent === null ? null : Number(equivalent.toFixed(6)),
      }));
    }
  }

  const monthlyEquivalentByCurrency = {};
  for (const row of rows) {
    if (!row.currency || typeof row.monthlyEquivalentMinor !== 'number') continue;
    monthlyEquivalentByCurrency[row.currency] = Number(
      ((monthlyEquivalentByCurrency[row.currency] || 0) + row.monthlyEquivalentMinor).toFixed(6),
    );
  }

  return Object.freeze({
    coverage: Object.freeze({ status: 'PASS', reason: null }),
    semantics: 'CUSTOMER_RECURRING_CHARGES_NOT_MERCHANT_OPERATING_COST',
    activeSubscriptionCount: new Set(rows.map((row) => row.subscriptionId).filter(Boolean)).size,
    recurringItems: Object.freeze(rows),
    monthlyEquivalentByCurrency: Object.freeze(monthlyEquivalentByCurrency),
  });
}

export async function readStripeSubscriptionSnapshot({
  apiKey,
  fetchImpl = fetch,
} = {}) {
  const token = clean(apiKey);
  if (!token) {
    return Object.freeze({
      coverage: Object.freeze({
        status: 'NOT_CONFIGURED',
        reason: 'CAPITAL_AI_STRIPE_BILLING_READ_KEY is not configured',
      }),
      semantics: 'CUSTOMER_RECURRING_CHARGES_NOT_MERCHANT_OPERATING_COST',
      activeSubscriptionCount: null,
      recurringItems: Object.freeze([]),
      monthlyEquivalentByCurrency: Object.freeze({}),
    });
  }

  const query = new URLSearchParams({ status: 'active', limit: '100' });
  const payload = await readJson(
    `https://api.stripe.com/v1/subscriptions?${query.toString()}`,
    token,
    fetchImpl,
  );
  return normalizeStripeActiveSubscriptions(payload);
}
