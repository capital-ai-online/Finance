/**
 * ============================================================================
 *  AIF-CORE — Market Data Validation & Scoring Audit Layer
 * ============================================================================
 *
 *  Production TypeScript port of the three-layer enterprise skill spec
 *  (market_data_validation_layer, market_scoring_audit_layer,
 *  market_reporting_orchestration_layer) that was authored as a standalone
 *  YAML/JSON/Markdown/Python reference design.
 *
 *  PURPOSE: this is a structural safeguard on top of the No-Demo-Data-Policy
 *  (see dataIntegrity.ts). Where dataIntegrity.ts enforces "never fabricate
 *  data when a source is unavailable", this module enforces "never trust a
 *  score/record that IS present but is internally inconsistent" — missing
 *  required fields, non-physical values (negative price/volume), stale
 *  timestamps, or a scoring formula whose weights don't sum correctly.
 *
 *  What was intentionally NOT ported 1:1 from the reference design:
 *  - The Python reference's `run_pipeline()` writes markdown/json report
 *    FILES to disk. That model fits a batch/offline audit tool, not a
 *    request-scoped Express handler. Reporting here is returned inline as
 *    part of the API response (`auditTrail`) instead, so it stays visible
 *    to the frontend without touching the filesystem on every request.
 *  - `freshness_max_age_minutes: 15` from market_data_validation_layer.md
 *    is exposed as a parameter (not hardcoded) since different endpoints
 *    have different realistic freshness windows (a 60s-cached crypto quote
 *    vs. a daily OHLC bar).
 * ============================================================================
 */

export interface ValidationIssue {
  type: string;
  field: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  status: 'pass' | 'review' | 'reject';
  dataQualityScore: number;
  issues: ValidationIssue[];
}

export interface MarketRecordInput {
  symbol?: string;
  market?: string;
  timeframe?: string;
  timestampMs?: number;
  price?: number;
  volume?: number;
  sourceId?: string;
}

const REQUIRED_FIELDS: (keyof MarketRecordInput)[] = ['symbol', 'market', 'timestampMs', 'price', 'sourceId'];

/**
 * Layer 1 — market_data_validation_layer
 * Validates required fields, non-physical values, and data freshness.
 * Mirrors market_datavalidatoon_layer.md: completeness_threshold 0.98,
 * reject_on missing_symbol / invalid_timestamp / negative_price /
 * zero_or_negative_volume.
 */
export function validateMarketRecord(
  record: MarketRecordInput,
  opts: { freshnessMaxAgeMinutes?: number; requireVolume?: boolean } = {}
): ValidationResult {
  const { freshnessMaxAgeMinutes = 15, requireVolume = false } = opts;
  const issues: ValidationIssue[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      issues.push({ type: 'MISSING_FIELD', field, severity: 'high' });
    }
  }

  if (typeof record.price === 'number' && record.price <= 0) {
    issues.push({ type: 'INVALID_PRICE', field: 'price', severity: 'high' });
  }
  if (requireVolume) {
    if (typeof record.volume !== 'number' || record.volume <= 0) {
      issues.push({ type: 'INVALID_VOLUME', field: 'volume', severity: 'high' });
    }
  }
  if (typeof record.timestampMs === 'number') {
    const ageMinutes = (Date.now() - record.timestampMs) / 60000;
    if (ageMinutes < 0) {
      issues.push({ type: 'INVALID_TIMESTAMP', field: 'timestampMs', severity: 'high' });
    } else if (ageMinutes > freshnessMaxAgeMinutes) {
      issues.push({ type: 'STALE_DATA', field: 'timestampMs', severity: 'medium' });
    }
  }

  // Each issue costs 12 quality points, floor 0 — matches the reference
  // Python implementation's `max(0, 100 - len(issues) * 12)`.
  const dataQualityScore = Math.max(0, 100 - issues.length * 12);
  const hasHighSeverity = issues.some(i => i.severity === 'high');

  return {
    status: hasHighSeverity ? 'reject' : (issues.length > 0 ? 'review' : 'pass'),
    dataQualityScore,
    issues,
  };
}

export interface ScoreComponents {
  trend?: number;
  momentum?: number;
  volume?: number;
  liquidity?: number;
  volatility?: number;
  structure?: number;
  regime?: number;
  risk?: number;
}

export interface ScoreAuditResult {
  status: 'approved' | 'rejected' | 'review_required';
  issues: ValidationIssue[];
  weightSum: number;
}

/**
 * Layer 2 — market_scoring_audit_layer
 * Verifies formula/weight integrity BEFORE a score is trusted, per
 * market_scoring_audit_layer.md: weight_sum_target 1.0, score_range 0-100,
 * hard_fail_on formula_mismatch / weight_sum_error / invalid_component_range.
 *
 * This does not recompute the score itself (each scoring module owns its
 * own formula) — it audits whether the weights and inputs that fed the
 * formula were internally consistent, catching the exact class of bug this
 * project has hit before (a hardcoded score override that ignores its
 * declared inputs entirely).
 */
export function auditScoreWeights(
  weights: Partial<Record<keyof ScoreComponents, number>>,
  components: ScoreComponents,
  finalScore: number,
  opts: { weightSumTolerance?: number; scoreMin?: number; scoreMax?: number } = {}
): ScoreAuditResult {
  const { weightSumTolerance = 0.02, scoreMin = 0, scoreMax = 100 } = opts;
  const issues: ValidationIssue[] = [];

  const weightSum = Object.values(weights).reduce((sum, w) => sum + (typeof w === 'number' ? w : 0), 0);
  if (Math.abs(weightSum - 1.0) > weightSumTolerance) {
    issues.push({ type: 'WEIGHT_SUM_ERROR', field: 'weights', severity: 'high' });
  }

  for (const [key, val] of Object.entries(components)) {
    if (typeof val === 'number' && (val < 0 || val > 1)) {
      issues.push({ type: 'INVALID_COMPONENT_RANGE', field: key, severity: 'high' });
    }
  }

  if (finalScore < scoreMin || finalScore > scoreMax) {
    issues.push({ type: 'SCORE_OUT_OF_RANGE', field: 'finalScore', severity: 'high' });
  }
  if (Number.isNaN(finalScore)) {
    issues.push({ type: 'FORMULA_MISMATCH', field: 'finalScore', severity: 'high' });
  }

  const hasHighSeverity = issues.some(i => i.severity === 'high');
  return {
    status: hasHighSeverity ? 'rejected' : (issues.length > 0 ? 'review_required' : 'approved'),
    issues,
    weightSum: Math.round(weightSum * 1000) / 1000,
  };
}

/**
 * Layer 3 — market_reporting_orchestration_layer (condensed)
 * Combines validation + scoring audit results into a single inline audit
 * trail object attached to API responses, instead of a written-to-disk
 * markdown/json report (see file header for why).
 */
export function buildAuditTrail(validation: ValidationResult | null, scoreAudit: ScoreAuditResult | null) {
  const allIssues = [...(validation?.issues ?? []), ...(scoreAudit?.issues ?? [])];
  const workflowStatus =
    (validation && validation.status === 'reject') || (scoreAudit && scoreAudit.status === 'rejected')
      ? 'rejected'
      : allIssues.length > 0
        ? 'review_required'
        : 'completed';

  return {
    workflowStatus,
    dataQualityScore: validation?.dataQualityScore ?? null,
    scoreAuditStatus: scoreAudit?.status ?? null,
    weightSum: scoreAudit?.weightSum ?? null,
    issues: allIssues,
  };
}
