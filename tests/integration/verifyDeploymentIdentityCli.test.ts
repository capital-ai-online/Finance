import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

// M7 (ADR-0061, docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md, "Required Negative Tests":
// "health/readiness failure -> rollback/STOP"). scripts/deployment/verifyDeploymentIdentity.ts's
// main() is not exported (it is the CLI's real entry point), so the only way to prove the CI job
// actually stops on a bad deploy - rather than silently reporting success - is to run the real
// script as a child process against a real (mock) health endpoint, exactly as ci.yml does. This
// scenario already happened for real in production once (a header-vs-body bug made every real
// deploy fail-closed for the full timeout); this test makes that guarantee repeatable and
// independent of a live Render deploy.

const EXPECTED_SHA = 'a'.repeat(40);
const WRONG_SHA = 'b'.repeat(40);

let server: http.Server | null = null;
let evidencePath: string | null = null;

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
  if (evidencePath && fs.existsSync(evidencePath)) {
    fs.rmSync(path.dirname(evidencePath), { recursive: true, force: true });
    evidencePath = null;
  }
});

function startMockHealthServer(respond: (res: http.ServerResponse) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    const instance = http.createServer((_req, res) => respond(res));
    instance.on('error', reject);
    instance.listen(0, '127.0.0.1', () => {
      const address = instance.address();
      if (address && typeof address === 'object') {
        server = instance;
        resolve(address.port);
      } else {
        reject(new Error('failed to bind mock health server'));
      }
    });
  });
}

function runCli(env: Record<string, string>): Promise<{ code: number | null; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    execFile(
      'npx',
      ['tsx', 'scripts/deployment/verifyDeploymentIdentity.ts'],
      { cwd: process.cwd(), env: { ...process.env, ...env } },
      (error, stdout, stderr) => {
        const code = error && typeof (error as NodeJS.ErrnoException & { code?: number }).code === 'number'
          ? (error as unknown as { code: number }).code
          : (error ? 1 : 0);
        resolve({ code, stdout, stderr });
      },
    );
  });
}

describe('verifyDeploymentIdentity CLI fails closed on health/readiness failure', () => {
  it('exits non-zero and writes FAILED evidence when the deployed commit never matches (STOP, no false PASS)', async () => {
    const port = await startMockHealthServer((res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        deployment: { commitSha: WRONG_SHA, branch: 'main', repoSlug: 'SvenKulessa/Finance', provider: 'render' },
      }));
    });

    const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'm7-negative-test-'));
    evidencePath = path.join(evidenceDir, 'deployment-identity-evidence.json');

    const result = await runCli({
      CAPITAL_AI_PRODUCTION_HEALTH_URL: `http://127.0.0.1:${port}/healthz`,
      VERIFIED_COMMIT_SHA: EXPECTED_SHA,
      GITHUB_REPOSITORY: 'SvenKulessa/Finance',
      DEPLOYMENT_VERIFY_POLL_INTERVAL_MS: '30',
      DEPLOYMENT_VERIFY_TIMEOUT_MS: '120',
      DEPLOYMENT_VERIFY_EVIDENCE_OUTPUT: evidencePath,
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('FAIL-CLOSED');

    expect(fs.existsSync(evidencePath)).toBe(true);
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(evidence.result).toBe('FAILED / TIMEOUT');
    expect(evidence.expectedCommitSha).toBe(EXPECTED_SHA);
    expect(evidence.violations.join(' ')).toMatch(/entspricht nicht dem erwarteten/);
  }, 20_000);

  it('exits non-zero when the health endpoint never answers with HTTP 2xx (unreachable deploy)', async () => {
    const port = await startMockHealthServer((res) => {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'unavailable' }));
    });

    const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'm7-negative-test-'));
    evidencePath = path.join(evidenceDir, 'deployment-identity-evidence.json');

    const result = await runCli({
      CAPITAL_AI_PRODUCTION_HEALTH_URL: `http://127.0.0.1:${port}/healthz`,
      VERIFIED_COMMIT_SHA: EXPECTED_SHA,
      GITHUB_REPOSITORY: 'SvenKulessa/Finance',
      DEPLOYMENT_VERIFY_POLL_INTERVAL_MS: '30',
      DEPLOYMENT_VERIFY_TIMEOUT_MS: '120',
      DEPLOYMENT_VERIFY_EVIDENCE_OUTPUT: evidencePath,
    });

    expect(result.code).not.toBe(0);
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(evidence.result).toBe('FAILED / TIMEOUT');
    expect(evidence.violations.join(' ')).toMatch(/HTTP 2xx/);
  }, 20_000);
});
