import React from 'react';
import { CryptoEnterpriseEvaluator } from './CryptoEnterpriseEvaluator';

/**
 * ARCH-AUDIT-0003 / AUD3-F-001 remediation.
 *
 * The former implementation of this component contained an independent symbol-hash based
 * scoring path for stocks/forex/indices and a hash-derived trading setup/pattern generator.
 * That path could present deterministic pseudo-financial values as if they were analysis.
 *
 * Until every asset class has a provenance-backed scoring adapter, this legacy surface delegates
 * to the P0-hardened evaluator. The hardened evaluator is fail-closed: unavailable financial
 * evidence stays unavailable and does not become a numeric fallback score, expected return,
 * volatility, risk classification, chart pattern, entry range, stop-loss or take-profit value.
 *
 * This adapter intentionally preserves the existing public component contract so Dashboard and
 * other callers do not need an architectural rewrite as part of this remediation.
 */
export interface CryptoScoringEnterpriseProps {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
  timeframe: string;
  onChangeTimeframe?: (timeframe: string) => void;
  userSession?: unknown;
  subscriptionTier?: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick?: () => void;
}

export function CryptoScoringEnterprise({
  selectedSymbol,
  onSelectSymbol,
  subscriptionTier,
  onUpgradeClick,
}: CryptoScoringEnterpriseProps) {
  return (
    <CryptoEnterpriseEvaluator
      selectedSymbol={selectedSymbol}
      onSelectSymbol={onSelectSymbol ?? (() => undefined)}
      subscriptionTier={subscriptionTier}
      onUpgradeClick={onUpgradeClick}
    />
  );
}
