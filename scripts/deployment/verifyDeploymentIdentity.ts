import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// M7 (Deployment Identity, ADR-0061, docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md).
//
// Runs after deploy-production has triggered a Render deploy for a verified main commit. Polls
// the public production health endpoint (already exposing ADR-0036 deployment identity headers)
// until it reports that exact commit as live and healthy, or fails closed on timeout/mismatch.
// This closes the "health/readiness verification -> immutable deployment evidence" link in the
// M7 Required Trust Chain, which previously did not exist: the CI job fired the deploy hook and
// stopped, without ever confirming the deploy actually landed.
const DEFAULT_PRODUCTION_HEALTH_URL = 'https://capital-ai.online/healthz';

export interface DeploymentIdentityObservation {
  status: string | null;
  commitSha: string | null;
  branch: string | null;
  repoSlug: string | null;
  provider: string | null;
}

export interface DeploymentVerificationInput {
  expectedCommitSha: string;
  expectedRepository: string | null;
  responseOk: boolean;
  healthPayload: any;
}

export interface DeploymentVerificationResult {
  ok: boolean;
  violations: string[];
  observed: DeploymentIdentityObservation;
}

function normalizeSha(value: unknown): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

export function verifyDeploymentIdentity(input: DeploymentVerificationInput): DeploymentVerificationResult {
  const violations: string[] = [];
  const deployment = input.healthPayload?.deployment ?? {};
  const observed: DeploymentIdentityObservation = {
    status: input.healthPayload?.status ?? null,
    commitSha: deployment.commitSha ?? null,
    branch: deployment.branch ?? null,
    repoSlug: deployment.repoSlug ?? null,
    provider: deployment.provider ?? null,
  };

  if (!input.responseOk) {
    violations.push('Health-Endpoint antwortete nicht mit HTTP 2xx.');
    return { ok: false, violations, observed };
  }

  if (observed.status !== 'ok') {
    violations.push(`Health-Status ist nicht "ok" (beobachtet: ${String(observed.status)}).`);
  }

  const expectedSha = normalizeSha(input.expectedCommitSha);
  if (!expectedSha) {
    violations.push(`Erwarteter Commit ${input.expectedCommitSha} ist kein gueltiger 40-stelliger SHA.`);
  }

  const observedSha = normalizeSha(observed.commitSha);
  if (!observedSha) {
    violations.push('Deployment liefert keinen gueltigen 40-stelligen Commit-SHA (ADR-0036 Header/Feld fehlt oder ungueltig).');
  } else if (expectedSha && observedSha !== expectedSha) {
    violations.push(`Deployter Commit ${observedSha} entspricht nicht dem erwarteten ${expectedSha}.`);
  }

  if (input.expectedRepository && observed.repoSlug && observed.repoSlug !== input.expectedRepository) {
    violations.push(`Deployment gehoert zu ${observed.repoSlug}, erwartet ${input.expectedRepository}.`);
  }

  if (observed.branch && observed.branch !== 'main') {
    violations.push(`Deployment meldet Branch ${observed.branch}, erwartet main.`);
  }

  return { ok: violations.length === 0, violations, observed };
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface HeaderLookup {
  get(name: string): string | null;
}

// /healthz (server/routes/health.ts) does NOT include a `deployment` field in its JSON body -
// deployment identity is set exclusively as response headers by the middleware in
// server/logger.ts (x-capital-ai-version/-commit/-branch/-repo/-provider). Falls back to those
// headers exactly like scripts/pr/productionPreflight.mjs already does, so both consumers of this
// endpoint agree on where the identity actually comes from. Exported and unit-tested on its own
// because a first version of this script silently missed this and only read the JSON body,
// making verification fail-closed forever regardless of how long it polled.
export function mergeHealthPayloadWithHeaders(payload: any, headers: HeaderLookup): any {
  const headerDeployment = {
    version: headers.get('x-capital-ai-version'),
    commitSha: headers.get('x-capital-ai-commit'),
    branch: headers.get('x-capital-ai-branch'),
    repoSlug: headers.get('x-capital-ai-repo'),
    provider: headers.get('x-capital-ai-provider'),
  };
  return { ...payload, deployment: payload?.deployment || headerDeployment };
}

async function fetchHealth(url: string): Promise<{ responseOk: boolean; payload: any }> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return { responseOk: response.ok, payload: mergeHealthPayloadWithHeaders(payload, response.headers) };
  } catch {
    return { responseOk: false, payload: null };
  }
}

async function main(): Promise<void> {
  const healthUrl = process.env.CAPITAL_AI_PRODUCTION_HEALTH_URL || DEFAULT_PRODUCTION_HEALTH_URL;
  const expectedCommitSha = process.env.VERIFIED_COMMIT_SHA || process.env.GITHUB_SHA || '';
  const expectedRepository = process.env.GITHUB_REPOSITORY || null;
  const pollIntervalMs = Number(process.env.DEPLOYMENT_VERIFY_POLL_INTERVAL_MS || 10_000);
  const timeoutMs = Number(process.env.DEPLOYMENT_VERIFY_TIMEOUT_MS || 300_000);
  const evidencePath = process.env.DEPLOYMENT_VERIFY_EVIDENCE_OUTPUT || 'artifacts/deployment/deployment-identity-evidence.json';

  if (!expectedCommitSha) {
    console.error('[deployment-verify] FAIL-CLOSED: kein erwarteter Commit (VERIFIED_COMMIT_SHA/GITHUB_SHA) gesetzt.');
    process.exit(1);
  }

  const startedAt = Date.now();
  let lastResult: DeploymentVerificationResult | null = null;
  let attempts = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempts += 1;
    const { responseOk, payload } = await fetchHealth(healthUrl);
    lastResult = verifyDeploymentIdentity({ expectedCommitSha, expectedRepository, responseOk, healthPayload: payload });

    if (lastResult.ok) {
      writeJsonFile(evidencePath, {
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        healthUrl,
        expectedCommitSha: expectedCommitSha.toLowerCase(),
        expectedRepository,
        observed: lastResult.observed,
        attempts,
        elapsedMs: Date.now() - startedAt,
        result: 'VERIFIED PASS',
      });
      console.log(
        `[deployment-verify] PASS nach ${attempts} Versuch(en), ${Date.now() - startedAt}ms: ` +
          `Commit ${lastResult.observed.commitSha} live und healthy.`,
      );
      return;
    }

    await sleep(pollIntervalMs);
  }

  writeJsonFile(evidencePath, {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    healthUrl,
    expectedCommitSha: expectedCommitSha.toLowerCase(),
    expectedRepository,
    observed: lastResult?.observed ?? null,
    attempts,
    elapsedMs: Date.now() - startedAt,
    result: 'FAILED / TIMEOUT',
    violations: lastResult?.violations ?? ['Kein Health-Response innerhalb des Timeouts erhalten.'],
  });

  console.error(
    `[deployment-verify] FAIL-CLOSED nach ${attempts} Versuch(en), ${Date.now() - startedAt}ms: ` +
      (lastResult?.violations ?? ['kein Health-Response']).join('; '),
  );
  process.exit(1);
}

if (pathToFileURL(path.resolve(process.argv[1] ?? '')).href === import.meta.url) {
  main();
}
