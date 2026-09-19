function sortedUnique(values) {
  return Object.freeze(
    [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort(),
  );
}

export function projectBudgetInventoryEvidence(result) {
  const budgets = Array.isArray(result?.budgets) ? result.budgets : [];
  return Object.freeze({
    budgetCount: budgets.length,
    budgetTypes: sortedUnique(budgets.map((budget) => budget?.budgetType)),
    scopes: sortedUnique(budgets.map((budget) => budget?.scope)),
    alertingEnabledCount: budgets.filter((budget) => budget?.alerting?.willAlert === true).length,
    preventFurtherUsageCount: budgets.filter((budget) => budget?.preventFurtherUsage === true).length,
  });
}

export function projectUsageInventoryEvidence(summary) {
  const usageItems = Array.isArray(summary?.usageItems) ? summary.usageItems : [];

  return Object.freeze({
    timePeriod: Object.freeze({
      year: Number.isInteger(summary?.timePeriod?.year) ? summary.timePeriod.year : null,
      month: Number.isInteger(summary?.timePeriod?.month) ? summary.timePeriod.month : null,
      day: Number.isInteger(summary?.timePeriod?.day) ? summary.timePeriod.day : null,
    }),
    usageItemCount: usageItems.length,
    products: sortedUnique(usageItems.map((item) => item?.product)),
    skus: sortedUnique(usageItems.map((item) => item?.sku)),
    unitTypes: sortedUnique(usageItems.map((item) => item?.unitType)),
    hasUsage: usageItems.some((item) => {
      const grossQuantity = typeof item?.grossQuantity === 'number' ? item.grossQuantity : 0;
      const netQuantity = typeof item?.netQuantity === 'number' ? item.netQuantity : 0;
      return grossQuantity !== 0 || netQuantity !== 0;
    }),
  });
}

export function projectCostCenterInventoryEvidence(costCenters) {
  const rows = Array.isArray(costCenters) ? costCenters : [];

  return Object.freeze({
    costCenterCount: rows.length,
    states: sortedUnique(rows.map((costCenter) => costCenter?.state)),
    aiCreditPoolEnabledCount: rows.filter((costCenter) => costCenter?.aiCreditPoolEnabled === true).length,
  });
}
