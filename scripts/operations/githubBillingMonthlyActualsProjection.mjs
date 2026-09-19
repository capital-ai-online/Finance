function numberOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function rounded(value) {
  return Number(numberOrZero(value).toFixed(6));
}

export function projectMonthlyBillingActuals(summary) {
  const usageItems = Array.isArray(summary?.usageItems) ? summary.usageItems : [];
  const rows = usageItems
    .map((item) => Object.freeze({
      product: typeof item?.product === 'string' ? item.product : null,
      sku: typeof item?.sku === 'string' ? item.sku : null,
      unitType: typeof item?.unitType === 'string' ? item.unitType : null,
      pricePerUnit: rounded(item?.pricePerUnit),
      grossQuantity: rounded(item?.grossQuantity),
      grossAmount: rounded(item?.grossAmount),
      discountQuantity: rounded(item?.discountQuantity),
      discountAmount: rounded(item?.discountAmount),
      netQuantity: rounded(item?.netQuantity),
      netAmount: rounded(item?.netAmount),
    }))
    .sort((a, b) => {
      const productOrder = String(a.product || '').localeCompare(String(b.product || ''));
      return productOrder !== 0
        ? productOrder
        : String(a.sku || '').localeCompare(String(b.sku || ''));
    });

  const totals = rows.reduce(
    (acc, item) => ({
      grossAmount: acc.grossAmount + item.grossAmount,
      discountAmount: acc.discountAmount + item.discountAmount,
      netAmount: acc.netAmount + item.netAmount,
    }),
    { grossAmount: 0, discountAmount: 0, netAmount: 0 },
  );

  return Object.freeze({
    timePeriod: Object.freeze({
      year: Number.isInteger(summary?.timePeriod?.year) ? summary.timePeriod.year : null,
      month: Number.isInteger(summary?.timePeriod?.month) ? summary.timePeriod.month : null,
      day: Number.isInteger(summary?.timePeriod?.day) ? summary.timePeriod.day : null,
    }),
    usageItemCount: rows.length,
    totals: Object.freeze({
      grossAmount: rounded(totals.grossAmount),
      discountAmount: rounded(totals.discountAmount),
      netAmount: rounded(totals.netAmount),
    }),
    rows: Object.freeze(rows),
  });
}
