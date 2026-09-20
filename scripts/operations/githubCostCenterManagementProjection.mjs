import { projectMonthlyBillingActuals } from './githubBillingMonthlyActualsProjection.mjs';

export const CANONICAL_ENTERPRISE_COST_CENTER_NAME = 'Enterprise';
export const OWNER_ADDITIONAL_COST_TARGET_EUR = 5;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function amount(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Number(value.toFixed(6))
    : 0;
}

function lower(value) {
  return text(value).toLowerCase();
}

function isExpectedEnterpriseLicense(row) {
  const product = lower(row?.product);
  const sku = lower(row?.sku);
  return (
    sku === 'ghec_licenses'
    || sku.includes('ghec')
    || product === 'ghec'
    || product.includes('github enterprise')
  );
}

function categoryFor(row) {
  const haystack = `${lower(row?.product)} ${lower(row?.sku)}`;

  if (isExpectedEnterpriseLicense(row)) return 'ENTERPRISE_LICENSE';
  if (
    haystack.includes('advanced security')
    || haystack.includes('ghas')
    || haystack.includes('code_security')
    || haystack.includes('secret_protection')
    || haystack.includes('secret protection')
    || haystack.includes('code security')
  ) return 'SECURITY';
  if (haystack.includes('actions')) return 'ACTIONS';
  if (haystack.includes('codespaces')) return 'CODESPACES';
  if (haystack.includes('package') || haystack.includes('lfs') || haystack.includes('storage')) return 'STORAGE';
  if (haystack.includes('copilot') || haystack.includes('model') || haystack.includes('ai credit')) return 'AI';
  return 'OTHER';
}

function bucketRows(rows) {
  const result = {
    enterpriseLicenseNet: 0,
    includedOrDiscountedGross: 0,
    additionalNet: 0,
    securityNet: 0,
    actionsNet: 0,
    aiNet: 0,
    storageNet: 0,
    codespacesNet: 0,
    otherNet: 0,
    positiveAdditionalRows: [],
    includedOrDiscountedRows: [],
  };

  for (const row of rows) {
    const grossAmount = amount(row?.grossAmount);
    const netAmount = amount(row?.netAmount);
    const category = categoryFor(row);

    if (isExpectedEnterpriseLicense(row)) {
      result.enterpriseLicenseNet += netAmount;
      continue;
    }

    if (grossAmount > 0 && netAmount <= 0) {
      result.includedOrDiscountedGross += grossAmount;
      result.includedOrDiscountedRows.push(row);
    }

    if (netAmount <= 0) continue;

    result.additionalNet += netAmount;
    result.positiveAdditionalRows.push(row);

    if (category === 'SECURITY') result.securityNet += netAmount;
    else if (category === 'ACTIONS') result.actionsNet += netAmount;
    else if (category === 'AI') result.aiNet += netAmount;
    else if (category === 'STORAGE') result.storageNet += netAmount;
    else if (category === 'CODESPACES') result.codespacesNet += netAmount;
    else result.otherNet += netAmount;
  }

  return Object.freeze({
    enterpriseLicenseNet: amount(result.enterpriseLicenseNet),
    includedOrDiscountedGross: amount(result.includedOrDiscountedGross),
    additionalNet: amount(result.additionalNet),
    securityNet: amount(result.securityNet),
    actionsNet: amount(result.actionsNet),
    aiNet: amount(result.aiNet),
    storageNet: amount(result.storageNet),
    codespacesNet: amount(result.codespacesNet),
    otherNet: amount(result.otherNet),
    positiveAdditionalRows: Object.freeze(result.positiveAdditionalRows),
    includedOrDiscountedRows: Object.freeze(result.includedOrDiscountedRows),
  });
}

function activeCanonicalCostCenters(costCenters) {
  return (Array.isArray(costCenters) ? costCenters : []).filter((item) => (
    lower(item?.name) === CANONICAL_ENTERPRISE_COST_CENTER_NAME.toLowerCase()
    && lower(item?.state) === 'active'
  ));
}

function deletedCanonicalCostCenters(costCenters) {
  return (Array.isArray(costCenters) ? costCenters : []).filter((item) => (
    lower(item?.name) === CANONICAL_ENTERPRISE_COST_CENTER_NAME.toLowerCase()
    && lower(item?.state) === 'deleted'
  ));
}

function matchingCostCenterBudgets(budgets, costCenterId) {
  const rows = Array.isArray(budgets?.budgets) ? budgets.budgets : [];
  if (!costCenterId) return [];
  return rows.filter((budget) => (
    lower(budget?.scope) === 'cost_center'
    && text(budget?.entityName) === costCenterId
  ));
}

function recommendation(priority, code, reason) {
  return Object.freeze({ priority, code, reason });
}

/**
 * Deterministic management projection for GitHub Enterprise billing.
 *
 * Provider amounts are never converted into EUR here because the GitHub usage-summary
 * response does not establish a currency in this repository contract. The Owner's
 * EUR 5 target is retained as a policy target and is intentionally not compared with
 * provider amounts until currency evidence exists.
 *
 * @param {{
 *   enterpriseUsageSummary?: any;
 *   costCenterUsageSummary?: any;
 *   costCenters?: any[];
 *   budgets?: any;
 * }} [input]
 */
export function projectGitHubCostCenterManagement({
  enterpriseUsageSummary = null,
  costCenterUsageSummary = null,
  costCenters = [],
  budgets = null,
} = {}) {
  const enterpriseActuals = projectMonthlyBillingActuals(enterpriseUsageSummary);
  const costCenterActuals = projectMonthlyBillingActuals(costCenterUsageSummary);

  const activeMatches = activeCanonicalCostCenters(costCenters);
  const deletedMatches = deletedCanonicalCostCenters(costCenters);

  const canonicalState = activeMatches.length === 1
    ? 'ACTIVE'
    : activeMatches.length > 1
      ? 'AMBIGUOUS'
      : deletedMatches.length > 0
        ? 'DELETED_RECONCILIATION_REQUIRED'
        : 'NOT_CONFIGURED';

  const canonical = activeMatches.length === 1 ? activeMatches[0] : null;
  const costCenterBudgets = matchingCostCenterBudgets(budgets, canonical?.id);
  const bucket = bucketRows(enterpriseActuals.rows);

  const enterpriseNet = amount(enterpriseActuals.totals.netAmount);
  const costCenterNet = amount(costCenterActuals.totals.netAmount);
  const enterpriseOnlyNet = amount(Math.max(0, enterpriseNet - costCenterNet));

  const recommendations = [];

  if (canonicalState === 'NOT_CONFIGURED') {
    recommendations.push(recommendation(
      'P1',
      'CREATE_CANONICAL_COST_CENTER',
      'Der kanonische Cost Center Enterprise ist noch nicht aktiv; Kosten können dadurch nicht gezielt als Cost-Center-Nutzung ausgewertet werden.',
    ));
  } else if (canonicalState !== 'ACTIVE') {
    recommendations.push(recommendation(
      'P0',
      'RECONCILE_COST_CENTER_STATE',
      'Der kanonische Cost Center ist nicht eindeutig aktiv. Vor weiteren Writes ist manuelle Reconciliation erforderlich.',
    ));
  }

  if (canonicalState === 'ACTIVE' && enterpriseNet > 0 && costCenterNet === 0) {
    recommendations.push(recommendation(
      'P1',
      'ASSIGN_BILLABLE_RESOURCES',
      'Der Cost Center ist aktiv, aber aktuell werden keine Kosten ihm zugerechnet. Organisation, Repositories und/oder Benutzerzuordnung sollten geprüft werden.',
    ));
  }

  if (canonicalState === 'ACTIVE' && costCenterBudgets.length === 0) {
    recommendations.push(recommendation(
      'P1',
      'CONFIGURE_COST_CENTER_BUDGET',
      'Für den aktiven Cost Center wurde kein Cost-Center-Budget gefunden. Der Owner-Zielwert beträgt 5 EUR zusätzliche Monatskosten.',
    ));
  }

  if (bucket.securityNet > 0) {
    recommendations.push(recommendation(
      'P0',
      'TRACE_SECURITY_COST_ORIGIN',
      'Positive GitHub-Security-Kosten sind vorhanden und sollten bis auf Repository/Benutzer/Produkt zurückverfolgt werden.',
    ));
  }

  if (bucket.additionalNet > 0) {
    recommendations.push(recommendation(
      'P1',
      'REVIEW_ADDITIONAL_COSTS',
      'Es bestehen positive Nettokosten außerhalb der erwarteten Enterprise-Grundlizenz.',
    ));
  }

  if (bucket.otherNet > 0) {
    recommendations.push(recommendation(
      'P0',
      'CLASSIFY_UNKNOWN_BILLING_SKU',
      'Mindestens eine positive Kostenposition ist keiner bekannten Kostenklasse zugeordnet.',
    ));
  }

  if (canonicalState === 'ACTIVE' && enterpriseOnlyNet > 0) {
    recommendations.push(recommendation(
      'P2',
      'REVIEW_ENTERPRISE_ONLY_SPEND',
      'Ein Teil der Enterprise-Kosten erscheint außerhalb des Cost Centers. Das kann erwartete Basis-/nicht zuordenbare Nutzung oder fehlende Ressourcenzuordnung sein.',
    ));
  }

  if (recommendations.length === 0) {
    recommendations.push(recommendation(
      'P3',
      'NO_IMMEDIATE_ACTION',
      'Cost Center, Budget-Readback und aktuelle Zusatzkosten zeigen keinen unmittelbaren Handlungsbedarf.',
    ));
  }

  const hardStopBudgetCount = costCenterBudgets.filter((item) => item?.preventFurtherUsage === true).length;
  const alertingBudgetCount = costCenterBudgets.filter((item) => item?.alerting?.willAlert === true).length;

  const decisionState = canonicalState !== 'ACTIVE'
    ? 'SETUP_REQUIRED'
    : bucket.securityNet > 0 || bucket.otherNet > 0
      ? 'COST_REVIEW_REQUIRED'
      : costCenterBudgets.length === 0
        ? 'BUDGET_CONFIGURATION_REQUIRED'
        : bucket.additionalNet > 0
          ? 'ADDITIONAL_SPEND_OBSERVED'
          : 'CONTROLLED';

  return Object.freeze({
    status: 'PASS',
    mode: 'READ_ONLY_COST_CENTER_MANAGEMENT',
    canonicalCostCenter: Object.freeze({
      expectedName: CANONICAL_ENTERPRISE_COST_CENTER_NAME,
      state: canonicalState,
      activeMatchCount: activeMatches.length,
      deletedMatchCount: deletedMatches.length,
      aiCreditPoolEnabled: canonical?.aiCreditPoolEnabled === true,
    }),
    decisionState,
    period: enterpriseActuals.timePeriod,
    totals: Object.freeze({
      enterpriseGross: enterpriseActuals.totals.grossAmount,
      enterpriseDiscount: enterpriseActuals.totals.discountAmount,
      enterpriseNet,
      costCenterNet,
      enterpriseOnlyNet,
      expectedEnterpriseLicenseNet: bucket.enterpriseLicenseNet,
      includedOrDiscountedGross: bucket.includedOrDiscountedGross,
      additionalNet: bucket.additionalNet,
      securityNet: bucket.securityNet,
      actionsNet: bucket.actionsNet,
      aiNet: bucket.aiNet,
      storageNet: bucket.storageNet,
      codespacesNet: bucket.codespacesNet,
      otherNet: bucket.otherNet,
    }),
    costCenterBudget: Object.freeze({
      configuredCount: costCenterBudgets.length,
      hardStopBudgetCount,
      alertingBudgetCount,
      providerAmounts: Object.freeze(
        costCenterBudgets
          .map((item) => amount(item?.amount))
          .filter((value) => value >= 0),
      ),
    }),
    ownerPolicy: Object.freeze({
      additionalMonthlyCostTarget: OWNER_ADDITIONAL_COST_TARGET_EUR,
      currency: 'EUR',
      providerCurrencyComparison: 'NOT_PERFORMED_WITHOUT_EXPLICIT_PROVIDER_CURRENCY_EVIDENCE',
      desiredOutcome: 'Enterprise-Grundlizenz ausnehmen; zusätzliche kostenpflichtige Nutzung auf 5 EUR pro Abrechnungszyklus begrenzen.',
    }),
    classifications: Object.freeze({
      positiveAdditionalRows: bucket.positiveAdditionalRows,
      includedOrDiscountedRows: bucket.includedOrDiscountedRows,
    }),
    recommendations: Object.freeze(recommendations),
    amountSemantics: 'Enterprise and Cost Center are nested billing views and must not be added together.',
    providerMutationPerformed: false,
  });
}
