export interface PdfExportFlowOptions<TConsumption> {
  unlimited: boolean;
  prepareExport: () => Promise<() => void | Promise<void>>;
  consumeCredit: () => Promise<TConsumption>;
}

/**
 * Prepares the complete PDF before any credit mutation. For limited accounts the
 * authenticated server-side debit must then succeed before the already prepared
 * download is committed. This avoids charging for generation failures and avoids
 * granting a download when the debit is rejected.
 */
export async function runPdfExportFlow<TConsumption>(
  options: PdfExportFlowOptions<TConsumption>,
): Promise<TConsumption | null> {
  const commitDownload = await options.prepareExport();
  const consumption = options.unlimited ? null : await options.consumeCredit();
  await commitDownload();
  return consumption;
}
