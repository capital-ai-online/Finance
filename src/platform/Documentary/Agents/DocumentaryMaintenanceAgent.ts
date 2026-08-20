import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DOCUMENT_REGISTRY_PATH,
  collectDocumentationHygieneFindings,
  type RegistryEntry,
} from '../Governance/Services/DocumentationHygieneValidator';
import {
  isAutomaticDocumentPatchPathAllowed,
  type SemanticFreshnessFinding,
  type SemanticFreshnessReport,
  type SourceChangeEvidence,
} from '../Discovery/SemanticFreshnessAnalyzer';
import type { DocumentaryMaintenanceRecommendation } from '../../Supervisor/documentaryMaintenanceObservation';

export const DOCUMENTARY_MAINTENANCE_AGENT_VERSION = 'documentary-maintenance-agent/1.0.0' as const;
const DEFAULT_MIN_CONFIDENCE = 0.82;
const MAX_DOCUMENT_BYTES = 256 * 1024;
const MAINTENANCE_BRANCH = /^agent\/documentary-maintenance-[a-z0-9][a-z0-9._-]*$/i;

export interface SemanticFreshnessAssessment {
  stale: boolean;
  confidence: number;
  reason: string;
  provider: string;
  evidenceIds: string[];
}

export interface SemanticPatchProposal {
  content: string;
  provider: string;
  evidenceIds: string[];
}

export interface DocumentarySemanticMaintenanceProvider {
  assessFreshness(input: {
    finding: SemanticFreshnessFinding;
    currentContent: string;
    sourceChanges: readonly SourceChangeEvidence[];
    sourceCommit: string;
    correlationId: string;
  }): Promise<SemanticFreshnessAssessment>;
  proposeUpdate(input: {
    finding: SemanticFreshnessFinding;
    currentContent: string;
    sourceChanges: readonly SourceChangeEvidence[];
    sourceCommit: string;
    correlationId: string;
    assessment: SemanticFreshnessAssessment;
  }): Promise<SemanticPatchProposal>;
}

export interface DocumentaryMaintenancePatch {
  documentId: string;
  path: string;
  previousSha256: string;
  proposedSha256: string;
  proposedContent: string;
  confidence: number;
  reason: string;
  provider: string;
  evidenceIds: string[];
}

export interface DocumentaryMaintenancePlan {
  agentVersion: typeof DOCUMENTARY_MAINTENANCE_AGENT_VERSION;
  correlationId: string;
  sourceCommit: string;
  createdAt: string;
  patches: DocumentaryMaintenancePatch[];
  reviewRequiredPaths: string[];
  skipped: Array<{ path: string; reason: string }>;
}

export interface DocumentaryMaintenanceApplyResult {
  correlationId: string;
  branchName: string;
  changedPaths: string[];
  versionChanges: Array<{ documentId: string; from: string; to: string; lifecycle: 'generated' }>;
}

interface DocumentRegistryEnvelope {
  schemaVersion: string;
  authority: string;
  entries: RegistryEntry[];
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeRepoPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').trim();
}

function resolveFile(repoRoot: string, relativePath: string): string {
  const normalized = normalizeRepoPath(relativePath);
  const root = path.resolve(repoRoot);
  const absolute = path.resolve(root, normalized);
  if (!normalized || path.isAbsolute(normalized) || (absolute !== root && !absolute.startsWith(`${root}${path.sep}`))) {
    throw new Error(`[DocumentaryMaintenanceAgent] invalid repository path: ${relativePath}`);
  }
  return absolute;
}

function readPatchableDocument(repoRoot: string, relativePath: string): string {
  if (!isAutomaticDocumentPatchPathAllowed(relativePath)) {
    throw new Error(`[DocumentaryMaintenanceAgent] path is review-only: ${relativePath}`);
  }
  const absolute = resolveFile(repoRoot, relativePath);
  const stat = fs.lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`[DocumentaryMaintenanceAgent] path must be a regular non-symlink file: ${relativePath}`);
  }
  if (stat.size > MAX_DOCUMENT_BYTES) {
    throw new Error(`[DocumentaryMaintenanceAgent] document exceeds ${MAX_DOCUMENT_BYTES} bytes: ${relativePath}`);
  }
  return fs.readFileSync(absolute, 'utf8');
}

function nextPatchVersion(version: string): string {
  const match = version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) throw new Error(`[DocumentaryMaintenanceAgent] invalid document SemVer: ${version}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export async function planDocumentaryMaintenance(options: {
  repoRoot?: string;
  freshness: SemanticFreshnessReport;
  recommendation: DocumentaryMaintenanceRecommendation;
  provider: DocumentarySemanticMaintenanceProvider;
  minConfidence?: number;
  createdAt?: string;
}): Promise<DocumentaryMaintenancePlan> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  if (minConfidence < 0 || minConfidence > 1) throw new Error('[DocumentaryMaintenanceAgent] minConfidence must be between 0 and 1.');
  if (options.recommendation.verdict !== 'RECOMMENDED') {
    throw new Error(`[DocumentaryMaintenanceAgent] Supervisor verdict is ${options.recommendation.verdict}; patch planning is not authorized.`);
  }
  if (options.recommendation.correlationId !== options.freshness.correlationId || options.recommendation.sourceCommit !== options.freshness.sourceCommit) {
    throw new Error('[DocumentaryMaintenanceAgent] Supervisor recommendation does not match freshness evidence.');
  }

  const patches: DocumentaryMaintenancePatch[] = [];
  const skipped: Array<{ path: string; reason: string }> = [];
  const candidateByPath = new Map(
    options.freshness.findings.filter((finding) => finding.candidate).map((finding) => [finding.path, finding]),
  );

  for (const documentPath of options.recommendation.patchablePaths) {
    const finding = candidateByPath.get(documentPath);
    if (!finding || finding.mutationClass !== 'PATCHABLE') {
      skipped.push({ path: documentPath, reason: 'Supervisor path is not a patchable freshness candidate.' });
      continue;
    }

    const currentContent = readPatchableDocument(repoRoot, documentPath);
    const currentHash = sha256(currentContent);
    if (finding.contentSha256 && finding.contentSha256 !== currentHash) {
      skipped.push({ path: documentPath, reason: 'Content changed after freshness observation (TOCTOU guard).' });
      continue;
    }

    const assessment = await options.provider.assessFreshness({
      finding,
      currentContent,
      sourceChanges: options.freshness.sourceChanges,
      sourceCommit: options.freshness.sourceCommit,
      correlationId: options.freshness.correlationId,
    });
    if (!assessment.stale) {
      skipped.push({ path: documentPath, reason: `Semantic assessment says current: ${assessment.reason}` });
      continue;
    }
    if (!Number.isFinite(assessment.confidence) || assessment.confidence < minConfidence) {
      skipped.push({ path: documentPath, reason: `Semantic confidence ${assessment.confidence} is below threshold ${minConfidence}.` });
      continue;
    }

    const proposal = await options.provider.proposeUpdate({
      finding,
      currentContent,
      sourceChanges: options.freshness.sourceChanges,
      sourceCommit: options.freshness.sourceCommit,
      correlationId: options.freshness.correlationId,
      assessment,
    });
    if (!proposal.content.trim()) {
      skipped.push({ path: documentPath, reason: 'Semantic provider returned empty content.' });
      continue;
    }
    const proposedHash = sha256(proposal.content);
    if (proposedHash === currentHash) {
      skipped.push({ path: documentPath, reason: 'Semantic provider produced no content change.' });
      continue;
    }

    patches.push({
      documentId: finding.documentId,
      path: documentPath,
      previousSha256: currentHash,
      proposedSha256: proposedHash,
      proposedContent: proposal.content,
      confidence: assessment.confidence,
      reason: assessment.reason,
      provider: proposal.provider || assessment.provider,
      evidenceIds: [...new Set([...assessment.evidenceIds, ...proposal.evidenceIds])].sort(),
    });
  }

  return Object.freeze({
    agentVersion: DOCUMENTARY_MAINTENANCE_AGENT_VERSION,
    correlationId: options.freshness.correlationId,
    sourceCommit: options.freshness.sourceCommit,
    createdAt: options.createdAt ?? new Date().toISOString(),
    patches,
    reviewRequiredPaths: [...options.recommendation.reviewRequiredPaths],
    skipped,
  });
}

export function applyDocumentaryMaintenancePlan(options: {
  repoRoot?: string;
  branchName: string;
  plan: DocumentaryMaintenancePlan;
}): DocumentaryMaintenanceApplyResult {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  if (!MAINTENANCE_BRANCH.test(options.branchName) || options.branchName === 'main') {
    throw new Error(`[DocumentaryMaintenanceAgent] mutation requires an isolated agent/documentary-maintenance-* branch, got: ${options.branchName}`);
  }
  if (options.plan.patches.length === 0) {
    return { correlationId: options.plan.correlationId, branchName: options.branchName, changedPaths: [], versionChanges: [] };
  }

  const preFindings = collectDocumentationHygieneFindings(repoRoot);
  if (preFindings.length > 0) {
    throw new Error(`[DocumentaryMaintenanceAgent] baseline hygiene is not clean (${preFindings.length} finding(s)); refusing mutation.`);
  }

  const registryAbsolute = resolveFile(repoRoot, DOCUMENT_REGISTRY_PATH);
  const registryOriginal = fs.readFileSync(registryAbsolute, 'utf8');
  const registry = JSON.parse(registryOriginal) as DocumentRegistryEnvelope;
  const originals = new Map<string, string>();
  const versionChanges: DocumentaryMaintenanceApplyResult['versionChanges'] = [];

  try {
    for (const patch of options.plan.patches) {
      const currentContent = readPatchableDocument(repoRoot, patch.path);
      if (sha256(currentContent) !== patch.previousSha256) {
        throw new Error(`[DocumentaryMaintenanceAgent] TOCTOU check failed before apply: ${patch.path}`);
      }
      if (sha256(patch.proposedContent) !== patch.proposedSha256) {
        throw new Error(`[DocumentaryMaintenanceAgent] proposed content hash mismatch: ${patch.path}`);
      }
      originals.set(patch.path, currentContent);
      fs.writeFileSync(resolveFile(repoRoot, patch.path), patch.proposedContent, 'utf8');

      const entry = registry.entries.find((candidate) => candidate.documentId === patch.documentId && normalizeRepoPath(candidate.path) === patch.path);
      if (!entry) throw new Error(`[DocumentaryMaintenanceAgent] registry entry missing for ${patch.documentId} (${patch.path}).`);
      const from = entry.version;
      const to = nextPatchVersion(from);
      entry.version = to;
      entry.lifecycle = 'generated';
      versionChanges.push({ documentId: patch.documentId, from, to, lifecycle: 'generated' });
    }

    fs.writeFileSync(registryAbsolute, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    const postFindings = collectDocumentationHygieneFindings(repoRoot);
    if (postFindings.length > 0) {
      throw new Error(`[DocumentaryMaintenanceAgent] post-apply hygiene failed (${postFindings.length} finding(s)).`);
    }
  } catch (error) {
    for (const [documentPath, original] of originals) {
      fs.writeFileSync(resolveFile(repoRoot, documentPath), original, 'utf8');
    }
    fs.writeFileSync(registryAbsolute, registryOriginal, 'utf8');
    throw error;
  }

  return {
    correlationId: options.plan.correlationId,
    branchName: options.branchName,
    changedPaths: [...options.plan.patches.map((patch) => patch.path), DOCUMENT_REGISTRY_PATH].sort(),
    versionChanges,
  };
}
