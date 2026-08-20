import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import type { PlatformDecisionRecord } from '../../src/platform/PlatformDirector/Contracts/PlatformDecision';
import type { AgentPrincipalContext, AgentCapability } from '../../src/platform/Security/agentIam';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';
import { collectDocumentationHygieneFindings, DOCUMENT_REGISTRY_PATH } from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';
import { analyzeSemanticFreshness, type SourceChangeEvidence } from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';
import { observeDocumentaryMaintenance } from '../../src/platform/Supervisor/documentaryMaintenanceObservation';
import {
  assertDocumentaryRepositoryMutationCapability,
  authorizeDocumentaryMaintenanceTask,
  orchestrateDocumentaryMaintenance,
  type DocumentaryAgentAuthorizationContext,
} from '../../src/platform/Documentary/Orchestration/DocumentaryMaintenanceOrchestrator';
import { applyDocumentaryMaintenancePlan } from '../../src/platform/Documentary/Agents/DocumentaryMaintenanceAgent';
import {
  buildDocumentaryMaintenanceHealthSnapshot,
  type DocumentaryMaintenanceHealthSnapshot,
} from '../../src/platform/Documentary/Observability/DocumentaryMaintenanceObservability';
import { DocumentaryMaintenanceAiAdapter } from '../../server/documentaryMaintenanceAiAdapter';

export const DOCUMENTARY_MAINTENANCE_HOST_VERSION = 'documentary-maintenance-git-host/1.1.1' as const;
const CLAIM_SCHEMA_VERSION = '1.0.0';
const BRANCH_PREFIX = 'agent/documentary-maintenance-';

export interface DocumentaryMaintenanceControlLoopRequest {
  correlationId: string;
  sourceCommit: string;
  sourceChanges?: SourceChangeEvidence[];
  decision: PlatformDecisionRecord;
  principal: AgentPrincipalContext;
  grantedCapabilities: AgentCapability[];
  targetResource: string;
  riskClass?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  killSwitchActive?: boolean;
  minConfidence?: number;
}

function run(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): string {
  return execFileSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commandSucceeds(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): boolean {
  try {
    run(command, args, options);
    return true;
  } catch {
    return false;
  }
}

function requireCleanWorktree(repoRoot: string): void {
  const status = run('git', ['status', '--porcelain'], { cwd: repoRoot });
  if (status) throw new Error('[DocumentaryMaintenanceHost] worktree must be clean before automatic branch creation.');
}

function safeBranchToken(correlationId: string): string {
  const normalized = correlationId.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  if (!normalized) throw new Error('[DocumentaryMaintenanceHost] correlationId cannot produce a safe branch token.');
  return normalized;
}

export function buildMaintenanceBranchName(correlationId: string): string {
  return `${BRANCH_PREFIX}${safeBranchToken(correlationId)}`;
}

export function buildRuntimeWorkClaim(input: {
  correlationId: string;
  baseSha: string;
  changedPaths: string[];
  startedAt?: string;
}) {
  const claimId = `DOCUMENTARY-MAINT-${safeBranchToken(input.correlationId).toUpperCase()}`;
  return {
    schemaVersion: CLAIM_SCHEMA_VERSION,
    claimId,
    status: 'active',
    exclusive: true,
    agent: {
      provider: 'provider-neutral',
      model: 'runtime-selected',
      executionSurface: 'Documentary Maintenance Control Loop',
    },
    workItem: 'Documentary continuous semantic freshness maintenance: evidence-bound document patches, deterministic document version bump, branch-only mutation, Draft-PR handoff.',
    startedAt: input.startedAt ?? new Date().toISOString(),
    baseBranch: 'main',
    baseSha: input.baseSha,
    claimedPaths: [...new Set([...input.changedPaths, DOCUMENT_REGISTRY_PATH])].sort(),
    releaseCondition: 'Claim is released when the Draft PR is merged, closed, superseded or abandoned. Agent runtime has no MERGE capability.',
  };
}

function writeRuntimeClaim(repoRoot: string, claim: ReturnType<typeof buildRuntimeWorkClaim>): string {
  const claimPath = `.ai/work-claims/${claim.claimId}.json`;
  const absolute = path.join(repoRoot, claimPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  if (fs.existsSync(absolute)) throw new Error(`[DocumentaryMaintenanceHost] work claim already exists: ${claimPath}`);
  fs.writeFileSync(absolute, `${JSON.stringify(claim, null, 2)}\n`, 'utf8');
  return claimPath;
}

function authorizationContext(request: DocumentaryMaintenanceControlLoopRequest): DocumentaryAgentAuthorizationContext {
  return {
    principal: request.principal,
    grantedCapabilities: request.grantedCapabilities,
    riskClass: request.riskClass ?? 'MEDIUM',
    environment: 'development',
    targetResource: request.targetResource,
    killSwitchActive: request.killSwitchActive ?? false,
  };
}

function assertRuntimeGrantSet(
  request: DocumentaryMaintenanceControlLoopRequest,
  dispatchDraftPr: boolean,
): void {
  const required: AgentCapability[] = [
    AGENT_CAPABILITIES.READ,
    AGENT_CAPABILITIES.ANALYZE,
    AGENT_CAPABILITIES.PLAN,
    AGENT_CAPABILITIES.BRANCH,
    AGENT_CAPABILITIES.COMMIT,
    ...(dispatchDraftPr ? [AGENT_CAPABILITIES.PR] : []),
  ];
  for (const capability of required) {
    if (!request.grantedCapabilities.includes(capability)) {
      throw new Error(`[DocumentaryMaintenanceHost] required explicit capability missing: ${capability}`);
    }
  }
  for (const forbidden of [AGENT_CAPABILITIES.DEPLOY_REQUEST, AGENT_CAPABILITIES.PRODUCTION_MUTATION]) {
    if (request.grantedCapabilities.includes(forbidden)) {
      throw new Error(`[DocumentaryMaintenanceHost] excessive capability is forbidden for Documentary maintenance: ${forbidden}`);
    }
  }
}

function discardEmptyMaintenanceBranch(repoRoot: string, branchName: string): void {
  run('git', ['switch', 'main'], { cwd: repoRoot });
  run('git', ['branch', '--delete', '--force', branchName], { cwd: repoRoot });
}

function assertRemoteBranchAbsent(repoRoot: string, branchName: string): void {
  if (commandSucceeds('git', ['ls-remote', '--exit-code', '--heads', 'origin', branchName], { cwd: repoRoot })) {
    throw new Error(`[DocumentaryMaintenanceHost] remote branch already exists; refusing to reuse mutable agent branch: ${branchName}`);
  }
}

export async function runDocumentaryMaintenanceControlLoop(options: {
  repoRoot?: string;
  request: DocumentaryMaintenanceControlLoopRequest;
  dispatchDraftPr?: boolean;
}): Promise<{
  branchName: string;
  mainSha: string;
  changedPaths: string[];
  claimPath: string | null;
  draftPrDispatched: boolean;
  reviewRequiredPaths: string[];
  health: DocumentaryMaintenanceHealthSnapshot;
}> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const request = options.request;
  const dispatchDraftPr = options.dispatchDraftPr !== false;
  assertRuntimeGrantSet(request, dispatchDraftPr);
  requireCleanWorktree(repoRoot);

  run('git', ['fetch', '--no-tags', 'origin', 'main'], { cwd: repoRoot });
  const mainSha = run('git', ['rev-parse', 'origin/main'], { cwd: repoRoot });
  if (!/^[0-9a-f]{40}$/i.test(mainSha)) throw new Error('[DocumentaryMaintenanceHost] origin/main did not resolve to a full SHA.');
  const currentHead = run('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
  const currentBranch = run('git', ['branch', '--show-current'], { cwd: repoRoot });
  if (currentHead !== mainSha || currentBranch !== 'main') {
    throw new Error(`[DocumentaryMaintenanceHost] host must start from the exact checked-out current main (${mainSha}); got ${currentBranch || '<detached>'}@${currentHead}.`);
  }
  if (request.sourceCommit.toLowerCase() !== mainSha.toLowerCase()) {
    throw new Error(`[DocumentaryMaintenanceHost] sourceCommit must equal current main (${mainSha}); got ${request.sourceCommit}.`);
  }

  const auth = authorizationContext(request);
  const hygieneFindings = collectDocumentationHygieneFindings(repoRoot);
  const freshness = analyzeSemanticFreshness({
    repoRoot,
    correlationId: request.correlationId,
    sourceCommit: mainSha,
    sourceChanges: request.sourceChanges,
  });
  const recommendation = observeDocumentaryMaintenance(freshness, hygieneFindings);

  if (recommendation.verdict === 'BLOCKED') {
    throw new Error(`[DocumentaryMaintenanceHost] Supervisor blocked maintenance: ${recommendation.rationale}`);
  }
  if (recommendation.verdict === 'NO_ACTION') {
    const health = buildDocumentaryMaintenanceHealthSnapshot({ freshness, recommendation });
    return {
      branchName: buildMaintenanceBranchName(request.correlationId),
      mainSha,
      changedPaths: [],
      claimPath: null,
      draftPrDispatched: false,
      reviewRequiredPaths: recommendation.reviewRequiredPaths,
      health,
    };
  }

  // Authorization is evaluated while still on the exact current main. The agent cannot create a
  // branch merely to discover whether its Platform Director / Supervisor evidence is valid.
  authorizeDocumentaryMaintenanceTask({
    decision: request.decision,
    recommendation,
    freshness,
    agentAuthorization: auth,
  });

  assertDocumentaryRepositoryMutationCapability(auth, AGENT_CAPABILITIES.BRANCH);
  const branchName = buildMaintenanceBranchName(request.correlationId);
  run('git', ['check-ref-format', '--branch', branchName], { cwd: repoRoot });
  assertRemoteBranchAbsent(repoRoot, branchName);
  run('git', ['switch', '--create', branchName, '--no-track', 'origin/main'], { cwd: repoRoot });

  let remoteBranchPushed = false;
  try {
    const provider = new DocumentaryMaintenanceAiAdapter();
    const { plan } = await orchestrateDocumentaryMaintenance({
      repoRoot,
      decision: request.decision,
      recommendation,
      freshness,
      provider,
      agentAuthorization: auth,
      minConfidence: request.minConfidence,
    });

    const apply = applyDocumentaryMaintenancePlan({ repoRoot, branchName, plan });
    const health = buildDocumentaryMaintenanceHealthSnapshot({ freshness, recommendation, plan, apply });
    if (apply.changedPaths.length === 0) {
      discardEmptyMaintenanceBranch(repoRoot, branchName);
      return {
        branchName,
        mainSha,
        changedPaths: [],
        claimPath: null,
        draftPrDispatched: false,
        reviewRequiredPaths: plan.reviewRequiredPaths,
        health,
      };
    }

    assertDocumentaryRepositoryMutationCapability(auth, AGENT_CAPABILITIES.COMMIT);
    const claim = buildRuntimeWorkClaim({
      correlationId: request.correlationId,
      baseSha: mainSha,
      changedPaths: apply.changedPaths,
    });
    const claimPath = writeRuntimeClaim(repoRoot, claim);
    const changedPaths = [...new Set([...apply.changedPaths, claimPath])].sort();

    run('npm', ['run', 'docs:hygiene:check'], { cwd: repoRoot });
    run('npm', ['run', 'governance:control-plane'], { cwd: repoRoot });
    run('git', ['add', '--', ...changedPaths], { cwd: repoRoot });
    const staged = run('git', ['diff', '--cached', '--name-only'], { cwd: repoRoot }).split(/\r?\n/).filter(Boolean).sort();
    if (JSON.stringify(staged) !== JSON.stringify(changedPaths)) {
      throw new Error(`[DocumentaryMaintenanceHost] staged scope mismatch. Expected ${changedPaths.join(', ')}, got ${staged.join(', ')}`);
    }
    run('git', ['commit', '-m', `docs(documentary): semantic freshness ${request.correlationId}`], { cwd: repoRoot });

    // Mandatory final main-sync gate: never open a PR from a branch whose verified baseline has
    // moved underneath it. A fresh run will rebuild semantic evidence from the newer main rather
    // than silently rebasing evidence-bound document patches.
    run('git', ['fetch', '--no-tags', 'origin', 'main'], { cwd: repoRoot });
    const finalMainSha = run('git', ['rev-parse', 'origin/main'], { cwd: repoRoot });
    if (finalMainSha !== mainSha) {
      throw new Error(`[DocumentaryMaintenanceHost] main changed during the run (${mainSha} -> ${finalMainSha}); discard this local candidate and restart from current main.`);
    }
    run('npm', ['run', 'docs:hygiene:check'], { cwd: repoRoot });
    run('npm', ['run', 'governance:control-plane'], { cwd: repoRoot });
    run('git', ['push', '--set-upstream', 'origin', branchName], { cwd: repoRoot });
    remoteBranchPushed = true;

    let draftPrDispatched = false;
    if (dispatchDraftPr) {
      assertDocumentaryRepositoryMutationCapability(auth, AGENT_CAPABILITIES.PR);
      run('gh', [
        'workflow', 'run', 'open-agent-draft-pr.yml',
        '--repo', process.env.GITHUB_REPOSITORY || 'SvenKulessa/Finance',
        '--ref', 'main',
        '-f', `head_branch=${branchName}`,
      ], { cwd: repoRoot });
      draftPrDispatched = true;
    }

    return {
      branchName,
      mainSha,
      changedPaths,
      claimPath,
      draftPrDispatched,
      reviewRequiredPaths: plan.reviewRequiredPaths,
      health,
    };
  } catch (error) {
    if (remoteBranchPushed) {
      try {
        run('git', ['push', 'origin', '--delete', branchName], { cwd: repoRoot });
      } catch {
        // Best-effort remote cleanup only; preserve the original error.
      }
    }
    try {
      run('git', ['reset', '--hard'], { cwd: repoRoot });
      run('git', ['switch', 'main'], { cwd: repoRoot });
      run('git', ['branch', '--delete', '--force', branchName], { cwd: repoRoot });
    } catch {
      // Best-effort local cleanup only; preserve the original error.
    }
    throw error;
  }
}

function loadRequest(filePath: string): DocumentaryMaintenanceControlLoopRequest {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8')) as DocumentaryMaintenanceControlLoopRequest;
}

async function main(): Promise<void> {
  const requestArg = process.argv.find((arg) => arg.startsWith('--request='));
  if (!requestArg) throw new Error('Usage: tsx scripts/automation/runDocumentaryMaintenanceControlLoop.ts --request=<request.json> [--no-dispatch]');
  const request = loadRequest(requestArg.slice('--request='.length));
  const result = await runDocumentaryMaintenanceControlLoop({
    request,
    dispatchDraftPr: !process.argv.includes('--no-dispatch'),
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}