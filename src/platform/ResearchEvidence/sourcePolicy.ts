import type {
  ResearchAllowedUse,
  ResearchEvidenceDiscovery,
  ResearchEvidenceSourcePolicy,
  ResearchEvidenceSourcePolicyEntry,
  ResearchEvidenceValidationResult,
  ResearchSourceClass,
} from './contracts';
import { RESEARCH_EVIDENCE_VALIDATION_CONTRACT_VERSION } from './contracts';

export const EMPTY_RESEARCH_SOURCE_POLICY: ResearchEvidenceSourcePolicy = Object.freeze({
  policyVersion: 'research-source-policy/1.0.0-empty',
  entries: Object.freeze([]),
});

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function isIpLiteral(hostname: string): boolean {
  if (hostname.includes(':')) return true; // IPv6 literals are intentionally rejected here.
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Research source URLs are data, never authority. Only public HTTPS hostnames are accepted into
 * the discovery-validation layer. Private hosts/IP literals are rejected to keep future provider
 * transports away from SSRF-style escalation paths.
 */
export function validatePublicResearchUrl(rawUrl: string): { ok: true; hostname: string } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'Source URL is not a valid absolute URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only HTTPS research sources are accepted.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'Research source URLs must not contain credentials.' };
  }
  if (parsed.port && parsed.port !== '443') {
    return { ok: false, reason: 'Non-standard research-source ports are not accepted.' };
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { ok: false, reason: 'Private/local research source hostnames are not accepted.' };
  }
  if (isIpLiteral(hostname)) {
    return { ok: false, reason: 'IP-literal research sources are not accepted.' };
  }

  return { ok: true, hostname };
}

function matchesEntry(hostname: string, entry: ResearchEvidenceSourcePolicyEntry): boolean {
  const rule = normalizeHostname(entry.hostname);
  if (hostname === rule) return true;
  return Boolean(entry.includeSubdomains && hostname.endsWith(`.${rule}`));
}

export function classifyResearchSource(
  rawUrl: string,
  policy: ResearchEvidenceSourcePolicy = EMPTY_RESEARCH_SOURCE_POLICY,
): {
  sourceClass: ResearchSourceClass;
  allowedUses: readonly ResearchAllowedUse[];
  matchedEntry?: ResearchEvidenceSourcePolicyEntry;
} {
  const validated = validatePublicResearchUrl(rawUrl);
  if (validated.ok === false) return { sourceClass: 'unknown', allowedUses: [] };
  const matchedEntry = policy.entries.find((entry) => matchesEntry(validated.hostname, entry));
  if (!matchedEntry) return { sourceClass: 'unknown', allowedUses: ['research'] };
  return {
    sourceClass: matchedEntry.sourceClass,
    allowedUses: matchedEntry.allowedUses,
    matchedEntry,
  };
}

function validObservedAt(value: string | undefined): boolean {
  if (value === undefined) return true;
  return Number.isFinite(Date.parse(value));
}

function validClaimValue(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  return value === null || typeof value === 'string' || typeof value === 'boolean';
}

/**
 * Structural/source-policy validation only. It deliberately cannot make a discovery score-eligible.
 * Field-level promotion belongs to the canonical Evidence/Feature contract and requires an explicit
 * follow-up implementation/Owner gate.
 */
export function validateResearchEvidenceDiscovery(
  discovery: ResearchEvidenceDiscovery,
  policy: ResearchEvidenceSourcePolicy = EMPTY_RESEARCH_SOURCE_POLICY,
  now = new Date(),
): ResearchEvidenceValidationResult {
  const reasons: string[] = [];
  const url = validatePublicResearchUrl(discovery.source.url);
  if (url.ok === false) reasons.push(url.reason);
  if (discovery.citation.url !== discovery.source.url) reasons.push('Citation URL does not match discovery source URL.');
  if (!discovery.claim.field.trim()) reasons.push('Claim field is empty.');
  if (!validClaimValue(discovery.claim.value)) reasons.push('Claim value is not finite/serializable.');
  if (!validObservedAt(discovery.claim.observedAt)) reasons.push('Claim observedAt is invalid.');
  if (
    discovery.claim.extractionConfidence !== undefined
    && (!Number.isFinite(discovery.claim.extractionConfidence)
      || discovery.claim.extractionConfidence < 0
      || discovery.claim.extractionConfidence > 1)
  ) {
    reasons.push('Extraction confidence must be within 0..1.');
  }

  if (reasons.length > 0) {
    return {
      contractVersion: RESEARCH_EVIDENCE_VALIDATION_CONTRACT_VERSION,
      discoveryId: discovery.discoveryId,
      status: 'REJECTED',
      sourceClass: 'unknown',
      scoreEligible: false,
      allowedUses: [],
      reasons,
      validatedAt: now.toISOString(),
    };
  }

  const classified = classifyResearchSource(discovery.source.url, policy);
  const primary = classified.sourceClass === 'regulated-primary'
    || classified.sourceClass === 'official-primary'
    || classified.sourceClass === 'provider-primary';

  return {
    contractVersion: RESEARCH_EVIDENCE_VALIDATION_CONTRACT_VERSION,
    discoveryId: discovery.discoveryId,
    status: primary ? 'VALIDATED_PRIMARY_SOURCE' : 'RESEARCH_ONLY',
    sourceClass: classified.sourceClass,
    scoreEligible: false,
    allowedUses: classified.allowedUses,
    reasons: primary
      ? ['Source matched an approved primary-source policy entry; field-level promotion is still required.']
      : ['Source is usable for research only until an approved source-policy entry and field contract exist.'],
    validatedAt: now.toISOString(),
  };
}
