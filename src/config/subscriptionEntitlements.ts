export type SubscriptionTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';
export type AccountType = 'guest' | 'registered';

export type FeatureKey =
  | 'verified_screening'
  | 'backtest'
  | 'monte_carlo'
  | 'full_ai_analysis'
  | 'realtime_ai_newsfeed'
  | 'buffett_value_check'
  | 'pdf_compliance_export';

export interface WindowedLimit {
  limit: number;
  windowDays: number;
}

export interface PlanEntitlements {
  monthlyPriceEur: number;
  annualBilling: 'not_applicable' | 'ten_percent_discount' | 'on_request';
  devices: number;
  verifiedScreening: WindowedLimit | 'unlimited';
  backtest: boolean;
  monteCarlo: WindowedLimit | 'unlimited' | 'none';
  fullAiAnalysis: WindowedLimit | 'unlimited' | 'preview_only';
  realtimeAiNewsfeed: boolean;
  buffettValueCheck: WindowedLimit | 'unlimited';
  pdfComplianceExport: boolean;
}

export const SUBSCRIPTION_ENTITLEMENTS: Record<SubscriptionTier, PlanEntitlements> = {
  Free: {
    monthlyPriceEur: 0,
    annualBilling: 'not_applicable',
    devices: 1,
    verifiedScreening: { limit: 3, windowDays: 5 },
    backtest: false,
    monteCarlo: 'none',
    fullAiAnalysis: 'preview_only',
    realtimeAiNewsfeed: false,
    buffettValueCheck: { limit: 1, windowDays: 3 },
    pdfComplianceExport: false,
  },
  Starter: {
    monthlyPriceEur: 7,
    annualBilling: 'ten_percent_discount',
    devices: 2,
    verifiedScreening: { limit: 5, windowDays: 1 },
    backtest: false,
    monteCarlo: 'none',
    fullAiAnalysis: { limit: 1, windowDays: 1 },
    realtimeAiNewsfeed: false,
    buffettValueCheck: { limit: 1, windowDays: 3 },
    pdfComplianceExport: false,
  },
  Pro: {
    monthlyPriceEur: 29,
    annualBilling: 'ten_percent_discount',
    devices: 2,
    verifiedScreening: { limit: 20, windowDays: 1 },
    backtest: true,
    monteCarlo: { limit: 1, windowDays: 1 },
    fullAiAnalysis: 'unlimited',
    realtimeAiNewsfeed: true,
    buffettValueCheck: 'unlimited',
    pdfComplianceExport: false,
  },
  Enterprise: {
    monthlyPriceEur: 109,
    annualBilling: 'on_request',
    devices: 5,
    verifiedScreening: 'unlimited',
    backtest: true,
    monteCarlo: 'unlimited',
    fullAiAnalysis: 'unlimited',
    realtimeAiNewsfeed: true,
    buffettValueCheck: 'unlimited',
    pdfComplianceExport: true,
  },
};

export function normalizeSubscriptionTier(value: string | null | undefined): SubscriptionTier {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'starter') return 'Starter';
  if (normalized === 'pro') return 'Pro';
  if (normalized === 'enterprise' || normalized === 'enterprise os') return 'Enterprise';
  return 'Free';
}

export function getPlanEntitlements(tier: string): PlanEntitlements {
  return SUBSCRIPTION_ENTITLEMENTS[normalizeSubscriptionTier(tier)];
}

export function isUnlimitedEntitlement(value: WindowedLimit | 'unlimited' | 'none' | 'preview_only'): boolean {
  return value === 'unlimited';
}

export function canUseFeature(accountType: AccountType, tier: string, feature: FeatureKey): boolean {
  if (accountType === 'guest') {
    return feature === 'verified_screening';
  }

  const plan = getPlanEntitlements(tier);
  switch (feature) {
    case 'verified_screening':
      return true;
    case 'backtest':
      return plan.backtest;
    case 'monte_carlo':
      return plan.monteCarlo !== 'none';
    case 'full_ai_analysis':
      return plan.fullAiAnalysis !== 'preview_only';
    case 'realtime_ai_newsfeed':
      return plan.realtimeAiNewsfeed;
    case 'buffett_value_check':
      return true;
    case 'pdf_compliance_export':
      return plan.pdfComplianceExport;
  }
}

export function getWindowedFeatureLimit(tier: string, feature: 'verified_screening' | 'buffett_value_check' | 'monte_carlo' | 'full_ai_analysis'): WindowedLimit | 'unlimited' | 'none' | 'preview_only' {
  const plan = getPlanEntitlements(tier);
  if (feature === 'verified_screening') return plan.verifiedScreening;
  if (feature === 'buffett_value_check') return plan.buffettValueCheck;
  if (feature === 'monte_carlo') return plan.monteCarlo;
  return plan.fullAiAnalysis;
}

export function getAnnualPricePreviewEur(tier: SubscriptionTier): number | null {
  const plan = SUBSCRIPTION_ENTITLEMENTS[tier];
  if (plan.annualBilling !== 'ten_percent_discount') return null;
  return Number((plan.monthlyPriceEur * 12 * 0.9).toFixed(2));
}
