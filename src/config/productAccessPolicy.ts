/**
 * Presentation lifecycle for the currently archived pricing model.
 *
 * This contract deliberately owns only product-surface visibility and checkout entry-point
 * presentation. It does not grant protected server capabilities, bypass provider limits,
 * change Stripe state, or replace server-side IAM/quota/credit enforcement.
 */
export const PRODUCT_ACCESS_POLICY = Object.freeze({
  pricingLifecycle: 'archived_pending_replacement',
  pricingArchivedAt: '2026-09-23',
  subscriptionVisibilityGating: false,
  checkoutEntryPointsEnabled: false,
} as const);

export type ProductAccessPolicy = typeof PRODUCT_ACCESS_POLICY;
