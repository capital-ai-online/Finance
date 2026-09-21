import { createHash } from 'node:crypto';

export const UNIFIED_OSS_QUALITY_FINDING_SCHEMA = 'oss-quality-finding/1.0.0' as const;
export const UNIFIED_OSS_QUALITY_BUNDLE_SCHEMA = 'oss-quality-evidence/1.1.0' as const;

export const OSS_QUALITY_TOOL_IDS = [
  'gitleaks',
  'osv-scanner',
  'vitest-coverage',
  'knip',
  'jscpd',
] as const;

export const OSS_QUALITY_PROFILES = [
  'PR_FAST',
  'DEEP_BASELINE',
  'FULL',
] as const;

export type OssQualityToolId = typeof OSS_QUALITY_TOOL_IDS[number];
export type OssQualityProfile = typeof OSS_QUALITY_PROFILES[number];
export type UnifiedQualityDomain =
  | 'SECURITY'
  | 'DEPENDENCY'
  | 'COVERAGE'
  | 'MAINTAINABILITY'
  | 'DUPLICATION';
export type UnifiedQualitySeverity = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type UnifiedQualityFindingState =
  | 'OPEN'
  | 'BASELINED'
  | 'FIXED'
  | 'ACCEPTED_EXCEPTION'
  | 'FALSE_POSITIVE';
export type UnifiedQualityToolStatus = 'PASS' | 'FINDINGS' | 'NOT_AVAILABLE' | 'NOT_APPLICABLE';

export interface UnifiedQualityFinding {
  schemaVersion: typeof UNIFIED_OSS_QUALITY_FINDING_SCHEMA;
  id: string;
  sourceTool: OssQualityToolId;
  ruleId: string;
  domain: UnifiedQualityDomain;
  severity: UnifiedQualitySeverity;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  path: string | null;
  line: number | null;
  sourceSha: string;
  baseSha: string;
  newInPr: boolean;
  state: UnifiedQualityFindingState;
  artifactPath: string;
  toolVersion: string;
  configSha256: string | null;
  metadata: Readonly<Record<string, string | number | boolean | null>>;
}

export interface UnifiedQualityToolEvidence {
  tool: OssQualityToolId;
  version: string;
  status: UnifiedQualityToolStatus;
  artifactPath: string | null;
}

export interface UnifiedQualityCoverageMeasurement {
  status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_APPLICABLE';
  source: string | null;
  statements: number | null;
  branches: number | null;
  functions: number | null;
  lines: number | null;
}

export interface UnifiedQualityDuplicationMeasurement {
  status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_APPLICABLE';
  source: string | null;
  percentage: number | null;
  clones: number | null;
  duplicatedLines: number | null;
  totalLines: number | null;
}

export interface UnifiedQualityEvidenceBundle {
  schemaVersion: typeof UNIFIED_OSS_QUALITY_BUNDLE_SCHEMA;
  generatedAt: string;
  repository: string;
  sourceSha: string;
  baseSha: string;
  profile: OssQualityProfile;
  nonAuthorizingStatement: string;
  tools: readonly UnifiedQualityToolEvidence[];
  findings: readonly UnifiedQualityFinding[];
  measurements: Readonly<{
    coverage: UnifiedQualityCoverageMeasurement;
    duplication: UnifiedQualityDuplicationMeasurement;
  }>;
}

export function buildUnifiedQualityFindingId(input: {
  sourceTool: OssQualityToolId;
  ruleId: string;
  path?: string | null;
  line?: number | null;
  identity?: string | null;
}): string {
  const canonical = [
    input.sourceTool,
    input.ruleId,
    input.path ?? '',
    input.line ?? '',
    input.identity ?? '',
  ].join('|');
  return `QF-${createHash('sha256').update(canonical).digest('hex').slice(0, 24).toUpperCase()}`;
}

export function isOssQualityToolId(value: string): value is OssQualityToolId {
  return (OSS_QUALITY_TOOL_IDS as readonly string[]).includes(value);
}

export function isOssQualityProfile(value: string): value is OssQualityProfile {
  return (OSS_QUALITY_PROFILES as readonly string[]).includes(value);
}
